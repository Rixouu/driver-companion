import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    const { data: schedules, error } = await supabase
      .from('report_schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedules: schedules || []
    })

  } catch (error) {
    console.error('Error fetching report schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      report_type,
      format,
      frequency,
      day_of_week,
      day_of_month,
      time_of_day,
      options,
      recipients
    } = body

    const supabase = createServiceClient()

    // Calculate next run time
    const { data: nextRunData, error: nextRunError } = await supabase
      .rpc('calculate_next_run', {
        frequency,
        day_of_week: day_of_week || null,
        day_of_month: day_of_month || null,
        time_of_day: time_of_day || '09:00'
      })

    if (nextRunError) throw nextRunError

    const scheduleData = {
      name,
      description,
      report_type,
      format: format || 'pdf',
      frequency,
      day_of_week,
      day_of_month,
      time_of_day: time_of_day || '09:00',
      is_active: true,
      options: options || {},
      recipients: recipients || [],
      next_run: nextRunData
    }

    const { data, error } = await supabase
      .from('report_schedules')
      .insert(scheduleData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      schedule: data
    })

  } catch (error) {
    console.error('Error creating report schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create report schedule' },
      { status: 500 }
    )
  }
}
