import { NextResponse } from "next/server"
import { createAPIClient, withErrorHandling } from '@/lib/api/supabase-client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const supabase = createAPIClient()
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

    return newAssignment
  }, "Error assigning driver to vehicle")
} 