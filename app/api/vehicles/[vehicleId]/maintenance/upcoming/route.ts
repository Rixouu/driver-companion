import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { isAfter, isBefore, addDays } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("vehicle_id", params.vehicleId)
      .eq("status", "scheduled")
      .order("due_date", { ascending: true })
      .limit(5)

    if (error) throw error

    const upcomingServices = data.map(task => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      estimatedDuration: task.estimated_duration,
      priority: isAfter(new Date(task.due_date), addDays(new Date(), 7))
        ? "normal"
        : "high",
    }))

    return NextResponse.json(upcomingServices)
  } catch (error) {
    console.error("Failed to fetch upcoming services:", error)
    return NextResponse.json(
      { error: "Failed to fetch upcoming services" },
      { status: 500 }
    )
  }
} 