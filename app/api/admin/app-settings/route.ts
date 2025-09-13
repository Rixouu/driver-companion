import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('key')
    
    if (error) throw error
    
    return NextResponse.json(settings || [])
  } catch (error) {
    console.error('Error fetching app settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()
    
    // Update each setting
    const updates = []
    for (const [key, value] of Object.entries(body)) {
      updates.push(
        supabase
          .from('app_settings')
          .upsert({ 
            key, 
            value: value as string,
            updated_at: new Date().toISOString()
          })
      )
    }
    
    await Promise.all(updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating app settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
