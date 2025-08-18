import { NextRequest, NextResponse } from 'next/server';
import { updateBookingAction } from '@/app/actions/bookings';

export async function POST(request: NextRequest) {
  try {
    // Test the updateBookingAction with dummy data
    const testResult = await updateBookingAction('test-id', {
      notes: 'Test update from API route'
    });
    
    return NextResponse.json({
      success: true,
      testResult,
      message: 'Booking action test completed'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Booking action test failed'
    }, { status: 500 });
  }
}
