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
    console.log('API received body with', Object.keys(body).length, 'settings')
    
    const supabase = createServiceClient()
    console.log('Service client created successfully')
    
    // Test the connection first
    const { data: testData, error: testError } = await supabase
      .from('app_settings')
      .select('key')
      .limit(1)
    
    if (testError) {
      console.error('Database connection test failed:', testError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    console.log('Database connection test successful')
    
    // Get current timestamp for all updates
    const now = new Date().toISOString()
    
    // Prepare batch data for upsert
    const settingsData = Object.entries(body).map(([key, value]) => ({
      key,
      value: value as string,
      updated_at: now
    }))
    
    console.log(`Performing batch upsert for ${settingsData.length} settings`)
    
    // Use upsert for batch operation - much more efficient!
    const { data: upsertData, error: upsertError } = await supabase
      .from('app_settings')
      .upsert(settingsData, {
        onConflict: 'key',
        ignoreDuplicates: false
      })
      .select()
    
    if (upsertError) {
      console.error('Batch upsert failed:', upsertError)
      return NextResponse.json({ error: `Failed to update settings: ${upsertError.message}` }, { status: 500 })
    }
    
    console.log(`Successfully updated ${upsertData?.length || 0} settings in batch operation`)
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: upsertData?.length || 0 
    })
  } catch (error) {
    console.error('Error updating app settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
