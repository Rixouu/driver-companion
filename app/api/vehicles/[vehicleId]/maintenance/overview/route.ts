import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("maintenance_tasks")
      .select("status")
      .eq("vehicle_id", params.vehicleId)

    if (error) throw error

    const stats = data.reduce(
      (acc, task) => {
        if (task.status === "completed") acc.completed++
        else if (task.status === "scheduled") acc.scheduled++
        else if (task.status === "overdue") acc.overdue++
        return acc
      },
      { completed: 0, scheduled: 0, overdue: 0 }
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch maintenance overview:", error)
    return NextResponse.json(
      { error: "Failed to fetch maintenance overview" },
      { status: 500 }
    )
  }
} 