import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { z } from "zod"

const assignDriverSchema = z.object({
  driverId: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: { vehicleId: string } }
) {
  try {
    const body = await request.json()
    const { driverId } = assignDriverSchema.parse(body)

    // End current assignment if exists
    const { error: unassignError } = await supabase
      .from("vehicle_assignments")
      .update({ end_date: new Date().toISOString() })
      .eq("vehicle_id", params.vehicleId)
      .is("end_date", null)

    if (unassignError) throw unassignError

    // Create new assignment
    const { error: assignError } = await supabase
      .from("vehicle_assignments")
      .insert([{
        vehicle_id: params.vehicleId,
        driver_id: driverId,
        start_date: new Date().toISOString(),
      }])

    if (assignError) throw assignError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to assign driver:", error)
    return NextResponse.json(
      { error: "Failed to assign driver" },
      { status: 500 }
    )
  }
} 