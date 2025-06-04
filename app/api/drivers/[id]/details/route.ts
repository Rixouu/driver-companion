import { NextResponse } from 'next/server'
import { getDriverById } from '@/lib/services/drivers'
import { getSupabaseServerClient } from '@/lib/supabase/server' // For auth check

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const driverId = params.id
    if (!driverId) {
      return NextResponse.json({ message: 'Driver ID is required' }, { status: 400 })
    }

    const driver = await getDriverById(driverId)

    if (!driver) {
      return NextResponse.json({ message: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('[API /drivers/[id]/details GET] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ message: 'Failed to fetch driver details', error: errorMessage }, { status: 500 })
  }
} 