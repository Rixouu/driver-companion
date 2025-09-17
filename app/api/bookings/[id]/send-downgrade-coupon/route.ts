import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { EmailAPIWrapper } from "@/lib/services/email-api-wrapper";
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { couponCode, refundAmount, previousCategory, newCategory, bccEmail, operationId } = await request.json();
    const { id: bookingId } = await params;

    if (!couponCode || !refundAmount) {
      return NextResponse.json(
        { error: 'Coupon code and refund amount are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        wp_id, 
        customer_name, 
        customer_email, 
        service_name,
        vehicle_id
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get the specific vehicle assignment operation
    const { data: assignmentOperation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .select('previous_vehicle_id, new_vehicle_id')
      .eq('id', operationId)
      .single();

    if (operationError || !assignmentOperation) {
      return NextResponse.json(
        { error: 'Vehicle assignment operation not found' },
        { status: 404 }
      );
    }

    // Get vehicle names and details using separate queries
    let previousVehicleName = 'N/A';
    let newVehicleName = 'N/A';
    let previousVehicleDetails = '';
    let newVehicleDetails = '';

    if (assignmentOperation.previous_vehicle_id) {
      const { data: previousVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', assignmentOperation.previous_vehicle_id)
        .single();
      previousVehicleName = previousVehicle?.name || 'N/A';
      if (previousVehicle?.brand && previousVehicle?.model) {
        previousVehicleDetails = ` (${previousVehicle.brand} ${previousVehicle.model})`;
      }
    }

    if (assignmentOperation.new_vehicle_id) {
      const { data: newVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', assignmentOperation.new_vehicle_id)
        .single();
      newVehicleName = newVehicle?.name || 'N/A';
      if (newVehicle?.brand && newVehicle?.model) {
        newVehicleDetails = ` (${newVehicle.brand} ${newVehicle.model})`;
      }
    }

    // Generate invoice PDF and prepare email data in parallel for better performance
    const baseUrl = request.nextUrl.origin;
    
    // Start PDF generation in background while preparing email data
    const pdfPromise = fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        operation_type: 'downgrade',
        previous_vehicle_name: previousVehicleName,
        new_vehicle_name: newVehicleName,
        coupon_code: couponCode,
        refund_amount: refundAmount
      })
    }).then(async (response) => {
      if (response.ok) {
        const invoiceData = await response.arrayBuffer();
        console.log('✅ [DOWNGRADE COUPON] Invoice PDF generated successfully');
        return Buffer.from(invoiceData);
      } else {
        console.warn('⚠️ [DOWNGRADE COUPON] Failed to generate invoice PDF, continuing without attachment');
        return null;
      }
    }).catch((error) => {
      console.warn('⚠️ [DOWNGRADE COUPON] Error generating invoice PDF:', error);
      return null;
    });

    // Prepare email data (this runs in parallel with PDF generation)
    const emailData = {
      booking: {
        id: bookingId,
        wp_id: booking.wp_id,
        customer_name: booking.customer_name || '',
        customer_email: booking.customer_email || '',
        service_name: booking.service_name || '',
        vehicle_make: 'N/A',
        vehicle_model: 'N/A',
        vehicle_capacity: 0,
        pickup_location: 'N/A',
        dropoff_location: 'N/A',
        date: new Date().toISOString().split('T')[0],
        time: 'N/A',
        duration: 0,
        price_amount: 0,
        price_currency: 'JPY',
        payment_status: 'pending',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      emailType: 'vehicle-downgrade-coupon',
      templateVariables: {
        booking_id: booking.wp_id,
        customer_name: booking.customer_name,
        previous_vehicle_name: `${previousVehicleName}${previousVehicleDetails}`,
        new_vehicle_name: `${newVehicleName}${newVehicleDetails}`,
        refund_amount: refundAmount,
        coupon_code: couponCode,
        currency: 'JPY',
        language: 'en', // Default to English, can be made dynamic later
        primary_color: '#059669'
      },
      language: 'en' as const,
      bccEmails: bccEmail || 'admin.rixou@gmail.com'
    };

    // Wait for PDF generation to complete, then send single email with attachment
    try {
      const invoiceBuffer = await pdfPromise;
      
      // Send single email with PDF attachment (if available)
      const result = await EmailAPIWrapper.sendBookingEmail({
        ...emailData,
        attachments: invoiceBuffer ? [
          {
            filename: `invoice-${booking.wp_id}-downgrade.pdf`,
            content: invoiceBuffer.toString('base64')
          }
        ] : undefined
      });

      if (result.success) {
        console.log('✅ [DOWNGRADE COUPON] Email sent successfully using unified system', 
          invoiceBuffer ? 'with PDF attachment' : 'without PDF attachment');
      } else {
        console.error('❌ [DOWNGRADE COUPON] Email failed:', result.error);
        return NextResponse.json(
          { error: 'Failed to send coupon email' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('❌ [DOWNGRADE COUPON] Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send coupon email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Downgrade coupon sent successfully',
      couponCode,
      refundAmount
    });

  } catch (error) {
    console.error('Error sending downgrade coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
