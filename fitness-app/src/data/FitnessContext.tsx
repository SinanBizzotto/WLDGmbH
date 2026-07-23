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
  ExercisePreference,
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
  toggleFavoriteExercise: (id: string) => Promise<void>;
  duplicateExercise: (exercise: Exercise) => Promise<Exercise>;
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
const preferenceStorageKey = (id: string) =>
  `wld-fitness-exercise-preferences-v1:${id}`;

const readLocalPreferences = (userId: string): ExercisePreference[] => {
  try {
    return JSON.parse(
      localStorage.getItem(preferenceStorageKey(userId)) ?? "[]",
    ) as ExercisePreference[];
  } catch {
    return [];
  }
};

const writeLocalPreference = (
  userId: string,
  preference: ExercisePreference,
) => {
  const current = readLocalPreferences(userId);
  localStorage.setItem(
    preferenceStorageKey(userId),
    JSON.stringify([
      ...current.filter((item) => item.exerciseId !== preference.exerciseId),
      preference,
    ]),
  );
};

const applyExercisePreference = (
  exercise: Exercise,
  preference?: ExercisePreference,
): Exercise => {
  if (!preference) return exercise;
  const customized = Boolean(
    preference.customName ||
      preference.muscleGroup ||
      preference.equipment ||
      preference.exerciseType ||
      preference.description ||
      preference.instructions,
  );
  return {
    ...exercise,
    name: preference.customName ?? exercise.name,
    muscleGroup: preference.muscleGroup ?? exercise.muscleGroup,
    equipment: preference.equipment ?? exercise.equipment,
    exerciseType: preference.exerciseType ?? exercise.exerciseType,
    description: preference.description ?? exercise.description,
    instructions: preference.instructions ?? exercise.instructions,
    isFavorite: preference.isFavorite,
    isCustomized: customized,
  };
};

const mergeDemoExercises = (saved: FitnessStore): FitnessStore => {
  const savedById = new Map(
    saved.exercises.map((exercise) => [exercise.id, exercise]),
  );
  return {
    ...saved,
    exercises: [
      ...defaultExercises.map(
        (exercise) => savedById.get(exercise.id) ?? exercise,
      ),
      ...saved.exercises.filter(
        (exercise) =>
          !defaultExercises.some((item) => item.id === exercise.id),
      ),
    ],
  };
};

async function loadRemoteStore(userId: string): Promise<FitnessStore> {
  if (!supabase) return emptyStore(userId);
  const [
    profile,
    exercises,
    preferences,
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
      .from("exercise_preferences")
      .select("*")
      .eq("user_id", userId),
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
  const preferenceMap = new Map<string, ExercisePreference>();
  for (const preference of preferences.data ?? []) {
    preferenceMap.set(preference.exercise_id, {
      exerciseId: preference.exercise_id,
      customName: preference.custom_name ?? undefined,
      muscleGroup:
        (preference.custom_muscle_group as ExercisePreference["muscleGroup"]) ??
        undefined,
      equipment:
        (preference.custom_equipment_type as ExercisePreference["equipment"]) ??
        undefined,
      exerciseType:
        (preference.custom_exercise_type as ExercisePreference["exerciseType"]) ??
        undefined,
      description: preference.custom_description ?? undefined,
      instructions: preference.custom_instructions ?? undefined,
      isFavorite: preference.is_favorite,
    });
  }
  for (const preference of readLocalPreferences(userId)) {
    preferenceMap.set(preference.exerciseId, {
      ...preferenceMap.get(preference.exerciseId),
      ...preference,
    });
  }
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
        return applyExercisePreference({
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
        } as Exercise, preferenceMap.get(e.id));
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
          ? mergeDemoExercises(JSON.parse(raw) as FitnessStore)
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
        if (exercise.isPublic) {
          const preference: ExercisePreference = {
            exerciseId: exercise.id,
            customName: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            exerciseType: exercise.exerciseType,
            description: exercise.description,
            instructions: exercise.instructions,
            isFavorite: Boolean(exercise.isFavorite),
          };
          writeLocalPreference(userId, preference);
          if (supabase && !demoMode) {
            await supabase.from("exercise_preferences").upsert({
              user_id: userId,
              exercise_id: exercise.id,
              custom_name: preference.customName,
              custom_muscle_group: preference.muscleGroup,
              custom_equipment_type: preference.equipment,
              custom_exercise_type: preference.exerciseType,
              custom_description: preference.description,
              custom_instructions: preference.instructions,
              is_favorite: preference.isFavorite,
            });
          }
          update((s) => ({
            ...s,
            exercises: s.exercises.map((item) =>
              item.id === exercise.id
                ? { ...exercise, isCustomized: true }
                : item,
            ),
          }));
          return;
        }
        if (supabase && !demoMode) {
          const { error } = await supabase.from("exercises").upsert({
            id: exercise.id,
            user_id: userId,
            name: exercise.name,
            muscle_group: exercise.muscleGroup,
            equipment_type: exercise.equipment,
            exercise_type: exercise.exerciseType,
            description: exercise.description,
            instructions: exercise.instructions,
            image_url: exercise.image,
            is_public: false,
          });
          if (error) throw error;
        }
        update((s) => ({
          ...s,
          exercises: [
            ...s.exercises.filter((e) => e.id !== exercise.id),
            exercise,
          ],
        }));
      },
      toggleFavoriteExercise: async (id) => {
        const exercise = store.exercises.find((item) => item.id === id);
        if (!exercise) return;
        const nextFavorite = !exercise.isFavorite;
        const previousPreferences = readLocalPreferences(userId);
        const existing =
          previousPreferences.find((item) => item.exerciseId === id) ??
          ({
            exerciseId: id,
            customName: exercise.isCustomized ? exercise.name : undefined,
            muscleGroup: exercise.isCustomized
              ? exercise.muscleGroup
              : undefined,
            equipment: exercise.isCustomized ? exercise.equipment : undefined,
            exerciseType: exercise.isCustomized
              ? exercise.exerciseType
              : undefined,
            description: exercise.isCustomized
              ? exercise.description
              : undefined,
            instructions: exercise.isCustomized
              ? exercise.instructions
              : undefined,
            isFavorite: false,
          } satisfies ExercisePreference);
        const preference = { ...existing, isFavorite: nextFavorite };
        writeLocalPreference(userId, preference);
        update((s) => ({
          ...s,
          exercises: s.exercises.map((item) =>
            item.id === id ? { ...item, isFavorite: nextFavorite } : item,
          ),
        }));
        if (supabase && !demoMode) {
          await supabase.from("exercise_preferences").upsert({
            user_id: userId,
            exercise_id: id,
            is_favorite: nextFavorite,
          });
        }
      },
      duplicateExercise: async (exercise) => {
        const duplicate: Exercise = {
          ...exercise,
          id: crypto.randomUUID(),
          userId,
          name: `${exercise.name} – Kopie`,
          isPublic: false,
          isFavorite: false,
          isCustomized: false,
        };
        if (supabase && !demoMode) {
          const { error } = await supabase.from("exercises").insert({
            id: duplicate.id,
            user_id: userId,
            name: duplicate.name,
            muscle_group: duplicate.muscleGroup,
            equipment_type: duplicate.equipment,
            exercise_type: duplicate.exerciseType,
            description: duplicate.description,
            instructions: duplicate.instructions,
            image_url: duplicate.image,
            is_public: false,
          });
          if (error) throw error;
        }
        update((s) => ({
          ...s,
          exercises: [...s.exercises, duplicate],
        }));
        return duplicate;
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
