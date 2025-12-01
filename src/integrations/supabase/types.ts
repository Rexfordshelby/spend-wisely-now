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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          due_date: string
          id: string
          name: string
          notes: string | null
          recurrence_type: string | null
          recurring: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          name: string
          notes?: string | null
          recurrence_type?: string | null
          recurring?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          name?: string
          notes?: string | null
          recurrence_type?: string | null
          recurring?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          daily_limit: number
          id: string
          updated_at: string
          user_id: string
          weekly_limit: number
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          id?: string
          updated_at?: string
          user_id: string
          weekly_limit?: number
        }
        Update: {
          created_at?: string
          daily_limit?: number
          id?: string
          updated_at?: string
          user_id?: string
          weekly_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_number: string
          created_at: string | null
          cvv: string
          expiry: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          card_number: string
          created_at?: string | null
          cvv: string
          expiry: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          card_number?: string
          created_at?: string | null
          cvv?: string
          expiry?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rate_cache: {
        Row: {
          base_currency: string
          fetched_at: string | null
          id: string
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency: string
          fetched_at?: string | null
          id?: string
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string
          fetched_at?: string | null
          id?: string
          rate?: number
          target_currency?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          id: string
          name: string
          status: string | null
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name: string
          status?: string | null
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name?: string
          status?: string | null
          target_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_goal_members: {
        Row: {
          contribution: number | null
          goal_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          contribution?: number | null
          goal_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          contribution?: number | null
          goal_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_goal_members_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "group_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_goal_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_goals: {
        Row: {
          created_at: string | null
          creator_id: string
          current_amount: number | null
          deadline: string | null
          id: string
          name: string
          status: string | null
          target_amount: number
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name: string
          status?: string | null
          target_amount: number
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          name?: string
          status?: string | null
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_goals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      international_transfers: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          exchange_rate: number
          fee: number
          id: string
          recipient_details: Json | null
          recipient_id: string | null
          sender_id: string
          sender_wallet_id: string | null
          source_currency: string
          status: string | null
          target_currency: string
          total_amount: number
          transfer_type: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          exchange_rate: number
          fee?: number
          id?: string
          recipient_details?: Json | null
          recipient_id?: string | null
          sender_id: string
          sender_wallet_id?: string | null
          source_currency: string
          status?: string | null
          target_currency: string
          total_amount: number
          transfer_type: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          exchange_rate?: number
          fee?: number
          id?: string
          recipient_details?: Json | null
          recipient_id?: string | null
          sender_id?: string
          sender_wallet_id?: string | null
          source_currency?: string
          status?: string | null
          target_currency?: string
          total_amount?: number
          transfer_type?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          country_code: string
          created_at: string | null
          document_type: string
          document_url: string | null
          id: string
          id_number: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          document_type: string
          document_url?: string | null
          id?: string
          id_number?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          document_type?: string
          document_url?: string | null
          id?: string
          id_number?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      leaderboard_scores: {
        Row: {
          id: string
          rank: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          rank?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          rank?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      multi_currency_wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          is_primary: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          budget_adherence_score: number | null
          created_at: string | null
          credit_score: number | null
          full_name: string | null
          id: string
          monthly_income: number | null
          onboarding_completed: boolean | null
          role: string | null
          spends_advised_count: number | null
          spends_skipped_count: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          budget_adherence_score?: number | null
          created_at?: string | null
          credit_score?: number | null
          full_name?: string | null
          id: string
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          role?: string | null
          spends_advised_count?: number | null
          spends_skipped_count?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          budget_adherence_score?: number | null
          created_at?: string | null
          credit_score?: number | null
          full_name?: string | null
          id?: string
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          role?: string | null
          spends_advised_count?: number | null
          spends_skipped_count?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      recipients: {
        Row: {
          account_number: string | null
          bank_name: string | null
          country_code: string
          created_at: string | null
          currency: string
          iban: string | null
          id: string
          is_verified: boolean | null
          name: string
          swift_code: string | null
          upi_id: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          country_code: string
          created_at?: string | null
          currency: string
          iban?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          swift_code?: string | null
          upi_id?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          country_code?: string
          created_at?: string | null
          currency?: string
          iban?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          swift_code?: string | null
          upi_id?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          metadata: Json | null
          post_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          post_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          metadata?: Json | null
          post_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spending_limits: {
        Row: {
          category: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          weekly_limit: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          weekly_limit?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          weekly_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "spending_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          category: string | null
          created_at: string | null
          id: string
          name: string
          next_billing_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          next_billing_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          next_billing_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          recurrence_pattern: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
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
      [_ in never]: never
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
