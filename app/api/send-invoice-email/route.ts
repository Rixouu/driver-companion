import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service-client'
import { mapSupabaseBookingToBooking } from '@/lib/api/bookings-service'
import { handleApiError } from '@/lib/errors/error-handler'
import { ValidationError, NotFoundError, DatabaseError, ExternalServiceError, AppError } from '@/lib/errors/app-error'

// Email translations for different languages
const translations = {
  en: {
    subject: 'Receipt from Japan Driver',
    greeting: 'Hello',
    thankYou: 'Thank you for choosing Japan Driver. Please find your receipt details below. We\'ve attached a detailed invoice to this email for your records.',
    serviceType: 'SERVICE TYPE',
    vehicle: 'VEHICLE',
    pickupDate: 'PICKUP DATE',
    pickupTime: 'PICKUP TIME',
    route: 'ROUTE',
    pickup: 'Pickup',
    dropoff: 'Drop-off',
    estimatedDuration: 'Estimated duration',
    minutes: 'minutes',
    paymentSummary: 'Payment Summary',
    originalPrice: 'Original Price',
    discount: 'Discount ({discount}%)',
    couponCode: 'Coupon Code',
    totalAmount: 'Total Amount',
    viewBookingDetails: 'Pay Now',
    questions: 'If you have any questions about this receipt, please contact us at',
    company: 'Japan Driver Co., Ltd.',
    emailText: `Receipt from Japan Driver
Receipt #{bookingId}

AMOUNT PAID: {formattedAmount}
DATE PAID: {formattedDate}

Thank you for your business! Your invoice is attached.

SERVICE TYPE: {serviceType}
VEHICLE: {vehicleInfo}
PICKUP DATE: {bookingDate}
PICKUP TIME: {pickupTimeFormatted}

ROUTE:
Pickup: {pickupLocation}
Drop-off: {dropoffLocation}

PAYMENT SUMMARY:
{priceBreakdown}

If you have any questions about this receipt, please contact us at booking@japandriver.com.

Japan Driver Co., Ltd.
japandriver.com`
  },
  ja: {
    subject: 'ジャパンドライバーからの領収書',
    greeting: 'こんにちは',
    thankYou: 'ジャパンドライバーをご利用いただきありがとうございます。以下に領収書の詳細がございます。詳細な請求書をこのメールに添付しております。',
    serviceType: 'サービスタイプ',
    vehicle: '車両',
    pickupDate: '送迎日',
    pickupTime: '送迎時間',
    route: '経路',
    pickup: '出発地',
    dropoff: '目的地',
    estimatedDuration: '予想所要時間',
    minutes: '分',
    paymentSummary: '支払い概要',
    originalPrice: '元の料金',
    discount: '割引 ({discount}%)',
    couponCode: 'クーポンコード',
    totalAmount: '合計金額',
    viewBookingDetails: '今すぐ支払う',
    questions: 'この領収書に関するご質問は、以下までお問い合わせください',
    company: 'ジャパンドライバー株式会社',
    emailText: `ジャパンドライバーからの領収書
領収書番号：{bookingId}

お支払い金額：{formattedAmount}
支払日：{formattedDate}

ご利用いただきありがとうございます。請求書を添付しております。

サービスタイプ：{serviceType}
車両：{vehicleInfo}
送迎日：{bookingDate}
送迎時間：{pickupTimeFormatted}

経路：
出発地：{pickupLocation}
目的地：{dropoffLocation}

支払い概要：
{priceBreakdown}

この領収書に関するご質問は booking@japandriver.com までお問い合わせください。

ジャパンドライバー株式会社
japandriver.com`
  }
}

