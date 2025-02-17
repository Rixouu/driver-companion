import * as z from "zod"

export const inspectionItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["pass", "fail", "null"]),
  photos: z.array(z.string()),
  notes: z.string().optional(),
})

export const inspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  items: z.record(z.array(inspectionItemSchema)),
  notes: z.string().optional(),
  location: z.tuple([z.number(), z.number()]).optional(),
})

export type InspectionFormData = z.infer<typeof inspectionSchema> 