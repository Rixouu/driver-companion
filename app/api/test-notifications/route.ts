import { NextRequest, NextResponse } from 'next/server'
import { processAllScheduledNotifications } from '@/lib/services/scheduled-notification-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-NOTIFICATIONS] Manually triggering notification processing...')
    
    await processAllScheduledNotifications()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification processing completed successfully' 
    })
  } catch (error) {
    console.error('[TEST-NOTIFICATIONS] Error processing notifications:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