export async function POST(request: Request) {
  try {
    // Create a formdata object
    const formData = await request.formData()
    
    // Get email address and booking_id from the form data
    const email = formData.get('email') as string
    const bookingId = formData.get('booking_id') as string
    const includeDetails = formData.get('include_details') === 'true'
    const language = (formData.get('language') as string) || 'en' // Default to English if not specified
    
    // Get the PDF file from the form data
    const pdfFile = formData.get('invoice_pdf') as File
    
    if (!email || !pdfFile || !bookingId) {
      throw new ValidationError('Missing required fields: email, booking_id, and invoice_pdf are required.')
    }
    
    // Use only supported languages, default to English for unsupported ones
    const lang = language === 'ja' ? 'ja' : 'en'
    const t = translations[lang]
    
    // Get the real booking data from the database
    const supabase = createServiceClient()
    
    // First try to find by internal UUID
    let { data: bookingData, error: initialFetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()
    
    if (initialFetchError) {
      throw new DatabaseError('Error fetching booking by internal ID.', { cause: initialFetchError })
    }
    
    // If not found, try to find by WordPress ID
    if (!bookingData) {
      const { data, error: wpIdError } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', bookingId)
        .maybeSingle()
      
      if (wpIdError) {
        throw new DatabaseError('Error fetching booking by WordPress ID.', { cause: wpIdError })
      }
      bookingData = data
    }
    
    if (!bookingData) {
      throw new NotFoundError(`Booking with ID or WordPress ID '${bookingId}' not found.`)
    }
    
    // Map to Booking type to use in the email
    const booking = mapSupabaseBookingToBooking(bookingData)
    
    // Convert the file to a buffer for attachment
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Log PDF file size for debugging
    const pdfSizeMB = buffer.length / (1024 * 1024);
    console.log(`📄 [SEND-INVOICE-EMAIL] PDF size: ${pdfSizeMB.toFixed(2)}MB`);
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    if (!process.env.RESEND_API_KEY) {
      throw new AppError("Email service (Resend) is not configured. Missing API key.", 500, false);
    }
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com'
    
    // Get the public URL for the Driver logo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`
    
    // Format price with currency
    const formattedAmount = booking.price?.formatted || 
      new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
        style: 'currency',
        currency: booking.price?.currency || 'JPY'
      }).format(booking.price?.amount || 0)
    
    // Calculate original price and discount if coupon is present
    const hasDiscount = booking.coupon_code && booking.coupon_discount_percentage
    let originalPrice = booking.price?.amount || 0
    let discountAmount = 0
    let formattedOriginalPrice = formattedAmount
    let formattedDiscountAmount = ''

    // Calculate time-based adjustments if available
    const timeBasedAdjustment = (booking as any).time_based_adjustment || 0;
    const timeBasedAdjustmentAmount = timeBasedAdjustment !== 0 ? (originalPrice * timeBasedAdjustment / 100) : 0;

    if (hasDiscount) {
      const discountPercentage = parseFloat(booking.coupon_discount_percentage as string)
      if (!isNaN(discountPercentage) && discountPercentage > 0) {
        // If we have a discount, calculate the original price (current price is after discount)
        originalPrice = Math.round(originalPrice / (1 - discountPercentage / 100))
        discountAmount = originalPrice - (booking.price?.amount || 0)

        // Format original price and discount amount
        formattedOriginalPrice = new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
          style: 'currency',
          currency: booking.price?.currency || 'JPY'
        }).format(originalPrice)

        formattedDiscountAmount = new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
          style: 'currency',
          currency: booking.price?.currency || 'JPY'
        }).format(discountAmount)
      }
    }
    
    // Format date for display in selected language
    const bookingDate = booking.date || new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    
    // Format current date in selected language
    const formattedDate = new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    
    // Get customer name with fallback
    const customerName = booking.customer_name || (lang === 'ja' ? 'お客様' : 'Customer')
    
    // Create localized time strings
    const pickupTimeFormatted = booking.time || '06:30 am'
    
    // Extract service info with fallbacks
    const serviceType = booking.service_name || (lang === 'ja' ? '送迎サービス' : 'Transportation Service')
    const vehicleInfo = booking.vehicle ? 
      `${booking.vehicle.make || ''} ${booking.vehicle.model || ''}`.trim() : 
      (lang === 'ja' ? 'トヨタ ハイエース グランドキャビン' : 'Toyota Hiace Grand Cabin')
    
    // Payment link - using booking ID to construct the URL
    const paymentLink = booking.payment_link || `${appUrl}/bookings/${bookingId}/payment`
    
    // Create the email text with placeholders replaced
    const priceBreakdownText = (() => {
      let breakdown = [];
      
      if (originalPrice > 0) {
        breakdown.push(`${t.originalPrice}: ${formattedOriginalPrice}`);
      }
      
      if (timeBasedAdjustmentAmount !== 0) {
        const formattedTimeAdjustment = new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
          style: 'currency',
          currency: booking.price?.currency || 'JPY'
        }).format(Math.abs(timeBasedAdjustmentAmount));
        
        breakdown.push(`${lang === 'ja' ? '時間帯調整' : 'Time-based adjustment'}: ${timeBasedAdjustment > 0 ? '+' : '-'}${formattedTimeAdjustment}`);
      }
      
      if (hasDiscount) {
        breakdown.push(`${t.couponCode}: ${booking.coupon_code}`);
        breakdown.push(`${t.discount.replace('{discount}', booking.coupon_discount_percentage || '0')}: -${formattedDiscountAmount}`);
      }
      
      breakdown.push(`${t.totalAmount}: ${formattedAmount}`);
      
      return breakdown.join('\n');
    })();
    
    const emailText = t.emailText
      .replace('{bookingId}', bookingId)
      .replace(/{formattedAmount}/g, formattedAmount)
      .replace('{formattedDate}', formattedDate)
      .replace('{serviceType}', serviceType)
      .replace('{vehicleInfo}', vehicleInfo)
      .replace('{bookingDate}', bookingDate)
      .replace('{pickupTimeFormatted}', pickupTimeFormatted)
      .replace('{pickupLocation}', booking.pickup_location || (lang === 'ja' ? '記載なし' : 'N/A'))
      .replace('{dropoffLocation}', booking.dropoff_location || (lang === 'ja' ? '記載なし' : 'N/A'))
      .replace('{priceBreakdown}', priceBreakdownText)
    
    // HTML Email Content (ensure this part is correctly structured and populated)
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
    .container { background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; }
    .header img { max-width: 150px; }
    h1 { color: #333; font-size: 22px; margin-top: 0; }
    p { line-height: 1.6; }
    .details-section { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 4px; }
    .details-section strong { display: inline-block; width: 150px; color: #555; }
    .payment-summary { margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
    .button-container { text-align: center; margin-top: 30px; }
    .button { background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
    .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${t.company} Logo">
      <h1>${t.greeting} ${customerName},</h1>
    </div>
    <p>${t.thankYou}</p>
    
    ${includeDetails ? `
    <div class="details-section">
      <p><strong>${t.serviceType}:</strong> ${serviceType}</p>
      <p><strong>${t.vehicle}:</strong> ${vehicleInfo}</p>
      <p><strong>${t.pickupDate}:</strong> ${bookingDate}</p>
      <p><strong>${t.pickupTime}:</strong> ${pickupTimeFormatted}</p>
      <p><strong>${t.route}:</strong></p>
      <p style="margin-left: 20px;"><strong>${t.pickup}:</strong> ${booking.pickup_location || (lang === 'ja' ? '記載なし' : 'N/A')}</p>
      <p style="margin-left: 20px;"><strong>${t.dropoff}:</strong> ${booking.dropoff_location || (lang === 'ja' ? '記載なし' : 'N/A')}</p>
      ${booking.duration ? `<p><strong>${t.estimatedDuration}:</strong> ${booking.duration} ${t.minutes}</p>` : ''}
    </div>` : ''}

    <div class="payment-summary">
      <h2>${t.paymentSummary}</h2>
      ${originalPrice > 0 ? `<p><strong>${t.originalPrice}:</strong> ${formattedOriginalPrice}</p>` : ''}
      ${timeBasedAdjustmentAmount !== 0 ? `
        <p><strong>${lang === 'ja' ? '時間帯調整' : 'Time-based adjustment'}:</strong> ${timeBasedAdjustment > 0 ? '+' : ''}${new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
          style: 'currency',
          currency: booking.price?.currency || 'JPY'
        }).format(timeBasedAdjustmentAmount)}</p>
      ` : ''}
      ${hasDiscount ? `
        ${booking.coupon_code ? `<p><strong>${t.couponCode}:</strong> ${booking.coupon_code}</p>` : ''}
        <p><strong>${t.discount.replace('{discount}', booking.coupon_discount_percentage || '0')}:</strong> -${formattedDiscountAmount}</p>
      ` : ''}
      <p><strong>${t.totalAmount}:</strong> ${formattedAmount}</p>
    </div>

    <div class="button-container">
      <a href="${paymentLink}" class="button">${t.viewBookingDetails}</a>
    </div>

    <div class="footer">
      <p>${t.questions} <a href="mailto:booking@${emailDomain}">booking@${emailDomain}</a></p>
      <p>&copy; ${new Date().getFullYear()} ${t.company}</p>
    </div>
  </div>
</body>
</html>`;

    // Send the email using Resend
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: `Japan Driver <noreply@${emailDomain}>`,
      to: [email],
      subject: t.subject,
      html: emailHtml,
      text: emailText, // Plain text version
      attachments: [
        {
          filename: pdfFile.name || 'invoice.pdf',
          content: buffer
        }
      ]
    })

    if (resendError) {
      const errorMessage = resendError.message || 'Failed to send email via Resend.';
      const causeError = new Error(typeof resendError === 'string' ? resendError : resendError.message);
      if (typeof resendError === 'object' && resendError !== null && 'name' in resendError) {
        // Copying the name is good practice if it exists, e.g. for specific Resend error types
        causeError.name = (resendError as any).name;
      }
      // ExternalServiceError(message: string, statusCode: number = 502, options?: { cause?: Error, stack?: string })
      // The original resendError object will be part of the 'causeError's context or Sentry will pick it up when the ExternalServiceError is captured.
      const serviceError = new ExternalServiceError(errorMessage, 503, { cause: causeError });
      // Add the original Resend error object as a non-standard property for Sentry to potentially pick up more details.
      (serviceError as any).originalExternalError = resendError;
      throw serviceError;
    }

    console.log('[SEND-INVOICE-EMAIL] Email sent successfully:', emailData);
    return NextResponse.json({ success: true, data: { message: 'Email sent successfully', emailId: emailData?.id } });

  } catch (error: unknown) {
    return handleApiError(error, { apiRoute: '/api/send-invoice-email', method: 'POST' });
  }
} 