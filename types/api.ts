export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type VehicleInfo = {
  vin: string
  make: string
  model: string
  year: string
  color: string
  licensePlate: string
  lastInspectionDate?: string
  documents: Document[]
}

export type Document = {
  id: string
  type: "insurance" | "registration" | "maintenance" | "other"
  fileName: string
  fileUrl: string
  uploadedAt: string
  expiryDate?: string
}

export type InspectionReport = {
  id: string
  vehicleId: string
  driverId: string
  date: string
  location: {
    latitude: number
    longitude: number
  }
  items: InspectionItem[]
  photos: PhotoEvidence[]
  damages: DamageReport[]
  status: "pending" | "completed"
  completedAt?: string
}

export type InspectionItem = {
  id: string
  description: string
  passed: boolean
  notes?: string
}

export type PhotoEvidence = {
  id: string
  itemId: string
  imageUrl: string
  timestamp: string
  location?: {
    latitude: number
    longitude: number
  }
}

export type DamageReport = {
  id: string
  location: string
  severity: "minor" | "moderate" | "severe"
  description: string
  photos: string[]
  reportedAt: string
}

