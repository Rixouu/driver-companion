import * as z from "zod"

export const vehicleSchema = z.object({
  name: z.string().min(1, "Required"),
  brand: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.string().min(1, "Required"),
  status: z.enum(["active", "maintenance", "inactive"]),
  image_url: z.string().optional(),
  vin: z.string().optional(),
  plate_number: z.string().min(1, "Required"),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>

export interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>
} 