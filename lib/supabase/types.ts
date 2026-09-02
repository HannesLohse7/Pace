/**
 * Generated from the live Supabase schema (`mcp__Supabase__generate_typescript_types`)
 * against the `core_schema` + `waitlist_signups` + `adaptation_audit_schema` +
 * `wearable_schema` + `calendar_schema` migrations, plus the `waitlist_signups_by_day` view.
 * Regenerate after any schema migration — don't hand-edit.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      adaptation_event: {
        Row: {
          after_state: Json | null;
          athlete_id: string;
          before_state: Json | null;
          created_at: string;
          engine_version_id: string | null;
          id: string;
          reasoning: string | null;
          summary: string;
          training_plan_id: string | null;
          trigger_type: string;
          workout_id: string | null;
        };
        Insert: {
          after_state?: Json | null;
          athlete_id: string;
          before_state?: Json | null;
          created_at?: string;
          engine_version_id?: string | null;
          id?: string;
          reasoning?: string | null;
          summary: string;
          training_plan_id?: string | null;
          trigger_type: string;
          workout_id?: string | null;
        };
        Update: {
          after_state?: Json | null;
          athlete_id?: string;
          before_state?: Json | null;
          created_at?: string;
          engine_version_id?: string | null;
          id?: string;
          reasoning?: string | null;
          summary?: string;
          training_plan_id?: string | null;
          trigger_type?: string;
          workout_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'adaptation_event_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'adaptation_event_engine_version_id_fkey';
            columns: ['engine_version_id'];
            isOneToOne: false;
            referencedRelation: 'engine_version';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'adaptation_event_training_plan_id_fkey';
            columns: ['training_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'adaptation_event_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workout';
            referencedColumns: ['id'];
          },
        ];
      };
      athlete_profile: {
        Row: {
          created_at: string;
          css_pace_sec_per_100m: number | null;
          date_of_birth: string | null;
          display_name: string;
          email: string;
          ftp_watts: number | null;
          id: string;
          sex: string | null;
          threshold_pace_sec_per_km: number | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          css_pace_sec_per_100m?: number | null;
          date_of_birth?: string | null;
          display_name: string;
          email: string;
          ftp_watts?: number | null;
          id: string;
          sex?: string | null;
          threshold_pace_sec_per_km?: number | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          css_pace_sec_per_100m?: number | null;
          date_of_birth?: string | null;
          display_name?: string;
          email?: string;
          ftp_watts?: number | null;
          id?: string;
          sex?: string | null;
          threshold_pace_sec_per_km?: number | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_connection: {
        Row: {
          athlete_id: string;
          connected_at: string;
          google_calendar_id: string;
          id: string;
          last_synced_at: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          athlete_id: string;
          connected_at?: string;
          google_calendar_id?: string;
          id?: string;
          last_synced_at?: string | null;
          provider: string;
          status?: string;
        };
        Update: {
          athlete_id?: string;
          connected_at?: string;
          google_calendar_id?: string;
          id?: string;
          last_synced_at?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_connection_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_connection_request: {
        Row: {
          athlete_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          athlete_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_connection_request_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_oauth_token: {
        Row: {
          access_token: string;
          connection_id: string;
          expires_at: string;
          id: string;
          refresh_token: string;
          updated_at: string;
        };
        Insert: {
          access_token: string;
          connection_id: string;
          expires_at: string;
          id?: string;
          refresh_token: string;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          connection_id?: string;
          expires_at?: string;
          id?: string;
          refresh_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_oauth_token_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: true;
            referencedRelation: 'calendar_connection';
            referencedColumns: ['id'];
          },
        ];
      };
      engine_version: {
        Row: {
          description: string;
          id: string;
          released_at: string;
          version: string;
        };
        Insert: {
          description: string;
          id?: string;
          released_at?: string;
          version: string;
        };
        Update: {
          description?: string;
          id?: string;
          released_at?: string;
          version?: string;
        };
        Relationships: [];
      };
      race: {
        Row: {
          athlete_id: string;
          created_at: string;
          distance: string;
          id: string;
          location: string | null;
          name: string;
          priority: string;
          race_date: string;
        };
        Insert: {
          athlete_id: string;
          created_at?: string;
          distance: string;
          id?: string;
          location?: string | null;
          name: string;
          priority?: string;
          race_date: string;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          distance?: string;
          id?: string;
          location?: string | null;
          name?: string;
          priority?: string;
          race_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'race_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      recovery_signal: {
        Row: {
          athlete_id: string;
          created_at: string;
          hrv_ms: number | null;
          id: string;
          resting_hr_bpm: number | null;
          signal_date: string;
          sleep_duration_min: number | null;
          source: string;
        };
        Insert: {
          athlete_id: string;
          created_at?: string;
          hrv_ms?: number | null;
          id?: string;
          resting_hr_bpm?: number | null;
          signal_date: string;
          sleep_duration_min?: number | null;
          source?: string;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          hrv_ms?: number | null;
          id?: string;
          resting_hr_bpm?: number | null;
          signal_date?: string;
          sleep_duration_min?: number | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recovery_signal_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      training_phase: {
        Row: {
          athlete_id: string;
          end_date: string;
          id: string;
          name: string;
          sequence: number;
          start_date: string;
          training_plan_id: string;
        };
        Insert: {
          athlete_id: string;
          end_date: string;
          id?: string;
          name: string;
          sequence: number;
          start_date: string;
          training_plan_id: string;
        };
        Update: {
          athlete_id?: string;
          end_date?: string;
          id?: string;
          name?: string;
          sequence?: number;
          start_date?: string;
          training_plan_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'training_phase_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_phase_training_plan_id_fkey';
            columns: ['training_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plan';
            referencedColumns: ['id'];
          },
        ];
      };
      training_plan: {
        Row: {
          athlete_id: string;
          created_at: string;
          end_date: string;
          id: string;
          race_id: string | null;
          start_date: string;
          status: string;
          weeks: number;
        };
        Insert: {
          athlete_id: string;
          created_at?: string;
          end_date: string;
          id?: string;
          race_id?: string | null;
          start_date: string;
          status?: string;
          weeks: number;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          race_id?: string | null;
          start_date?: string;
          status?: string;
          weeks?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'training_plan_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'training_plan_race_id_fkey';
            columns: ['race_id'];
            isOneToOne: false;
            referencedRelation: 'race';
            referencedColumns: ['id'];
          },
        ];
      };
      waitlist_signups: {
        Row: {
          created_at: string;
          distance_interest: string | null;
          email: string;
          id: string;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          distance_interest?: string | null;
          email: string;
          id?: string;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          distance_interest?: string | null;
          email?: string;
          id?: string;
          source?: string | null;
        };
        Relationships: [];
      };
      wearable_connection: {
        Row: {
          athlete_id: string;
          connected_at: string;
          created_at: string;
          id: string;
          last_synced_at: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          athlete_id: string;
          connected_at?: string;
          created_at?: string;
          id?: string;
          last_synced_at?: string | null;
          provider: string;
          status?: string;
        };
        Update: {
          athlete_id?: string;
          connected_at?: string;
          created_at?: string;
          id?: string;
          last_synced_at?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wearable_connection_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
        ];
      };
      workout: {
        Row: {
          athlete_id: string;
          cadence_target: string | null;
          created_at: string;
          description: string | null;
          discipline: string;
          equipment: string[];
          id: string;
          intensity: string | null;
          pace_target: string | null;
          planned_calories: number | null;
          planned_duration_min: number | null;
          planned_tss: number | null;
          scheduled_date: string;
          sequence_in_day: number;
          status: string;
          title: string;
          training_plan_id: string | null;
          updated_at: string;
        };
        Insert: {
          athlete_id: string;
          cadence_target?: string | null;
          created_at?: string;
          description?: string | null;
          discipline: string;
          equipment?: string[];
          id?: string;
          intensity?: string | null;
          pace_target?: string | null;
          planned_calories?: number | null;
          planned_duration_min?: number | null;
          planned_tss?: number | null;
          scheduled_date: string;
          sequence_in_day?: number;
          status?: string;
          title: string;
          training_plan_id?: string | null;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string;
          cadence_target?: string | null;
          created_at?: string;
          description?: string | null;
          discipline?: string;
          equipment?: string[];
          id?: string;
          intensity?: string | null;
          pace_target?: string | null;
          planned_calories?: number | null;
          planned_duration_min?: number | null;
          planned_tss?: number | null;
          scheduled_date?: string;
          sequence_in_day?: number;
          status?: string;
          title?: string;
          training_plan_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_training_plan_id_fkey';
            columns: ['training_plan_id'];
            isOneToOne: false;
            referencedRelation: 'training_plan';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_completion: {
        Row: {
          actual_calories: number | null;
          actual_duration_min: number | null;
          actual_tss: number | null;
          athlete_id: string;
          completed_at: string;
          created_at: string;
          id: string;
          notes: string | null;
          perceived_effort: number | null;
          source: string;
          workout_id: string;
        };
        Insert: {
          actual_calories?: number | null;
          actual_duration_min?: number | null;
          actual_tss?: number | null;
          athlete_id: string;
          completed_at?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          perceived_effort?: number | null;
          source?: string;
          workout_id: string;
        };
        Update: {
          actual_calories?: number | null;
          actual_duration_min?: number | null;
          actual_tss?: number | null;
          athlete_id?: string;
          completed_at?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          perceived_effort?: number | null;
          source?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_completion_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_completion_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workout';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_step: {
        Row: {
          athlete_id: string;
          description: string;
          id: string;
          phase: string;
          workout_id: string;
        };
        Insert: {
          athlete_id: string;
          description: string;
          id?: string;
          phase: string;
          workout_id: string;
        };
        Update: {
          athlete_id?: string;
          description?: string;
          id?: string;
          phase?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_step_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_step_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workout';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_target_zone: {
        Row: {
          athlete_id: string;
          id: string;
          range: string;
          sequence: number;
          target_type: string;
          workout_id: string;
          zone: string;
          zone_name: string;
        };
        Insert: {
          athlete_id: string;
          id?: string;
          range: string;
          sequence?: number;
          target_type: string;
          workout_id: string;
          zone: string;
          zone_name: string;
        };
        Update: {
          athlete_id?: string;
          id?: string;
          range?: string;
          sequence?: number;
          target_type?: string;
          workout_id?: string;
          zone?: string;
          zone_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_target_zone_athlete_id_fkey';
            columns: ['athlete_id'];
            isOneToOne: false;
            referencedRelation: 'athlete_profile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_target_zone_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workout';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      waitlist_signups_by_day: {
        Row: {
          cumulative_signups: number | null;
          signup_date: string | null;
          signups: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
