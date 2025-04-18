export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      fuel_entries: {
        Row: {
          created_at: string | null
          date: string
          fuel_amount: number
          fuel_cost: number
          full_tank: boolean | null
          id: string
          odometer_reading: number
          updated_at: string | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          fuel_amount: number
          fuel_cost: number
          full_tank?: boolean | null
          id?: string
          odometer_reading: number
          updated_at?: string | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          fuel_amount?: number
          fuel_cost?: number
          full_tank?: boolean | null
          id?: string
          odometer_reading?: number
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_categories: {
        Row: {
          created_at: string | null
          description_translations: Json | null
          id: string
          name_translations: Json | null
          order_number: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          name_translations?: Json | null
          order_number?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          name_translations?: Json | null
          order_number?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_item_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          description_translations: Json | null
          id: string
          name_translations: Json | null
          order_number: number | null
          requires_notes: boolean | null
          requires_photo: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          name_translations?: Json | null
          order_number?: number | null
          requires_notes?: boolean | null
          requires_photo?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          name_translations?: Json | null
          order_number?: number | null
          requires_notes?: boolean | null
          requires_photo?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_item_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inspection_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string | null
          notes: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_item_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          created_at: string
          id: string
          inspection_item_id: string | null
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_item_id?: string | null
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_item_id?: string | null
          photo_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          interval_days: number | null
          is_active: boolean
          last_generated_date: string | null
          notes: string | null
          start_date: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          start_date: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          start_date?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          due_date: string | null
          id: string
          inspector_id: string | null
          items: Json | null
          notes: string | null
          schedule_type: string
          started_at: string | null
          status: string
          type: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          due_date?: string | null
          id?: string
          inspector_id?: string | null
          items?: Json | null
          notes?: string | null
          schedule_type?: string
          started_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          due_date?: string | null
          id?: string
          inspector_id?: string | null
          items?: Json | null
          notes?: string | null
          schedule_type?: string
          started_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          estimated_cost: number | null
          estimated_duration: number | null
          frequency: string
          id: string
          interval_days: number | null
          is_active: boolean
          last_generated_date: string | null
          notes: string | null
          priority: string
          start_date: string
          template_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration?: number | null
          frequency: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          priority: string
          start_date: string
          template_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration?: number | null
          frequency?: string
          id?: string
          interval_days?: number | null
          is_active?: boolean
          last_generated_date?: string | null
          notes?: string | null
          priority?: string
          start_date?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "maintenance_task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_task_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string
          estimated_cost: number
          estimated_duration: number
          id: string
          priority: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          estimated_cost: number
          estimated_duration: number
          id?: string
          priority: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          estimated_cost?: number
          estimated_duration?: number
          id?: string
          priority?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_tasks: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          completed_date: string | null
          estimated_duration: number | null
          estimated_cost: number | null
          actual_cost: number | null
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          title: string
          description?: string | null
          status: string
          priority: string
          due_date?: string | null
          completed_date?: string | null
          estimated_duration?: number | null
          estimated_cost?: number | null
          actual_cost?: number | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_date?: string | null
          estimated_duration?: number | null
          estimated_cost?: number | null
          actual_cost?: number | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mileage_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          reading: number
          updated_at: string | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          reading: number
          updated_at?: string | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          reading?: number
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          id: string
          image_url: string | null
          last_inspection: string | null
          last_inspection_date: string | null
          mileage: number | null
          model: string
          name: string
          next_inspection: string | null
          next_inspection_date: string | null
          plate_number: string
          status: string
          updated_at: string
          user_email: string | null
          user_id: string
          vin: string
          year: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_inspection?: string | null
          last_inspection_date?: string | null
          mileage?: number | null
          model: string
          name: string
          next_inspection?: string | null
          next_inspection_date?: string | null
          plate_number: string
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          vin: string
          year: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_inspection?: string | null
          last_inspection_date?: string | null
          mileage?: number | null
          model?: string
          name?: string
          next_inspection?: string | null
          next_inspection_date?: string | null
          plate_number?: string
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          vin?: string
          year?: string
        }
        Relationships: []
      }
      vehicle_assignments: {
        Row: {
          id: string
          vehicle_id: string
          driver_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          driver_id: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          driver_id?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      fuel_logs: {
        Row: {
          id: string
          vehicle_id: string
          date: string
          fuel_amount: number
          fuel_cost: number
          odometer_reading: number
          full_tank: boolean | null
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          date: string
          fuel_amount: number
          fuel_cost: number
          odometer_reading: number
          full_tank?: boolean | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          date?: string
          fuel_amount?: number
          fuel_cost?: number
          odometer_reading?: number
          full_tank?: boolean | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mileage_logs: {
        Row: {
          id: string
          vehicle_id: string
          date: string
          start_odometer: number
          end_odometer: number
          distance: number
          purpose: string | null
          notes: string | null
          user_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          date: string
          start_odometer: number
          end_odometer: number
          distance: number
          purpose?: string | null
          notes?: string | null
          user_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          date?: string
          start_odometer?: number
          end_odometer?: number
          distance?: number
          purpose?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicle_statistics: {
        Row: {
          id: string
          vehicle_id: string
          total_distance: number | null
          fuel_efficiency: number | null
          maintenance_cost: number | null
          total_fuel_cost: number | null
          inspections_passed: number | null
          inspections_failed: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          total_distance?: number | null
          fuel_efficiency?: number | null
          maintenance_cost?: number | null
          total_fuel_cost?: number | null
          inspections_passed?: number | null
          inspections_failed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          total_distance?: number | null
          fuel_efficiency?: number | null
          maintenance_cost?: number | null
          total_fuel_cost?: number | null
          inspections_passed?: number | null
          inspections_failed?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_statistics_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      inspection_details: {
        Row: {
          created_at: string | null
          date: string | null
          id: string | null
          inspector_email: string | null
          inspector_id: string | null
          inspector_name: string | null
          model: string | null
          plate_number: string | null
          status: string | null
          vehicle_id: string | null
          vehicle_name: string | null
          year: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
