import { NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Create a Supabase client - using 'any' to avoid type errors with missing tables
    const supabase = createRouteHandlerClient({ cookies })
    const { driverId } = await request.json()

    // Check if there's an existing active assignment
    const { data: existingAssignment } = await supabase
      .from("vehicle_assignments")
      .select("*")
      .eq("vehicle_id", params.id)
      .eq("status", "active")
      .single()

    if (existingAssignment) {
      // Update existing assignment to inactive
      await supabase
        .from("vehicle_assignments")
        .update({ status: "inactive" })
        .eq("vehicle_id", params.id)
        .eq("status", "active")
    }

    // Create new assignment
    const { data: newAssignment, error } = await supabase
      .from("vehicle_assignments")
      .insert({
        vehicle_id: params.id,
        driver_id: driverId,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(newAssignment)
  } catch (error) {
    console.error("Error assigning driver:", error)
    return new NextResponse("Error assigning driver", { status: 500 })
  }
} 