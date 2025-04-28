import { RecursiveStringRecord } from '@/lib/i18n/types'
import type { Database } from './supabase'

// Define the base types from the database schema
type DbTables = Database['public']['Tables']

export type DbVehicle = {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  year?: string
  status: 'active' | 'maintenance' | 'inactive'
  image_url?: string
  vin?: string
  created_at: string
  updated_at: string
  user_id: string
  maintenance_tasks?: DbMaintenanceTask[]
  inspections?: DbInspection[]
  driver_id?: string
}

export type DbDriver = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  line_id?: string
  license_number?: string
  license_expiry?: string
  status: 'available' | 'unavailable' | 'leave' | 'training'
  profile_image_url?: string
  address?: string
  emergency_contact?: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
  assigned_vehicles?: DbVehicle[]
}

export type DbInspection = {
  id: string
  vehicle_id: string
  vehicle?: DbVehicle
  type: 'routine' | 'safety' | 'maintenance'
  date: string
  status: 'scheduled' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  user_id: string
  created_by?: string
  driver_id?: string
}

export type DbMaintenanceTask = {
  id: string
  vehicle_id: string
  vehicle?: DbVehicle
  title: string
  description?: string
  status: 'in_progress' | 'completed' | 'scheduled' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  due_date: string
  completed_date?: string
  started_at?: string
  created_at: string
  updated_at: string
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

export type InspectionWithVehicle = DbInspection & {
  vehicle: Pick<DbVehicle, 'id' | 'name' | 'plate_number' | 'image_url'>
}

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
  vehicle_id: string
  inspector_id: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
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
  status: 'available' | 'unavailable' | 'leave' | 'training'
  profile_image_url?: string
  address?: string
  emergency_contact?: string
  notes?: string
}

// Add Driver instance to the exports
export interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  line_id?: string
  license_number?: string
  license_expiry?: string
  status: 'available' | 'unavailable' | 'leave' | 'training'
  profile_image_url?: string
  address?: string
  emergency_contact?: string
  notes?: string
  created_at: string
  updated_at: string
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