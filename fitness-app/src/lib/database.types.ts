/** Supabase schema types. Regenerate after migrations with: supabase gen types typescript. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};
type Owned = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};
export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        height_cm: number | null;
        current_weight_kg: number | null;
        target_weight_kg: number | null;
        training_goal: string;
        experience_level: string;
        training_days_per_week: number;
        created_at: string;
        updated_at: string;
      }>;
      exercises: Table<
        Owned & {
          name: string;
          muscle_group: string;
          equipment_type: string;
          exercise_type: string;
          description: string | null;
          instructions: string[];
          image_url: string | null;
          is_public: boolean;
          user_id: string | null;
        }
      >;
      exercise_preferences: Table<{
        user_id: string;
        exercise_id: string;
        custom_name: string | null;
        custom_muscle_group: string | null;
        custom_equipment_type: string | null;
        custom_exercise_type: string | null;
        custom_description: string | null;
        custom_instructions: string[] | null;
        is_favorite: boolean;
        created_at: string;
        updated_at: string;
      }>;
      workout_plans: Table<
        Owned & {
          name: string;
          muscle_groups: string[];
          estimated_minutes: number;
        }
      >;
      workout_plan_exercises: Table<{
        id: string;
        plan_id: string;
        exercise_id: string;
        sort_order: number;
        sets: number;
        reps: number;
        weight_kg: number;
        rest_seconds: number;
        created_at: string;
        updated_at: string;
      }>;
      workout_sessions: Table<
        Owned & {
          plan_id: string | null;
          plan_name: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number;
          total_volume_kg: number;
          current_exercise_index: number;
        }
      >;
      workout_sets: Table<{
        id: string;
        session_id: string;
        exercise_id: string;
        set_number: number;
        planned_reps: number;
        actual_reps: number;
        weight_kg: number;
        completed: boolean;
        created_at: string;
        updated_at: string;
      }>;
      body_measurements: Table<
        Owned & { measured_at: string; weight_kg: number }
      >;
      nutrition_goals: Table<
        Owned & {
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
        }
      >;
      meals: Table<
        Owned & {
          name: string;
          eaten_at: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
        }
      >;
      meal_entries: Table<{
        id: string;
        meal_id: string;
        name: string;
        amount_g: number;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        created_at: string;
        updated_at: string;
      }>;
      personal_records: Table<
        Owned & {
          exercise_id: string | null;
          exercise_name: string;
          weight_kg: number;
          achieved_at: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      delete_current_user: { Args: Record<PropertyKey, never>; Returns: void };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
