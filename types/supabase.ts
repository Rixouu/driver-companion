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
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_name: string | null
          billing_street_number: string | null
          billing_tax_number: string | null
          coupon_code: string | null
          coupon_discount_percentage: number | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          date: string
          distance: string | null
          driver_id: string | null
          dropoff_location: string | null
          duration: string | null
          id: string
          meta: Json | null
          notes: string | null
          payment_link: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_location: string | null
          price_amount: number | null
          price_currency: string | null
          price_formatted: string | null
          service_id: string | null
          service_name: string
          service_type: string | null
          status: string
          synced_at: string | null
          time: string
          updated_at: string | null
          updated_by: string | null
          vehicle_capacity: number | null
          vehicle_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          wp_id: string
          wp_meta: Json | null
          wp_vehicle_id: string | null
        }
        Insert: {
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          coupon_code?: string | null
          coupon_discount_percentage?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date: string
          distance?: string | null
          driver_id?: string | null
          dropoff_location?: string | null
          duration?: string | null
          id?: string
          meta?: Json | null
          notes?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_formatted?: string | null
          service_id?: string | null
          service_name: string
          service_type?: string | null
          status?: string
          synced_at?: string | null
          time: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          wp_id: string
          wp_meta?: Json | null
          wp_vehicle_id?: string | null
        }
        Update: {
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          coupon_code?: string | null
          coupon_discount_percentage?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date?: string
          distance?: string | null
          driver_id?: string | null
          dropoff_location?: string | null
          duration?: string | null
          id?: string
          meta?: Json | null
          notes?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_formatted?: string | null
          service_id?: string | null
          service_name?: string
          service_type?: string | null
          status?: string
          synced_at?: string | null
          time?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          wp_id?: string
          wp_meta?: Json | null
          wp_vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dispatch_entries: {
        Row: {
          booking_id: string
          created_at: string
          driver_id: string | null
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          driver_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          driver_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_entries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_availability: {
        Row: {
          created_at: string | null
          driver_id: string
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          email: string
          emergency_contact: string | null
          first_name: string
          id: string
          last_name: string
          license_expiry: string | null
          license_number: string | null
          line_id: string | null
          notes: string | null
          phone: string | null
          profile_image_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          emergency_contact?: string | null
          first_name: string
          id?: string
          last_name: string
          license_expiry?: string | null
          license_number?: string | null
          line_id?: string | null
          notes?: string | null
          phone?: string | null
          profile_image_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          emergency_contact?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_expiry?: string | null
          license_number?: string | null
          line_id?: string | null
          notes?: string | null
          phone?: string | null
          profile_image_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          booking_id: string | null
          created_at: string
          created_by: string | null
          date: string
          driver_id: string | null
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
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          driver_id?: string | null
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
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          driver_id?: string | null
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
            foreignKeyName: "inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
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
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          due_date: string
          estimated_duration: number | null
          id: string
          inspection_id: string | null
          notes: string | null
          priority: string | null
          started_at: string
          status: string
          title: string
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          due_date: string
          estimated_duration?: number | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          priority?: string | null
          started_at?: string
          status?: string
          title: string
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          due_date?: string
          estimated_duration?: number | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          priority?: string | null
          started_at?: string
          status?: string
          title?: string
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
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
      pricing_calculation_logs: {
        Row: {
          applied_discount: number | null
          applied_tax: number | null
          base_price: number | null
          calculated_amount: number | null
          calculation_details: Json | null
          created_at: string
          days_count: number | null
          duration_hours: number | null
          final_amount: number | null
          function_name: string
          id: string
          quotation_id: string | null
          service_type: string | null
        }
        Insert: {
          applied_discount?: number | null
          applied_tax?: number | null
          base_price?: number | null
          calculated_amount?: number | null
          calculation_details?: Json | null
          created_at?: string
          days_count?: number | null
          duration_hours?: number | null
          final_amount?: number | null
          function_name: string
          id?: string
          quotation_id?: string | null
          service_type?: string | null
        }
        Update: {
          applied_discount?: number | null
          applied_tax?: number | null
          base_price?: number | null
          calculated_amount?: number | null
          calculation_details?: Json | null
          created_at?: string
          days_count?: number | null
          duration_hours?: number | null
          final_amount?: number | null
          function_name?: string
          id?: string
          quotation_id?: string | null
          service_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_calculation_logs_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "pricing_calculation_logs_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_calculation_logs_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_types: string[]
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_types: string[]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_types?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_items: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          duration_hours: number
          id: string
          is_active: boolean
          price: number
          service_type: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          duration_hours: number
          id?: string
          is_active?: boolean
          price: number
          service_type: string
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          duration_hours?: number
          id?: string
          is_active?: boolean
          price?: number
          service_type?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_package_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_included_in_base: boolean
          item_type: string
          name: string
          package_id: string
          price: number
          quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_included_in_base?: boolean
          item_type: string
          name: string
          package_id: string
          price: number
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_included_in_base?: boolean
          item_type?: string
          name?: string
          package_id?: string
          price?: number
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_packages: {
        Row: {
          base_price: number
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          package_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          package_type: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          package_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_promotions: {
        Row: {
          applicable_services: string[]
          applicable_vehicle_types: string[]
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          maximum_discount: number | null
          minimum_amount: number | null
          name: string
          start_date: string | null
          times_used: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          applicable_services?: string[]
          applicable_vehicle_types?: string[]
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          maximum_discount?: number | null
          minimum_amount?: number | null
          name: string
          start_date?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          applicable_services?: string[]
          applicable_vehicle_types?: string[]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          maximum_discount?: number | null
          minimum_amount?: number | null
          name?: string
          start_date?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      quotation_activities: {
        Row: {
          action: string
          created_at: string
          customer_id: string | null
          details: Json | null
          id: string
          quotation_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          customer_id?: string | null
          details?: Json | null
          id?: string
          quotation_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          customer_id?: string | null
          details?: Json | null
          id?: string
          quotation_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_activities_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_activities_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_activities_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quotation_id: string
          sort_order: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quotation_id: string
          sort_order?: number
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string
          sort_order?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_messages: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          is_from_customer: boolean
          is_read: boolean
          message: string
          quotation_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_from_customer?: boolean
          is_read?: boolean
          message: string
          quotation_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_from_customer?: boolean
          is_read?: boolean
          message?: string
          quotation_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_messages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_messages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_messages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          amount: number
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_name: string | null
          billing_street_number: string | null
          billing_tax_number: string | null
          converted_to_booking_id: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          days_count: number | null
          discount_percentage: number | null
          display_currency: string | null
          dropoff_location: string | null
          duration_hours: number | null
          expiry_date: string
          hours_per_day: number | null
          id: string
          merchant_id: string | null
          merchant_notes: string | null
          passenger_count: number | null
          pickup_date: string | null
          pickup_location: string | null
          pickup_time: string | null
          quote_number: number
          reference_code: string | null
          rejected_reason: string | null
          service_days: number | null
          service_type: string
          status: string
          tax_percentage: number | null
          title: string
          total_amount: number
          updated_at: string
          vehicle_category: string | null
          vehicle_type: string
        }
        Insert: {
          amount: number
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          converted_to_booking_id?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          days_count?: number | null
          discount_percentage?: number | null
          display_currency?: string | null
          dropoff_location?: string | null
          duration_hours?: number | null
          expiry_date?: string
          hours_per_day?: number | null
          id?: string
          merchant_id?: string | null
          merchant_notes?: string | null
          passenger_count?: number | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          quote_number?: number
          reference_code?: string | null
          rejected_reason?: string | null
          service_days?: number | null
          service_type: string
          status?: string
          tax_percentage?: number | null
          title: string
          total_amount: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type: string
        }
        Update: {
          amount?: number
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          converted_to_booking_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          days_count?: number | null
          discount_percentage?: number | null
          display_currency?: string | null
          dropoff_location?: string | null
          duration_hours?: number | null
          expiry_date?: string
          hours_per_day?: number | null
          id?: string
          merchant_id?: string | null
          merchant_notes?: string | null
          passenger_count?: number | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          quote_number?: number
          reference_code?: string | null
          rejected_reason?: string | null
          service_days?: number | null
          service_type?: string
          status?: string
          tax_percentage?: number | null
          title?: string
          total_amount?: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_to_booking_id_fkey"
            columns: ["converted_to_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          created_at: string | null
          driver_id: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      pricing_diagnostic_view: {
        Row: {
          actual_total_amount: number | null
          base_price: number | null
          calculation_details: Json | null
          calculation_time: string | null
          days_count: number | null
          discount_percentage: number | null
          duration_hours: number | null
          expected_base_amount: number | null
          quotation_id: string | null
          service_type: string | null
          tax_percentage: number | null
          title: string | null
          vehicle_type: string | null
        }
        Relationships: []
      }
      quotation_summary_view: {
        Row: {
          amount: number | null
          booking_status: string | null
          calculated_amount: number | null
          converted_to_booking_id: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          days_count: number | null
          discount_percentage: number | null
          duration_hours: number | null
          expiry_date: string | null
          id: string | null
          is_converted: boolean | null
          is_expired: boolean | null
          merchant_id: string | null
          quote_number: number | null
          service_type: string | null
          status: string | null
          tax_percentage: number | null
          title: string | null
          total_amount: number | null
          updated_at: string | null
          vehicle_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_to_booking_id_fkey"
            columns: ["converted_to_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_charter_price: {
        Args:
          | { base_price: number; days_count: number }
          | { base_price: number; days_count: number; quotation_id?: string }
        Returns: number
      }
      get_correct_price_for_duration: {
        Args:
          | {
              p_vehicle_type: string
              p_service_type: string
              p_duration_hours: number
            }
          | {
              p_vehicle_type: string
              p_service_type: string
              p_duration_hours: number
              p_category_id: string
            }
        Returns: {
          price: number
          currency: string
          duration_hours: number
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
