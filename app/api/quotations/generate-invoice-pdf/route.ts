import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generatePdfFromHtml } from '@/lib/html-pdf-generator'
import { PricingPackage, PricingPromotion } from '@/types/quotations'

// Generate invoice HTML (similar to quotation but focused on invoice format)
function generateInvoiceHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en',
  selectedPackage: PricingPackage | null = null,
  selectedPromotion: PricingPromotion | null = null
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
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
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
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = quotation.discount_percentage || 0;
    const taxPercentage = quotation.tax_percentage || 0;
    
    const promotionDiscount = selectedPromotion ? 
      (selectedPromotion.discount_type === 'percentage' ? 
        baseTotal * (selectedPromotion.discount_value / 100) : 
        selectedPromotion.discount_value) : 0;
    
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
    <div style="font-family: 'Work Sans', sans-serif; color: #111827; box-sizing: border-box; width: 100%; margin: 0; padding: 10px 0 0; border-top: 2px solid #FF2600;">
      
      <!-- Logo -->
      <div style="text-align: left; margin: 30px 0; margin-bottom: 30px;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'}/img/driver-header-logo.png" alt="Driver Logo" style="height: 50px;">
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
          <p style="margin: 0; color: #111827; font-size: 14px;">
            ${isJapanese ? '見積参照:' : 'Quotation Ref:'} QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}
          </p>
        </div>
        
        <div style="text-align: right;">
          <h2 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">Driver (Thailand) Company Limited</h2>
          <p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">580/17 Soi Ramkhamhaeng 39</p>
          <p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">Wang Thong Lang</p>
          <p style="margin: 0 0 2px 0; color: #111827; font-size: 13px;">Bangkok 10310</p>
          <p style="margin: 0 0 10px 0; color: #111827; font-size: 13px;">Thailand</p>
          <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: 0105566135845</p>
        </div>
      </div>
      
      <!-- Billing Address -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: bold;">
          ${isJapanese ? '請求先住所:' : 'BILLING ADDRESS:'}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: bold; color: #111827; font-size: 14px;">
          ${quotation?.customer_name || 'N/A'}
        </p>
        <p style="margin: 0 0 3px 0; color: #111827; font-size: 14px;">
          ${quotation?.customer_email || 'N/A'}
        </p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
          ${quotation?.customer_phone || 'N/A'}
        </p>
        
        ${quotation?.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 14px; color: #111827;">
            <strong>${isJapanese ? '会社名:' : 'Company:'}</strong> ${quotation.billing_company_name}
          </p>
        ` : ''}
        
        ${quotation?.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 14px; color: #111827;">
            <strong>${isJapanese ? '税番号:' : 'Tax ID:'}</strong> ${quotation.billing_tax_number}
          </p>
        ` : ''}
        
        ${[quotation?.billing_street_number, quotation?.billing_street_name, quotation?.billing_city, quotation?.billing_state, quotation?.billing_postal_code, quotation?.billing_country].filter(Boolean).length > 0 ? `
          <p style="margin: 0; font-size: 14px; color: #111827;">
            ${[quotation?.billing_street_number, quotation?.billing_street_name, quotation?.billing_city, quotation?.billing_state, quotation?.billing_postal_code, quotation?.billing_country].filter(Boolean).join(', ')}
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
                  ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Vehicle'}`}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${item.pickup_date || quotation.pickup_date || 'N/A'}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #111827;">
                  ${formatCurrency(item.total_price || item.unit_price || 0)}
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
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
          ${isJapanese ? 'ご利用いただきありがとうございます。' : 'Thank you for your business!'}
        </p>
        <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
          ${isJapanese ? 'この請求書に関するお問い合わせは billing@japandriver.com までご連絡ください。' : 'If you have any questions about this invoice, please contact us at billing@japandriver.com'}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
          Driver (Thailand) Company Limited • www.japandriver.com
        </p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { quotation_id, language = 'en' } = await request.json()
    
    if (!quotation_id) {
      return NextResponse.json(
        { error: 'Missing quotation_id' },
        { status: 400 }
      )
    }
    
    // Create server client
    const supabase = await getSupabaseServerClient()
    
    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch quotation data
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*), quotation_items (*)')
      .eq('id', quotation_id)
      .single()
    
    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }
    
    // Only allow invoice generation for approved quotations
    if (quotation.status !== 'approved') {
      return NextResponse.json(
        { error: 'Can only generate invoices for approved quotations' },
        { status: 400 }
      )
    }
    
    // Fetch associated package and promotion
    let selectedPackage: PricingPackage | null = null
    const packageId = (quotation as any).selected_package_id || (quotation as any).package_id;
    if (packageId) {
      const { data: pkg } = await supabase
        .from('pricing_packages')
        .select('*, items:pricing_package_items(*)')
        .eq('id', packageId)
        .single()
      selectedPackage = pkg as PricingPackage | null
    }

    let selectedPromotion: PricingPromotion | null = null
    const promotionCode = (quotation as any).selected_promotion_code || (quotation as any).promotion_code;
    if (promotionCode) {
      const { data: promo } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('code', promotionCode)
        .single()
      selectedPromotion = promo as PricingPromotion | null
    }
    
    // Generate HTML content for invoice
    const htmlContent = generateInvoiceHtml(quotation, language as 'en' | 'ja', selectedPackage, selectedPromotion)
    
    // Convert to PDF
    const pdfBuffer = await generatePdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    })
    
    // Return PDF as blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="INV-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}
