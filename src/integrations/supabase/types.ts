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
      daily_stock_sheets: {
        Row: {
          close_qty: number
          created_at: string
          date: string
          id: string
          item_id: string
          open_qty: number
          os_status: string | null
          qty_in: number
          reach: number
          remark: string | null
          retail_team_name: string
          sales_qty: number
          updated_at: string
        }
        Insert: {
          close_qty?: number
          created_at?: string
          date: string
          id?: string
          item_id: string
          open_qty?: number
          os_status?: string | null
          qty_in?: number
          reach?: number
          remark?: string | null
          retail_team_name: string
          sales_qty?: number
          updated_at?: string
        }
        Update: {
          close_qty?: number
          created_at?: string
          date?: string
          id?: string
          item_id?: string
          open_qty?: number
          os_status?: string | null
          qty_in?: number
          reach?: number
          remark?: string | null
          retail_team_name?: string
          sales_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stock_sheets_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          department: string
          id: string
          item_id: string
          metadata: Json
          quantity: number
          transaction_date: string
          type: string
        }
        Insert: {
          created_at?: string
          department?: string
          id?: string
          item_id: string
          metadata?: Json
          quantity?: number
          transaction_date?: string
          type: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          item_id?: string
          metadata?: Json
          quantity?: number
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      issuance_ledger: {
        Row: {
          created_at: string
          date: string
          id: string
          issued_by: string
          item_id: string
          quantity: number
          recipient_group: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          issued_by: string
          item_id: string
          quantity: number
          recipient_group: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          issued_by?: string
          item_id?: string
          quantity?: number
          recipient_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issuance_ledger_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_departments: {
        Row: {
          created_at: string
          department: string
          id: string
          item_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          item_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_departments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string
          created_at: string
          department: string
          id: string
          low_stock_threshold: number
          name: string
          unit_cost: number
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          department?: string
          id?: string
          low_stock_threshold?: number
          name: string
          unit_cost?: number
          unit_of_measure: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          department?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          unit_cost?: number
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: []
      }
      received_ledger: {
        Row: {
          created_at: string
          date: string
          id: string
          invoice_number: string | null
          item_id: string
          quantity: number
          supplier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          invoice_number?: string | null
          item_id: string
          quantity: number
          supplier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invoice_number?: string | null
          item_id?: string
          quantity?: number
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "received_ledger_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_ledger: {
        Row: {
          created_at: string
          date: string
          destination: string
          id: string
          item_id: string
          quantity: number
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          destination: string
          id?: string
          item_id: string
          quantity: number
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          destination?: string
          id?: string
          item_id?: string
          quantity?: number
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_ledger_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_teams: {
        Row: {
          created_at: string
          id: string
          team_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_name?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_stock_counts: {
        Row: {
          created_at: string
          date: string
          id: string
          item_id: string
          location: string
          notes: string | null
          physical_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          item_id: string
          location: string
          notes?: string | null
          physical_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_id?: string
          location?: string
          notes?: string | null
          physical_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_stock_counts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
