import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "@/types/supabase"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const awaitedParams = await context.params;
  const vehicleId = Array.isArray(awaitedParams.id) ? awaitedParams.id[0] : awaitedParams.id;

  // Initialize Supabase client with cookies() (do not await)
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
    // Get all mileage entries for the vehicle
    const { data: logs, error } = await supabase
      .from("mileage_entries")
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching mileage entries:", error)
      return NextResponse.json(
        { error: "Failed to fetch mileage entries" },
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