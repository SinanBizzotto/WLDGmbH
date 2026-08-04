export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      exercise_preferences: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_equipment_type: string | null
          custom_exercise_type: string | null
          custom_instructions: string[] | null
          custom_muscle_group: string | null
          custom_name: string | null
          exercise_id: string
          is_favorite: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_equipment_type?: string | null
          custom_exercise_type?: string | null
          custom_instructions?: string[] | null
          custom_muscle_group?: string | null
          custom_name?: string | null
          exercise_id: string
          is_favorite?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_equipment_type?: string | null
          custom_exercise_type?: string | null
          custom_instructions?: string[] | null
          custom_muscle_group?: string | null
          custom_name?: string | null
          exercise_id?: string
          is_favorite?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_preferences_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          equipment_type: string
          exercise_type: string
          id: string
          image_url: string | null
          instructions: string[]
          is_public: boolean
          muscle_group: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment_type: string
          exercise_type?: string
          id?: string
          image_url?: string | null
          instructions?: string[]
          is_public?: boolean
          muscle_group: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment_type?: string
          exercise_type?: string
          id?: string
          image_url?: string | null
          instructions?: string[]
          is_public?: boolean
          muscle_group?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      friend_request_attempts: {
        Row: {
          attempted_at: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_entries: {
        Row: {
          amount_g: number
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          meal_id: string
          name: string
          protein_g: number
          updated_at: string
        }
        Insert: {
          amount_g?: number
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          meal_id: string
          name: string
          protein_g?: number
          updated_at?: string
        }
        Update: {
          amount_g?: number
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          meal_id?: string
          name?: string
          protein_g?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          eaten_at: string
          fat_g: number
          id: string
          name: string
          protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          eaten_at?: string
          fat_g?: number
          id?: string
          name: string
          protein_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          eaten_at?: string
          fat_g?: number
          id?: string
          name?: string
          protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          protein_g: number
          updated_at: string
          user_id: string
          water_goal_ml: number
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          protein_g?: number
          updated_at?: string
          user_id: string
          water_goal_ml?: number
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          protein_g?: number
          updated_at?: string
          user_id?: string
          water_goal_ml?: number
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          kind: string
          user_id: string
          workout_duration_seconds: number | null
          workout_exercise_count: number | null
          workout_plan_name: string | null
          workout_session_id: string | null
          workout_volume_kg: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          user_id: string
          workout_duration_seconds?: number | null
          workout_exercise_count?: number | null
          workout_plan_name?: string | null
          workout_session_id?: string | null
          workout_volume_kg?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          user_id?: string
          workout_duration_seconds?: number | null
          workout_exercise_count?: number | null
          workout_plan_name?: string | null
          workout_session_id?: string | null
          workout_volume_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_weight_kg: number | null
          display_name: string
          experience_level: string
          friend_code: string | null
          height_cm: number | null
          id: string
          share_nutrition: boolean
          share_training: boolean
          share_weight: boolean
          target_weight_kg: number | null
          training_days_per_week: number
          training_goal: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_weight_kg?: number | null
          display_name?: string
          experience_level?: string
          friend_code?: string | null
          height_cm?: number | null
          id: string
          share_nutrition?: boolean
          share_training?: boolean
          share_weight?: boolean
          target_weight_kg?: number | null
          training_days_per_week?: number
          training_goal?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_weight_kg?: number | null
          display_name?: string
          experience_level?: string
          friend_code?: string | null
          height_cm?: number | null
          id?: string
          share_nutrition?: boolean
          share_training?: boolean
          share_weight?: boolean
          target_weight_kg?: number | null
          training_days_per_week?: number
          training_goal?: string
          updated_at?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plan_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          plan_id: string
          reps: number
          rest_seconds: number
          sets: number
          sort_order: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          plan_id: string
          reps: number
          rest_seconds?: number
          sets: number
          sort_order?: number
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          plan_id?: string
          reps?: number
          rest_seconds?: number
          sets?: number
          sort_order?: number
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          estimated_minutes: number
          id: string
          muscle_groups: string[]
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          muscle_groups?: string[]
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          muscle_groups?: string[]
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_exercise_index: number
          duration_seconds: number
          id: string
          plan_id: string | null
          plan_name: string
          started_at: string
          status: string
          total_volume_kg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_exercise_index?: number
          duration_seconds?: number
          id?: string
          plan_id?: string | null
          plan_name: string
          started_at?: string
          status?: string
          total_volume_kg?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_exercise_index?: number
          duration_seconds?: number
          id?: string
          plan_id?: string | null
          plan_name?: string
          started_at?: string
          status?: string
          total_volume_kg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          actual_reps: number
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          planned_reps: number
          session_id: string
          set_number: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          actual_reps?: number
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          planned_reps?: number
          session_id: string
          set_number: number
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          actual_reps?: number
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          planned_reps?: number
          session_id?: string
          set_number?: number
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_current_user: { Args: never; Returns: undefined }
      get_connection_profiles: {
        Args: { target_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          share_nutrition: boolean
          share_training: boolean
          share_weight: boolean
        }[]
      }
      is_accepted_friend: { Args: { other_user_id: string }; Returns: boolean }
      send_friend_request: {
        Args: { target_code: string }
        Returns: {
          friend_avatar_url: string
          friend_display_name: string
          friend_id: string
          friendship_id: string
          friendship_status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
