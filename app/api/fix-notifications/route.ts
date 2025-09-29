import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const supabaseService = createServiceClient() // Use service client to bypass RLS
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // First, let's see what notifications exist (using service client to bypass RLS)
    const { data: existingNotifications, error: fetchError } = await supabaseService
      .from('notifications')
      .select('id, user_id, title')
      .in('user_id', [
        '00000000-0000-0000-0000-000000000000', // Placeholder ID
        '5ae543dc-88b4-4ac4-9e02-a1024ad6d0b7', // Old admin user ID
        '1050a5cd-9caa-4737-b83e-9b4ed69a5cc7', // Another user ID
        'ecf5c05f-7f28-4f03-bb6e-c7e0fd865993'  // Another user ID
      ])

    if (fetchError) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch notifications: ${fetchError.message}` 
      }, { status: 500 })
    }

    console.log(`Found ${existingNotifications?.length || 0} notifications to fix`)

    if (!existingNotifications || existingNotifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        updatedCount: 0,
        message: 'No notifications found to fix'
      })
    }

    // Update all notifications with wrong user IDs to the current user's ID (using service client)
    const { data: updatedNotifications, error: updateError } = await supabaseService
      .from('notifications')
      .update({ user_id: user.id })
      .in('user_id', [
        '00000000-0000-0000-0000-000000000000', // Placeholder ID
        '5ae543dc-88b4-4ac4-9e02-a1024ad6d0b7', // Old admin user ID
        '1050a5cd-9caa-4737-b83e-9b4ed69a5cc7', // Another user ID
        'ecf5c05f-7f28-4f03-bb6e-c7e0fd865993'  // Another user ID
      ])
      .select()

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: `Failed to update notifications: ${updateError.message}` 
      }, { status: 500 })
    }

    console.log(`Updated ${updatedNotifications?.length || 0} notifications`)

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedNotifications?.length || 0,
      message: `Fixed ${updatedNotifications?.length || 0} notifications with correct user ID`
    })

  } catch (error) {
    console.error('Fix notifications error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
