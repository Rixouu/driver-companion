import { createAPIClient, withErrorHandling } from '@/lib/api/supabase-client'
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
        vehicle:vehicle_id (
          id,
          name,
          plate_number,
          brand,
          model,
          image_url
        )
      `)
      .eq("driver_id", params.id)
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
        vehicle: assignment.vehicle,
      })) || [],
    }
  }, "Error fetching driver vehicle assignments")
} 