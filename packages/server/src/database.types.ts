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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          cycle_id: string
          ends_at: string
          id: string
          kind: string
          revoked_at: string | null
          starts_at: string
          user_id: string
        }
        Insert: {
          cycle_id: string
          ends_at: string
          id?: string
          kind: string
          revoked_at?: string | null
          starts_at: string
          user_id: string
        }
        Update: {
          cycle_id?: string
          ends_at?: string
          id?: string
          kind?: string
          revoked_at?: string | null
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "exam_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_entries: {
        Row: {
          content_id: string
          cycle_id: string
          kind: string
          status: string
          summary: string
          title: string
          topic_id: string
          version_id: string
          visibility: string
        }
        Insert: {
          content_id: string
          cycle_id: string
          kind: string
          status: string
          summary: string
          title: string
          topic_id: string
          version_id: string
          visibility: string
        }
        Update: {
          content_id?: string
          cycle_id?: string
          kind?: string
          status?: string
          summary?: string
          title?: string
          topic_id?: string
          version_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_entries_cycle_id_topic_id_fkey"
            columns: ["cycle_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["cycle_id", "id"]
          },
        ]
      }
      exam_cycles: {
        Row: {
          exam_id: string
          id: string
          label: string
          source_checked_at: string | null
          source_url: string | null
          source_verified: boolean
          status: string
        }
        Insert: {
          exam_id: string
          id: string
          label: string
          source_checked_at?: string | null
          source_url?: string | null
          source_verified?: boolean
          status?: string
        }
        Update: {
          exam_id?: string
          id?: string
          label?: string
          source_checked_at?: string | null
          source_url?: string | null
          source_verified?: boolean
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          display_name: string
          revision: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name: string
          revision: number
          timezone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string
          revision?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_preferences: {
        Row: {
          cycle_id: string | null
          daily_minutes: number
          diagnostic_choice: string
          familiarity: string
          revision: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          cycle_id?: string | null
          daily_minutes: number
          diagnostic_choice: string
          familiarity: string
          revision: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          cycle_id?: string | null
          daily_minutes?: number
          diagnostic_choice?: string
          familiarity?: string
          revision?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_preferences_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "exam_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      target_history: {
        Row: {
          changed_at: string
          cycle_id: string
          exam_id: string
          id: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          cycle_id: string
          exam_id: string
          id?: string
          user_id: string
        }
        Update: {
          changed_at?: string
          cycle_id?: string
          exam_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_history_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "exam_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_prerequisites: {
        Row: {
          cycle_id: string
          prerequisite_id: string
          topic_id: string
        }
        Insert: {
          cycle_id: string
          prerequisite_id: string
          topic_id: string
        }
        Update: {
          cycle_id?: string
          prerequisite_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_prerequisites_cycle_id_prerequisite_id_fkey"
            columns: ["cycle_id", "prerequisite_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["cycle_id", "id"]
          },
          {
            foreignKeyName: "topic_prerequisites_cycle_id_topic_id_fkey"
            columns: ["cycle_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["cycle_id", "id"]
          },
        ]
      }
      topics: {
        Row: {
          cycle_id: string
          id: string
          status: string
          title: string
        }
        Insert: {
          cycle_id: string
          id: string
          status?: string
          title: string
        }
        Update: {
          cycle_id?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "exam_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      lawprep_access: { Args: never; Returns: Json }
      lawprep_actor: { Args: never; Returns: Json }
      lawprep_catalog: { Args: { p_exam_id: string }; Returns: Json }
      lawprep_editor_command: { Args: { p_command: Json }; Returns: Json }
      lawprep_editor_state: { Args: { p_version_id?: string }; Returns: Json }
      lawprep_import_library: {
        Args: {
          p_batch_hash?: string
          p_kind?: string
          p_limit?: number
          p_offset?: number
          p_ordinal?: number
          p_query?: string
        }
        Returns: Json
      }
      lawprep_record_sample_learning: {
        Args: {
          p_kind: string
          p_mutation_id: string
          p_option_id: string
          p_question_id: string
          p_unit_id: string
        }
        Returns: Json
      }
      lawprep_sample_learning: { Args: never; Returns: Json }
      lawprep_save_profile: {
        Args: {
          p_display_name: string
          p_expected_revision: number
          p_timezone: string
        }
        Returns: Json
      }
      lawprep_save_study_preferences: {
        Args: {
          p_cycle_id: string
          p_daily_minutes: number
          p_diagnostic_choice: string
          p_expected_revision: number
          p_familiarity: string
          p_target_date: string
        }
        Returns: Json
      }
      lawprep_study_preferences: { Args: never; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
