import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { OmiseClient } from "@/lib/omise-client";
import { EmailAPIWrapper } from "@/lib/services/email-api-wrapper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, description, bccEmail, operationId } = await request.json();
    const { id: bookingId } = await params;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
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
        vehicle_id,
        team_location
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
    console.log('Looking for operation ID:', operationId);
    const { data: assignmentOperation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .select('previous_vehicle_id, new_vehicle_id')
      .eq('id', operationId)
      .single();

    console.log('Operation query result:', { assignmentOperation, operationError });

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
    let previousPrice = 0;
    let newPrice = 0;

    if (assignmentOperation.previous_vehicle_id) {
      const { data: previousVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', assignmentOperation.previous_vehicle_id)
        .single();
      previousVehicleName = previousVehicle?.name || 'N/A';
      // Since we don't have base_price in vehicles table, we'll use a default or calculate from upgrade amount
      previousPrice = 0; // Will be calculated based on upgrade amount
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
      // Calculate new price as previous price + upgrade amount
      newPrice = previousPrice + amount;
      if (newVehicle?.brand && newVehicle?.model) {
        newVehicleDetails = ` (${newVehicle.brand} ${newVehicle.model})`;
      }
    }

    // Initialize Omise client
    const omiseClient = new OmiseClient(
      process.env.OMISE_PUBLIC_KEY || '',
      process.env.OMISE_SECRET_KEY || ''
    );

    // Create payment link for upgrade
    const paymentLinkData = {
      amount: amount, // Keep as JPY amount, don't multiply by 100
      currency: 'jpy',
      description: `Vehicle upgrade from ${previousVehicleName} to ${newVehicleName}`,
      reference: `upgrade-${booking.wp_id}`,
      customerEmail: booking.customer_email || '',
      customerName: booking.customer_name || '',
      returnUrl: process.env.OMISE_RETURN_URL || 'https://driver-companion.vercel.app/quotations/[QUOTATION_ID]'
    };

    console.log('Creating payment link with data:', paymentLinkData);

    const paymentLink = await omiseClient.createPaymentLink(paymentLinkData);

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        meta: {
          upgrade_payment_link: paymentLink.chargeId,
          upgrade_payment_amount: amount,
          upgrade_payment_generated_at: new Date().toISOString()
        }
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment link:', updateError);
    }

    // Generate invoice PDF and prepare email data in parallel for better performance
    const baseUrl = request.nextUrl.origin;
    
    // Start PDF generation in background while preparing email data
    const pdfPromise = fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        operation_type: 'upgrade',
        previous_vehicle_name: previousVehicleName,
        new_vehicle_name: newVehicleName,
        payment_amount: amount
      })
    }).then(async (response) => {
      if (response.ok) {
        const invoiceData = await response.arrayBuffer();
        console.log('✅ [UPGRADE PAYMENT] Invoice PDF generated successfully');
        return Buffer.from(invoiceData);
      } else {
        console.warn('⚠️ [UPGRADE PAYMENT] Failed to generate invoice PDF, continuing without attachment');
        return null;
      }
    }).catch((error) => {
      console.warn('⚠️ [UPGRADE PAYMENT] Error generating invoice PDF:', error);
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
      emailType: 'vehicle-upgrade-payment',
      templateVariables: {
        // Basic booking info
        booking_id: booking.wp_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email || '',
        
        // Vehicle upgrade details
        previous_vehicle_name: `${previousVehicleName}${previousVehicleDetails}`,
        new_vehicle_name: `${newVehicleName}${newVehicleDetails}`,
        previous_price: previousPrice,
        new_price: newPrice,
        
        // Payment details
        payment_amount: amount,
        payment_link: paymentLink.paymentUrl,
        currency: 'JPY',
        
        // Approval details
        approval_date: new Date().toLocaleDateString('en-US'),
        
        // Upgrade notes
        upgrade_notes: `Vehicle upgrade from ${previousVehicleName} to ${newVehicleName}`,
        
        // Email header structure (like other emails)
        subtitle: booking.team_location === 'thailand' ? 'Driver Thailand' : 'Driver Japan',
        email_title: 'Vehicle Upgrade Payment Required',
        
        // Localization
        language: 'en', // Default to English, can be made dynamic later
        primary_color: '#E03E2D'
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
            filename: `invoice-${booking.wp_id}-upgrade.pdf`,
            content: invoiceBuffer.toString('base64')
          }
        ] : undefined
      });

      if (result.success) {
        console.log('✅ [UPGRADE PAYMENT] Email sent successfully using unified system', 
          invoiceBuffer ? 'with PDF attachment' : 'without PDF attachment');
      } else {
        console.error('❌ [UPGRADE PAYMENT] Email failed:', result.error);
      }
    } catch (emailError) {
      console.error('❌ [UPGRADE PAYMENT] Error sending email:', emailError);
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.chargeId, // Use chargeId from Omise client
      paymentUrl: paymentLink.paymentUrl, // Use the full URL from Omise client
      amount: amount,
      currency: 'JPY'
    });

  } catch (error) {
    console.error('Error generating upgrade payment link:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}
