import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { inspector_ids } = await request.json()

    if (!inspector_ids || !Array.isArray(inspector_ids) || inspector_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid inspector_ids array' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .in('id', inspector_ids)

    if (error) {
      console.error('Error fetching drivers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch driver information' },
        { status: 500 }
      )
    }

    // Create a map of driver_id to driver data
    const driversMap: Record<string, any> = {}
    drivers?.forEach(driver => {
      driversMap[driver.id] = driver
    })

    return NextResponse.json({ drivers: driversMap })
  } catch (error) {
    console.error('Error in inspector-info-batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
