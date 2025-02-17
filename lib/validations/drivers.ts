import { z } from "zod"

export const driverAssignmentSchema = z.object({
  driverId: z.string().uuid({
    message: "Invalid driver ID",
  }),
  startDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

export type DriverAssignmentData = z.infer<typeof driverAssignmentSchema> 