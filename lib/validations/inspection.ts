import * as z from "zod"

export const inspectionSchema = z.object({
  vehicleId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    status: z.enum(["pass", "fail"]),
    notes: z.string().optional(),
    photos: z.array(z.string()).optional(),
  })),
  inspector: z.string(),
  date: z.string(),
}) 