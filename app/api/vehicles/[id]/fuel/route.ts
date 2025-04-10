import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "@/types/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vehicleId = params.id

  // Initialize Supabase client
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // Get all fuel entries for the vehicle
    const { data: logs, error } = await supabase
      .from("fuel_entries")
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching fuel entries:", error)
      return NextResponse.json(
        { error: "Failed to fetch fuel entries" },
        { status: 500 }
      )
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 