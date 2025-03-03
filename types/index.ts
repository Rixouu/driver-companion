import type { Database } from "./supabase"

// Database Types
export interface DbVehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  year?: string
  status: string
  image_url?: string
  created_at: string
  updated_at: string
  user_id: string
  vin?: string
  maintenance_tasks?: MaintenanceTask[]
  inspections?: Inspection[]
}

export type DbInspection = Database['public']['Tables']['inspections']['Row']
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