import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeDayStreak,
  formatRelativeTime,
  isThisWeek,
  startOfWeek,
} from "./time";

// 2024-01-08 is a known Monday (verified against a real calendar), so every
// date below is built relative to it with a plain local-time constructor —
// no dependency on the test runner's timezone beyond internal consistency.
const MONDAY = new Date(2024, 0, 8, 9, 0, 0);
const WEDNESDAY = new Date(2024, 0, 10, 15, 30, 0);
const SUNDAY = new Date(2024, 0, 14, 23, 0, 0);
const NEXT_MONDAY = new Date(2024, 0, 15, 0, 0, 0);

describe("startOfWeek", () => {
  it("returns the same Monday at midnight when given a Monday", () => {
    const start = startOfWeek(MONDAY);
    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(8);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("returns the preceding Monday when given a midweek day", () => {
    const start = startOfWeek(WEDNESDAY);
    expect(start.getDate()).toBe(8);
  });

  it("returns the preceding Monday when given a Sunday", () => {
    const start = startOfWeek(SUNDAY);
    expect(start.getDate()).toBe(8);
  });
});

describe("isThisWeek", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is true for a date earlier in the same Mon–Sun week", () => {
    vi.setSystemTime(WEDNESDAY);
    expect(isThisWeek(MONDAY.toISOString())).toBe(true);
  });

  it("is true for the current moment itself", () => {
    vi.setSystemTime(WEDNESDAY);
    expect(isThisWeek(WEDNESDAY.toISOString())).toBe(true);
  });

  it("is true right at the week's start boundary (Monday 00:00)", () => {
    const mondayMidnight = new Date(2024, 0, 8, 0, 0, 0);
    vi.setSystemTime(WEDNESDAY);
    expect(isThisWeek(mondayMidnight.toISOString())).toBe(true);
  });

  it("is false right at the week's end boundary (next Monday 00:00)", () => {
    vi.setSystemTime(WEDNESDAY);
    expect(isThisWeek(NEXT_MONDAY.toISOString())).toBe(false);
  });

  it("is false for a date from the previous week", () => {
    vi.setSystemTime(MONDAY);
    const lastSunday = new Date(2024, 0, 7, 12, 0, 0);
    expect(isThisWeek(lastSunday.toISOString())).toBe(false);
  });

  it("is false for a date from the following week", () => {
    vi.setSystemTime(SUNDAY);
    expect(isThisWeek(NEXT_MONDAY.toISOString())).toBe(false);
  });
});

describe("computeDayStreak", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const day = (offsetFromMonday: number, hour = 12) =>
    new Date(2024, 0, 8 + offsetFromMonday, hour, 0, 0);

  it("is 0 when there are no completed sessions", () => {
    vi.setSystemTime(WEDNESDAY);
    expect(computeDayStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    vi.setSystemTime(day(2)); // Wednesday
    const dates = [day(0), day(1), day(2)].map((d) => d.toISOString());
    expect(computeDayStreak(dates)).toBe(3);
  });

  it("stops at the first gap", () => {
    vi.setSystemTime(day(3)); // Thursday
    // Monday + Thursday, Tue/Wed missing — only "today" (Thursday) counts.
    const dates = [day(0), day(3)].map((d) => d.toISOString());
    expect(computeDayStreak(dates)).toBe(1);
  });

  it("doesn't reset just because today has no session yet", () => {
    vi.setSystemTime(day(3, 8)); // Thursday morning, no workout yet today
    const dates = [day(1), day(2)].map((d) => d.toISOString());
    expect(computeDayStreak(dates)).toBe(2);
  });

  it("is 0 once a full day has been missed (today and yesterday both empty)", () => {
    vi.setSystemTime(day(3)); // Thursday
    const dates = [day(0), day(1)].map((d) => d.toISOString()); // Mon, Tue only
    expect(computeDayStreak(dates)).toBe(0);
  });

  it("counts a day only once even with multiple sessions on it", () => {
    vi.setSystemTime(day(0));
    const dates = [day(0, 7), day(0, 19)].map((d) => d.toISOString());
    expect(computeDayStreak(dates)).toBe(1);
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows 'gerade eben' for under 30 seconds (rounds to 0 minutes)", () => {
    const now = new Date(2024, 0, 10, 12, 0, 0);
    vi.setSystemTime(now);
    const iso = new Date(now.getTime() - 20_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("gerade eben");
  });

  it("shows minutes for under an hour", () => {
    const now = new Date(2024, 0, 10, 12, 0, 0);
    vi.setSystemTime(now);
    const iso = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("vor 5 Min.");
  });

  it("shows hours for under a day", () => {
    const now = new Date(2024, 0, 10, 12, 0, 0);
    vi.setSystemTime(now);
    const iso = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("vor 3 Std.");
  });

  it("shows days for under a week", () => {
    const now = new Date(2024, 0, 10, 12, 0, 0);
    vi.setSystemTime(now);
    const iso = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("vor 2 Tg.");
  });

  it("falls back to a formatted date at a week or older", () => {
    const now = new Date(2024, 0, 10, 12, 0, 0);
    vi.setSystemTime(now);
    const iso = new Date(now.getTime() - 10 * 86_400_000).toISOString();
    const result = formatRelativeTime(iso);
    expect(result).not.toMatch(/vor|gerade/);
  });
});
