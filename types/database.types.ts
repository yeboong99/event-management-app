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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      carpool_requests: {
        Row: {
          carpool_id: string
          created_at: string | null
          id: string
          message: string | null
          passenger_id: string
          status: Database["public"]["Enums"]["carpool_request_status"]
          updated_at: string | null
        }
        Insert: {
          carpool_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          passenger_id: string
          status?: Database["public"]["Enums"]["carpool_request_status"]
          updated_at?: string | null
        }
        Update: {
          carpool_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          passenger_id?: string
          status?: Database["public"]["Enums"]["carpool_request_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carpool_requests_carpool_id_fkey"
            columns: ["carpool_id"]
            isOneToOne: false
            referencedRelation: "carpools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpool_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carpools: {
        Row: {
          created_at: string | null
          departure_place: string
          departure_time: string | null
          description: string | null
          driver_id: string
          event_id: string
          id: string
          total_seats: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          departure_place: string
          departure_time?: string | null
          description?: string | null
          driver_id: string
          event_id: string
          id?: string
          total_seats: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          departure_place?: string
          departure_time?: string | null
          description?: string | null
          driver_id?: string
          event_id?: string
          id?: string
          total_seats?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carpools_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carpools_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          event_date: string
          host_id: string
          id: string
          invite_token: string
          is_public: boolean | null
          is_settlement_finalized: boolean
          location: string | null
          max_participants: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date: string
          host_id: string
          id?: string
          invite_token?: string
          is_public?: boolean | null
          is_settlement_finalized?: boolean
          location?: string | null
          max_participants?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          host_id?: string
          id?: string
          invite_token?: string
          is_public?: boolean | null
          is_settlement_finalized?: boolean
          location?: string | null
          max_participants?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          attended: boolean | null
          created_at: string | null
          event_id: string
          id: string
          message: string | null
          status: Database["public"]["Enums"]["participation_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          event_id: string
          id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      settlement_items: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          event_id: string
          id: string
          label: string
          paid_by: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          event_id: string
          id?: string
          label: string
          paid_by: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          id?: string
          label?: string
          paid_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_carpool_request: {
        Args: { p_carpool_id: string; p_request_id: string }
        Returns: boolean
      }
      approve_participation: {
        Args: { p_event_id: string; p_participation_id: string }
        Returns: boolean
      }
      get_admin_kpi_stats: { Args: never; Returns: Json }
      get_event_by_invite_token: {
        Args: { p_invite_token: string }
        Returns: {
          category: Database["public"]["Enums"]["event_category"]
          cover_image_url: string
          description: string
          event_date: string
          host_id: string
          host_name: string
          id: string
          is_public: boolean
          location: string
          max_participants: number
          title: string
        }[]
      }
      get_event_participant_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      get_events_participant_counts: {
        Args: { p_event_ids: string[] }
        Returns: {
          event_id: string
          participant_count: number
        }[]
      }
      is_approved_participant_for_event: {
        Args: { event_uuid: string }
        Returns: boolean
      }
      update_carpool_info: {
        Args: {
          p_carpool_id: string
          p_departure_place: string
          p_departure_time: string
          p_description: string
          p_total_seats: number
        }
        Returns: boolean
      }
      update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      carpool_request_status: "pending" | "approved" | "rejected"
      event_category:
        | "생일파티"
        | "파티모임"
        | "워크샵"
        | "스터디"
        | "운동스포츠"
        | "기타"
      participation_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>]

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
    Enums: {
      carpool_request_status: ["pending", "approved", "rejected"],
      event_category: [
        "생일파티",
        "파티모임",
        "워크샵",
        "스터디",
        "운동스포츠",
        "기타",
      ],
      participation_status: ["pending", "approved", "rejected"],
    },
  },
} as const
