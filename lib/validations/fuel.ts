import { z } from "zod"

export const fuelEntrySchema = z.object({
  date: z.string().datetime(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  mileage: z.number().positive(),
})

export type FuelEntryFormData = z.infer<typeof fuelEntrySchema> 