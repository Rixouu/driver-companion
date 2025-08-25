import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
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

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single()

    if (driverError) {
      console.error('Error fetching driver:', driverError)
      return NextResponse.json(
        { error: 'Failed to fetch driver' },
        { status: 500 }
      )
    }

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Error in driver API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API: Starting driver update')
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ API: Missing environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    console.log('🔍 API: Environment variables OK')
    console.log('🔍 API: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
    console.log('🔍 API: Service key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)
    
    const supabase = await createSupabaseServer()
    console.log('🔍 API: Supabase client created')
    const resolvedParams = await params
    const driverId = resolvedParams.id
    const body = await request.json()

    console.log('🔍 API: Driver ID:', driverId)
    console.log('🔍 API: Update data:', body)

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      )
    }

    // Test Supabase connection first
    try {
      const { data: testConnection, error: connectionError } = await supabase
        .from('drivers')
        .select('id')
        .eq('id', driverId)
        .limit(1)
      
      if (connectionError) {
        console.error('❌ API: Database connection test failed:', connectionError)
        return NextResponse.json(
          { error: 'Database connection failed', details: connectionError.message },
          { status: 500 }
        )
      }
      
      console.log('🔍 API: Database connection test successful')
    } catch (connectionTestError) {
      console.error('❌ API: Database connection test exception:', connectionTestError)
      return NextResponse.json(
        { error: 'Database connection test failed', details: connectionTestError instanceof Error ? connectionTestError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Clean up empty strings to null for database compatibility
    const cleanedData = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key, 
        value === '' ? null : value
      ])
    )

    console.log('🔍 API: Cleaned data:', cleanedData)

    // Update driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .select()
      .single()

    if (driverError) {
      console.error('❌ API: Error updating driver:', driverError)
      return NextResponse.json(
        { error: 'Failed to update driver', details: driverError.message },
        { status: 500 }
      )
    }

    if (!driver) {
      console.error('❌ API: Driver not found after update')
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    console.log('✅ API: Successfully updated driver:', driver.id)
    return NextResponse.json({
      ...driver,
      full_name: `${driver.first_name} ${driver.last_name}`
    })
  } catch (error) {
    console.error('❌ API: Error in driver update API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
