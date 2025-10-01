import { getTeamAddressHtml, getTeamFooterHtml } from "@/lib/team-addresses";

export async function generateBookingInvoiceHtml(
  booking: any, 
  language: 'en' | 'ja' = 'en',
  operation_type?: string,
  previous_vehicle_name?: string,
  new_vehicle_name?: string,
  coupon_code?: string,
  refund_amount?: number,
  payment_amount?: number,
  previousVehicleInfo?: any,
  newVehicleInfo?: any
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

  // Format date to DD/MM/YYYY
  const formatDateDDMMYYYY = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
    // For refunds, show refund amount
    if (operation_type === 'downgrade' && refund_amount) {
      return {
        baseAmount: refund_amount,
        regularDiscount: 0,
        couponDiscount: 0,
        couponDiscountPercentage: 0,
        totalDiscount: 0,
        subtotal: refund_amount,
        taxAmount: 0,
        finalTotal: refund_amount
      };
    }

    // For full quotes with upgrades/downgrades, show complete breakdown
    if (!operation_type && (payment_amount || refund_amount)) {
      // This is a full quote with upgrade/downgrade
      const upgradeDowngradeAmount = payment_amount || refund_amount || 0;
      const isDowngrade = refund_amount && !payment_amount;
      
      // Get the base service amount (previous service)
      let baseServiceAmount = 0;
      if (booking.calculated_pricing) {
        baseServiceAmount = booking.calculated_pricing.baseAmount || 0;
      } else {
        baseServiceAmount = booking.base_amount || booking.price_amount || booking.amount || 0;
      }
      
      // Calculate tax on the base service amount
      const taxPercentage = booking.tax_percentage || 10;
      const baseTaxAmount = Math.round(baseServiceAmount * taxPercentage / 100);
      const baseSubtotal = baseServiceAmount;
      
      // Calculate upgrade/downgrade amount
      const upgradeDowngradeTaxAmount = Math.round(upgradeDowngradeAmount * taxPercentage / 100);
      const upgradeDowngradeSubtotal = upgradeDowngradeAmount;
      
      // Calculate totals
      const totalBaseAmount = baseSubtotal + baseTaxAmount;
      const totalUpgradeDowngradeAmount = upgradeDowngradeSubtotal + upgradeDowngradeTaxAmount;
      const finalTotal = totalBaseAmount + totalUpgradeDowngradeAmount;
      
      return {
        baseAmount: baseServiceAmount,
        regularDiscount: 0,
        couponDiscount: 0,
        couponDiscountPercentage: 0,
        totalDiscount: 0,
        subtotal: baseSubtotal,
        taxAmount: baseTaxAmount,
        upgradeDowngradeAmount: upgradeDowngradeAmount,
        upgradeDowngradeTaxAmount: upgradeDowngradeTaxAmount,
        upgradeDowngradeSubtotal: upgradeDowngradeSubtotal,
        finalTotal: finalTotal
      };
    }

    // For regular bookings, use the booking's pricing
    const baseAmount = booking.base_amount || booking.price_amount || booking.amount || 0;
    const discountPercentage = booking.discount_percentage || 0;
    const taxPercentage = booking.tax_percentage || 10;
    
    const regularDiscount = Math.round(baseAmount * discountPercentage / 100);
    const subtotal = baseAmount - regularDiscount;
    const taxAmount = Math.round(subtotal * taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      baseAmount,
      regularDiscount,
      couponDiscount: 0,
      couponDiscountPercentage: 0,
      totalDiscount: regularDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = await calculateTotals();
  
  // Format invoice ID
  const formattedInvoiceId = `INV-BOOK-JPDR-${(booking.wp_id || booking.id.slice(-6)).toString().padStart(6, '0')}`;
  const bookingNumber = booking.wp_id || booking.id.slice(-6);
  
  // Format dates
  const invoiceDate = formatDateDDMMYYYY(new Date().toISOString());
  const serviceDate = booking.date ? formatDateDDMMYYYY(booking.date) : '';
  
  // Customer information
  const customerName = booking.customer_name || 'Customer';
  const customerEmail = booking.customer_email || '';
  
  // Payment status
  const isPaid = booking.status === 'paid';
  const statusText = isPaid ? 'PAID' : 'PENDING PAYMENT';
  const statusColor = isPaid ? '#10B981' : '#F59E0B';

  // Translation keys
  const invoiceT = {
    invoice: isJapanese ? '請求書' : 'INVOICE',
    invoiceNumber: isJapanese ? '請求書番号:' : 'Invoice #:',
    invoiceDate: isJapanese ? '請求書発行日:' : 'Invoice Date:',
    bookingRef: isJapanese ? '予約参照:' : 'Booking Ref:',
    billingAddress: isJapanese ? '請求先住所:' : 'BILLING ADDRESS:',
    serviceDetails: isJapanese ? 'サービス詳細:' : 'SERVICE DETAILS:',
    service: isJapanese ? 'サービス:' : 'Service:',
    pickup: isJapanese ? '出発地:' : 'Pickup:',
    dropoff: isJapanese ? '到着地:' : 'Dropoff:',
    date: isJapanese ? '日付:' : 'Date:',
    time: isJapanese ? '時間:' : 'Time:',
    passengers: isJapanese ? '乗客数:' : 'Passengers:',
    vehicle: isJapanese ? '車両:' : 'Vehicle:',
    priceDetails: isJapanese ? '料金詳細:' : 'PRICE DETAILS:',
    description: isJapanese ? '項目' : 'Description',
    amount: isJapanese ? '金額' : 'Amount',
    baseAmount: isJapanese ? '基本料金' : 'Base Amount',
    discount: isJapanese ? '割引' : 'Discount',
    subtotal: isJapanese ? '小計' : 'Subtotal',
    tax: isJapanese ? '税金' : 'Tax',
    total: isJapanese ? '合計' : 'Total',
    paymentInfo: isJapanese ? '支払い情報' : 'PAYMENT INFORMATION',
    paymentPending: isJapanese ? 'この請求書は未払いです。下記のリンクからお支払いをお願いいたします。' : 'This invoice is pending payment. Please complete your payment using the link below.',
    dueDate: isJapanese ? '支払い期限:' : 'Due Date:',
    paid: isJapanese ? '支払済み' : 'PAID',
    pendingPayment: isJapanese ? '未払い' : 'PENDING PAYMENT'
  };

  return `
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #333; box-sizing: border-box; width: 100%; margin: 0; padding: 0;">
      <!-- Red line at top -->
      <div style="border-top: 2px solid #FF2600; width: 100%; margin-bottom: 20px;"></div>
      
      <!-- Logo -->
      <div style="text-align: left; margin-bottom: 20px; margin-top: 20px;">
        <img src="data:image/png;base64,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" alt="Driver Logo" style="height: 50px;">
      </div>
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1;">
          <h1 style="margin: 0 0 15px 0; font-size: 24px; font-weight: bold; color: #111827;">
            ${invoiceT.invoice}
          </h1>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${invoiceT.invoiceNumber} ${formattedInvoiceId}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${invoiceT.invoiceDate} ${invoiceDate}
          </p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;">
            ${invoiceT.bookingRef} ${bookingNumber}
          </p>
          <!-- Payment Status Badge -->
          <div style="margin-top: 12px;">
            <div style="display: inline-block; padding: 6px 12px; background: ${statusColor}; border-radius: 4px;">
              <span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${isPaid ? invoiceT.paid : invoiceT.pendingPayment}
              </span>
            </div>
          </div>
        </div>
        
        <div style="text-align: right; flex: 1;">
          ${getTeamAddressHtml(booking.team_location || 'thailand', isJapanese)}
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${invoiceT.billingAddress}
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
      </div>
      
      <!-- Service Details -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${invoiceT.serviceDetails}
        </h3>
        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
            <strong>${invoiceT.service}</strong> ${safeEncodeText(booking.service_name || 'Service')}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
            <strong>${invoiceT.pickup}</strong> ${safeEncodeText(booking.pickup_location || '')}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
            <strong>${invoiceT.dropoff}</strong> ${safeEncodeText(booking.dropoff_location || '')}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
            <strong>${invoiceT.date}</strong> ${serviceDate}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
            <strong>${invoiceT.time}</strong> ${booking.time || ''}
          </p>
          ${booking.number_of_passengers ? `
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
              <strong>${invoiceT.passengers}</strong> ${booking.number_of_passengers}
            </p>
          ` : ''}
          ${previousVehicleInfo && newVehicleInfo ? `
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">
              <strong>${invoiceT.vehicle}</strong> ${safeEncodeText(previousVehicleInfo.brand || '')} ${safeEncodeText(previousVehicleInfo.model || '')} (${safeEncodeText(previousVehicleInfo.name || '')})
            </p>
          ` : ''}
        </div>
      </div>
      
      <!-- Pricing Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${invoiceT.priceDetails}
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #F3F4F6;">
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #111827; border-bottom: 2px solid #E5E7EB;">
                ${invoiceT.description}
              </th>
              <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #111827; border-bottom: 2px solid #E5E7EB;">
                ${invoiceT.amount}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${invoiceT.baseAmount}
              </td>
              <td style="padding: 12px; text-align: right; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${formatCurrency(totals.baseAmount)}
              </td>
            </tr>
            ${totals.regularDiscount > 0 ? `
              <tr>
                <td style="padding: 12px; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                  ${invoiceT.discount} (${booking.discount_percentage || 0}%)
                </td>
                <td style="padding: 12px; text-align: right; font-size: 13px; color: #10B981; border-bottom: 1px solid #E5E7EB;">
                  -${formatCurrency(totals.regularDiscount)}
                </td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 12px; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${invoiceT.subtotal}
              </td>
              <td style="padding: 12px; text-align: right; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${formatCurrency(totals.subtotal)}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${invoiceT.tax} (${booking.tax_percentage || 10}%)
              </td>
              <td style="padding: 12px; text-align: right; font-size: 13px; color: #111827; border-bottom: 1px solid #E5E7EB;">
                ${formatCurrency(totals.taxAmount)}
              </td>
            </tr>
            <tr style="background: #F9FAFB; font-weight: bold;">
              <td style="padding: 12px; font-size: 14px; color: #111827; border-top: 2px solid #E5E7EB;">
                ${invoiceT.total}
              </td>
              <td style="padding: 12px; text-align: right; font-size: 14px; color: #DC2626; border-top: 2px solid #E5E7EB;">
                ${formatCurrency(totals.finalTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Payment Information -->
      ${!isPaid ? `
        <div style="margin-bottom: 32px; padding: 16px; background: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <h3 style="margin: 0 0 8px 0; color: #92400E; font-size: 14px; font-weight: bold;">
            ${invoiceT.paymentInfo}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #92400E;">
            ${invoiceT.paymentPending}
          </p>
          <p style="margin: 0; font-size: 13px; color: #92400E;">
            <strong>${invoiceT.dueDate}</strong> ${(() => {
              const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
              return formatDateDDMMYYYY(dueDate.toISOString());
            })()}
          </p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
        ${getTeamFooterHtml(booking.team_location || 'thailand', isJapanese)}
      </div>
    </div>
  `;
}
