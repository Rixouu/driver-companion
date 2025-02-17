export interface MaintenanceTaskWithVehicle {
  id: string
  title: string
  description: string | null
  status: string
  due_date: string
  estimated_duration?: number | null
  cost?: number | null
  notes?: string | null
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
  // ... other fields from your backup
} 