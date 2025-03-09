export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          status: "active" | "inactive" | "suspended"
          license_number: string | null
          license_expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["drivers"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>
      }
      vehicle_assignments: {
        Row: {
          id: string
          vehicle_id: string
          driver_id: string
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["vehicle_assignments"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["vehicle_assignments"]["Insert"]>
      }
      vehicles: {
        Row: {
          id: string
          name: string
          plate_number: string
          brand: string
          model: string
          year: string
          status: "active" | "maintenance" | "inactive"
          image_url?: string
          created_at: string
          updated_at: string
          user_id: string
          vin: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      inspections: {
        Row: {
          id: string
          vehicle_id: string
          status: "pending" | "in_progress" | "completed"
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['inspections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inspections']['Insert']>
      }
      maintenance_tasks: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          description?: string
          status: "scheduled" | "in_progress" | "completed" | "overdue"
          priority: "low" | "medium" | "high"
          due_date: string
          completed_date?: string
          estimated_duration?: number
          cost?: number
          notes?: string
          created_at: string
          user_id: string
          inspection_id?: string
          started_at?: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_tasks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['maintenance_tasks']['Insert']>
      }
      maintenance_task_templates: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          estimated_duration: number
          estimated_cost: number
          priority: "low" | "medium" | "high"
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_task_templates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['maintenance_task_templates']['Insert']>
      }
      maintenance_schedules: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          description?: string
          priority: "low" | "medium" | "high"
          frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "biannually" | "annually" | "custom"
          interval_days?: number
          start_date: string
          end_date?: string
          last_generated_date?: string
          template_id?: string
          estimated_duration?: number
          estimated_cost?: number
          is_active: boolean
          created_at: string
          updated_at: string
          user_id: string
          notes?: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_schedules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['maintenance_schedules']['Insert']>
      }
      inspection_schedules: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          description?: string
          type: "routine" | "safety" | "maintenance"
          frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "biannually" | "annually" | "custom"
          interval_days?: number
          start_date: string
          end_date?: string
          last_generated_date?: string
          is_active: boolean
          created_at: string
          updated_at: string
          user_id: string
          notes?: string
        }
        Insert: Omit<Database['public']['Tables']['inspection_schedules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inspection_schedules']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: "maintenance" | "inspection" | "system"
          related_id?: string
          is_read: boolean
          created_at: string
          due_date?: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      mileage_entries: {
        Row: {
          id: string
          vehicle_id: string
          reading: number
          date: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["mileage_entries"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["mileage_entries"]["Insert"]>
      }
      fuel_entries: {
        Row: {
          id: string
          vehicle_id: string
          date: string
          liters: number
          cost: number
          mileage: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["fuel_entries"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["fuel_entries"]["Insert"]>
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
  }
} 