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
    const vehicleId = resolvedParams.id

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      // Return only the count for quickstats
      const { count, error } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId)

      if (error) {
        console.error('Error counting vehicle inspections:', error)
        return NextResponse.json(
          { error: 'Failed to count inspections' },
          { status: 500 }
        )
      }

      return NextResponse.json({ count: count || 0 })
    }

    // Fetch inspections for the vehicle
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select(`
        id,
        date,
        type,
        status,
        notes,
        created_at,
        updated_at,
        inspector_id,
        driver_id,
        items
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicle inspections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inspections' },
        { status: 500 }
      )
    }

    // For each inspection, get the item counts and inspector info
    const inspectionsWithCounts = await Promise.all(
      (inspections || []).map(async (inspection) => {
        // Get inspection items counts from the items JSONB field or inspection_items table
        let items_count = 0
        let failed_items_count = 0

        // First try to get from inspection_items table
        const { data: items, error: itemsError } = await supabase
          .from('inspection_items')
          .select('id, status')
          .eq('inspection_id', inspection.id)

        if (!itemsError && items && items.length > 0) {
          items_count = items.length
          failed_items_count = items.filter(item => item.status === 'fail').length
        } else if (inspection.items && Array.isArray(inspection.items)) {
          // Fallback to items JSONB field
          items_count = inspection.items.length
          failed_items_count = inspection.items.filter((item: any) => item.status === 'fail').length
        }

        // Get inspector name if inspector_id exists
        let inspector_name = null
        let inspector_email = null
        
        if (inspection.inspector_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(inspection.inspector_id)
          if (userData?.user) {
            inspector_name = userData.user.user_metadata?.full_name || userData.user.email
            inspector_email = userData.user.email
          }
        }

        return {
          id: inspection.id,
          date: inspection.date,
          type: inspection.type,
          status: inspection.status,
          notes: inspection.notes,
          created_at: inspection.created_at,
          updated_at: inspection.updated_at,
          inspector_id: inspection.inspector_id,
          driver_id: inspection.driver_id,
          items_count,
          failed_items_count,
          inspector_name,
          inspector_email
        }
      })
    )

    return NextResponse.json(inspectionsWithCounts)
  } catch (error) {
    console.error('Error in vehicle inspections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 