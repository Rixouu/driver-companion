import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

async function createSupabaseServer() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API: Starting inspection details fetch for driver')
    const supabase = await createSupabaseServer()
    const driverId = (await params).id

    console.log('🔍 API: Driver ID:', driverId)

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Get driver email first
    console.log('🔍 API: Fetching driver email...')
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('email')
      .eq('id', driverId)
      .single()

    if (driverError) {
      console.error('❌ API: Error fetching driver:', driverError)
      return NextResponse.json(
        { error: 'Failed to fetch driver' },
        { status: 500 }
      )
    }

    console.log('🔍 API: Driver email:', driver.email)

                 // Use the new, properly organized inspection_details view
             console.log('🔍 API: Fetching inspections from new view...')
             
             const { data: inspectionDetails, error: inspectionError } = await supabase
               .from('inspection_details')
               .select('*')
               .eq('inspector_id', driverId)
               .order('date', { ascending: false })

    if (inspectionError) {
      console.error('❌ API: Error fetching inspections:', inspectionError)
      return NextResponse.json(
        { error: 'Failed to fetch inspections' },
        { status: 500 }
      )
    }



    console.log('✅ API: Successfully fetched inspection details:', inspectionDetails?.length || 0)

    return NextResponse.json({
      inspectionDetails: inspectionDetails || []
    })
  } catch (error) {
    console.error('❌ API: Error in driver inspection details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
