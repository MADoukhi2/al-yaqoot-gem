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
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finished_items: {
        Row: {
          artisan: string | null
          category: string
          created_at: string
          customer_id: string | null
          id: string
          karat: number
          kind: Database["public"]["Enums"]["item_kind"]
          labor_cost: number
          name: string
          profit: number
          sku: string
          sold: boolean
          status: Database["public"]["Enums"]["service_status"] | null
          updated_at: string
          weight_g: number
        }
        Insert: {
          artisan?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          karat?: number
          kind?: Database["public"]["Enums"]["item_kind"]
          labor_cost?: number
          name: string
          profit?: number
          sku: string
          sold?: boolean
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
          weight_g?: number
        }
        Update: {
          artisan?: string | null
          category?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          karat?: number
          kind?: Database["public"]["Enums"]["item_kind"]
          labor_cost?: number
          name?: string
          profit?: number
          sku?: string
          sold?: boolean
          status?: Database["public"]["Enums"]["service_status"] | null
          updated_at?: string
          weight_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "finished_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          finished_item_id: string | null
          id: string
          karat: number
          line_total: number
          order_id: string
          quantity: number
          unit_price: number
          weight_g: number
        }
        Insert: {
          created_at?: string
          description: string
          finished_item_id?: string | null
          id?: string
          karat?: number
          line_total?: number
          order_id: string
          quantity?: number
          unit_price?: number
          weight_g?: number
        }
        Update: {
          created_at?: string
          description?: string
          finished_item_id?: string | null
          id?: string
          karat?: number
          line_total?: number
          order_id?: string
          quantity?: number
          unit_price?: number
          weight_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_finished_item_id_fkey"
            columns: ["finished_item_id"]
            isOneToOne: false
            referencedRelation: "finished_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel: Database["public"]["Enums"]["order_channel"]
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          gold_price: number
          id: string
          notes: string | null
          order_no: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_weight_g: number
          updated_at: string
          vat: number
        }
        Insert: {
          channel?: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          gold_price?: number
          id?: string
          notes?: string | null
          order_no?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_weight_g?: number
          updated_at?: string
          vat?: number
        }
        Update: {
          channel?: Database["public"]["Enums"]["order_channel"]
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          gold_price?: number
          id?: string
          notes?: string | null
          order_no?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_weight_g?: number
          updated_at?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          preferred_lang: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          preferred_lang?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_lang?: string
          updated_at?: string
        }
        Relationships: []
      }
      raw_assets: {
        Row: {
          created_at: string
          id: string
          karat: number
          metal: Database["public"]["Enums"]["metal_type"]
          name: string
          notes: string | null
          sku: string
          updated_at: string
          weight_g: number
        }
        Insert: {
          created_at?: string
          id?: string
          karat?: number
          metal?: Database["public"]["Enums"]["metal_type"]
          name: string
          notes?: string | null
          sku: string
          updated_at?: string
          weight_g?: number
        }
        Update: {
          created_at?: string
          id?: string
          karat?: number
          metal?: Database["public"]["Enums"]["metal_type"]
          name?: string
          notes?: string | null
          sku?: string
          updated_at?: string
          weight_g?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_kind: "Sellable" | "Service"
      metal_type: "Gold" | "Silver"
      order_channel: "Retail" | "Investment"
      order_status: "Pending" | "Confirmed" | "Fulfilled" | "Cancelled"
      service_status:
        | "Received"
        | "Delivering to Workshop"
        | "Crafting"
        | "Polishing"
        | "Heading to Shop"
        | "Ready"
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
      item_kind: ["Sellable", "Service"],
      metal_type: ["Gold", "Silver"],
      order_channel: ["Retail", "Investment"],
      order_status: ["Pending", "Confirmed", "Fulfilled", "Cancelled"],
      service_status: [
        "Received",
        "Delivering to Workshop",
        "Crafting",
        "Polishing",
        "Heading to Shop",
        "Ready",
      ],
    },
  },
} as const
