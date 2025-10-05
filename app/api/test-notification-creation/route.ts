import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notification-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-NOTIFICATION-CREATION] Creating test notification for all admin users...')
    
    // Create a test notification for all admin users
    await notificationService.createAdminNotification(
      'booking_reminder_24h',
      {
        bookingId: 'b20f834d-3c91-49d8-99c4-8a7350780fa9',
        wpId: 'TEST-123',
        customerName: 'Test Customer',
        serviceName: 'Test Service',
        time: '10:00',
        pickupLocation: 'Test Location',
        date: '2025-10-05'
      },
      'b20f834d-3c91-49d8-99c4-8a7350780fa9'
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test notification created for all admin users' 
    })
  } catch (error) {
    console.error('[TEST-NOTIFICATION-CREATION] Error creating test notification:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
