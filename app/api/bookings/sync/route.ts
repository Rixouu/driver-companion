import { NextRequest, NextResponse } from 'next/server'
import { syncBookingsFromWordPress } from '@/lib/api/bookings-service'
import { createServiceClient } from '@/lib/supabase/service-client'

// Optional auth function for verification
async function verifyRequest(req: NextRequest) {
  // Get the authorization header or API key from request
  const authHeader = req.headers.get('authorization')
  
  // This is a simple check to protect this endpoint
  // In production, use a more secure method like API keys or JWT
  const apiKey = process.env.API_SYNC_SECRET_KEY
  
  if (!apiKey) {
    return true // If no API key is configured, don't block
  }
  
  // Check if the authorization header is valid
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === apiKey) {
    return true
  }
  
  // Also allow query param for cron jobs that don't support headers
  const url = new URL(req.url)
  const keyParam = url.searchParams.get('key')
  if (keyParam === apiKey) {
    return true
  }
  
  return false
}

// Store the last sync time to avoid too frequent syncs
let lastSyncTime: Date | null = null
const MIN_SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Automated booking sync endpoint
 * This can be called by a cron job or scheduler to keep bookings in sync
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the request (optional)
    const isAuthorized = await verifyRequest(req)
    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if we've synced recently
    const now = new Date()
    if (lastSyncTime && (now.getTime() - lastSyncTime.getTime()) < MIN_SYNC_INTERVAL) {
      return NextResponse.json({
        success: false,
        message: `Sync throttled. Last sync was ${Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000)} seconds ago.`
      }, { status: 429 })
    }
    
    // Record this sync attempt
    lastSyncTime = now
    
    // Get force parameter from query string
    const url = new URL(req.url)
    const forceSync = url.searchParams.get('force') === 'true'
    
    // Get debug parameter from query string
    const debug = url.searchParams.get('debug') === 'true'
    
    // Log sync start
    console.log(`Starting scheduled booking sync at ${now.toISOString()}${forceSync ? ' (forced)' : ''}`)
    
    // Run the sync
    const result = await syncBookingsFromWordPress()
    
    // Store metadata about this sync in system variables
    // We'll store the last sync time in localStorage or another appropriate place
    // This doesn't require schema changes
    
    // Handle errors
    if (result.error) {
      console.error(`Booking sync failed: ${result.error}`)
      
      return NextResponse.json({
        success: false,
        message: `Sync failed: ${result.error}`,
        timestamp: now.toISOString(),
        ...(debug ? { debug_info: result } : {})
      }, { status: 500 })
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.total} bookings (${result.created} created, ${result.updated} updated)`,
      stats: {
        total: result.total,
        created: result.created,
        updated: result.updated
      },
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Unhandled error in booking sync API:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error in booking sync',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 