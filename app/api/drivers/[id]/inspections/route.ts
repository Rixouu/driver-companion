import { NextResponse } from 'next/server'
import { getDriverInspections } from '@/lib/services/drivers'
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

    const inspections = await getDriverInspections(driverId)

    return NextResponse.json(inspections)
  } catch (error) {
    console.error('[API /drivers/[id]/inspections GET] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ message: 'Failed to fetch driver inspections', error: errorMessage }, { status: 500 })
  }
} 