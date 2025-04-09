import { NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: stats } = await supabase
      .from("vehicle_statistics")
      .select("*")
      .eq("vehicle_id", params.id)
      .single()

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching vehicle statistics:", error)
    return new NextResponse("Error fetching vehicle statistics", { status: 500 })
  }
} 