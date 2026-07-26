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
import {
  createDemoStore,
  defaultExercises,
  DEMO_FEED_SEED,
  DEMO_FRIEND_STATS_BY_ID,
} from "../lib/demoData";
import { supabase } from "../lib/supabase";
import {
  addComment as feedAddComment,
  addPost as feedAddPost,
  getFeed,
  removeComment as feedRemoveComment,
  removePost as feedRemovePost,
  seedFeedIfEmpty,
  toggleLike as feedToggleLike,
} from "../lib/feedStore";
import { LoadingSkeleton, PageError } from "../components/ui";
import type {
  BodyMeasurement,
  Exercise,
  ExercisePreference,
  FitnessStore,
  FriendConnection,
  FriendStats,
  Meal,
  NutritionGoal,
  Post,
  PostComment,
  PostKind,
  PostWorkoutSummary,
  Profile,
  WaterLog,
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
  addWaterLog: (amountMl: number) => Promise<void>;
  deleteWaterLog: (id: string) => Promise<void>;
  sendFriendRequest: (code: string) => Promise<string>;
  respondToFriendRequest: (
    friendshipId: string,
    accept: boolean,
  ) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  loadFriendStats: (friendId: string) => Promise<FriendStats>;
  loadFeed: () => Promise<Post[]>;
  createPost: (input: {
    kind: PostKind;
    caption?: string;
    imageUrl?: string;
    workoutSessionId?: string;
  }) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
  loadComments: (postId: string) => Promise<PostComment[]>;
  addComment: (postId: string, body: string) => Promise<PostComment>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
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
  waterLogs: [],
  friends: [],
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
    waterLogs,
    friendships,
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
    supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false }),
    supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);
  const base = emptyStore(userId);
  const p = profile.data;
  const friendIds = (friendships.data ?? []).map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id,
  );
  const friendProfiles = friendIds.length
    ? await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", friendIds)
    : { data: [] };
  const friendProfileMap = new Map(
    (friendProfiles.data ?? []).map((fp) => [fp.id, fp]),
  );
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
          friendCode: p.friend_code ?? "",
          shareTraining: p.share_training ?? true,
          shareWeight: p.share_weight ?? false,
          shareNutrition: p.share_nutrition ?? false,
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
          waterMl: goal.data.water_goal_ml ?? 2500,
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
    waterLogs: (waterLogs.data ?? []).map((w) => ({
      id: w.id,
      loggedAt: w.logged_at,
      amountMl: w.amount_ml,
    })),
    friends: (friendships.data ?? []).map((f) => {
      const outgoing = f.requester_id === userId;
      const friendId = outgoing ? f.addressee_id : f.requester_id;
      const friendProfile = friendProfileMap.get(friendId);
      return {
        id: f.id,
        status: f.status as FriendConnection["status"],
        direction: outgoing ? "outgoing" : "incoming",
        friendId,
        friendDisplayName: friendProfile?.display_name ?? "Unbekannt",
        friendAvatarUrl: friendProfile?.avatar_url ?? undefined,
      } satisfies FriendConnection;
    }),
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
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (query.data) {
      setStore(query.data);
      setSynced(true);
    }
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
    () => {
      const resolveAuthor = (
        authorId: string,
      ): { displayName: string; avatarUrl?: string } => {
        if (authorId === userId)
          return {
            displayName: store.profile.displayName || "Du",
            avatarUrl: store.profile.avatarUrl,
          };
        const friend = store.friends.find((f) => f.friendId === authorId);
        return {
          displayName: friend?.friendDisplayName ?? "Unbekannt",
          avatarUrl: friend?.friendAvatarUrl,
        };
      };
      return {
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
            water_goal_ml: goal.waterMl,
          });
      },
      addWaterLog: async (amountMl) => {
        const log: WaterLog = {
          id: crypto.randomUUID(),
          loggedAt: new Date().toISOString(),
          amountMl,
        };
        update((s) => ({ ...s, waterLogs: [log, ...s.waterLogs] }));
        if (supabase && !demoMode)
          await supabase.from("water_logs").insert({
            id: log.id,
            user_id: userId,
            logged_at: log.loggedAt,
            amount_ml: log.amountMl,
          });
      },
      deleteWaterLog: async (id) => {
        update((s) => ({
          ...s,
          waterLogs: s.waterLogs.filter((w) => w.id !== id),
        }));
        if (supabase && !demoMode)
          await supabase.from("water_logs").delete().eq("id", id);
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
            share_training: profile.shareTraining,
            share_weight: profile.shareWeight,
            share_nutrition: profile.shareNutrition,
          });
      },
      sendFriendRequest: async (code) => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) throw new Error("Bitte einen Freundescode eingeben");
        if (demoMode) {
          if (trimmed === store.profile.friendCode)
            throw new Error("Du kannst dich nicht selbst hinzufügen");
          if (
            store.friends.some(
              (f) => f.friendDisplayName.toUpperCase().includes(trimmed),
            )
          )
            throw new Error("Ihr seid bereits verbunden");
          const friend: FriendConnection = {
            id: crypto.randomUUID(),
            status: "accepted",
            direction: "outgoing",
            friendId: crypto.randomUUID(),
            friendDisplayName: `Freund ${trimmed}`,
          };
          update((s) => ({ ...s, friends: [...s.friends, friend] }));
          return friend.friendDisplayName;
        }
        if (!supabase) throw new Error("Nicht verfügbar");
        const { data, error } = await supabase.rpc("send_friend_request", {
          target_code: trimmed,
        });
        if (error) throw new Error(error.message);
        const row = data?.[0];
        if (!row) throw new Error("Kein Nutzer mit diesem Code gefunden");
        update((s) => ({
          ...s,
          friends: [
            ...s.friends.filter((f) => f.id !== row.friendship_id),
            {
              id: row.friendship_id,
              status: row.friendship_status as FriendConnection["status"],
              direction: "outgoing",
              friendId: row.friend_id,
              friendDisplayName: row.friend_display_name,
              friendAvatarUrl: row.friend_avatar_url ?? undefined,
            },
          ],
        }));
        return row.friend_display_name;
      },
      respondToFriendRequest: async (friendshipId, accept) => {
        if (!accept) {
          update((s) => ({
            ...s,
            friends: s.friends.filter((f) => f.id !== friendshipId),
          }));
          if (supabase && !demoMode)
            await supabase.from("friendships").delete().eq("id", friendshipId);
          return;
        }
        update((s) => ({
          ...s,
          friends: s.friends.map((f) =>
            f.id === friendshipId ? { ...f, status: "accepted" } : f,
          ),
        }));
        if (supabase && !demoMode)
          await supabase
            .from("friendships")
            .update({ status: "accepted" })
            .eq("id", friendshipId);
      },
      removeFriend: async (friendshipId) => {
        update((s) => ({
          ...s,
          friends: s.friends.filter((f) => f.id !== friendshipId),
        }));
        if (supabase && !demoMode)
          await supabase.from("friendships").delete().eq("id", friendshipId);
      },
      loadFriendStats: async (friendId) => {
        if (demoMode) {
          const stats = DEMO_FRIEND_STATS_BY_ID[friendId];
          if (stats) return stats;
          return {
            sharesTraining: false,
            sharesWeight: false,
            sharesNutrition: false,
            workoutCount: 0,
            totalVolumeKg: 0,
            personalRecords: [],
            weightSeries: [],
            avgDailyCalories: null,
          };
        }
        if (!supabase)
          return {
            sharesTraining: false,
            sharesWeight: false,
            sharesNutrition: false,
            workoutCount: 0,
            totalVolumeKg: 0,
            personalRecords: [],
            weightSeries: [],
            avgDailyCalories: null,
          };
        const friendProfile = await supabase
          .from("profiles")
          .select("share_training,share_weight,share_nutrition")
          .eq("id", friendId)
          .maybeSingle();
        const sharesTraining = friendProfile.data?.share_training ?? false;
        const sharesWeight = friendProfile.data?.share_weight ?? false;
        const sharesNutrition = friendProfile.data?.share_nutrition ?? false;
        const [sessions, records, measurements, meals] = await Promise.all([
          sharesTraining
            ? supabase
                .from("workout_sessions")
                .select("total_volume_kg")
                .eq("user_id", friendId)
            : Promise.resolve({ data: [] as { total_volume_kg: number }[] }),
          sharesTraining
            ? supabase
                .from("personal_records")
                .select("*")
                .eq("user_id", friendId)
                .order("achieved_at", { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [] as never[] }),
          sharesWeight
            ? supabase
                .from("body_measurements")
                .select("*")
                .eq("user_id", friendId)
                .order("measured_at")
            : Promise.resolve({ data: [] as never[] }),
          sharesNutrition
            ? supabase
                .from("meals")
                .select("calories,eaten_at")
                .eq("user_id", friendId)
                .order("eaten_at", { ascending: false })
                .limit(14)
            : Promise.resolve({ data: [] as { calories: number }[] }),
        ]);
        const mealsData = meals.data ?? [];
        return {
          sharesTraining,
          sharesWeight,
          sharesNutrition,
          workoutCount: sessions.data?.length ?? 0,
          totalVolumeKg: (sessions.data ?? []).reduce(
            (sum, s) => sum + (s.total_volume_kg ?? 0),
            0,
          ),
          personalRecords: (records.data ?? []).map(
            (r: {
              id: string;
              exercise_name: string;
              weight_kg: number;
              achieved_at: string;
            }) => ({
              id: r.id,
              exerciseName: r.exercise_name,
              weightKg: r.weight_kg,
              achievedAt: r.achieved_at,
            }),
          ),
          weightSeries: (measurements.data ?? []).map(
            (m: { measured_at: string; weight_kg: number }) => ({
              date: m.measured_at,
              kg: m.weight_kg,
            }),
          ),
          avgDailyCalories: mealsData.length
            ? Math.round(
                mealsData.reduce((sum, m) => sum + (m.calories ?? 0), 0) /
                  mealsData.length,
              )
            : null,
        } satisfies FriendStats;
      },
      loadFeed: async () => {
        if (demoMode) {
          const data = seedFeedIfEmpty(userId, DEMO_FEED_SEED);
          return data.posts
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((p) => {
              const author = resolveAuthor(p.userId);
              const likes = data.likes[p.id] ?? [];
              return {
                id: p.id,
                userId: p.userId,
                authorDisplayName: author.displayName,
                authorAvatarUrl: author.avatarUrl,
                kind: p.kind,
                caption: p.caption,
                imageUrl: p.imageUrl,
                workoutSessionId: p.workoutSessionId,
                workoutSummary: p.workoutSummary,
                createdAt: p.createdAt,
                likeCount: likes.length,
                likedByMe: likes.includes(userId),
                commentCount: (data.comments[p.id] ?? []).length,
              } satisfies Post;
            });
        }
        if (!supabase) return [];
        const { data: posts, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw new Error(error.message);
        const rows = posts ?? [];
        const ids = rows.map((p) => p.id);
        const authorIds = [...new Set(rows.map((p) => p.user_id))];
        const [profiles, likes, comments] = await Promise.all([
          authorIds.length
            ? supabase
                .from("profiles")
                .select("id,display_name,avatar_url")
                .in("id", authorIds)
            : Promise.resolve({
                data: [] as {
                  id: string;
                  display_name: string;
                  avatar_url: string | null;
                }[],
              }),
          ids.length
            ? supabase
                .from("post_likes")
                .select("post_id,user_id")
                .in("post_id", ids)
            : Promise.resolve({
                data: [] as { post_id: string; user_id: string }[],
              }),
          ids.length
            ? supabase.from("post_comments").select("post_id").in("post_id", ids)
            : Promise.resolve({ data: [] as { post_id: string }[] }),
        ]);
        const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
        const likesByPost = new Map<string, string[]>();
        for (const like of likes.data ?? []) {
          likesByPost.set(like.post_id, [
            ...(likesByPost.get(like.post_id) ?? []),
            like.user_id,
          ]);
        }
        const commentCountByPost = new Map<string, number>();
        for (const c of comments.data ?? []) {
          commentCountByPost.set(
            c.post_id,
            (commentCountByPost.get(c.post_id) ?? 0) + 1,
          );
        }
        return rows.map((p) => {
          const author = profileMap.get(p.user_id);
          const likeIds = likesByPost.get(p.id) ?? [];
          return {
            id: p.id,
            userId: p.user_id,
            authorDisplayName: author?.display_name ?? "Unbekannt",
            authorAvatarUrl: author?.avatar_url ?? undefined,
            kind: p.kind as PostKind,
            caption: p.caption ?? undefined,
            imageUrl: p.image_url ?? undefined,
            workoutSessionId: p.workout_session_id ?? undefined,
            workoutSummary:
              p.kind === "workout" && p.workout_plan_name
                ? {
                    planName: p.workout_plan_name,
                    durationSeconds: p.workout_duration_seconds ?? 0,
                    totalVolumeKg: p.workout_volume_kg ?? 0,
                    exerciseCount: p.workout_exercise_count ?? 0,
                  }
                : undefined,
            createdAt: p.created_at,
            likeCount: likeIds.length,
            likedByMe: likeIds.includes(userId),
            commentCount: commentCountByPost.get(p.id) ?? 0,
          } satisfies Post;
        });
      },
      createPost: async (input) => {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        let workoutSummary: PostWorkoutSummary | undefined;
        if (input.kind === "workout") {
          const session = store.sessions.find(
            (s) => s.id === input.workoutSessionId,
          );
          if (!session) throw new Error("Workout nicht gefunden");
          workoutSummary = {
            planName: session.planName,
            durationSeconds: session.durationSeconds,
            totalVolumeKg: session.totalVolumeKg,
            exerciseCount: new Set(session.sets.map((s) => s.exerciseId)).size,
          };
        }
        if (demoMode) {
          feedAddPost(userId, {
            id,
            userId,
            kind: input.kind,
            caption: input.caption,
            imageUrl: input.imageUrl,
            workoutSessionId: input.workoutSessionId,
            workoutSummary,
            createdAt,
          });
        } else if (supabase) {
          const { error } = await supabase.from("posts").insert({
            id,
            user_id: userId,
            kind: input.kind,
            caption: input.caption ?? null,
            image_url: input.imageUrl ?? null,
            workout_session_id: input.workoutSessionId ?? null,
            workout_plan_name: workoutSummary?.planName ?? null,
            workout_duration_seconds: workoutSummary?.durationSeconds ?? null,
            workout_volume_kg: workoutSummary?.totalVolumeKg ?? null,
            workout_exercise_count: workoutSummary?.exerciseCount ?? null,
            created_at: createdAt,
          });
          if (error) throw new Error(error.message);
        } else {
          throw new Error("Nicht verfügbar");
        }
        return {
          id,
          userId,
          authorDisplayName: store.profile.displayName || "Du",
          authorAvatarUrl: store.profile.avatarUrl,
          kind: input.kind,
          caption: input.caption,
          imageUrl: input.imageUrl,
          workoutSessionId: input.workoutSessionId,
          workoutSummary,
          createdAt,
          likeCount: 0,
          likedByMe: false,
          commentCount: 0,
        } satisfies Post;
      },
      deletePost: async (postId) => {
        if (demoMode) {
          feedRemovePost(userId, postId);
          return;
        }
        if (supabase) {
          const { error } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId);
          if (error) throw new Error(error.message);
        }
      },
      toggleLike: async (postId, currentlyLiked) => {
        if (demoMode) {
          feedToggleLike(userId, postId, userId);
          return;
        }
        if (!supabase) return;
        if (currentlyLiked) {
          const { error } = await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase
            .from("post_likes")
            .insert({ post_id: postId, user_id: userId });
          if (error) throw new Error(error.message);
        }
      },
      loadComments: async (postId) => {
        if (demoMode) {
          const data = getFeed(userId);
          return (data.comments[postId] ?? []).map((c) => {
            const author = resolveAuthor(c.userId);
            return {
              id: c.id,
              postId: c.postId,
              userId: c.userId,
              authorDisplayName: author.displayName,
              authorAvatarUrl: author.avatarUrl,
              body: c.body,
              createdAt: c.createdAt,
            } satisfies PostComment;
          });
        }
        if (!supabase) return [];
        const { data, error } = await supabase
          .from("post_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        const authorIds = [...new Set(rows.map((c) => c.user_id))];
        const profiles = authorIds.length
          ? await supabase
              .from("profiles")
              .select("id,display_name,avatar_url")
              .in("id", authorIds)
          : {
              data: [] as {
                id: string;
                display_name: string;
                avatar_url: string | null;
              }[],
            };
        const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));
        return rows.map((c) => {
          const author = profileMap.get(c.user_id);
          return {
            id: c.id,
            postId: c.post_id,
            userId: c.user_id,
            authorDisplayName: author?.display_name ?? "Unbekannt",
            authorAvatarUrl: author?.avatar_url ?? undefined,
            body: c.body,
            createdAt: c.created_at,
          } satisfies PostComment;
        });
      },
      addComment: async (postId, body) => {
        const trimmed = body.trim();
        if (!trimmed) throw new Error("Kommentar darf nicht leer sein");
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        if (demoMode) {
          feedAddComment(userId, { id, postId, userId, body: trimmed, createdAt });
        } else if (supabase) {
          const { error } = await supabase.from("post_comments").insert({
            id,
            post_id: postId,
            user_id: userId,
            body: trimmed,
            created_at: createdAt,
          });
          if (error) throw new Error(error.message);
        } else {
          throw new Error("Nicht verfügbar");
        }
        return {
          id,
          postId,
          userId,
          authorDisplayName: store.profile.displayName || "Du",
          authorAvatarUrl: store.profile.avatarUrl,
          body: trimmed,
          createdAt,
        } satisfies PostComment;
      },
      deleteComment: async (postId, commentId) => {
        if (demoMode) {
          feedRemoveComment(userId, postId, commentId);
          return;
        }
        if (supabase) {
          const { error } = await supabase
            .from("post_comments")
            .delete()
            .eq("id", commentId);
          if (error) throw new Error(error.message);
        }
      },
      };
    },
    [store, query.isLoading, update, demoMode, userId],
  );
  if (query.isError) return <PageError retry={() => void query.refetch()} />;
  if (query.isLoading || !synced) return <LoadingSkeleton cards={8} />;
  return (
    <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>
  );
}
export function useFitness() {
  const value = useContext(FitnessContext);
  if (!value) throw new Error("useFitness must be used inside FitnessProvider");
  return value;
}
