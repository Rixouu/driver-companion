import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateOptimizedPdfFromHtml } from "@/lib/optimized-html-pdf-generator";
import { getTeamAddressHtml, getTeamFooterHtml } from "@/lib/team-addresses";

async function generateBookingInvoiceHtml(
  booking: any, 
  language: 'en' | 'ja' = 'en'
): Promise<string> {
  const isJapanese = language === 'ja';
  const localeCode = isJapanese ? 'ja-JP' : 'en-US';
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Safe text encoding function
  const safeEncodeText = (text: any) => {
    if (!text) return '';
    return String(text).replace(/[<>&"']/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return match;
      }
    });
  };

  // Calculate totals using the same logic as quotation system
  const calculateTotals = async () => {
    // Try to get pricing from the calculated pricing data first
    let baseAmount = 0;

    // Check if we have calculated pricing data
    if (booking.calculated_pricing) {
      baseAmount = booking.calculated_pricing.baseAmount || 0;
    } else {
      // Use base_amount if available, otherwise fallback to price_amount
      baseAmount = booking.base_amount || booking.price_amount || booking.amount || 0;
      
      // If no stored pricing, get it directly from the database
      if (baseAmount === 0 && booking.service_name && booking.vehicle_id) {
        try {
          const supabase = await getSupabaseServerClient();
          
          // Get service type ID from service name
          const { data: serviceTypes, error: serviceError } = await supabase
            .from('service_types')
            .select('id')
            .ilike('name', `%${booking.service_name}%`)
            .limit(1);
          
          if (serviceError) {
            throw new Error(`Service type lookup error: ${serviceError.message}`);
          }
          
          if (serviceTypes && serviceTypes.length > 0) {
            const serviceTypeId = serviceTypes[0].id;
            
            // Query pricing directly from database
            const { data: pricingItems, error: pricingError } = await supabase
              .from('pricing_items')
              .select('price, currency')
              .eq('service_type_id', serviceTypeId)
              .eq('vehicle_id', booking.vehicle_id)
              .eq('duration_hours', 1)
              .eq('is_active', true);
            
            if (pricingError) {
              console.error('Pricing query error:', pricingError);
              throw new Error('Failed to fetch pricing from database');
            } else if (pricingItems && pricingItems.length > 0) {
              baseAmount = Number(pricingItems[0].price);
            } else {
              throw new Error('No pricing found in database');
            }
          } else {
            throw new Error('Service type not found');
          }
        } catch (error) {
          console.error('Error fetching pricing from database:', error);
          // Use fallback pricing like email generation does
          baseAmount = booking.price_amount || 0;
          if (baseAmount === 0) {
            console.error('No pricing data available for booking');
            throw new Error('Unable to determine pricing for this booking');
          }
        }
      }
    }
    
    const discountPercentage = booking.discount_percentage || 0;
    const taxPercentage = booking.tax_percentage || 10; // Default 10% Japanese tax
    const couponCode = booking.coupon_code || '';

    // Calculate regular discount
    const regularDiscount = baseAmount * (discountPercentage / 100);

    // Calculate coupon discount from coupon code
    let couponDiscount = 0;
    let couponDiscountPercentage = 0;
    if (couponCode) {
      // First try to use stored coupon discount percentage
      if (booking.coupon_discount_percentage) {
        couponDiscountPercentage = booking.coupon_discount_percentage;
        couponDiscount = baseAmount * (booking.coupon_discount_percentage / 100);
      } else {
        // Fallback to calculating from coupon code
        try {
          const supabase = await getSupabaseServerClient();
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
                  couponDiscount = baseAmount * (couponData.discount_value / 100);
                  if (couponData.maximum_discount && couponDiscount > couponData.maximum_discount) {
                    couponDiscount = couponData.maximum_discount;
                  }
                } else {
                  couponDiscount = Math.min(couponData.discount_value, baseAmount);
                  couponDiscountPercentage = (couponDiscount / baseAmount) * 100;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error validating coupon:', error);
        }
      }
    }

    // Total discount
    const totalDiscount = regularDiscount + couponDiscount;

    // Subtotal after discounts
    const subtotal = Math.max(0, baseAmount - totalDiscount);

    // Tax on subtotal
    const taxAmount = subtotal * (taxPercentage / 100);

    // Final total
    const finalTotal = subtotal + taxAmount;

    return {
      baseAmount,
      regularDiscount,
      couponDiscount,
      couponDiscountPercentage,
      totalDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = await calculateTotals();
  const bookingNumber = booking.wp_id || booking.id;
  const customerName = booking.customer_name || booking.customers?.name || 'Customer';
  const customerEmail = booking.customer_email || booking.customers?.email || '';
  const serviceName = booking.service_name || 'Transportation Service';
  const pickupLocation = booking.pickup_location || '';
  const dropoffLocation = booking.dropoff_location || '';
  const date = booking.date || new Date().toISOString().split('T')[0];
  const time = booking.time || '';

  // Determine payment status
  const isPaid = booking.status === 'confirmed' || booking.payment_status === 'paid';
  const paymentStatus = isPaid ? 'PAID' : 'PENDING PAYMENT';
  const paymentStatusColor = isPaid ? '#10b981' : '#f59e0b'; // Green for paid, orange for pending
  
  const formattedInvoiceId = `INV-${bookingNumber}`;
  const invoiceDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return `
    <div style="font-family: 'Work Sans', sans-serif; color: #111827; box-sizing: border-box; width: 100%; margin: 0; padding: 10px 0 0; border-top: 2px solid #FF2600;">
      
      <!-- Logo -->
      <div style="text-align: left; margin: 30px 0; margin-bottom: 30px;">
        <img src="data:image/png;base64,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" alt="Driver Logo" style="height: 50px;">
      </div>
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h1 style="margin: 0 0 15px 0; font-size: 24px; font-weight: bold; color: #111827;">
            ${isJapanese ? '請求書' : 'INVOICE'}
          </h1>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '請求書番号:' : 'Invoice #:'} ${formattedInvoiceId}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '請求書発行日:' : 'Invoice Date:'} ${invoiceDate}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '予約参照:' : 'Booking Ref:'} ${bookingNumber}
          </p>
          <!-- Payment Status Badge -->
          <div style="margin-top: 12px;">
            <div style="display: inline-block; padding: 6px 12px; background: ${paymentStatusColor}; border-radius: 4px;">
              <span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${isJapanese ? (isPaid ? '支払済み' : '未払い') : paymentStatus}
              </span>
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          ${getTeamAddressHtml(booking.team_location || 'thailand', isJapanese)}
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '請求先住所:' : 'BILLING ADDRESS:'}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; color: #111827; font-size: 13px;">
          ${safeEncodeText(customerName)}
        </p>
        <p style="margin: 0 0 3px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(customerEmail)}
        </p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(booking.customer_phone || '')}
        </p>
        
        ${booking.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '会社名:' : 'Company:'}</strong> ${safeEncodeText(booking.billing_company_name)}
          </p>
        ` : ''}
        
        ${booking.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '税番号:' : 'Tax ID:'}</strong> ${safeEncodeText(booking.billing_tax_number)}
          </p>
        ` : ''}
        
        ${(booking.billing_street_name || booking.billing_street_number) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '住所:' : 'Address:'}</strong> ${safeEncodeText(booking.billing_street_name || '')} ${safeEncodeText(booking.billing_street_number || '')}
          </p>
        ` : ''}
        
        ${(booking.billing_city || booking.billing_state || booking.billing_postal_code) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '市区町村/都道府県/郵便番号:' : 'City/State/Postal:'}</strong> ${safeEncodeText(booking.billing_city || '')} ${booking.billing_state ? ', ' + safeEncodeText(booking.billing_state) : ''} ${booking.billing_postal_code ? ', ' + safeEncodeText(booking.billing_postal_code) : ''}
          </p>
        ` : ''}
        
        ${booking.billing_country ? `
          <p style="margin: 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '国:' : 'Country:'}</strong> ${safeEncodeText(booking.billing_country)}
          </p>
        ` : ''}
      </div>
      
      <!-- Service Details Table -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
          ${isJapanese ? 'サービス詳細:' : 'SERVICE DETAILS:'}
        </h3>
        <table style="width: 100%; border-collapse: collapse; color: #111827;">
          <thead style="background-color: #f3f3f3;">
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 45%; color: #111827;">
                ${isJapanese ? 'サービス内容' : 'Service Description'}
              </th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 15%; color: #111827;">
                ${isJapanese ? '日付' : 'Date'}
              </th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 15%; color: #111827;">
                ${isJapanese ? '数量' : 'Quantity'}
              </th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; width: 25%; color: #111827;">
                ${isJapanese ? '価格' : 'Price'}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${serviceName}${serviceName === 'Charter Services' && booking.duration_hours > 0 && booking.service_days > 0 ? ` (${booking.service_days} day${booking.service_days > 1 ? 's' : ''}, ${booking.hours_per_day} hour${booking.hours_per_day > 1 ? 's' : ''} per day)` : ''}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${formatDate(date)}
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                1
              </td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                ${formatCurrency(totals.baseAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 35px;">
        <table style="width: 300px; border-collapse: collapse;">
          ${totals.regularDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                ${isJapanese ? `割引 (${booking.discount_percentage || 0}%):` : `Discount (${booking.discount_percentage || 0}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                -${formatCurrency(totals.regularDiscount)}
              </td>
            </tr>
          ` : ''}
          ${totals.couponDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #10b981; white-space: nowrap;">
                ${isJapanese ? `クーポン割引 (${booking.coupon_code || ''})${totals.couponDiscountPercentage > 0 ? ` (${totals.couponDiscountPercentage}%)` : ''}:` : `Coupon Discount (${booking.coupon_code || ''})${totals.couponDiscountPercentage > 0 ? ` (${totals.couponDiscountPercentage}%)` : ''}:`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #10b981;">
                -${formatCurrency(totals.couponDiscount)}
              </td>
            </tr>
          ` : ''}
          <tr>
            <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827; font-weight: 500;">
              ${isJapanese ? '小計:' : 'Subtotal:'}
            </td>
            <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #111827; font-weight: 500;">
              ${formatCurrency(totals.subtotal)}
            </td>
          </tr>
          ${totals.taxAmount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827;">
                ${isJapanese ? `税金 (${booking.tax_percentage || 10}%):` : `Tax (${booking.tax_percentage || 10}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #111827;">
                +${formatCurrency(totals.taxAmount)}
              </td>
            </tr>
          ` : ''}
          <tr style="background-color: #f3f3f3;">
            <td style="padding: 8px 15px 8px 0; text-align: right; font-weight: bold; font-size: 14px; color: #111827;">
              ${isJapanese ? '合計:' : 'TOTAL:'}
            </td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 14px; color: #111827;">
              ${formatCurrency(totals.finalTotal)}
            </td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- Page break before information blocks -->
    <div style="page-break-before: always; margin-top: 20px;"></div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
      ${getTeamFooterHtml(booking.team_location || 'thailand', isJapanese)}
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { booking_id, language = 'en' } = await request.json();
    
    if (!booking_id) {
      return NextResponse.json(
        { error: 'Missing booking_id' },
        { status: 400 }
      );
    }
    
    // Create server client
    const supabase = await getSupabaseServerClient();
    
    // For internal API calls, skip auth check (called from payment link generation)
    // Authentication is handled by the calling API
    
    // Fetch booking data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', booking_id)
      .single();
    
    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Generate HTML content for invoice
    const htmlContent = await generateBookingInvoiceHtml(booking, language as 'en' | 'ja');
    
    // Convert to PDF using optimized generator
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="INV-${booking.wp_id || booking.id}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Error generating booking invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
