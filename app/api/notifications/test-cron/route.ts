import { NextRequest, NextResponse } from 'next/server'
import { 
  processAllScheduledNotifications,
  getUpcomingNotifications
} from '@/lib/services/scheduled-notification-service'

// Test endpoint for manual cron testing
export async function POST(request: NextRequest) {
  try {
    console.log('[Test Cron API] Manual test triggered...')
    
    // Process all scheduled notifications
    const result = await processAllScheduledNotifications()
    
    // Get summary of upcoming notifications for monitoring
    const upcoming = await getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      message: 'Test cron executed successfully',
      executed_at: new Date().toISOString(),
      result,
      upcoming_notifications: upcoming
    })
    
  } catch (error) {
    console.error('[Test Cron API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to execute test cron',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking what notifications would be triggered
export async function GET(request: NextRequest) {
  try {
    const upcoming = await getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      current_time: new Date().toISOString(),
      upcoming_notifications: upcoming,
      message: 'Use POST to trigger the test cron'
    })
    
  } catch (error) {
    console.error('[Test Cron API] Error getting status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get test cron status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
