import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-ADMIN-NOTIFICATIONS] Testing notification creation for all admin users...')
    
    const supabase = createServiceClient()
    
    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
    
    if (adminError) {
      throw adminError
    }
    
    console.log(`[TEST-ADMIN-NOTIFICATIONS] Found ${adminUsers?.length || 0} admin users:`, adminUsers)
    
    // Try to create a test notification for each admin user
    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map(user => ({
        user_id: user.id,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        type: 'booking_reminder_24h',
        related_id: 'b20f834d-3c91-49d8-99c4-8a7350780fa9',
        is_read: false
      }))
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select()
      
      if (error) {
        console.error('[TEST-ADMIN-NOTIFICATIONS] Error creating notifications:', error)
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          adminUsers: adminUsers.map(u => ({ id: u.id, email: u.email }))
        }, { status: 500 })
      }
      
      console.log(`[TEST-ADMIN-NOTIFICATIONS] Successfully created ${data?.length || 0} test notifications`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Created ${data?.length || 0} test notifications for all admin users`,
        notifications: data,
        adminUsers: adminUsers.map(u => ({ id: u.id, email: u.email }))
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No admin users found' 
      }, { status: 404 })
    }
  } catch (error) {
    console.error('[TEST-ADMIN-NOTIFICATIONS] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
