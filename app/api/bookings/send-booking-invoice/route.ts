import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { sendBookingPaymentEmail } from '@/lib/email/send-booking-payment-email'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, bccEmails } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        ),
        vehicles (
          id,
          make,
          model,
          year,
          capacity
        ),
        drivers (
          id,
          name,
          phone
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Calculate pricing for email
    const baseAmount = booking.base_amount || 0
    const discountPercentage = booking.discount_percentage || 0
    const taxPercentage = booking.tax_percentage || 10
    const couponCode = booking.coupon_code || ''

    // Calculate regular discount
    const regularDiscount = baseAmount * (discountPercentage / 100)

    // Calculate coupon discount
    let couponDiscount = 0
    let couponDiscountPercentage = 0
    if (couponCode) {
      // First try to use stored coupon discount percentage
      if (booking.coupon_discount_percentage) {
        couponDiscountPercentage = booking.coupon_discount_percentage
        couponDiscount = baseAmount * (booking.coupon_discount_percentage / 100)
      } else {
        // Fallback to calculating from coupon code
        try {
          const { data: couponData } = await supabase
            .from('pricing_promotions')
            .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
            .eq('code', couponCode)
            .eq('is_active', true)
            .single()

          if (couponData) {
            const now = new Date()
            const validFrom = couponData.start_date ? new Date(couponData.start_date) : null
            const validUntil = couponData.end_date ? new Date(couponData.end_date) : null

            if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
              if (!couponData.minimum_amount || baseAmount >= couponData.minimum_amount) {
                if (couponData.discount_type === 'percentage') {
                  couponDiscountPercentage = couponData.discount_value
                  couponDiscount = baseAmount * (couponData.discount_value / 100)
                  if (couponData.maximum_discount && couponDiscount > couponData.maximum_discount) {
                    couponDiscount = couponData.maximum_discount
                  }
                } else {
                  couponDiscount = Math.min(couponData.discount_value, baseAmount)
                  couponDiscountPercentage = (couponDiscount / baseAmount) * 100
                }
              }
            }
          }
        } catch (error) {
          console.error('Error validating coupon:', error)
        }
      }
    }

    // Total discount
    const totalDiscount = regularDiscount + couponDiscount

    // Subtotal after discounts
    const subtotal = Math.max(0, baseAmount - totalDiscount)

    // Calculate tax
    const tax = subtotal * (taxPercentage / 100)

    // Final total
    const total = subtotal + tax

    // Prepare email data
    const emailPricing = {
      baseAmount,
      regularDiscount,
      couponDiscount,
      couponDiscountPercentage,
      subtotal,
      tax,
      total,
      discountPercentage,
      taxPercentage
    }

    // Determine payment status for invoice
    const isPaid = booking.status === 'confirmed' || booking.payment_status === 'paid'
    const paymentStatus = isPaid ? 'PAID' : 'PENDING PAYMENT'

    // Send the invoice email
    await sendBookingPaymentEmail({
      to: booking.customers?.email || booking.customer_email || '',
      customerName: booking.customers?.name || booking.customer_name || 'Customer',
      bookingId: booking.id,
      serviceName: booking.service_name || booking.service_type || 'Service',
      pickupLocation: booking.pickup_location || '',
      dropoffLocation: booking.dropoff_location || '',
      date: booking.date || '',
      time: booking.time || '',
      amount: total,
      currency: booking.price_currency || 'JPY',
      paymentLink: booking.payment_link || '',
      bccEmails: bccEmails || 'booking@japandriver.com',
      // Pricing breakdown
      baseAmount: emailPricing.baseAmount,
      regularDiscountAmount: emailPricing.regularDiscount,
      couponDiscountAmount: emailPricing.couponDiscount,
      taxAmount: emailPricing.tax,
      totalAmount: emailPricing.total,
      discountPercentage: emailPricing.discountPercentage,
      taxPercentage: emailPricing.taxPercentage,
      couponCode: booking.coupon_code || '',
      couponDiscountPercentage: emailPricing.couponDiscountPercentage,
      // Service duration details
      duration_hours: booking.duration_hours || null,
      service_days: booking.service_days || null,
      hours_per_day: booking.hours_per_day || null,
      // Team location
      teamLocation: booking.team_location || 'thailand',
      // Payment status
      paymentStatus
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      paymentStatus 
    })

  } catch (error) {
    console.error('Error sending booking invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
