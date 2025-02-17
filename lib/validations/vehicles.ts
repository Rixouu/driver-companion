import { z } from "zod"

export const vehicleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  plateNumber: z.string().regex(/^[A-Z0-9-]+$/, "Invalid plate number format"),
  model: z.string().min(2, "Model must be at least 2 characters"),
  year: z.string().regex(/^\d{4}$/, "Invalid year format"),
  vin: z.string().optional(),
  status: z.enum(["active", "maintenance", "inspection_due"]),
})

export const maintenanceTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const fuelEntrySchema = z.object({
  date: z.string().datetime(),
  liters: z.number().positive("Liters must be positive"),
  cost: z.number().positive("Cost must be positive"),
  mileage: z.number().positive("Mileage must be positive"),
  notes: z.string().optional(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
export type MaintenanceTaskFormData = z.infer<typeof maintenanceTaskSchema>
export type FuelEntryFormData = z.infer<typeof fuelEntrySchema> 