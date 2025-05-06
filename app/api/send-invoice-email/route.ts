import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service-client'
import { mapSupabaseBookingToBooking } from '@/lib/api/bookings-service'

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
  // Create a formdata object
  const formData = await request.formData()
  
  // Get email address and booking_id from the form data
  const email = formData.get('email') as string
  const bookingId = formData.get('booking_id') as string
  const includeDetails = formData.get('include_details') === 'true'
  const language = (formData.get('language') as string) || 'en' // Default to English if not specified
  
  // Get the PDF file from the form data
  const pdfFile = formData.get('invoice_pdf') as File
  
  if (!email || !pdfFile) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  // Use only supported languages, default to English for unsupported ones
  const lang = language === 'ja' ? 'ja' : 'en'
  const t = translations[lang]
  
  try {
    // Get the real booking data from the database
    const supabase = createServiceClient()
    
    // First try to find by internal UUID
    let { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()
    
    // If not found, try to find by WordPress ID
    if (!bookingData) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', bookingId)
        .maybeSingle()
      
      bookingData = data
    }
    
    if (!bookingData) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
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
    const priceBreakdownText = hasDiscount ? 
      `${t.originalPrice}: ${formattedOriginalPrice}
${t.couponCode}: ${booking.coupon_code}
${t.discount.replace('{discount}', booking.coupon_discount_percentage || '0')}: -${formattedDiscountAmount}
${t.totalAmount}: ${formattedAmount}` : 
      `${formattedAmount}`
    
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
    
    // Send the email using Resend API
    const { data, error } = await resend.emails.send({
      from: `Driver Japan <booking@${emailDomain}>`,
      to: [email],
      subject: `${t.subject} - #${bookingId}`,
      text: emailText,
      html: `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t.subject}</title>
  <style>
    body, table, td, a {
      -webkit-text-size-adjust:100%;
      -ms-text-size-adjust:100%;
      font-family: Work Sans, sans-serif;
    }
    table, td { mso-table-lspace:0; mso-table-rspace:0; }
    img {
      border:0;
      line-height:100%;
      outline:none;
      text-decoration:none;
      -ms-interpolation-mode:bicubic;
    }
    table { border-collapse:collapse!important; }
    body {
      margin:0;
      padding:0;
      width:100%!important;
      background:#F2F4F6;
    }
    .greeting {
      color:#32325D;
      margin:24px 24px 16px;
      line-height:1.4;
    }
    @media only screen and (max-width:600px) {
      .container { width:100%!important; }
      .stack { display:block!important; width:100%!important; text-align:center!important; }
      .timeline { padding-left:0!important; }
    }
  </style>
</head>
<body style="background:#F2F4F6; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#FFFFFF; border-radius:8px; overflow:hidden;">
          
          <!-- HEADER with white-circle badge -->
          <tr>
            <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
              <table width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding:24px;">
                    <!-- white circular badge -->
                    <table cellpadding="0" cellspacing="0" style="
                      background:#FFFFFF;
                      border-radius:50%;
                      width:64px;
                      height:64px;
                      margin:0 auto 12px;
                    ">
                      <tr>
                        <td align="center" valign="middle" style="text-align:center;">
                          <img src="${logoUrl}" width="48" height="48" alt="Japan Driver logo" style="display:block; margin:0 auto;">
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">${t.subject}</h1>
                    <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                      ${lang === 'ja' ? '領収書番号' : 'Receipt'} #${bookingId}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- GREETING -->
          <tr>
            <td>
              <p class="greeting">
                ${t.greeting} ${customerName},<br><br>
                ${t.thankYou}
              </p>
            </td>
          </tr>
          
          <!-- DETAIL BLOCK -->
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#F8FAFC; border-radius:8px;">
                <tr>
                  <td style="width:30%; padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${t.serviceType}</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${serviceType}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${t.vehicle}</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${vehicleInfo}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${t.pickupDate}</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${bookingDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${t.pickupTime}</span>
                  </td>
                  <td style="padding:16px 0;">
                    <span style="font-size:14px; color:#32325D;">${pickupTimeFormatted}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- ROUTE TIMELINE -->
          <tr>
            <td style="padding:0 24px 24px; color:#32325D;">
              <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif;">${t.route}</h3>
              <table width="100%" role="presentation">
                <tr>
                  <td class="timeline" width="24" valign="top" style="padding-right:12px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr><td width="8" height="8" style="background:#E03E2D; border-radius:4px;"></td></tr>
                      <tr><td width="2" height="32" style="background:#D9E2EC;"></td></tr>
                      <tr><td width="8" height="8" style="background:#32325D; border-radius:4px;"></td></tr>
                    </table>
                  </td>
                  <td valign="top" style="font-size:14px; line-height:1.4; font-family: Work Sans, sans-serif;">
                    <p style="margin:0 0 8px;"><strong>${t.pickup}:</strong> ${booking.pickup_location || (lang === 'ja' ? '記載なし' : 'N/A')}<br>
                      <small style="color:#8898AA;">${booking.time || (lang === 'ja' ? '時間の記載なし' : 'N/A')}</small></p>
                    <p style="margin:0;"><strong>${t.dropoff}:</strong> ${booking.dropoff_location || (lang === 'ja' ? '記載なし' : 'N/A')}<br>
                      <small style="color:#8898AA;">${booking.duration ? `${t.estimatedDuration}: ${booking.duration} ${t.minutes}` : (lang === 'ja' ? '所要時間の記載なし' : 'N/A')}</small></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- PAYMENT SUMMARY CARD -->
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#F8FAFC; border-radius:8px;">
                ${hasDiscount ? `
                <tr>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    ${t.originalPrice}
                  </td>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#32325D; text-align:right; font-family: Work Sans, sans-serif;">
                    ${formattedOriginalPrice}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    ${t.couponCode}
                  </td>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#32325D; text-align:right; font-family: Work Sans, sans-serif;">
                    ${booking.coupon_code}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    ${t.discount.replace('{discount}', booking.coupon_discount_percentage || '0')}
                  </td>
                  <td style="padding:16px 16px 8px 16px; font-size:14px; color:#32325D; text-align:right; font-family: Work Sans, sans-serif;">
                    -${formattedDiscountAmount}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    ${t.totalAmount}
                  </td>
                  <td style="padding:16px; font-size:16px; color:#32325D; font-weight:bold; text-align:right; font-family: Work Sans, sans-serif;">
                    ${formattedAmount}
                  </td>
                </tr>
                ` : `
                <tr>
                  <td style="padding:16px; font-size:14px; color:#8898AA; text-transform:uppercase; font-family: Work Sans, sans-serif;">
                    ${t.paymentSummary}
                  </td>
                  <td style="padding:16px; font-size:16px; color:#32325D; font-weight:bold; text-align:right; font-family: Work Sans, sans-serif;">
                    ${formattedAmount}
                  </td>
                </tr>
                `}
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <a href="${paymentLink}"
                 style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                        text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                        font-size:16px; font-weight:600;">
                ${t.viewBookingDetails}
              </a>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
              <p style="margin:0 0 8px;">
                ${t.questions}<br>
                <a href="mailto:booking@japandriver.com" style="color:#E03E2D; text-decoration:none;">
                  booking@japandriver.com
                </a>
              </p>
              <p style="margin:0 0 4px;">${t.company}</p>
              <p style="margin:0;">
                <a href="https://japandriver.com" style="color:#E03E2D; text-decoration:none;">
                  japandriver.com
                </a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      attachments: [
        {
          filename: `invoice-${bookingId}.pdf`,
          content: buffer.toString('base64')
        }
      ]
    })
    
    if (error) {
      console.error('❌ [SEND-INVOICE-EMAIL] Resend API error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
    
    console.log(`✅ [SEND-INVOICE-EMAIL] Email sent successfully to ${email} with invoice #${bookingId}`);
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [SEND-INVOICE-EMAIL] Error sending email:', error);
    if (error instanceof Error && error.stack) {
      console.error('❌ [SEND-INVOICE-EMAIL] Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
} 