import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateOptimizedPdfFromHtml } from '@/lib/optimized-html-pdf-generator'
import { getTeamAddressHtml, getTeamFooterHtml } from '@/lib/team-addresses'

// Helper function to safely encode text for HTML
function safeEncodeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[<>&"']/g, (char) => {
    const entities: { [key: string]: string } = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char] || char;
  });
}

function generateInvoiceHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en'
): string {
  const isJapanese = language === 'ja';
  const localeCode = language === 'ja' ? 'ja-JP' : 'en-US';
  
  // Format currency
  const formatCurrency = (value: number): string => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!value) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    if (currency === 'JPY') {
      return `¥${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `฿${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  // Calculate totals using the same logic as PDF generator
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotation.quotation_items && quotation.quotation_items.length > 0) {
      quotation.quotation_items.forEach((item: any) => {
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (item.service_type_name?.toLowerCase().includes('charter')) {
          itemBasePrice = item.unit_price * (item.service_days || 1);
        } else {
          itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        }
        serviceBaseTotal += itemBasePrice;
        
        if (item.time_based_adjustment) {
          const timeAdjustment = itemBasePrice * (item.time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      serviceBaseTotal = quotation.amount || 0;
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = 0; // No package for magic link version
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    
    const promotionDiscount = 0; // No promotion for magic link version
    
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      serviceTotal,
      packageTotal,
      baseTotal,
      promotionDiscount,
      regularDiscount,
      totalDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = calculateTotals();
  const formattedInvoiceId = `INV-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  const invoiceDate = new Date().toLocaleDateString(localeCode, { year: 'numeric', month: '2-digit', day: '2-digit' });

  return `
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #111827; box-sizing: border-box; width: 100%; margin: 0; padding: 0; border-top: 2px solid #FF2600;">
      
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
            ${isJapanese ? '見積参照:' : 'Quotation Ref:'} QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}
          </p>
          
          <!-- Status Badge for Paid Quotations -->
          ${quotation.status === 'paid' ? `
            <div style="background: #10b981; color: white; padding: 8px 12px; border-radius: 5px; margin-top: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              ${isJapanese ? '✓ 支払い済み' : '✓ PAID'}
            </div>
            <p style="margin: 5px 0 0 0; font-size: 13px;">
              ${quotation.payment_date ? 
                `${isJapanese ? '支払い完了日時:' : 'Paid on:'} ${new Date(quotation.payment_date).toLocaleDateString(localeCode)} ${quotation.payment_completed_at ? new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' }) : ''}` :
                quotation.payment_completed_at ? 
                  `${isJapanese ? '支払い完了日時:' : 'Payment completed on:'} ${new Date(quotation.payment_completed_at).toLocaleDateString(localeCode)} ${new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                  `${isJapanese ? '支払い完了日時:' : 'Payment completed on:'} ${invoiceDate}`}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: right;">
          ${getTeamAddressHtml(quotation.team_location || 'thailand', isJapanese)}
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '請求先住所:' : 'BILLING ADDRESS:'}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_name)}
        </p>
        <p style="margin: 0 0 3px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_email)}
        </p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_phone)}
        </p>
        
        ${quotation?.billing_company_name ? `
          <p style=\"margin: 0 0 3px 0; font-size: 13px; color: #111827;\">
            <strong>${isJapanese ? '会社名:' : 'Company:'}</strong> ${safeEncodeText(quotation.billing_company_name)}
          </p>
        ` : ''}
        
        ${quotation?.billing_tax_number ? `
          <p style=\"margin: 0 0 3px 0; font-size: 13px; color: #111827;\">
            <strong>${isJapanese ? '税番号:' : 'Tax ID:'}</strong> ${safeEncodeText(quotation.billing_tax_number)}
          </p>
        ` : ''}
        
        ${(quotation?.billing_street_name || quotation?.billing_street_number) ? `
          <p style=\"margin: 0 0 3px 0; font-size: 13px; color: #111827;\">
            <strong>${isJapanese ? '住所:' : 'Address:'}</strong> ${safeEncodeText(quotation.billing_street_name || '')} ${safeEncodeText(quotation.billing_street_number || '')}
          </p>
        ` : ''}
        
        ${(quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code) ? `
          <p style=\"margin: 0 0 3px 0; font-size: 13px; color: #111827;\">
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
            ${(quotation.quotation_items && quotation.quotation_items.length > 0 ? quotation.quotation_items : [{ 
              description: quotation.title, 
              quantity: 1, 
              unit_price: totals.finalTotal, 
              total_price: totals.finalTotal, 
              pickup_date: quotation.pickup_date 
            }]).map((item: any) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  <div style="font-weight: 500; margin-bottom: 4px;">
                    ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Vehicle'}`}
                  </div>
                  ${item.service_type_name?.toLowerCase().includes('charter') ? `
                    <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                      Hourly Rate (${item.hours_per_day || 8} hours / day): ${formatCurrency(item.unit_price)}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                      Number of Days: × ${item.service_days || 1}
                    </div>
                  ` : item.service_days && item.service_days > 1 ? `
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                      ${item.service_days} day(s) × ${item.hours_per_day || 1}h per day
                    </div>
                  ` : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${item.pickup_date || quotation.pickup_date || 'N/A'}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${(() => {
                    // For Charter Services, calculate total based on duration (unit_price × service_days)
                    if (item.service_type_name?.toLowerCase().includes('charter')) {
                      return formatCurrency(item.unit_price * (item.service_days || 1));
                    }
                    // For other services, use existing logic
                    return formatCurrency(item.total_price || item.unit_price || 0);
                  })()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 35px;">
        <table style="width: 250px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827;">
              ${isJapanese ? '小計:' : 'Subtotal:'}
            </td>
            <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #111827;">
              ${formatCurrency(totals.baseTotal)}
            </td>
          </tr>
          ${totals.promotionDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #10b981;">
                ${isJapanese ? 'プロモーション割引:' : 'Promotion Discount:'}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #10b981;">
                -${formatCurrency(totals.promotionDiscount)}
              </td>
            </tr>
          ` : totals.regularDiscount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                ${isJapanese ? `割引 (${quotation.discount_percentage}%):` : `Discount (${quotation.discount_percentage}%):`}
              </td>
              <td style="padding: 5px 0; text-align: right; font-size: 13px; color: #e53e3e;">
                -${formatCurrency(totals.regularDiscount)}
              </td>
            </tr>
          ` : ''}
          ${totals.taxAmount > 0 ? `
            <tr>
              <td style="padding: 5px 15px 5px 0; text-align: right; font-size: 13px; color: #111827;">
                ${isJapanese ? `税金 (${quotation.tax_percentage}%):` : `Tax (${quotation.tax_percentage}%):`}
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
      
      <!-- Payment Information section for paid quotations - moved above footer -->
      ${quotation.status === 'paid' ? `
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
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; margin-bottom: 30px;">
        ${getTeamFooterHtml(quotation.team_location || 'thailand', isJapanese)}
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en', token } = await request.json()
    
    if (!quotation_id || !token) {
      return NextResponse.json(
        { error: 'Missing quotation_id or token' },
        { status: 400 }
      )
    }
    
    // Create service client (bypasses authentication)
    const supabase = createServiceClient()
    
    let actualQuotationId = quotation_id;
    
    // Check if token is a quote number (QUO-JPDR-XXXXXX) or UUID
    if (token.startsWith('QUO-JPDR-')) {
      const quoteNumber = parseInt(token.replace('QUO-JPDR-', ''));
      if (isNaN(quoteNumber)) {
        return NextResponse.json(
          { error: 'Invalid quote number format' },
          { status: 400 }
        );
      }
      
      // Find quotation by quote number
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('id')
        .eq('quote_number', quoteNumber)
        .single();
      
      if (quotationError || !quotationData) {
        return NextResponse.json(
          { error: 'Quotation not found' },
          { status: 404 }
        );
      }
      
      actualQuotationId = quotationData.id;
    } else {
      // Token is a UUID, validate magic link
      const { data: magicLinkData, error: magicLinkError } = await supabase
        .from('quotation_magic_links')
        .select('*')
        .eq('token', token)
        .eq('quotation_id', quotation_id)
        .single()
      
      if (magicLinkError || !magicLinkData) {
        return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 401 })
      }
      
      // Check if magic link is expired
      const now = new Date()
      const expiryDate = new Date(magicLinkData.expires_at)
      if (now > expiryDate) {
        return NextResponse.json({ error: 'Magic link has expired' }, { status: 410 })
      }
    }
    
    // Fetch quotation data using the actual quotation ID
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*), quotation_items (*)')
      .eq('id', actualQuotationId)
      .single()
    
    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }
    
    // Only allow invoice generation for approved, paid, or converted quotations
    if (!['approved', 'paid', 'converted'].includes(quotation.status)) {
      return NextResponse.json(
        { error: 'Can only generate invoices for approved, paid, or converted quotations' },
        { status: 400 }
      )
    }
    
    // Generate HTML content for invoice
    const htmlContent = generateInvoiceHtml(quotation, language as 'en' | 'ja')
    
    // Convert to PDF using optimized generator
    const pdfBuffer = await generateOptimizedPdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    }, quotation, null, null, language)
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating invoice PDF via magic link:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}
