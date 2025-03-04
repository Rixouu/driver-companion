import * as z from "zod"

export const fuelLogSchema = z.object({
  date: z.string(),
  odometer_reading: z.number().min(0),
  fuel_amount: z.number().min(0),
  fuel_cost: z.number().min(0),
  full_tank: z.boolean().default(true),
})

export type FuelLogFormData = z.infer<typeof fuelLogSchema> 