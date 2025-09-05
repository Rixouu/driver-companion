import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const body = await request.json()
    
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('report_schedules')
      .update(body)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedule: data
    })

  } catch (error) {
    console.error('Error updating report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update report schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete report schedule' },
      { status: 500 }
    )
  }
}
