import * as z from "zod"

export const driverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
  profile_image_url: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
})

export type DriverFormValues = z.infer<typeof driverSchema> 