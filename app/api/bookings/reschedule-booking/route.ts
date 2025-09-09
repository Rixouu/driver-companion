import { NextRequest, NextResponse } from 'next/server';
import { rescheduleBookingAction } from '@/app/actions/bookings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, newDate, newTime } = body;

    if (!bookingId || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, newDate, newTime' },
        { status: 400 }
      );
    }

    const result = await rescheduleBookingAction(bookingId, newDate, newTime);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        booking: result.booking
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in reschedule-booking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
