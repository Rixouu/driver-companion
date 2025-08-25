import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const resolvedParams = await params
    const driverId = resolvedParams.id

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Get driver email first
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('email')
      .eq('id', driverId)
      .single()

    if (driverError) {
      console.error('Error fetching driver:', driverError)
      return NextResponse.json(
        { error: 'Failed to fetch driver' },
        { status: 500 }
      )
    }

    // Get inspection details where this driver is the inspector
    const { data: inspectionDetails, error: inspectionError } = await supabase
      .from('inspection_details')
      .select('*')
      .eq('inspector_email', driver.email)
      .order('created_at', { ascending: false })

    if (inspectionError) {
      console.error('Error fetching inspection details:', inspectionError)
      return NextResponse.json(
        { error: 'Failed to fetch inspection details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      inspectionDetails: inspectionDetails || []
    })
  } catch (error) {
    console.error('Error in driver inspection details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
