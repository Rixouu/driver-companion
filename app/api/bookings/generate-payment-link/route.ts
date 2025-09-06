import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OmiseClient } from "@/lib/omise-client";
import { sendBookingPaymentEmail } from "@/lib/email/send-booking-payment-email";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && !session?.user && !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      booking_id: bookingId, 
      bookingId: newBookingId,
      customer_email, 
      customer_name, 
      custom_payment_name: customPaymentName,
      language = 'en',
      amount: providedAmount,
      bcc_emails: bccEmails = 'booking@japandriver.com',
      bccEmails: newBccEmails
    } = await req.json();
    
    // Handle both old and new parameter formats
    const finalBookingId = newBookingId || bookingId;
    const finalBccEmails = newBccEmails || bccEmails;

    if (!finalBookingId) {
      return NextResponse.json(
        { error: "Missing required field: bookingId is required" },
        { status: 400 }
      );
    }

    // Get booking data from database
    const supabase = await getSupabaseServerClient();
    
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', finalBookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if payment link already exists
    if (!customPaymentName && (bookingData as any).payment_link) {
      return NextResponse.json({
        success: true,
        paymentUrl: (bookingData as any).payment_link,
        message: "Payment link already exists"
      });
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
    
    console.log(`[Booking Payment] Using ${isTestMode ? 'TEST' : 'PRODUCTION'} credentials`);

    // Use provided amount or fallback to booking data
    const amount = providedAmount || bookingData.price_amount || bookingData.amount || 0;
    const currency = 'JPY';

    // Validate amount
    if (amount <= 0) {
      console.error('Invalid amount calculated:', { amount, bookingData });
      return NextResponse.json(
        { error: 'Invalid amount calculated. Please check booking pricing.' },
        { status: 400 }
      );
    }

    // Create payment link data
    const customerName = customer_name || bookingData.customer_name || bookingData.customers?.name || 'Customer';
    const serviceDescription = bookingData.service_name || 'Transportation Service';
    const bookingNumber = bookingData.wp_id || bookingData.booking_number || bookingData.id;
    
    const defaultDescription = `${customerName} - ${serviceDescription} - Booking ${bookingNumber}`;
    
    const paymentLinkData = {
      amount: amount,
      currency: currency,
      description: customPaymentName || defaultDescription,
      reference: `BOOK-${bookingNumber}`,
      customerEmail: customer_email,
      customerName: customerName,
      expiryHours: 48, // 48 hours expiry
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'}/bookings/${bookingData.id}`
    };

    console.log('Booking payment link data:', paymentLinkData);

    // Generate payment link
    const result = await omiseClient.createPaymentLink(paymentLinkData);

    if (result.error) {
      return NextResponse.json(
        { error: result.message || 'Failed to generate payment link' },
        { status: 400 }
      );
    }

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        payment_link: result.paymentUrl,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
      } as any)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking with payment link:', updateError);
      // Don't fail the request, just log the error
    }

    // Generate PDF invoice
    let pdfBuffer: Buffer | undefined;
    try {
      const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bookings/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          language: language
        })
      });

      if (pdfResponse.ok) {
        pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        console.log('PDF generated successfully for booking:', bookingId);
      } else {
        console.warn('Failed to generate PDF for booking:', bookingId);
      }
    } catch (pdfError) {
      console.error('Error generating PDF for booking:', pdfError);
      // Continue without PDF attachment
    }

    // Calculate correct pricing for email
    let emailPricing = {
      baseAmount: bookingData.base_amount || bookingData.price_amount || amount,
      regularDiscountAmount: 0,
      couponDiscountAmount: 0,
      taxAmount: 0,
      totalAmount: amount,
      discountPercentage: bookingData.discount_percentage || 0,
      taxPercentage: bookingData.tax_percentage || 10,
      couponCode: bookingData.coupon_code || '',
      couponDiscountPercentage: 0
    };

    // If we don't have proper pricing data, calculate it directly from database
    if (!bookingData.base_amount && bookingData.service_name && bookingData.vehicle_id) {
      try {
        // First, get the service_type_id from the service name
        let serviceTypeId = bookingData.service_type_id;
        
        if (!serviceTypeId) {
          const { data: serviceTypes } = await supabase
            .from('service_types')
            .select('id')
            .ilike('name', `%${bookingData.service_name}%`)
            .limit(1);
          
          if (serviceTypes && serviceTypes.length > 0) {
            serviceTypeId = serviceTypes[0].id;
          }
        }
        
        if (serviceTypeId) {
          // Get vehicle category
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select(`
              pricing_category_vehicles (
                category_id
              )
            `)
            .eq('id', bookingData.vehicle_id)
            .single();
          
          const vehicleCategory = vehicleData?.pricing_category_vehicles?.[0]?.category_id;
          
          // Query pricing directly from database
          let pricingQuery = supabase
            .from('pricing_items')
            .select('price, currency')
            .eq('service_type_id', serviceTypeId)
            .eq('vehicle_id', bookingData.vehicle_id)
            .eq('duration_hours', bookingData.duration_hours || 1)
            .eq('is_active', true);
          
          if (vehicleCategory) {
            pricingQuery = pricingQuery.eq('category_id', vehicleCategory);
          }
          
          const { data: pricingItems, error: pricingError } = await pricingQuery;
          
          if (pricingError) {
            console.error('Pricing query error:', pricingError);
          } else if (pricingItems && pricingItems.length > 0) {
            const baseAmount = Number(pricingItems[0].price);
            const discountPercentage = bookingData.discount_percentage || 0;
            const taxPercentage = bookingData.tax_percentage || 10;
            const couponCode = bookingData.coupon_code || '';
            
            // Calculate regular discount
            const regularDiscountAmount = baseAmount * (discountPercentage / 100);
            
            // Calculate coupon discount if provided
            let couponDiscountAmount = 0;
            let couponDiscountPercentage = 0;
            if (couponCode) {
              const { data: couponData } = await supabase
                .from('pricing_promotions')
                .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
                .eq('code', couponCode)
                .eq('is_active', true)
                .single();
              
              if (couponData) {
                const now = new Date();
                const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
                const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;
                
                if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
                  if (!couponData.minimum_amount || baseAmount >= couponData.minimum_amount) {
                    if (couponData.discount_type === 'percentage') {
                      couponDiscountPercentage = couponData.discount_value;
                      couponDiscountAmount = baseAmount * (couponData.discount_value / 100);
                      if (couponData.maximum_discount && couponDiscountAmount > couponData.maximum_discount) {
                        couponDiscountAmount = couponData.maximum_discount;
                      }
                    } else {
                      couponDiscountAmount = Math.min(couponData.discount_value, baseAmount);
                      couponDiscountPercentage = (couponDiscountAmount / baseAmount) * 100;
                    }
                  }
                }
              }
            }
            
            const amountAfterDiscount = baseAmount - regularDiscountAmount - couponDiscountAmount;
            const taxAmount = amountAfterDiscount * (taxPercentage / 100);
            const totalAmount = amountAfterDiscount + taxAmount;
            
            emailPricing = {
              baseAmount,
              regularDiscountAmount,
              couponDiscountAmount,
              taxAmount,
              totalAmount,
              discountPercentage,
              taxPercentage,
              couponCode,
              couponDiscountPercentage
            };
          }
        }
      } catch (error) {
        console.error('Error calculating pricing for email:', error);
      }
      
      // If still no base amount, we need to get it from the database
      if (emailPricing.baseAmount === 0) {
        console.error('No pricing data found for booking:', bookingData.id);
        // Use the amount from the booking as fallback, but log the issue
        emailPricing.baseAmount = amount;
        console.warn('Using booking amount as fallback for pricing calculation');
      }
    } else if (bookingData.base_amount) {
      // Use stored pricing data - calculate coupon discount if coupon code exists
      let couponDiscountAmount = 0;
      let couponDiscountPercentage = 0;
      
      if (bookingData.coupon_code && bookingData.coupon_discount_percentage) {
        // Use stored coupon discount percentage
        couponDiscountAmount = bookingData.base_amount * (bookingData.coupon_discount_percentage / 100);
        couponDiscountPercentage = bookingData.coupon_discount_percentage;
      } else if (bookingData.coupon_code) {
        // Calculate coupon discount from coupon code
        try {
          const { data: couponData } = await supabase
            .from('pricing_promotions')
            .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
            .eq('code', bookingData.coupon_code)
            .eq('is_active', true)
            .single();
          
          if (couponData) {
            const now = new Date();
            const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
            const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;
            
            if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
              if (!couponData.minimum_amount || bookingData.base_amount >= couponData.minimum_amount) {
                if (couponData.discount_type === 'percentage') {
                  couponDiscountPercentage = couponData.discount_value;
                  couponDiscountAmount = bookingData.base_amount * (couponData.discount_value / 100);
                  if (couponData.maximum_discount && couponDiscountAmount > couponData.maximum_discount) {
                    couponDiscountAmount = couponData.maximum_discount;
                  }
                } else {
                  couponDiscountAmount = Math.min(couponData.discount_value, bookingData.base_amount);
                  couponDiscountPercentage = (couponDiscountAmount / bookingData.base_amount) * 100;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error calculating coupon discount from stored data:', error);
        }
      }
      
      const regularDiscountAmount = bookingData.discount_percentage ? bookingData.base_amount * (bookingData.discount_percentage / 100) : 0;
      const amountAfterDiscount = bookingData.base_amount - regularDiscountAmount - couponDiscountAmount;
      const taxAmount = bookingData.tax_percentage ? (amountAfterDiscount * (bookingData.tax_percentage / 100)) : 0;
      
      emailPricing = {
        baseAmount: bookingData.base_amount,
        regularDiscountAmount,
        couponDiscountAmount,
        taxAmount,
        totalAmount: amount,
        discountPercentage: bookingData.discount_percentage || 0,
        taxPercentage: bookingData.tax_percentage || 10,
        couponCode: bookingData.coupon_code || '',
        couponDiscountPercentage
      };
    }

    // Send payment link email
    try {
      const emailResult = await sendBookingPaymentEmail({
        to: customer_email,
        customerName: customerName,
        bookingId: bookingNumber,
        serviceName: serviceDescription,
        pickupLocation: bookingData.pickup_location,
        dropoffLocation: bookingData.dropoff_location,
        date: bookingData.date,
        time: bookingData.time,
        amount: amount,
        currency: currency,
        paymentLink: result.paymentUrl || '',
        language: language,
        pdfAttachment: pdfBuffer,
        bccEmails: finalBccEmails,
        // Use calculated pricing
        baseAmount: emailPricing.baseAmount,
        discountAmount: emailPricing.regularDiscountAmount + emailPricing.couponDiscountAmount,
        regularDiscountAmount: emailPricing.regularDiscountAmount,
        couponDiscountAmount: emailPricing.couponDiscountAmount,
        taxAmount: emailPricing.taxAmount,
        totalAmount: emailPricing.totalAmount,
        discountPercentage: emailPricing.discountPercentage,
        taxPercentage: emailPricing.taxPercentage,
        couponCode: emailPricing.couponCode,
        couponDiscountPercentage: emailPricing.couponDiscountPercentage,
        duration_hours: bookingData.duration_hours || 0,
        service_days: bookingData.service_days || 0,
        hours_per_day: bookingData.hours_per_day || 0,
        teamLocation: (bookingData.team_location as 'japan' | 'thailand') || 'thailand'
      });

      if (!emailResult.success) {
        console.error('Failed to send payment link email:', emailResult.error);
        // Don't fail the request, just log the error
      }
    } catch (emailError) {
      console.error('Error sending payment link email:', emailError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      chargeId: result.chargeId,
      amount: amount,
      currency: currency,
      expiresAt: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
    });

  } catch (error) {
    console.error('Error generating booking payment link:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}
