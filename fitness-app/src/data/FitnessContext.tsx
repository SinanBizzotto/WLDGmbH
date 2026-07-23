import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { createDemoStore, defaultExercises } from "../lib/demoData";
import { supabase } from "../lib/supabase";
import { LoadingSkeleton, PageError } from "../components/ui";
import type {
  BodyMeasurement,
  Exercise,
  FitnessStore,
  Meal,
  NutritionGoal,
  Profile,
  WorkoutPlan,
  WorkoutSession,
} from "../types";

interface FitnessActions {
  savePlan: (plan: WorkoutPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  saveExercise: (exercise: Exercise) => Promise<void>;
  saveSession: (session: WorkoutSession) => Promise<void>;
  saveMeasurement: (measurement: BodyMeasurement) => Promise<void>;
  saveMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  saveGoal: (goal: NutritionGoal) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
}
interface FitnessValue extends FitnessActions {
  store: FitnessStore;
  loading: boolean;
}
const FitnessContext = createContext<FitnessValue | null>(null);
const emptyStore = (id: string): FitnessStore => ({
  ...createDemoStore(id),
  profile: { ...createDemoStore(id).profile, displayName: "" },
  exercises: defaultExercises,
  plans: [],
  sessions: [],
  measurements: [],
  records: [],
  meals: [],
});
const storageKey = (id: string) => `wld-fitness-v1:${id}`;

async function loadRemoteStore(userId: string): Promise<FitnessStore> {
  if (!supabase) return emptyStore(userId);
  const [
    profile,
    exercises,
    plans,
    sessions,
    measurements,
    records,
    goal,
    meals,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("exercises")
      .select("*")
      .or(`user_id.eq.${userId},is_public.eq.true`),
    supabase
      .from("workout_plans")
      .select("*,workout_plan_exercises(*)")
      .eq("user_id", userId),
    supabase
      .from("workout_sessions")
      .select("*,workout_sets(*)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at"),
    supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false }),
    supabase
      .from("nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false }),
  ]);
  const base = emptyStore(userId);
  const p = profile.data;
  return {
    ...base,
    profile: p
      ? {
          id: p.id,
          displayName: p.display_name ?? "",
          avatarUrl: p.avatar_url ?? undefined,
          heightCm: p.height_cm ?? 0,
          currentWeightKg: p.current_weight_kg ?? 0,
          targetWeightKg: p.target_weight_kg ?? 0,
          goal: p.training_goal ?? "",
          level: p.experience_level ?? "",
          trainingDays: p.training_days_per_week ?? 3,
        }
      : base.profile,
    exercises: (exercises.data ?? []).map(
      (e) => {
        const isMislabeledDumbbellRack =
          e.id === "10000000-0000-4000-8000-000000000004";
        return {
          id: e.id,
          userId: e.user_id ?? undefined,
          name: isMislabeledDumbbellRack ? "Kurzhantel-Rack" : e.name,
          muscleGroup: isMislabeledDumbbellRack
            ? "Ganzkörper"
            : e.muscle_group,
          equipment: isMislabeledDumbbellRack
            ? "Kurzhantel"
            : e.equipment_type,
          exerciseType: isMislabeledDumbbellRack
            ? "Kraft"
            : e.exercise_type,
          description: isMislabeledDumbbellRack
            ? "Freie Gewichte für vielseitiges Ganzkörpertraining."
            : (e.description ?? ""),
          instructions: isMislabeledDumbbellRack
            ? [
                "Passendes Gewicht kontrolliert entnehmen",
                "Kurzhanteln nach dem Training sicher zurücklegen",
              ]
            : (e.instructions ?? []),
          image: e.image_url ?? undefined,
          isPublic: e.is_public,
        } as Exercise;
      },
    ),
    plans: (plans.data ?? []).map((pn) => ({
      id: pn.id,
      name: pn.name,
      muscleGroups: pn.muscle_groups ?? [],
      estimatedMinutes: pn.estimated_minutes ?? 45,
      updatedAt: pn.updated_at,
      exercises: (pn.workout_plan_exercises ?? []).map(
        (pe: {
          id: string;
          exercise_id: string;
          sort_order: number;
          sets: number;
          reps: number;
          weight_kg: number;
          rest_seconds: number;
        }) => ({
          id: pe.id,
          exerciseId: pe.exercise_id,
          order: pe.sort_order,
          sets: pe.sets,
          reps: pe.reps,
          weightKg: pe.weight_kg,
          restSeconds: pe.rest_seconds,
        }),
      ),
    })),
    sessions: (sessions.data ?? []).map((s) => ({
      id: s.id,
      planId: s.plan_id,
      planName: s.plan_name ?? "Workout",
      status: s.status,
      startedAt: s.started_at,
      completedAt: s.completed_at ?? undefined,
      durationSeconds: s.duration_seconds ?? 0,
      totalVolumeKg: s.total_volume_kg ?? 0,
      currentExerciseIndex: s.current_exercise_index ?? 0,
      sets: (s.workout_sets ?? []).map(
        (set: {
          id: string;
          exercise_id: string;
          set_number: number;
          planned_reps: number;
          actual_reps: number;
          weight_kg: number;
          completed: boolean;
        }) => ({
          id: set.id,
          exerciseId: set.exercise_id,
          setNumber: set.set_number,
          plannedReps: set.planned_reps,
          actualReps: set.actual_reps,
          weightKg: set.weight_kg,
          completed: set.completed,
        }),
      ),
    })),
    measurements: (measurements.data ?? []).map((m) => ({
      id: m.id,
      measuredAt: m.measured_at,
      weightKg: m.weight_kg,
    })),
    records: (records.data ?? []).map((r) => ({
      id: r.id,
      exerciseName: r.exercise_name,
      weightKg: r.weight_kg,
      achievedAt: r.achieved_at,
    })),
    nutritionGoal: goal.data
      ? {
          calories: goal.data.calories,
          proteinG: goal.data.protein_g,
          carbsG: goal.data.carbs_g,
          fatG: goal.data.fat_g,
        }
      : base.nutritionGoal,
    meals: (meals.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      eatenAt: m.eaten_at,
      calories: m.calories,
      proteinG: m.protein_g,
      carbsG: m.carbs_g,
      fatG: m.fat_g,
    })),
  };
}

