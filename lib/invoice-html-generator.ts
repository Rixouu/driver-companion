import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { getTeamAddressHtml } from '@/lib/team-addresses'

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
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function generateInvoiceHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en',
  selectedPackage: PricingPackage | null = null,
  selectedPromotion: PricingPromotion | null = null,
  statusLabel?: string,
  showTeamInfo: boolean = true,
  statusConfigs: { [status: string]: { showSignature: boolean; showStatusBadge: boolean; statusBadgeColor: string; statusBadgeName: string } } = {}
): string {
  const isJapanese = language === 'ja';
  const localeCode = isJapanese ? 'ja-JP' : 'en-US';
  
  // Calculate totals
  const calculateTotals = () => {
    let baseAmount = 0;
    
    // Calculate base amount from quotation items
    if (quotation?.quotation_items && quotation.quotation_items.length > 0) {
      baseAmount = quotation.quotation_items.reduce((total: number, item: any) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.unit_price || 0;
        const serviceDays = item.service_days || 1;
        return total + (unitPrice * quantity * serviceDays);
      }, 0);
    }
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 10;
    
    // Calculate regular discount
    const regularDiscount = baseAmount * (discountPercentage / 100);
    
    // Calculate promotion discount
    let promotionDiscount = 0;
    if (selectedPromotion) {
      if (selectedPromotion.discount_type === 'percentage') {
        promotionDiscount = baseAmount * (selectedPromotion.discount_value / 100);
        if (selectedPromotion.maximum_discount && promotionDiscount > selectedPromotion.maximum_discount) {
          promotionDiscount = selectedPromotion.maximum_discount;
        }
      } else {
        promotionDiscount = Math.min(selectedPromotion.discount_value, baseAmount);
      }
    }
    
    // Total discount
    const totalDiscount = regularDiscount + promotionDiscount;
    
    // Subtotal after discounts
    const subtotal = Math.max(0, baseAmount - totalDiscount);
    
    // Tax on subtotal
    const taxAmount = subtotal * (taxPercentage / 100);
    
    // Final total
    const finalTotal = subtotal + taxAmount;
    
    return {
      baseAmount,
      regularDiscount,
      promotionDiscount,
      totalDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = calculateTotals();
  
  // Determine status and colors
  const isPaid = quotation.status === 'paid' || quotation.payment_completed_at;
  const isConverted = quotation.status === 'converted';
  
  let statusText = 'PENDING PAYMENT';
  let statusColor = '#f59e0b'; // Orange for pending
  
  if (isPaid) {
    statusText = 'PAID';
    statusColor = '#10b981'; // Green for paid
  } else if (isConverted) {
    statusText = 'CONVERTED';
    statusColor = '#8b5cf6'; // Purple for converted
  }
  
  const formattedInvoiceId = `INV-${quotation.quote_number || quotation.id}`;
  const invoiceDate = formatDate(new Date().toISOString());

  return `
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #111827; box-sizing: border-box; width: 100%; margin: 0; padding: 10px 0 0; border-top: 2px solid #FF2600;">
      
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
            ${isJapanese ? '見積書参照:' : 'Quote Ref:'} ${quotation.quote_number || quotation.id}
          </p>
          <!-- Payment Status Badge -->
          <div style="margin-top: 12px;">
            <div style="display: inline-block; padding: 6px 12px; background: ${statusColor}; border-radius: 4px;">
              <span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                ${isJapanese ? (isPaid ? '支払済み' : isConverted ? '変換済み' : '未払い') : statusText}
              </span>
            </div>
          </div>
        </div>
        
        <div style="text-align: right;">
          ${showTeamInfo ? getTeamAddressHtml(quotation?.team || 'both', isJapanese) : ''}
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '請求先住所:' : 'BILLING ADDRESS:'}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_name || 'N/A')}
        </p>
        <p style="margin: 0 0 3px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_email || 'N/A')}
        </p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_phone || '')}
        </p>
        
        ${quotation?.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '会社名:' : 'Company:'}</strong> ${safeEncodeText(quotation.billing_company_name)}
          </p>
        ` : ''}
        
        ${quotation?.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '税番号:' : 'Tax ID:'}</strong> ${safeEncodeText(quotation.billing_tax_number)}
          </p>
        ` : ''}
        
        ${(quotation?.billing_street_name || quotation?.billing_street_number) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '住所:' : 'Address:'}</strong> ${safeEncodeText(quotation.billing_street_name || '')} ${safeEncodeText(quotation.billing_street_number || '')}
          </p>
        ` : ''}
        
        ${(quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '市区町村/都道府県/郵便番号:' : 'City/State/Postal:'}</strong> ${safeEncodeText(quotation.billing_city || '')} ${quotation.billing_state ? ', ' + safeEncodeText(quotation.billing_state) : ''} ${quotation.billing_postal_code ? ', ' + safeEncodeText(quotation.billing_postal_code) : ''}
          </p>
        ` : ''}
        
        ${quotation?.billing_country ? `
          <p style="margin: 0; font-size: 13px; color: #111827;">
            <strong>${isJapanese ? '国:' : 'Country:'}</strong> ${safeEncodeText(quotation.billing_country)}
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
            ${quotation?.quotation_items && quotation.quotation_items.length > 0 ? quotation.quotation_items.map((item: any, index: number) => {
              const serviceName = item.service_type_name || 'Service';
              const vehicleType = item.vehicle_type || 'Standard';
              const description = item.description || '';
              const quantity = item.quantity || 1;
              const unitPrice = item.unit_price || 0;
              const serviceDays = item.service_days || 1;
              const totalPrice = unitPrice * quantity * serviceDays;

              // Calculate service date - use pickup_date if available, otherwise use created_at
              let serviceDate;
              if (quotation.pickup_date) {
                serviceDate = formatDate(quotation.pickup_date);
              } else if (quotation.created_at) {
                serviceDate = formatDate(quotation.created_at);
              } else {
                serviceDate = formatDate(new Date().toISOString());
              }

              // Build clean service description without redundancy
              let serviceDescription = serviceName;
              if (vehicleType && vehicleType !== 'Standard') {
                serviceDescription += ` - ${vehicleType}`;
              }
              if (description && !description.includes(serviceName)) {
                serviceDescription += ` (${description})`;
              }

              return `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                    ${safeEncodeText(serviceDescription)}
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                    ${serviceDate}
                  </td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                    ${quantity}
                  </td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                    ${formatCurrency(totalPrice)}
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="4" style="padding: 20px; text-align: center; font-size: 14px; color: #6B7280;">
                  ${isJapanese ? 'サービス詳細はありません' : 'No service details available'}
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
      
      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 35px;">
        <table style="width: 300px; border-collapse: collapse;">
          ${totals.regularDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                ${isJapanese ? `割引 (${quotation.discount_percentage || 0}%):` : `Discount (${quotation.discount_percentage || 0}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                -${formatCurrency(totals.regularDiscount)}
              </td>
            </tr>
          ` : ''}
          ${totals.promotionDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #10b981; white-space: nowrap;">
                ${isJapanese ? `プロモーション割引 (${selectedPromotion?.code || ''})${selectedPromotion?.discount_type === 'percentage' ? ` (${selectedPromotion.discount_value}%)` : ''}:` : `Promotion Discount (${selectedPromotion?.code || ''})${selectedPromotion?.discount_type === 'percentage' ? ` (${selectedPromotion.discount_value}%)` : ''}:`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #10b981;">
                -${formatCurrency(totals.promotionDiscount)}
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
                ${isJapanese ? `税金 (${quotation.tax_percentage || 10}%):` : `Tax (${quotation.tax_percentage || 10}%):`}
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
    
    <!-- Information blocks on second page -->
    ${isPaid ? `
      <div style="margin-bottom: 20px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '支払い情報' : 'Payment Information'}
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
          ${quotation.payment_date ? `
            <div>
              <strong style="color: #166534;">${isJapanese ? '支払い日:' : 'Payment Date:'}</strong>
              <span style="color: #374151;"> ${new Date(quotation.payment_date).toLocaleDateString(localeCode)}</span>
            </div>
          ` : ''}
          ${quotation.payment_completed_at ? `
            <div>
              <strong style="color: #166534;">${isJapanese ? '完了時刻:' : 'Completed at:'}</strong>
              <span style="color: #374151;"> ${new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ` : ''}
          ${quotation.payment_amount ? `
            <div>
              <strong style="color: #166534;">${isJapanese ? '支払い金額:' : 'Payment Amount:'}</strong>
              <span style="color: #374151;"> ${quotation.currency || 'JPY'} ${quotation.payment_amount.toLocaleString()}</span>
            </div>
          ` : ''}
          ${quotation.payment_method ? `
            <div>
              <strong style="color: #166534;">${isJapanese ? '支払い方法:' : 'Payment Method:'}</strong>
              <span style="color: #374151;"> ${quotation.payment_method}</span>
            </div>
          ` : ''}
        </div>
      </div>
    ` : isConverted ? `
      <div style="margin-bottom: 20px; padding: 15px; background: #faf5ff; border: 1px solid #8b5cf6; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; color: #7c3aed; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '予約変換情報' : 'Booking Conversion Information'}
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
          ${quotation.updated_at ? `
            <div>
              <strong style="color: #7c3aed;">${isJapanese ? '変換日:' : 'Converted on:'}</strong>
              <span style="color: #374151;"> ${new Date(quotation.updated_at).toLocaleDateString(localeCode)}</span>
            </div>
          ` : ''}
          ${quotation.updated_at ? `
            <div>
              <strong style="color: #7c3aed;">${isJapanese ? '変換時刻:' : 'Converted at:'}</strong>
              <span style="color: #374151;"> ${new Date(quotation.updated_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ` : ''}
          <div>
            <strong style="color: #7c3aed;">${isJapanese ? '状態:' : 'Status:'}</strong>
            <span style="color: #374151;"> ${isJapanese ? '予約済み' : 'Converted to Booking'}</span>
          </div>
          <div>
            <strong style="color: #7c3aed;">${isJapanese ? '総額:' : 'Total Amount:'}</strong>
            <span style="color: #374151;"> ${formatCurrency(totals.finalTotal)}</span>
          </div>
        </div>
      </div>
      
      <!-- Show payment information for converted quotations if they have payment data -->
      ${(quotation.payment_date || quotation.payment_completed_at || quotation.payment_amount || quotation.payment_method) ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: bold;">
            ${isJapanese ? '支払い情報' : 'Payment Information'}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            ${quotation.payment_date ? `
              <div>
                <strong style="color: #166534;">${isJapanese ? '支払い日:' : 'Payment Date:'}</strong>
                <span style="color: #374151;"> ${new Date(quotation.payment_date).toLocaleDateString(localeCode)}</span>
              </div>
            ` : ''}
            ${quotation.payment_completed_at ? `
              <div>
                <strong style="color: #166534;">${isJapanese ? '完了時刻:' : 'Completed at:'}</strong>
                <span style="color: #374151;"> ${new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ` : ''}
            ${quotation.payment_amount ? `
              <div>
                <strong style="color: #166534;">${isJapanese ? '支払い金額:' : 'Payment Amount:'}</strong>
                <span style="color: #374151;"> ${quotation.currency || 'JPY'} ${quotation.payment_amount.toLocaleString()}</span>
              </div>
            ` : ''}
            ${quotation.payment_method ? `
              <div>
                <strong style="color: #166534;">${isJapanese ? '支払い方法:' : 'Payment Method:'}</strong>
                <span style="color: #374151;"> ${quotation.payment_method}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    ` : ''}
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
      <p style="margin: 0 0 10px; color: #333; font-weight: bold;">
        ${isJapanese ? 'ご利用ありがとうございます！' : 'Thank you for your business!'}
      </p>
      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
        ${isJapanese 
          ? 'この請求書についてご質問がございましたら、'
          : 'If you have any questions about this invoice, please contact us at '
        }
        <a href="mailto:booking@japandriver.com" style="color: #1e40af; text-decoration: none;">booking@japandriver.com</a>
      </p>
      <p style="margin: 0; color: #666; font-size: 14px;">
        Driver (Japan) Company Limited • 
        <a href="https://www.japandriver.com" style="color: #1e40af; text-decoration: none;">www.japandriver.com</a>
      </p>
    </div>
  `;
}