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
      audit_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      buyer_users: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_users_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: true
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          business_name: string
          city: string
          created_at: string
          daily_cap: number
          daily_sent: number
          email: string
          external_code: string | null
          free_leads_left: number
          id: string
          price_exclusive: number
          price_shared: number
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          response_rate: number
          services_csv: string
          shared_cap: number
          status: Database["public"]["Enums"]["buyer_status"]
        }
        Insert: {
          business_name: string
          city: string
          created_at?: string
          daily_cap?: number
          daily_sent?: number
          email: string
          external_code?: string | null
          free_leads_left?: number
          id?: string
          price_exclusive?: number
          price_shared?: number
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          response_rate?: number
          services_csv: string
          shared_cap?: number
          status?: Database["public"]["Enums"]["buyer_status"]
        }
        Update: {
          business_name?: string
          city?: string
          created_at?: string
          daily_cap?: number
          daily_sent?: number
          email?: string
          external_code?: string | null
          free_leads_left?: number
          id?: string
          price_exclusive?: number
          price_shared?: number
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          response_rate?: number
          services_csv?: string
          shared_cap?: number
          status?: Database["public"]["Enums"]["buyer_status"]
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          service_type: string
          slug: string
          status: Database["public"]["Enums"]["campaign_status"]
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          name: string
          service_type: string
          slug: string
          status?: Database["public"]["Enums"]["campaign_status"]
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          service_type?: string
          slug?: string
          status?: Database["public"]["Enums"]["campaign_status"]
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          buyer_id: string | null
          campaign_id: string | null
          channel: Database["public"]["Enums"]["delivery_channel"]
          charge_amount: number
          claimed: boolean
          closed_at: string | null
          contacted_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          outcome_notes: string | null
          outcome_reason: string | null
          refund_reason: string | null
          refund_ts: string | null
          refunded: boolean
          source: string
          won: boolean
        }
        Insert: {
          buyer_id?: string | null
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["delivery_channel"]
          charge_amount?: number
          claimed?: boolean
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          outcome_notes?: string | null
          outcome_reason?: string | null
          refund_reason?: string | null
          refund_ts?: string | null
          refunded?: boolean
          source?: string
          won?: boolean
        }
        Update: {
          buyer_id?: string | null
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["delivery_channel"]
          charge_amount?: number
          claimed?: boolean
          closed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          outcome_notes?: string | null
          outcome_reason?: string | null
          refund_reason?: string | null
          refund_ts?: string | null
          refunded?: boolean
          source?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_raw: string | null
          campaign_id: string | null
          city: string
          created_at: string
          email: string
          exclusivity: Database["public"]["Enums"]["pricing_mode"]
          hash_24h: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          price_per_buyer: number
          service_type: string
          source: string
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          budget_raw?: string | null
          campaign_id?: string | null
          city: string
          created_at?: string
          email: string
          exclusivity?: Database["public"]["Enums"]["pricing_mode"]
          hash_24h?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          price_per_buyer?: number
          service_type: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          budget_raw?: string | null
          campaign_id?: string | null
          city?: string
          created_at?: string
          email?: string
          exclusivity?: Database["public"]["Enums"]["pricing_mode"]
          hash_24h?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          price_per_buyer?: number
          service_type?: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_requests: {
        Row: {
          auto_decision: boolean
          buyer_id: string | null
          created_at: string
          delivery_id: string | null
          handled_by: string | null
          handled_ts: string | null
          id: string
          reason: string
          reason_category: string | null
          refund_amount: number | null
          refund_scope: string | null
          requested_by: string | null
          requested_by_details: string | null
          status: Database["public"]["Enums"]["refund_status"]
        }
        Insert: {
          auto_decision?: boolean
          buyer_id?: string | null
          created_at?: string
          delivery_id?: string | null
          handled_by?: string | null
          handled_ts?: string | null
          id?: string
          reason: string
          reason_category?: string | null
          refund_amount?: number | null
          refund_scope?: string | null
          requested_by?: string | null
          requested_by_details?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Update: {
          auto_decision?: boolean
          buyer_id?: string | null
          created_at?: string
          delivery_id?: string | null
          handled_by?: string | null
          handled_ts?: string | null
          id?: string
          reason?: string
          reason_category?: string | null
          refund_amount?: number | null
          refund_scope?: string | null
          requested_by?: string | null
          requested_by_details?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      rejections: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          payload: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          reason?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stripe_charges: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string
          delivery_id: string | null
          id: string
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_charges_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_charges_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          buyer_id: string | null
          created_at: string
          current_plan: string | null
          id: string
          stripe_customer_id: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          current_plan?: string | null
          id?: string
          stripe_customer_id: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          current_plan?: string | null
          id?: string
          stripe_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: true
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_subscriptions: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string
          trial_end: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id: string
          trial_end?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          trial_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscriptions_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buyer_email_exists: { Args: { _email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_email_matches_buyer: {
        Args: { _buyer_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "buyer"
      buyer_status: "active" | "paused" | "test"
      campaign_status: "active" | "paused"
      delivery_channel: "email" | "api" | "sms"
      lead_status:
        | "new"
        | "routed"
        | "delivered"
        | "refunded"
        | "rejected"
        | "archived"
      pricing_mode: "shared" | "exclusive" | "both"
      refund_status: "pending" | "approved" | "rejected" | "auto_approved"
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
    Enums: {
      app_role: ["admin", "buyer"],
      buyer_status: ["active", "paused", "test"],
      campaign_status: ["active", "paused"],
      delivery_channel: ["email", "api", "sms"],
      lead_status: [
        "new",
        "routed",
        "delivered",
        "refunded",
        "rejected",
        "archived",
      ],
      pricing_mode: ["shared", "exclusive", "both"],
      refund_status: ["pending", "approved", "rejected", "auto_approved"],
    },
  },
} as const
