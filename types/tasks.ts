export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "normal" | "high" | "urgent"
  due_date?: string
  assigned_to?: string
  vehicle_id?: string
  task_type: "maintenance" | "inspection" | "other"
  created_at: string
  updated_at: string
  vehicle?: {
    id: string
    name: string
    plate_number: string
  }
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
} 