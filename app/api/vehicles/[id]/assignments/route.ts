import { createAPIClient, withErrorHandling } from '@/lib/api/supabase-client'

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
        status,
        created_at,
        driver:driver_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("vehicle_id", params.id)
      .order("created_at", { ascending: false })
    
    if (error) throw error;

    return {
      assignments: assignments?.map((assignment) => ({
        id: assignment.id,
        status: assignment.status,
        createdAt: assignment.created_at,
        driver: assignment.driver,
      })),
    }
  }, "Error fetching vehicle assignments")
} 