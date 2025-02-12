export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "driver"
}

export interface Vehicle {
  id: string
  name: string
  plateNumber: string
  status: 'active' | 'inactive' | 'maintenance'
  model: string
  year: string
  vin: string
  lastInspection?: string
  assignedTo?: string
  imageUrl: string
  maintenanceHistory?: MaintenanceRecord[]
}

export interface MaintenanceRecord {
  id: string
  status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled' | 'overdue'
  date: string
  type: string
  photos: string[]
  notes: string
}

export interface CheckItem {
  id: string
  type: string
  label: string
  labelJa: string
  checked: boolean
  photos: string[]
  notes: string
  area?: 'front' | 'left' | 'right' | 'rear'
  status?: 'pass' | 'fail' | null
  voiceNotes?: string[]
}

export interface InspectionArea {
  id: string
  name: string
  items: CheckItem[]
}

export interface InspectionReport {
  id: string
  vehicleId: string
  inspectorId: string
  date: string
  status: 'draft' | 'completed' | 'reviewed'
  areas: InspectionArea[]
  signature?: string
  photos?: string[]
  voiceNotes?: string[]
}

export type InspectionItem = {
  id: string
  description: string
  status: "pass" | "fail" | null
  photos: string[]
  notes: string
}

export type VehicleSide = "Front" | "Left" | "Right" | "Rear"

export type DailyInspection = {
  id: string
  vehicleId: string
  driverId: string
  date: string
  status: "pending" | "completed"
  completedAt?: string
  items: Record<VehicleSide, InspectionItem[]>
  location?: {
    latitude: number
    longitude: number
  }
}

interface ValidationItem {
  id: string
  status: 'passed' | 'failed' | 'na' | 'pending'
  // ... other fields
}

