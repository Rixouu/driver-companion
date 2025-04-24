import { createAPIClient, withErrorHandling } from '@/lib/api/supabase-client'
import { VehicleAssignmentInput } from '@/types/vehicle-assignments'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const supabase = createAPIClient()
    
    const { data: assignments, error } = await supabase
      .from("vehicle_assignments")
      .select(`
        id,
        vehicle_id,
        driver_id,
        status,
        start_date,
        end_date,
        notes,
        created_at,
        updated_at,
        driver:driver_id (
          id,
          first_name,
          last_name,
          email,
          status,
          profile_image_url
        )
      `)
      .eq("vehicle_id", params.id)
      .order("created_at", { ascending: false })
    
    if (error) throw error;

    return {
      assignments: assignments?.map((assignment) => ({
        id: assignment.id,
        vehicleId: assignment.vehicle_id,
        driverId: assignment.driver_id,
        status: assignment.status,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        notes: assignment.notes,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        driver: assignment.driver,
      })) || [],
    }
  }, "Error fetching vehicle assignments")
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const supabase = createAPIClient()
    const input: VehicleAssignmentInput = await request.json()

    // Check if there's an existing active assignment
    const { data: existingAssignment } = await supabase
      .from("vehicle_assignments")
      .select("id")
      .eq("vehicle_id", params.id)
      .eq("status", "active")
      .single()

    if (existingAssignment) {
      // Update existing assignment to inactive
      await supabase
        .from("vehicle_assignments")
        .update({
          status: "inactive",
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingAssignment.id)
    }

    // Create new assignment
    const { data: newAssignment, error } = await supabase
      .from("vehicle_assignments")
      .insert({
        vehicle_id: params.id,
        driver_id: input.driverId,
        status: "active",
        start_date: input.startDate || new Date().toISOString(),
        notes: input.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        vehicle_id,
        driver_id,
        status,
        start_date,
        end_date,
        notes,
        created_at,
        updated_at
      `)
      .single()

    if (error) throw error

    // Also update any inspections for this vehicle with the driver_id
    await supabase
      .from('inspections')
      .update({ 
        driver_id: input.driverId,
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_id', params.id)
      .is('driver_id', null)

    return newAssignment
  }, "Error assigning driver to vehicle")
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const supabase = createAPIClient()
    const { assignmentId } = await request.json()

    const { data, error } = await supabase
      .from("vehicle_assignments")
      .update({
        status: "inactive",
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", assignmentId)
      .eq("vehicle_id", params.id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data
    }
  }, "Error ending vehicle assignment")
} 