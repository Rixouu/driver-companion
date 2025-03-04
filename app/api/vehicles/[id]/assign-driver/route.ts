import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { driverId } = await request.json()

    // Check if there's an existing active assignment
    const { data: existingAssignment } = await db
      .from("vehicle_assignments")
      .select("*")
      .eq("vehicle_id", params.id)
      .eq("status", "active")
      .single()

    if (existingAssignment) {
      // Update existing assignment to inactive
      await db
        .from("vehicle_assignments")
        .update({ status: "inactive" })
        .eq("vehicle_id", params.id)
        .eq("status", "active")
    }

    // Create new assignment
    const { data: newAssignment, error } = await db
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