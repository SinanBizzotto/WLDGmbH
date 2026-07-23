export type MuscleGroup =
  "Brust" | "Rücken" | "Beine" | "Schulter" | "Arme" | "Bauch" | "Ganzkörper";
export type EquipmentType =
  | "Körpergewicht"
  | "Langhantel"
  | "Kurzhantel"
  | "Maschine"
  | "Kabelzug"
  | "Cardio";

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: string;
  level: string;
  trainingDays: number;
}
export interface Exercise {
  id: string;
  userId?: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  exerciseType: "Kraft" | "Cardio" | "Mobilität";
  description: string;
  instructions: string[];
  image?: string;
  isPublic: boolean;
  isFavorite?: boolean;
  isCustomized?: boolean;
}
export interface ExercisePreference {
  exerciseId: string;
  customName?: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  exerciseType?: Exercise["exerciseType"];
  description?: string;
  instructions?: string[];
  isFavorite: boolean;
}
export interface PlanExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
}
export interface WorkoutPlan {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  estimatedMinutes: number;
  exercises: PlanExercise[];
  updatedAt: string;
}
export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  plannedReps: number;
  actualReps: number;
  weightKg: number;
  completed: boolean;
}
export interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  totalVolumeKg: number;
  sets: WorkoutSet[];
  currentExerciseIndex: number;
}
export interface BodyMeasurement {
  id: string;
  measuredAt: string;
  weightKg: number;
}
export interface PersonalRecord {
  id: string;
  exerciseName: string;
  weightKg: number;
  achievedAt: string;
}
export interface NutritionGoal {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
export interface Meal {
  id: string;
  name: string;
  eatenAt: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
export interface FitnessStore {
  profile: Profile;
  exercises: Exercise[];
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  records: PersonalRecord[];
  nutritionGoal: NutritionGoal;
  meals: Meal[];
}
