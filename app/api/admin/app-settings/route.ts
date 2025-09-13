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
    console.log('API received body:', JSON.stringify(body, null, 2))
    
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
    
    // Update each setting using proper upsert
    for (const [key, value] of Object.entries(body)) {
      console.log(`Updating ${key} = ${value}`)
      
      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('app_settings')
        .update({ 
          value: value as string,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
      
      if (updateError) {
        console.error(`Update failed for ${key}:`, updateError)
        return NextResponse.json({ error: `Failed to update ${key}: ${updateError.message}` }, { status: 500 })
      }
      
      // If no rows were updated, insert new record
      if (!updateData || updateData.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('app_settings')
          .insert({ 
            key,
            value: value as string,
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (insertError) {
          console.error(`Insert failed for ${key}:`, insertError)
          return NextResponse.json({ error: `Failed to insert ${key}: ${insertError.message}` }, { status: 500 })
        }
        
        console.log(`Successfully inserted ${key}:`, insertData)
      } else {
        console.log(`Successfully updated ${key}:`, updateData)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating app settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
