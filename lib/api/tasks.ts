import { supabase } from "@/lib/supabase"
import type { Task } from "@/types/tasks"

export async function getTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number),
      assignee:drivers(id, name, avatar)
    `)
    .order("due_date", { ascending: true })
    .limit(5)

  if (error) throw error
  return data
}

export async function getUpcomingTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      vehicle:vehicles(id, name, plate_number),
      assignee:drivers(id, name, avatar)
    `)
    .in("status", ["pending", "in_progress"])
    .order("due_date", { ascending: true })
    .limit(5)

  if (error) throw error
  return data
}

export async function createTask(task: Omit<Task, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([task])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
} 