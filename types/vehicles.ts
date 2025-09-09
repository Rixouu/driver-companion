export interface FuelEntry {
  id: string
  date: string
  liters: number
  cost: number
  mileage: number
  vehicle_id: string
}

export interface Vehicle {
  id: string
  created_at: string
  updated_at?: string
  make?: string
  model?: string
  year?: number | string
  license_plate?: string
  vin?: string
  image_url?: string
  status?: 'active' | 'maintenance' | 'retired' | string
  last_inspection?: string
  name?: string
  plate_number?: string
  brand?: string
  mileage?: number | null
  last_inspection_date?: string | null
  passenger_capacity?: number | null
  luggage_capacity?: number | null
}

export interface Driver {
  id: string
  name: string
  email: string
  avatar?: string
  status?: "active" | "inactive" | "suspended"
  licenseNumber?: string
  licenseExpiry?: string
}

export interface MileageEntry {
  id: string
  date: string
  reading: number
  notes?: string
  vehicle_id: string
}

export interface VehicleAssignment {
  id: string
  vehicleId: string
  driverId: string
  startDate: string
  endDate?: string
}

export interface VehicleStats {
  totalMileage: number
  avgFuelEfficiency: number
  totalMaintenanceCost: number
  nextServiceDue: string
}

export interface VehicleStatusData {
  month: string
  active: number
  maintenance: number
  inspection: number
}

export interface MaintenanceReport {
  tasks: Array<{
    id: string
    title: string
    completedDate: string
    cost: number
    status: string
  }>
  totalCost: number
  completedTasks: number
  pendingTasks: number
}

export type NewVehicle = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> 