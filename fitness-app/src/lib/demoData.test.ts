import { describe, expect, it } from "vitest";
import { createDemoStore, defaultExercises } from "./demoData";

describe("WLD Fitness demo fallback", () => {
  it("contains unique public exercises and the existing equipment images", () => {
    expect(new Set(defaultExercises.map((exercise) => exercise.id)).size).toBe(
      defaultExercises.length,
    );
    expect(defaultExercises.every((exercise) => exercise.isPublic)).toBe(true);
    expect(
      defaultExercises.filter((exercise) =>
        exercise.image?.startsWith("/assets/fitness/"),
      ).length,
    ).toBeGreaterThanOrEqual(40);
    expect(
      new Set(defaultExercises.map((exercise) => exercise.muscleGroup)).size,
    ).toBe(7);
  });
  it("labels the duplicated dumbbell-rack photo correctly", () => {
    const rack = defaultExercises.find(
      (exercise) => exercise.image === "/assets/fitness/stairmaster.jpeg",
    );

    expect(rack).toMatchObject({
      name: "Kurzhantel-Rack",
      equipment: "Kurzhantel",
      exerciseType: "Kraft",
    });
  });
  it("creates an isolated, usable fitness store", () => {
    const store = createDemoStore("test-user");
    expect(store.profile.id).toBe("test-user");
    expect(store.plans[0].exercises.length).toBeGreaterThan(0);
    expect(store.sessions.every((session) => session.totalVolumeKg >= 0)).toBe(
      true,
    );
  });
});
