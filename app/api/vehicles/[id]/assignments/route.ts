import { NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: assignments } = await supabase
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

    return NextResponse.json({
      assignments: assignments?.map((assignment) => ({
        id: assignment.id,
        status: assignment.status,
        createdAt: assignment.created_at,
        driver: assignment.driver,
      })),
    })
  } catch (error) {
    console.error("Error fetching vehicle assignments:", error)
    return new NextResponse("Error fetching vehicle assignments", { status: 500 })
  }
} 