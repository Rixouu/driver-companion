import * as z from "zod"

export const vehicleSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  plate_number: z.string().min(1, { message: "License plate is required" }),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>

export interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>
} 