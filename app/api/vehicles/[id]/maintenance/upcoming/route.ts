import { NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { isAfter, isBefore, addDays } from "date-fns"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: tasks } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("vehicle_id", params.id)
      .eq("status", "scheduled")
      .order("due_date", { ascending: true })

    if (!tasks) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 })
    }

    const upcomingServices = tasks.map(task => ({
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
    console.error("Error fetching upcoming maintenance:", error)
    return new NextResponse("Error fetching upcoming maintenance", { status: 500 })
  }
} 