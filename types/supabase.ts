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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_amount: number | null
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
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          date: string
          discount_percentage: number | null
          distance: string | null
          driver_id: string | null
          dropoff_location: string | null
          duration: string | null
          duration_hours: number | null
          flight_number: string | null
          hours_per_day: number | null
          id: string
          meta: Json | null
          notes: string | null
          payment_link: string | null
          payment_link_expires_at: string | null
          payment_link_generated_at: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_location: string | null
          price_amount: number | null
          price_currency: string | null
          price_formatted: string | null
          service_days: number | null
          service_id: string | null
          service_name: string
          service_type: string | null
          status: string
          synced_at: string | null
          tax_percentage: number | null
          team_location: string | null
          terminal: string | null
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
          base_amount?: number | null
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
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date: string
          discount_percentage?: number | null
          distance?: string | null
          driver_id?: string | null
          dropoff_location?: string | null
          duration?: string | null
          duration_hours?: number | null
          flight_number?: string | null
          hours_per_day?: number | null
          id?: string
          meta?: Json | null
          notes?: string | null
          payment_link?: string | null
          payment_link_expires_at?: string | null
          payment_link_generated_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_formatted?: string | null
          service_days?: number | null
          service_id?: string | null
          service_name: string
          service_type?: string | null
          status?: string
          synced_at?: string | null
          tax_percentage?: number | null
          team_location?: string | null
          terminal?: string | null
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
          base_amount?: number | null
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
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date?: string
          discount_percentage?: number | null
          distance?: string | null
          driver_id?: string | null
          dropoff_location?: string | null
          duration?: string | null
          duration_hours?: number | null
          flight_number?: string | null
          hours_per_day?: number | null
          id?: string
          meta?: Json | null
          notes?: string | null
          payment_link?: string | null
          payment_link_expires_at?: string | null
          payment_link_generated_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_formatted?: string | null
          service_days?: number | null
          service_id?: string | null
          service_name?: string
          service_type?: string | null
          status?: string
          synced_at?: string | null
          tax_percentage?: number | null
          team_location?: string | null
          terminal?: string | null
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
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
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
      customer_segments: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_name: string | null
          billing_street_number: string | null
          billing_tax_number: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          segment_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          segment_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          segment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_assignments: {
        Row: {
          actual_arrival: string | null
          actual_duration_minutes: number | null
          arrived_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          booking_id: string | null
          completed_at: string | null
          created_at: string | null
          distance_km: number | null
          driver_id: string | null
          dropoff_location: Json | null
          estimated_arrival: string | null
          estimated_duration_minutes: number | null
          id: string
          notes: string | null
          pickup_location: Json | null
          priority: number | null
          route_data: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_duration_minutes?: number | null
          arrived_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_location?: Json | null
          estimated_arrival?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes?: string | null
          pickup_location?: Json | null
          priority?: number | null
          route_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_duration_minutes?: number | null
          arrived_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_location?: Json | null
          estimated_arrival?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes?: string | null
          pickup_location?: Json | null
          priority?: number | null
          route_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "dispatch_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
          },
          {
            foreignKeyName: "dispatch_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "dispatch_entries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "dispatch_entries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
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
      dispatch_notifications: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          created_for: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string | null
          type: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          created_for?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          created_for?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_notifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "dispatch_assignments"
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
          {
            foreignKeyName: "driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_engagement_events: {
        Row: {
          created_at: string | null
          email: string
          email_id: string
          event_type: string
          id: string
          metadata: Json | null
          provider: string
          quotation_id: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          email: string
          email_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          provider: string
          quotation_id?: string | null
          timestamp: string
        }
        Update: {
          created_at?: string | null
          email?: string
          email_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          provider?: string
          quotation_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_engagement_events_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "email_engagement_events_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_engagement_events_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_statuses: {
        Row: {
          attempts: number | null
          bounced_at: string | null
          clicked_at: string | null
          delivered_at: string | null
          email: string
          email_id: string
          failed_at: string | null
          id: string
          last_updated: string | null
          metadata: Json | null
          opened_at: string | null
          provider: string
          quotation_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number | null
          bounced_at?: string | null
          clicked_at?: string | null
          delivered_at?: string | null
          email: string
          email_id: string
          failed_at?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider: string
          quotation_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number | null
          bounced_at?: string | null
          clicked_at?: string | null
          delivered_at?: string | null
          email?: string
          email_id?: string
          failed_at?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider?: string
          quotation_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_statuses_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "email_statuses_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_statuses_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
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
      generated_reports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          date_range: Json | null
          download_url: string | null
          file_size: number | null
          format: string
          id: string
          name: string
          options: Json | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range?: Json | null
          download_url?: string | null
          file_size?: number | null
          format: string
          id?: string
          name: string
          options?: Json | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range?: Json | null
          download_url?: string | null
          file_size?: number | null
          format?: string
          id?: string
          name?: string
          options?: Json | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_categories: {
        Row: {
          assigned_to_group_id: string | null
          assigned_to_vehicle_id: string | null
          created_at: string | null
          description_translations: Json | null
          id: string
          is_active: boolean | null
          master_template_id: string | null
          name_translations: Json | null
          order_number: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_group_id?: string | null
          assigned_to_vehicle_id?: string | null
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          is_active?: boolean | null
          master_template_id?: string | null
          name_translations?: Json | null
          order_number?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_group_id?: string | null
          assigned_to_vehicle_id?: string | null
          created_at?: string | null
          description_translations?: Json | null
          id?: string
          is_active?: boolean | null
          master_template_id?: string | null
          name_translations?: Json | null
          order_number?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inspection_categories_master_template"
            columns: ["master_template_id"]
            isOneToOne: false
            referencedRelation: "master_inspection_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_categories_assigned_to_group_id_fkey"
            columns: ["assigned_to_group_id"]
            isOneToOne: false
            referencedRelation: "vehicle_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_categories_assigned_to_vehicle_id_fkey"
            columns: ["assigned_to_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          created_by: string | null
          id: string
          inspection_id: string | null
          notes: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inspection_id?: string | null
          notes?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
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
          created_by: string | null
          id: string
          inspection_item_id: string | null
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_item_id?: string | null
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inspection_item_id?: string | null
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_item_id_fkey"
            columns: ["inspection_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
        ]
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
      inspection_template_assignments: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          template_type: string
          updated_at: string | null
          vehicle_group_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_type: string
          updated_at?: string | null
          vehicle_group_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_type?: string
          updated_at?: string | null
          vehicle_group_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_template_assignments_vehicle_group_id_fkey"
            columns: ["vehicle_group_id"]
            isOneToOne: false
            referencedRelation: "vehicle_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_template_assignments_vehicle_id_fkey"
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
            foreignKeyName: "inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
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
      master_inspection_templates: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["template_status_type"]
          title: string
          updated_at: string
          vehicle_type_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["template_status_type"]
          title: string
          updated_at?: string
          vehicle_type_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["template_status_type"]
          title?: string
          updated_at?: string
          vehicle_type_id?: string | null
        }
        Relationships: []
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
          service_type_id: string | null
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
          service_type_id?: string | null
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
          service_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pricing_calculation_logs_service_type"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
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
          service_type_ids: string[] | null
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
          service_type_ids?: string[] | null
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
          service_type_ids?: string[] | null
          service_types?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_category_service_types: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          service_type_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          service_type_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          service_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_category_service_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_category_service_types_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_category_vehicles: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          vehicle_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          vehicle_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_category_vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_category_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          service_type_id: string | null
          updated_at: string
          vehicle_id: string | null
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
          service_type_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
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
          service_type_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_type"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
          is_optional: boolean | null
          item_type: string
          name: string
          package_id: string
          price: number
          price_override: number | null
          pricing_item_id: string | null
          quantity: number
          service_type_id: string | null
          sort_order: number
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_included_in_base?: boolean
          is_optional?: boolean | null
          item_type: string
          name: string
          package_id: string
          price: number
          price_override?: number | null
          pricing_item_id?: string | null
          quantity?: number
          service_type_id?: string | null
          sort_order?: number
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_included_in_base?: boolean
          is_optional?: boolean | null
          item_type?: string
          name?: string
          package_id?: string
          price?: number
          price_override?: number | null
          pricing_item_id?: string | null
          quantity?: number
          service_type_id?: string | null
          sort_order?: number
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pricing_item_id"
            columns: ["pricing_item_id"]
            isOneToOne: false
            referencedRelation: "pricing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_package_services: {
        Row: {
          duration_hours: number | null
          id: string
          included_price: number | null
          package_id: string
          service_type_id: string
          service_type_name: string
          sort_order: number | null
          vehicle_type: string | null
        }
        Insert: {
          duration_hours?: number | null
          id?: string
          included_price?: number | null
          package_id: string
          service_type_id: string
          service_type_name: string
          sort_order?: number | null
          vehicle_type?: string | null
        }
        Update: {
          duration_hours?: number | null
          id?: string
          included_price?: number | null
          package_id?: string
          service_type_id?: string
          service_type_name?: string
          sort_order?: number | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_package_services_package_id_fkey"
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
          valid_from: string | null
          valid_to: string | null
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
          valid_from?: string | null
          valid_to?: string | null
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
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      pricing_promotions: {
        Row: {
          applicable_service: string[]
          applicable_service_type_ids: string[] | null
          applicable_vehicle_types: string[]
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          is_featured: boolean | null
          max_uses: number | null
          maximum_discount: number | null
          min_order_value: number | null
          minimum_amount: number | null
          name: string
          start_date: string | null
          times_used: number
          updated_at: string
          usage_limit: number | null
        }
        Insert: {
          applicable_service?: string[]
          applicable_service_type_ids?: string[] | null
          applicable_vehicle_types?: string[]
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          max_uses?: number | null
          maximum_discount?: number | null
          min_order_value?: number | null
          minimum_amount?: number | null
          name: string
          start_date?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Update: {
          applicable_service?: string[]
          applicable_service_type_ids?: string[] | null
          applicable_vehicle_types?: string[]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          max_uses?: number | null
          maximum_discount?: number | null
          min_order_value?: number | null
          minimum_amount?: number | null
          name?: string
          start_date?: string | null
          times_used?: number
          updated_at?: string
          usage_limit?: number | null
        }
        Relationships: []
      }
      pricing_time_based_rules: {
        Row: {
          adjustment_percentage: number
          category_id: string | null
          created_at: string
          days_of_week: string[] | null
          description: string | null
          end_time: string
          id: string
          is_active: boolean
          name: string
          priority: number
          service_type_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          adjustment_percentage: number
          category_id?: string | null
          created_at?: string
          days_of_week?: string[] | null
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          service_type_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          adjustment_percentage?: number
          category_id?: string | null
          created_at?: string
          days_of_week?: string[] | null
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          service_type_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_time_based_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_time_based_rules_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
          duration_hours: number | null
          hours_per_day: number | null
          id: string
          is_service_item: boolean | null
          pickup_date: string | null
          pickup_time: string | null
          quantity: number
          quotation_id: string
          service_days: number | null
          service_type_id: string | null
          service_type_name: string | null
          sort_order: number
          time_based_adjustment: number | null
          time_based_rule_name: string | null
          total_price: number
          unit_price: number
          updated_at: string
          vehicle_category: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          description: string
          duration_hours?: number | null
          hours_per_day?: number | null
          id?: string
          is_service_item?: boolean | null
          pickup_date?: string | null
          pickup_time?: string | null
          quantity?: number
          quotation_id: string
          service_days?: number | null
          service_type_id?: string | null
          service_type_name?: string | null
          sort_order?: number
          time_based_adjustment?: number | null
          time_based_rule_name?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          duration_hours?: number | null
          hours_per_day?: number | null
          id?: string
          is_service_item?: boolean | null
          pickup_date?: string | null
          pickup_time?: string | null
          quantity?: number
          quotation_id?: string
          service_days?: number | null
          service_type_id?: string | null
          service_type_name?: string | null
          sort_order?: number
          time_based_adjustment?: number | null
          time_based_rule_name?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type?: string | null
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
      quotation_magic_links: {
        Row: {
          created_at: string | null
          customer_email: string
          expires_at: string
          id: string
          is_used: boolean | null
          quotation_id: string
          token: string
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          quotation_id: string
          token: string
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          quotation_id?: string
          token?: string
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_magic_links_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_magic_links_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_magic_links_quotation_id_fkey"
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
      quotation_payments: {
        Row: {
          amount: number
          charge_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string
          id: string
          payment_method: string
          quotation_id: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          charge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency: string
          id?: string
          payment_method: string
          quotation_id?: string | null
          reference?: string | null
          status: string
        }
        Update: {
          amount?: number
          charge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string
          quotation_id?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_payments_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "pricing_diagnostic_view"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quotation_payments_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_payments_quotation_id_fkey"
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
          approval_notes: string | null
          approval_signature: string | null
          approved_at: string | null
          approved_by: string | null
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_name: string | null
          billing_street_number: string | null
          billing_tax_number: string | null
          booking_created_at: string | null
          charge_id: string | null
          converted_to_booking_id: string | null
          created_at: string
          created_by: string | null
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
          invoice_generated_at: string | null
          magic_link_expires_at: string | null
          magic_link_generated_at: string | null
          merchant_id: string | null
          merchant_notes: string | null
          package_discount: number | null
          passenger_count: number | null
          payment_amount: number | null
          payment_completed_at: string | null
          payment_date: string | null
          payment_link: string | null
          payment_link_expires_at: string | null
          payment_link_generated_at: string | null
          payment_link_sent_at: string | null
          payment_method: string | null
          pickup_date: string | null
          pickup_location: string | null
          pickup_time: string | null
          promotion_discount: number | null
          quote_number: number
          receipt_url: string | null
          reference_code: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejected_reason: string | null
          rejection_reason: string | null
          rejection_signature: string | null
          selected_package_description: string | null
          selected_package_id: string | null
          selected_package_name: string | null
          selected_promotion_code: string | null
          selected_promotion_description: string | null
          selected_promotion_id: string | null
          selected_promotion_name: string | null
          service_days: number | null
          service_type: string
          service_type_id: string | null
          status: string
          tax_percentage: number | null
          team_location: string
          time_based_adjustment: number | null
          title: string
          total_amount: number
          updated_at: string
          vehicle_category: string | null
          vehicle_type: string
        }
        Insert: {
          amount: number
          approval_notes?: string | null
          approval_signature?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          booking_created_at?: string | null
          charge_id?: string | null
          converted_to_booking_id?: string | null
          created_at?: string
          created_by?: string | null
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
          invoice_generated_at?: string | null
          magic_link_expires_at?: string | null
          magic_link_generated_at?: string | null
          merchant_id?: string | null
          merchant_notes?: string | null
          package_discount?: number | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_link_expires_at?: string | null
          payment_link_generated_at?: string | null
          payment_link_sent_at?: string | null
          payment_method?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          promotion_discount?: number | null
          quote_number?: number
          receipt_url?: string | null
          reference_code?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          rejection_signature?: string | null
          selected_package_description?: string | null
          selected_package_id?: string | null
          selected_package_name?: string | null
          selected_promotion_code?: string | null
          selected_promotion_description?: string | null
          selected_promotion_id?: string | null
          selected_promotion_name?: string | null
          service_days?: number | null
          service_type: string
          service_type_id?: string | null
          status?: string
          tax_percentage?: number | null
          team_location?: string
          time_based_adjustment?: number | null
          title: string
          total_amount: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type: string
        }
        Update: {
          amount?: number
          approval_notes?: string | null
          approval_signature?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_name?: string | null
          billing_street_number?: string | null
          billing_tax_number?: string | null
          booking_created_at?: string | null
          charge_id?: string | null
          converted_to_booking_id?: string | null
          created_at?: string
          created_by?: string | null
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
          invoice_generated_at?: string | null
          magic_link_expires_at?: string | null
          magic_link_generated_at?: string | null
          merchant_id?: string | null
          merchant_notes?: string | null
          package_discount?: number | null
          passenger_count?: number | null
          payment_amount?: number | null
          payment_completed_at?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_link_expires_at?: string | null
          payment_link_generated_at?: string | null
          payment_link_sent_at?: string | null
          payment_method?: string | null
          pickup_date?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          promotion_discount?: number | null
          quote_number?: number
          receipt_url?: string | null
          reference_code?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejected_reason?: string | null
          rejection_reason?: string | null
          rejection_signature?: string | null
          selected_package_description?: string | null
          selected_package_id?: string | null
          selected_package_name?: string | null
          selected_promotion_code?: string | null
          selected_promotion_description?: string | null
          selected_promotion_id?: string | null
          selected_promotion_name?: string | null
          service_days?: number | null
          service_type?: string
          service_type_id?: string | null
          status?: string
          tax_percentage?: number | null
          team_location?: string
          time_based_adjustment?: number | null
          title?: string
          total_amount?: number
          updated_at?: string
          vehicle_category?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_type"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "customer_analytics"
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
      report_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          format: string
          frequency: string
          id: string
          is_active: boolean | null
          last_run: string | null
          name: string
          next_run: string | null
          options: Json | null
          recipients: Json | null
          report_type: string
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          format?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          name: string
          next_run?: string | null
          options?: Json | null
          recipients?: Json | null
          report_type: string
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          name?: string
          next_run?: string | null
          options?: Json | null
          recipients?: Json | null
          report_type?: string
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_settings: {
        Row: {
          auto_generate: boolean | null
          created_at: string | null
          default_format: string | null
          default_sections: Json | null
          email_notifications: boolean | null
          id: string
          retention_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_generate?: boolean | null
          created_at?: string | null
          default_format?: string | null
          default_sections?: Json | null
          email_notifications?: boolean | null
          id?: string
          retention_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_generate?: boolean | null
          created_at?: string | null
          default_format?: string | null
          default_sections?: Json | null
          email_notifications?: boolean | null
          id?: string
          retention_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tracking_devices: {
        Row: {
          battery_level: number | null
          created_at: string | null
          device_id: string
          device_name: string | null
          driver_id: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          device_id: string
          device_name?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_devices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_devices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "tracking_devices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
          },
          {
            foreignKeyName: "tracking_devices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignment_operations: {
        Row: {
          bcc_email: string | null
          booking_id: string
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          driver_id: string
          email_sent_at: string | null
          id: string
          metadata: Json | null
          new_category_name: string | null
          new_vehicle_id: string
          operation_type: string
          payment_amount: number | null
          payment_link_id: string | null
          payment_url: string | null
          previous_category_name: string | null
          previous_vehicle_id: string | null
          price_difference: number
          refund_amount: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bcc_email?: string | null
          booking_id: string
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          driver_id: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          new_category_name?: string | null
          new_vehicle_id: string
          operation_type: string
          payment_amount?: number | null
          payment_link_id?: string | null
          payment_url?: string | null
          previous_category_name?: string | null
          previous_vehicle_id?: string | null
          price_difference?: number
          refund_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bcc_email?: string | null
          booking_id?: string
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          driver_id?: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          new_category_name?: string | null
          new_vehicle_id?: string
          operation_type?: string
          payment_amount?: number | null
          payment_link_id?: string | null
          payment_url?: string | null
          previous_category_name?: string | null
          previous_vehicle_id?: string | null
          price_difference?: number
          refund_amount?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignment_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignment_operations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignment_operations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "vehicle_assignment_operations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
          },
          {
            foreignKeyName: "vehicle_assignment_operations_new_vehicle_id_fkey"
            columns: ["new_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignment_operations_previous_vehicle_id_fkey"
            columns: ["previous_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
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
      vehicle_groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_locations: {
        Row: {
          accuracy: number | null
          address: string | null
          altitude: number | null
          battery_level: number | null
          bearing: number | null
          created_at: string | null
          device_id: string
          driver_id: string | null
          id: string
          is_moving: boolean | null
          latitude: number
          longitude: number
          speed: number | null
          timestamp: string
          vehicle_id: string | null
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          altitude?: number | null
          battery_level?: number | null
          bearing?: number | null
          created_at?: string | null
          device_id: string
          driver_id?: string | null
          id?: string
          is_moving?: boolean | null
          latitude: number
          longitude: number
          speed?: number | null
          timestamp: string
          vehicle_id?: string | null
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          altitude?: number | null
          battery_level?: number | null
          bearing?: number | null
          created_at?: string | null
          device_id?: string
          driver_id?: string | null
          id?: string
          is_moving?: boolean | null
          latitude?: number
          longitude?: number
          speed?: number | null
          timestamp?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "tracking_devices"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "vehicle_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["driver_id"]
          },
          {
            foreignKeyName: "vehicle_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inspection_details"
            referencedColumns: ["inspector_id"]
          },
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
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
          luggage_capacity: number | null
          mileage: number | null
          model: string
          name: string
          next_inspection: string | null
          next_inspection_date: string | null
          passenger_capacity: number | null
          plate_number: string
          status: string
          updated_at: string
          user_email: string | null
          user_id: string
          vehicle_category_id: string
          vehicle_group_id: string | null
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
          luggage_capacity?: number | null
          mileage?: number | null
          model: string
          name: string
          next_inspection?: string | null
          next_inspection_date?: string | null
          passenger_capacity?: number | null
          plate_number: string
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          vehicle_category_id: string
          vehicle_group_id?: string | null
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
          luggage_capacity?: number | null
          mileage?: number | null
          model?: string
          name?: string
          next_inspection?: string | null
          next_inspection_date?: string | null
          passenger_capacity?: number | null
          plate_number?: string
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          vehicle_category_id?: string
          vehicle_group_id?: string | null
          vin?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_vehicle_category_id_fkey"
            columns: ["vehicle_category_id"]
            isOneToOne: false
            referencedRelation: "pricing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_group_id_fkey"
            columns: ["vehicle_group_id"]
            isOneToOne: false
            referencedRelation: "vehicle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_analytics: {
        Row: {
          address: string | null
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_name: string | null
          billing_street_number: string | null
          billing_tax_number: string | null
          booking_count: number | null
          created_at: string | null
          email: string | null
          id: string | null
          last_activity_date: string | null
          name: string | null
          notes: string | null
          phone: string | null
          quotation_count: number | null
          segment_color: string | null
          segment_description: string | null
          segment_icon: string | null
          segment_id: string | null
          segment_name: string | null
          total_quotation_amount: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_details: {
        Row: {
          booking_id: string | null
          brand: string | null
          created_at: string | null
          date: string | null
          driver_email: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          due_date: string | null
          id: string | null
          inspector_email: string | null
          inspector_id: string | null
          inspector_name: string | null
          inspector_phone: string | null
          items: Json | null
          model: string | null
          notes: string | null
          plate_number: string | null
          schedule_type: string | null
          started_at: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          vehicle_id: string | null
          vehicle_name: string | null
          year: string | null
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
          billing_city: string | null
          billing_company_name: string | null
          billing_country: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          billing_city?: string | null
          billing_company_name?: string | null
          billing_country?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_charter_price: {
        Args:
          | { base_price: number; days_count: number }
          | { base_price: number; days_count: number; quotation_id?: string }
        Returns: number
      }
      calculate_next_run: {
        Args: {
          day_of_month?: number
          day_of_week?: number
          frequency: string
          time_of_day?: string
        }
        Returns: string
      }
      check_quotation_encoding_issues: {
        Args: Record<PropertyKey, never>
        Returns: {
          field_name: string
          has_encoding_issues: boolean
          issue_type: string
          original_value: string
          record_id: string
        }[]
      }
      clean_customer_data: {
        Args: { email_input: string; name_input: string; phone_input: string }
        Returns: {
          clean_email: string
          clean_name: string
          clean_phone: string
        }[]
      }
      clean_quotation_text: {
        Args: { input_text: string }
        Returns: string
      }
      clean_quotation_text_comprehensive: {
        Args:
          | { field_name?: string; input_text: string }
          | { input_text: string }
        Returns: string
      }
      create_customer_from_api: {
        Args: {
          p_address?: string
          p_email: string
          p_name?: string
          p_notes?: string
          p_phone?: string
          p_segment_id?: string
        }
        Returns: string
      }
      get_correct_price_for_duration: {
        Args:
          | {
              p_category_id: string
              p_duration_hours: number
              p_service_type: string
              p_vehicle_type: string
            }
          | {
              p_duration_hours: number
              p_service_type: string
              p_vehicle_type: string
            }
          | {
              p_duration_hours: number
              p_service_type_id: string
              p_vehicle_type: string
            }
        Returns: {
          currency: string
          duration_hours: number
          price: number
        }[]
      }
      get_inspections_with_details: {
        Args: {
          date_from?: string
          date_to?: string
          page_num: number
          page_size: number
          search_query?: string
          status_filter?: string
        }
        Returns: {
          created_at: string
          date: string
          id: string
          inspector_email: string
          inspector_id: string
          inspector_name: string
          notes: string
          status: string
          template_display_name: string
          total_count: number
          type: string
          updated_at: string
          vehicle_brand: string
          vehicle_id: string
          vehicle_model: string
          vehicle_name: string
          vehicle_plate_number: string
          vehicle_year: string
        }[]
      }
      recalculate_quotation_totals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_customer: {
        Args: {
          p_address?: string
          p_email: string
          p_name?: string
          p_notes?: string
          p_phone?: string
        }
        Returns: string
      }
    }
    Enums: {
      template_status_type: "draft" | "active" | "inactive" | "archived"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      template_status_type: ["draft", "active", "inactive", "archived"],
    },
  },
} as const
