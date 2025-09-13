import { NextRequest, NextResponse } from 'next/server'
import { 
  processAllScheduledNotifications,
  getUpcomingNotifications
} from '@/lib/services/scheduled-notification-service'

// This endpoint can be called by a cron job service like Vercel Cron or external scheduler
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Scheduled Notifications API] Processing scheduled notifications...')
    
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
    console.error('[Scheduled Notifications API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process scheduled notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for monitoring and debugging
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get upcoming notifications without processing them
    const upcoming = await getUpcomingNotifications()
    
    return NextResponse.json({
      success: true,
      current_time: new Date().toISOString(),
      upcoming_notifications: upcoming
    })
    
  } catch (error) {
    console.error('[Scheduled Notifications API] Error getting status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get scheduled notifications status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
