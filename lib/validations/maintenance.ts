import * as z from "zod"
import type { Database } from "@/types/supabase"

type MaintenanceTask = Database['public']['Tables']['maintenance_tasks']['Row']

export const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  due_date: z.string().min(1, "Required"),
  estimated_duration: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
})

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>

export interface MaintenanceFormProps {
  initialData?: MaintenanceTask
  mode?: 'create' | 'edit'
} 