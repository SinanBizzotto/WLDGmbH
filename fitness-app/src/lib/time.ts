// Monday-anchored, matching the "Mo Di Mi Do Fr Sa So" week chart — used
// everywhere "this week" is computed so the dashboard, sidebar and streak
// widget all agree on the same week boundaries.
export function startOfWeek(date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function isThisWeek(iso: string): boolean {
  const start = startOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const d = new Date(iso);
  return d >= start && d < end;
}

// Consecutive-day streak ending today (or yesterday, if today has no
// completed session yet — a day is only "missed" once it's fully over).
export function computeDayStreak(completedIsoDates: string[]): number {
  const days = new Set(
    completedIsoDates.map((iso) => new Date(iso).toDateString()),
  );
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  if (days < 7) return `vor ${days} Tg.`;
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "short",
  });
}
