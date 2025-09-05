import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    const { data: settings, error } = await supabase
      .from('report_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // Return default settings if none exist
    const defaultSettings = {
      default_format: 'pdf',
      default_sections: {
        financial: true,
        vehicles: true,
        drivers: true,
        inspections: true,
        maintenance: true,
        bookings: true
      },
      email_notifications: true,
      auto_generate: false,
      retention_days: 90
    }

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    })

  } catch (error) {
    console.error('Error fetching report settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // Upsert settings (insert or update)
    const { data, error } = await supabase
      .from('report_settings')
      .upsert(body, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      settings: data
    })

  } catch (error) {
    console.error('Error updating report settings:', error)
    return NextResponse.json(
      { error: 'Failed to update report settings' },
      { status: 500 }
    )
  }
}
