import type { Database } from "./supabase"

// Database Types
export type DbVehicle = Database['public']['Tables']['vehicles']['Row']
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
  vehicle: Pick<DbVehicle, 'id' | 'name' | 'plate_number'>
}

export type MaintenanceWithVehicle = DbMaintenance & {
  vehicle: Pick<DbVehicle, 'id' | 'name' | 'plate_number'>
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