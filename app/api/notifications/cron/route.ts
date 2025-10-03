import { NextRequest, NextResponse } from 'next/server'
import { 
  processAllScheduledNotifications,
  getUpcomingNotifications
} from '@/lib/services/scheduled-notification-service'

// This endpoint is specifically for Vercel cron jobs
// No authentication required as Vercel cron jobs are inherently secure
export async function POST(request: NextRequest) {
  try {
    console.log('[Vercel Cron] Processing scheduled notifications...')
    
    // Process all scheduled notifications
    await processAllScheduledNotifications()
    
    // Get summary of upcoming notifications for monitoring
    const upcoming = await getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled notifications processed successfully',
      processed_at: new Date().toISOString(),
      upcoming_notifications: upcoming
    })
    
  } catch (error) {
    console.error('[Vercel Cron] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process scheduled notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for monitoring
export async function GET(request: NextRequest) {
  try {
    const upcoming = await getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      current_time: new Date().toISOString(),
      upcoming_notifications: upcoming
    })
    
  } catch (error) {
    console.error('[Vercel Cron] Error getting status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get scheduled notifications status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
