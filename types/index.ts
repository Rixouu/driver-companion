export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "driver"
}

export type Vehicle = {
  id: string
  vin: string
  name: string
  model: string
  imageUrl: string
  assignedTo?: string // driver ID
  lastInspection?: string
  status: "pending" | "completed"
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

