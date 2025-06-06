import { NextRequest, NextResponse } from 'next/server';
import { OwnTracksPayload } from '@/types/dispatch';

export async function POST(request: NextRequest) {
  try {
    const payload: OwnTracksPayload = await request.json();
    
    // Validate payload
    if (!payload._type || payload._type !== 'location') {
      return NextResponse.json(
        { error: 'Invalid payload type' },
        { status: 400 }
      );
    }

    if (!payload.lat || !payload.lon || !payload.tid) {
      return NextResponse.json(
        { error: 'Missing required location data' },
        { status: 400 }
      );
    }

    // For now, just log the payload until database migration is applied
    console.log('OwnTracks location update:', {
      deviceId: payload.tid,
      latitude: payload.lat,
      longitude: payload.lon,
      speed: payload.vel,
      battery: payload.batt,
      timestamp: new Date(payload.tst * 1000).toISOString()
    });

    // TODO: After database migration is applied, implement:
    // 1. Find or create tracking device in tracking_devices table
    // 2. Insert location data into vehicle_locations table
    // 3. Associate with vehicle and driver if mapping exists
    // 4. Trigger real-time updates via Supabase realtime

    return NextResponse.json({ 
      success: true,
      message: 'Location data received and logged. Database integration pending migration.'
    });

  } catch (error) {
    console.error('OwnTracks webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'OwnTracks webhook endpoint',
    status: 'active' 
  });
} 