export function FitnessProvider({ children }: { children: ReactNode }) {
  const { user, demoMode } = useAuth();
  const userId = user?.id ?? "anonymous";
  const query = useQuery({
    queryKey: ["fitness-store", userId],
    queryFn: () => {
      if (demoMode) {
        const raw = localStorage.getItem(storageKey(userId));
        return raw
          ? (JSON.parse(raw) as FitnessStore)
          : createDemoStore(userId);
      }
      return loadRemoteStore(userId);
    },
    enabled: Boolean(user),
  });
  const [store, setStore] = useState<FitnessStore>(() =>
    demoMode ? createDemoStore(userId) : emptyStore(userId),
  );
  useEffect(() => {
    if (query.data) setStore(query.data);
  }, [query.data]);
  const update = useCallback(
    (fn: (current: FitnessStore) => FitnessStore) =>
      setStore((current) => {
        const next = fn(current);
        if (demoMode)
          localStorage.setItem(storageKey(userId), JSON.stringify(next));
        return next;
      }),
    [demoMode, userId],
  );
  const value = useMemo<FitnessValue>(
    () => ({
      store,
      loading: query.isLoading,
      savePlan: async (plan) => {
        update((s) => ({
          ...s,
          plans: [...s.plans.filter((p) => p.id !== plan.id), plan],
        }));
        if (supabase && !demoMode) {
          await supabase.from("workout_plans").upsert({
            id: plan.id,
            user_id: userId,
            name: plan.name,
            muscle_groups: plan.muscleGroups,
            estimated_minutes: plan.estimatedMinutes,
          });
          await supabase
            .from("workout_plan_exercises")
            .delete()
            .eq("plan_id", plan.id);
          if (plan.exercises.length)
            await supabase.from("workout_plan_exercises").insert(
              plan.exercises.map((e) => ({
                id: e.id,
                plan_id: plan.id,
                exercise_id: e.exerciseId,
                sort_order: e.order,
                sets: e.sets,
                reps: e.reps,
                weight_kg: e.weightKg,
                rest_seconds: e.restSeconds,
              })),
            );
        }
      },
      deletePlan: async (id) => {
        update((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
        if (supabase && !demoMode)
          await supabase.from("workout_plans").delete().eq("id", id);
      },
      saveExercise: async (exercise) => {
        update((s) => ({
          ...s,
          exercises: [
            ...s.exercises.filter((e) => e.id !== exercise.id),
            exercise,
          ],
        }));
        if (supabase && !demoMode)
          await supabase.from("exercises").upsert({
            id: exercise.id,
            user_id: userId,
            name: exercise.name,
            muscle_group: exercise.muscleGroup,
            equipment_type: exercise.equipment,
            exercise_type: exercise.exerciseType,
            description: exercise.description,
            instructions: exercise.instructions,
            is_public: false,
          });
      },
      saveSession: async (session) => {
        update((s) => ({
          ...s,
          sessions: [session, ...s.sessions.filter((x) => x.id !== session.id)],
        }));
        if (supabase && !demoMode) {
          await supabase.from("workout_sessions").upsert({
            id: session.id,
            user_id: userId,
            plan_id: session.planId,
            plan_name: session.planName,
            status: session.status,
            started_at: session.startedAt,
            completed_at: session.completedAt,
            duration_seconds: session.durationSeconds,
            total_volume_kg: session.totalVolumeKg,
            current_exercise_index: session.currentExerciseIndex,
          });
          await supabase
            .from("workout_sets")
            .delete()
            .eq("session_id", session.id);
          if (session.sets.length)
            await supabase.from("workout_sets").insert(
              session.sets.map((x) => ({
                id: x.id,
                session_id: session.id,
                exercise_id: x.exerciseId,
                set_number: x.setNumber,
                planned_reps: x.plannedReps,
                actual_reps: x.actualReps,
                weight_kg: x.weightKg,
                completed: x.completed,
              })),
            );
        }
      },
      saveMeasurement: async (m) => {
        update((s) => ({
          ...s,
          measurements: [...s.measurements.filter((x) => x.id !== m.id), m],
        }));
        if (supabase && !demoMode)
          await supabase.from("body_measurements").upsert({
            id: m.id,
            user_id: userId,
            measured_at: m.measuredAt,
            weight_kg: m.weightKg,
          });
      },
      saveMeal: async (meal) => {
        update((s) => ({
          ...s,
          meals: [...s.meals.filter((m) => m.id !== meal.id), meal],
        }));
        if (supabase && !demoMode)
          await supabase.from("meals").upsert({
            id: meal.id,
            user_id: userId,
            ...{
              name: meal.name,
              eaten_at: meal.eatenAt,
              calories: meal.calories,
              protein_g: meal.proteinG,
              carbs_g: meal.carbsG,
              fat_g: meal.fatG,
            },
          });
      },
      deleteMeal: async (id) => {
        update((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
        if (supabase && !demoMode)
          await supabase.from("meals").delete().eq("id", id);
      },
      saveGoal: async (goal) => {
        update((s) => ({ ...s, nutritionGoal: goal }));
        if (supabase && !demoMode)
          await supabase.from("nutrition_goals").upsert({
            user_id: userId,
            calories: goal.calories,
            protein_g: goal.proteinG,
            carbs_g: goal.carbsG,
            fat_g: goal.fatG,
          });
      },
      saveProfile: async (profile) => {
        update((s) => ({ ...s, profile }));
        if (supabase && !demoMode)
          await supabase.from("profiles").upsert({
            id: userId,
            display_name: profile.displayName,
            avatar_url: profile.avatarUrl,
            height_cm: profile.heightCm,
            current_weight_kg: profile.currentWeightKg,
            target_weight_kg: profile.targetWeightKg,
            training_goal: profile.goal,
            experience_level: profile.level,
            training_days_per_week: profile.trainingDays,
          });
      },
    }),
    [store, query.isLoading, update, demoMode, userId],
  );
  if (query.isLoading) return <LoadingSkeleton cards={8} />;
  if (query.isError) return <PageError retry={() => void query.refetch()} />;
  return (
    <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>
  );
}
export function useFitness() {
  const value = useContext(FitnessContext);
  if (!value) throw new Error("useFitness must be used inside FitnessProvider");
  return value;
}
