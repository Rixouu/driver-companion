import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Get all notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (notificationsError) {
      throw notificationsError
    }
    
    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (adminError) {
      throw adminError
    }
    
    return NextResponse.json({ 
      success: true,
      notifications,
      adminUsers,
      totalNotifications: notifications?.length || 0,
      totalAdminUsers: adminUsers?.length || 0
    })
  } catch (error) {
    console.error('[DEBUG-NOTIFICATIONS] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
