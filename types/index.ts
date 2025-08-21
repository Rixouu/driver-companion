import { RecursiveStringRecord } from '@/lib/i18n/types'
import type { Database } from './supabase'

// Define the base types from the database schema
type DbTables = Database['public']['Tables']

export interface DbVehicle {
  id: string
  name: string
  plate_number: string
  brand?: string | null
  model?: string | null
  year?: string | null
  status: string
  image_url?: string | null
  vin?: string | null
  created_at: string
  updated_at: string
  user_id: string
  luggage_capacity?: number | null
  passenger_capacity?: number | null
  maintenance_tasks?: DbMaintenanceTask[] | null
  inspections?: DbInspection[] | null
  driver_id?: string | null
}

export interface DbDriver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  line_id?: string | null
  license_number?: string | null
  license_expiry?: string | null
  status: 'available' | 'unavailable' | 'leave' | 'training'
  profile_image_url?: string | null
  address?: string | null
  emergency_contact?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  user_id: string
  assigned_vehicles?: DbVehicle[] | null
}

export interface DbInspection {
  id: string
  vehicle_id: string
  vehicle?: DbVehicle | null
  type: 'routine' | 'safety' | 'maintenance'
  date: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'draft' | 'cancelled'
  notes?: string | null
  created_at: string
  updated_at: string
  user_id?: string | null
  created_by?: string | null
  driver_id?: string | null
}

// Optimized inspection type for the RPC function
export interface OptimizedInspection {
  id: string;
  date: string;
  status: string;
  type: string;
  vehicle_id: string;
  inspector_id: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  // Vehicle fields (pre-joined)
  vehicle_name: string;
  vehicle_plate_number: string;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: string | null;
  // Inspector fields (pre-joined)
  inspector_name: string | null;
  inspector_email: string | null;
  // Template display name (pre-resolved)
  template_display_name: string;
  // Total count for pagination
  total_count: number;
}

export interface DbMaintenanceTask {
  id: string
  vehicle_id: string
  vehicle?: DbVehicle | null
  title: string
  description?: string | null
  status: 'in_progress' | 'completed' | 'scheduled' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  due_date: string
  completed_date?: string | null
  started_at?: string | null
  created_at: string
  updated_at?: string | null
  user_id: string
}

// Export the Database type
export type { Database }

// Database Types
export type DbMaintenance = Database['public']['Tables']['maintenance_tasks']['Row']

// Insert Types
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type InspectionInsert = {
  vehicle_id: string
  inspector_id: string
  date: string
  status: InspectionStatusType
  type: 'daily' | 'monthly' | 'annual'
  items: any[] // or more specific type if you have one
  notes?: string
}
export type MaintenanceInsert = Database['public']['Tables']['maintenance_tasks']['Insert']

// Update Types
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']
export type InspectionUpdate = Database['public']['Tables']['inspections']['Update']
export type MaintenanceUpdate = Database['public']['Tables']['maintenance_tasks']['Update']

// Joined Types
export type VehicleWithRelations = DbVehicle & {
  inspections?: DbInspection[]
  maintenance_tasks?: DbMaintenance[]
}

// Corrected definition for InspectionWithVehicle
export type InspectionWithVehicle = Omit<DbInspection, 'vehicle'> & {
  vehicle: Pick<DbVehicle, 'id' | 'name' | 'plate_number' | 'image_url'>;
};

export type MaintenanceWithVehicle = DbMaintenance & {
  vehicle: Pick<DbVehicle, 'id' | 'name' | 'plate_number' | 'image_url'>
}

// Enums and Constants
export const VehicleStatus = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
} as const

export type VehicleStatus = typeof VehicleStatus[keyof typeof VehicleStatus]

export const InspectionStatus = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress'
} as const

export type InspectionStatusType = typeof InspectionStatus[keyof typeof InspectionStatus]

// Add this type to help with form data
export type NewInspectionData = {
  vehicle_id: string
  inspector_id: string
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
}

// Add these interfaces if they don't exist
export interface MaintenanceTask {
  id: string
  vehicle_id: string
  title: string
  description?: string
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  due_date: string
  estimated_duration?: number
  cost?: number
  notes?: string
  user_id: string
  created_at: string
  started_at?: string
  completed_date?: string
  vehicle?: {
    id: string
    name: string
    plate_number: string
    image_url?: string
    brand?: string
  }
  metadata?: {
    is_recurring: boolean
    frequency: string
    interval_days?: number
    start_date: string
    end_date?: string | null
    schedule_id: string
  }
}

export interface Inspection {
  id: string
  name?: string
  vehicle_id: string
  inspector_id: string | null
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed'
  date: string
  notes?: string
  created_at: string
  updated_at: string
  vehicle?: {
    id: string
    name: string
    plate_number: string
    image_url?: string
  }
  inspector?: {
    id: string
    name: string
  }
}

export interface InspectionFormData {
  vehicle_id: string
  type: Inspection['type']
  date: string
  notes?: string
}

export interface FuelLog {
  id: string
  vehicle_id: string
  user_id: string
  date: string
  odometer_reading: number
  fuel_amount: number
  fuel_cost: number
  full_tank: boolean
  notes: string | null
  created_at: string
  vehicle?: DbVehicle
}

export interface MileageLog {
  id: string
  vehicle_id: string
  user_id: string
  date: string
  reading: number
  notes: string | null
  created_at: string
  updated_at: string
  vehicle?: DbVehicle
}

// Add to TranslationValues interface
export interface TranslationValues extends RecursiveStringRecord {
  // ... existing translations ...
  fuel: {
    title: string
    description: string
    addLog: string
    noLogs: string
    fields: {
      date: string
      odometer: string
      amount: string
      cost: string
      fuelType: string
      stationName: string
      fullTank: string
      notes: string
    }
    messages: {
      createSuccess: string
      updateSuccess: string
      deleteSuccess: string
      error: string
    }
  }
  mileage: {
    title: string
    description: string
    addLog: string
    noLogs: string
    fields: {
      date: string
      startOdometer: string
      endOdometer: string
      distance: string
      purpose: string
      notes: string
    }
    messages: {
      createSuccess: string
      updateSuccess: string
      deleteSuccess: string
      error: string
    }
  }
}

// Add this type to help with driver form data
export type DriverFormData = {
  first_name: string
  last_name: string
  email: string
  phone?: string
  line_id?: string
  license_number?: string
  license_expiry?: string
  profile_image_url?: string
  address?: string
  emergency_contact?: string
  notes?: string
}

export type { Driver, DriverAvailability, DriverAvailabilityStatus, DriverWithAvailability } from './drivers';
export type { Vehicle } from './vehicles';

// REMOVE the local Driver interface definition from lines 290-313 in types/index.ts
/*
export interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  line_id?: string
  license_number?: string
  license_expiry?: string
  profile_image_url?: string
  address?: string
  emergency_contact?: string
  notes?: string
  created_at: string
  updated_at: string // Problematic field
  user_id: string
  full_name?: string
  assigned_vehicles?: {
    id: string
    name: string
    plate_number: string
    image_url?: string
    brand?: string
    model?: string
  }[]
} 
*/ 