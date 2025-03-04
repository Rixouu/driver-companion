import * as z from "zod"

export const mileageLogSchema = z.object({
  date: z.string(),
  reading: z.number().min(0),
  notes: z.string().nullable(),
})

export type MileageLogFormData = z.infer<typeof mileageLogSchema> 