import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from '@/lib/supabase/service-client';
import { OmiseClient } from "@/lib/omise-client";
import { sendBookingPaymentEmail } from '@/lib/email/send-booking-payment-email';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [REGENERATE-PAYMENT-LINK] Starting payment link regeneration...');
    
    const { 
      bookingId, 
      bccEmails = [],
      customer_email 
    } = await req.json();
    
    console.log('📝 [REGENERATE-PAYMENT-LINK] Request data:', { bookingId, bccEmails, customer_email });

    if (!bookingId) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Missing booking ID');
      return NextResponse.json(
        { error: "Missing required field: bookingId is required" },
        { status: 400 }
      );
    }

    // Get booking data from database
    const supabase = createServiceClient();
    console.log('✅ [REGENERATE-PAYMENT-LINK] Supabase client created successfully');
    
    // Check if this looks like a WordPress ID (starts with letters and contains hyphens)
    const isWordPressId = /^[A-Z]+-\d+/.test(bookingId);
    const searchField = isWordPressId ? 'wp_id' : 'id';
    
    console.log(`🔍 [REGENERATE-PAYMENT-LINK] ID format detected: ${isWordPressId ? 'WordPress ID' : 'UUID'}`);
    console.log(`🔍 [REGENERATE-PAYMENT-LINK] Searching by field: ${searchField}`);
    
    let { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq(searchField, bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Database error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to fetch booking data' },
        { status: 500 }
      );
    }

    if (!bookingData) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Booking not found:', bookingId);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('✅ [REGENERATE-PAYMENT-LINK] Booking found:', bookingData.wp_id || bookingData.id);

    // Extract customer information
    let customerEmail = customer_email || bookingData.customer_email;
    let customerName = bookingData.customer_name;
    
    if (bookingData.customers && Array.isArray(bookingData.customers) && bookingData.customers.length > 0) {
      const customer = bookingData.customers[0];
      customerEmail = customerEmail || customer.email;
      customerName = customerName || customer.name;
    }
    
    customerEmail = customerEmail || 'customer@example.com';
    customerName = customerName || 'Customer';
    
    if (!customerEmail) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] No customer email found');
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Initialize Omise client
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true';
    const omiseClient = new OmiseClient({
      publicKey: isTestMode 
        ? (process.env.OMISE_TEST_PUBLIC_KEY || process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea')
        : (process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea'),
      secretKey: isTestMode 
        ? (process.env.OMISE_TEST_SECRET_KEY || process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2')
        : (process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2'),
      baseUrl: process.env.OMISE_API_URL || 'https://api.omise.co'
    });
    
    console.log(`[REGENERATE-PAYMENT-LINK] Using ${isTestMode ? 'TEST' : 'PRODUCTION'} credentials`);

    // Use booking amount
    const amount = bookingData.price_amount || (bookingData as any).base_amount || 0;
    const currency = 'JPY';

    // Validate amount
    if (amount <= 0) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Invalid amount calculated:', { amount, bookingData });
      return NextResponse.json(
        { error: 'Invalid amount calculated. Please check booking pricing.' },
        { status: 400 }
      );
    }

    // Create payment link data
    const serviceDescription = bookingData.service_name || 'Transportation Service';
    const bookingNumber = bookingData.wp_id || bookingData.id;
    
    const defaultDescription = `${customerName} - ${serviceDescription} - Booking ${bookingNumber}`;
    
    const paymentLinkData = {
      amount: amount,
      currency: currency,
      description: defaultDescription,
      reference: `BOOK-${bookingNumber}`,
      customerEmail: customerEmail,
      customerName: customerName,
      expiryHours: 48, // 48 hours expiry
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'}/bookings/${bookingData.id}`
    };

    console.log('💳 [REGENERATE-PAYMENT-LINK] Payment link data:', paymentLinkData);

    // Generate payment link
    const result = await omiseClient.createPaymentLink(paymentLinkData);

    if (result.error) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error creating payment link:', result.error);
      return NextResponse.json(
        { error: result.message || 'Failed to generate payment link' },
        { status: 400 }
      );
    }

    console.log('✅ [REGENERATE-PAYMENT-LINK] Payment link created successfully:', result.paymentUrl);

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_link: result.paymentUrl,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
      })
      .eq('id', bookingData.id);

    if (updateError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Failed to update booking with payment link:', updateError);
      // Don't fail the request, just log the error
    } else {
      console.log('✅ [REGENERATE-PAYMENT-LINK] Booking updated with new payment link');
    }

    // Generate PDF invoice
    let pdfBuffer: Buffer | undefined;
    try {
      console.log('📄 [REGENERATE-PAYMENT-LINK] Generating PDF invoice...');
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const pdfResponse = await fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingData.id,
          language: 'en' // Default to English for payment links
        })
      });

      if (pdfResponse.ok) {
        pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        console.log('✅ [REGENERATE-PAYMENT-LINK] PDF invoice generated successfully, size:', pdfBuffer.length, 'bytes');
      } else {
        const errorText = await pdfResponse.text();
        console.error('❌ [REGENERATE-PAYMENT-LINK] Failed to generate PDF invoice:', pdfResponse.status, errorText);
      }
    } catch (pdfError) {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error generating PDF invoice:', pdfError);
    }

    // Send email with PDF attachment
    console.log('📤 [REGENERATE-PAYMENT-LINK] Sending email with PDF attachment...');
    console.log('📄 [REGENERATE-PAYMENT-LINK] PDF buffer status:', pdfBuffer ? `Present (${pdfBuffer.length} bytes)` : 'Not generated');
    
    const emailResult = await sendBookingPaymentEmail({
      to: customerEmail,
      customerName: customerName,
      bookingId: bookingNumber,
      serviceName: serviceDescription,
      pickupLocation: bookingData.pickup_location || '',
      dropoffLocation: bookingData.dropoff_location || '',
      date: bookingData.date,
      time: bookingData.time,
      amount: amount,
      currency: currency,
      paymentLink: result.paymentUrl || '',
      language: 'en',
      pdfAttachment: pdfBuffer,
      bccEmails: bccEmails.join(','),
      // Pricing breakdown
      baseAmount: (bookingData as any).base_amount || amount,
      discountAmount: (bookingData as any).discount_amount || 0,
      regularDiscountAmount: (bookingData as any).regular_discount_amount || 0,
      couponDiscountAmount: (bookingData as any).coupon_discount_amount || 0,
      taxAmount: (bookingData as any).tax_amount || 0,
      totalAmount: amount,
      discountPercentage: bookingData.discount_percentage || 0,
      taxPercentage: bookingData.tax_percentage || 10,
      couponCode: bookingData.coupon_code || '',
      couponDiscountPercentage: bookingData.coupon_discount_percentage || 0,
      // Service duration details
      duration_hours: bookingData.duration_hours || 0,
      service_days: bookingData.service_days || 0,
      hours_per_day: bookingData.hours_per_day || 0,
      // Team location
      teamLocation: (bookingData.team_location as 'thailand' | 'japan') || 'thailand',
      // Payment status
      paymentStatus: 'PENDING PAYMENT'
    });

    if (emailResult.success) {
      console.log('✅ [REGENERATE-PAYMENT-LINK] Email sent successfully:', emailResult.messageId);
    } else {
      console.error('❌ [REGENERATE-PAYMENT-LINK] Error sending email:', emailResult.error);
    }

    console.log('🎉 [REGENERATE-PAYMENT-LINK] Process completed successfully');

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      chargeId: result.chargeId,
      amount: amount,
      currency: currency,
      expiresAt: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString(),
      emailId: emailResult.messageId
    });

  } catch (error) {
    console.error('💥 [REGENERATE-PAYMENT-LINK] Unexpected error:', error);
    console.error('💥 [REGENERATE-PAYMENT-LINK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to regenerate payment link' },
      { status: 500 }
    );
  }
}
