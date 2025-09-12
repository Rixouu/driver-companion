import { NextRequest, NextResponse } from 'next/server'
import { scheduledNotificationService } from '@/lib/services/scheduled-notification-service'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// This endpoint is for testing and manual triggering of notifications
export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper auth
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      const adminSecret = process.env.ADMIN_SECRET || 'admin-secret-change-in-production'
      
      if (authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'all'

    console.log(`[Test Notifications] Running test notifications - type: ${testType}`)
    
    let results: any = {}

    if (testType === 'quotations' || testType === 'all') {
      console.log('[Test Notifications] Processing quotation notifications...')
      await scheduledNotificationService.processQuotationExpiryNotifications()
      results.quotations = 'processed'
    }

    if (testType === 'bookings' || testType === 'all') {
      console.log('[Test Notifications] Processing booking notifications...')
      await scheduledNotificationService.processBookingReminderNotifications()
      results.bookings = 'processed'
    }

    // Get upcoming notifications for monitoring
    const upcoming = await scheduledNotificationService.getUpcomingNotifications()
    
    // Get recent notifications to see what was created
    const supabase = getSupabaseServerClient()
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('*')
      .in('type', [
        'quotation_expiring_24h',
        'quotation_expiring_2h', 
        'quotation_expired',
        'booking_reminder_24h',
        'booking_reminder_2h'
      ])
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      message: 'Test notifications processed successfully',
      test_type: testType,
      processed_at: new Date().toISOString(),
      results,
      upcoming_notifications: upcoming,
      recent_notifications: recentNotifications
    })
    
  } catch (error) {
    console.error('[Test Notifications] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process test notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for status check
export async function GET() {
  try {
    const upcoming = await scheduledNotificationService.getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled notification system is operational',
      current_time: new Date().toISOString(),
      upcoming_notifications: upcoming,
      endpoints: {
        trigger_all: '/api/notifications/trigger-test?type=all',
        trigger_quotations: '/api/notifications/trigger-test?type=quotations',
        trigger_bookings: '/api/notifications/trigger-test?type=bookings'
      }
    })
    
  } catch (error) {
    console.error('[Test Notifications] Error getting status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get notification system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
