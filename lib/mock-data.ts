export interface Inspection {
  id: string
  createdAt: Date
  updatedAt: Date
  vehicleId: string
  status: 'pending' | 'completed' | 'failed'
  type: string
  notes?: string
}

export interface Vehicle {
  id: string
  name: string
  plateNumber: string
  model: string
  year: string
  vin: string
  status: 'active' | 'inactive' | 'maintenance'
  lastInspection: string
  assignedTo: string
  imageUrl?: string
}

// Mock data stores
const mockInspections: Inspection[] = [
  {
    id: '1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    vehicleId: '1',
    status: 'completed',
    type: 'routine',
    notes: 'Regular inspection completed'
  },
  // Add more mock data as needed
]

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Toyota Alphard Z-Class",
    plateNumber: "ABC-123",
    model: "Alphard Z-Class",
    year: "2023",
    vin: "JN1WNYD26U0123456",
    status: "active",
    lastInspection: "2023-05-10",
    assignedTo: "Test User",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
  // Add more mock vehicles as needed
]

// Combined mock API
export const mockApi = {
  // Inspection methods
  getInspections: async () => mockInspections,
  getInspection: async (id: string) => 
    mockInspections.find(inspection => inspection.id === id),
  createInspection: async (data: Partial<Inspection>) => {
    const newInspection = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as Inspection
    mockInspections.push(newInspection)
    return newInspection
  },

  // Vehicle methods
  getVehicles: async () => mockVehicles,
  getVehicle: async (id: string) => 
    mockVehicles.find(vehicle => vehicle.id === id),
  createVehicle: async (data: Partial<Vehicle>) => {
    const newVehicle = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as Vehicle
    mockVehicles.push(newVehicle)
    return newVehicle
  }
} 