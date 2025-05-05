import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import puppeteer from 'puppeteer'

// Email templates for different languages
const emailTemplates = {
  en: {
    subject: 'Your Quotation from Driver',
    greeting: 'Hello',
    intro: 'Thank you for your interest in our services. Please find attached your quotation.',
    followup: 'If you have any questions or would like to proceed with this quotation, please click in the button below.',
    additionalInfo: 'From your online quote you can accept, decline, comment or print.',
    callToAction: 'View Your Quotation Online',
    closing: 'We look forward to working with you.',
    regards: 'Best regards,',
    company: 'Driver (Thailand) Company Limited',
    serviceDetails: 'SERVICE DETAILS',
    pricingDetails: 'PRICING DETAILS'
  },
  ja: {
    subject: 'ドライバーからの見積書',
    greeting: 'こんにちは',
    intro: '弊社サービスにご興味をお持ちいただき、ありがとうございます。ご依頼いただいた見積書を添付にてお送りいたします。',
    followup: 'ご質問がございましたら、またはこの見積もりを承諾される場合は、以下のボタンをクリックしてください。',
    additionalInfo: 'オンライン見積もりから、承諾、辞退、コメント、印刷ができます。',
    callToAction: 'オンラインで見積書を確認',
    closing: 'よろしくお願いいたします。',
    regards: '敬具',
    company: 'Driver (Thailand) Company Limited',
    serviceDetails: 'サービス詳細',
    pricingDetails: '価格詳細'
  }
};

// --- Start: Integrated PDF Generation Function (from send-reminder) ---
async function generateQuotationPDF(quotation: any, language: string): Promise<Buffer | null> {
  try {
    console.log('🔄 [SEND-EMAIL API] Starting PDF generation with updated design');
    
    const isJapanese = language === 'ja';
    
    // Get App URL for logo fetching
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const logoUrl = `${appUrl}/img/driver-header-logo.png`;
    let logoBase64 = '';

    try {
      console.log(`🔄 [SEND-EMAIL API] Fetching logo from: ${logoUrl}`);
      const response = await fetch(logoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.statusText}`);
      }
      const imageBuffer = await response.arrayBuffer();
      logoBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      console.log('✅ [SEND-EMAIL API] Logo fetched and encoded successfully.');
    } catch (logoError) {
      console.error('❌ [SEND-EMAIL API] Error fetching or encoding logo:', logoError);
      // Use a default placeholder if fetching fails
      logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADipAQK8AAFEDckVAAAAAElFTkSuQmCC'; // Placeholder
    }
    
    // Use the translation map directly from quotation-pdf-button.tsx logic
    const quotationTranslations = {
      en: {
        quotation: 'QUOTATION',
        quotationNumber: 'Quotation #:',
        quotationDate: 'Quotation Date:',
        expiryDate: 'Expiry Date:',
        validFor: 'Valid for:',
        days: 'days',
        companyName: 'Driver (Thailand) Company Limited',
        companyAddress1: '580/17 Soi Ramkhamhaeng 39',
        companyAddress2: 'Wang Thong Lang',
        companyAddress3: 'Bangkok 10310',
        companyAddress4: 'Thailand',
        companyTaxId: 'Tax ID: 0105566135845',
        customerInfo: 'CUSTOMER INFO:',
        billingAddress: 'BILLING ADDRESS:',
        serviceInfo: 'SERVICE INFO:',
        serviceType: 'Service Type:',
        vehicleType: 'Vehicle Type:',
        pickupDate: 'Pickup Date:',
        pickupTime: 'Pickup Time:',
        duration: 'Duration:',
        hours: 'hours',
        priceDetails: 'PRICE DETAILS:',
        items: {
          description: 'Description',
          price: 'Price',
          total: 'Total'
        },
        subtotal: 'Subtotal:',
        discount: 'Discount:',
        tax: 'Tax:',
        total: 'TOTAL:',
        thanksMessage: 'Thank you for considering our services!',
        contactMessage: 'If you have any questions about this quotation, please contact us at info@japandriver.com',
        companyFooter: 'Driver (Thailand) Company Limited • www.japandriver.com',
        termsAndConditions: 'Terms and Conditions',
        termsContent: '1. This quotation is valid for the specified period from the date of issue.\n2. Prices are subject to change if requirements change.\n3. Payment terms: 50% advance, 50% before service.\n4. Cancellation policy: 100% refund if cancelled 7+ days before service, 50% refund if 3-7 days, no refund if less than 3 days.',
        companyNameLabel: 'Company:',
        taxNumber: 'Tax ID:',
        address: 'Address:',
        cityStatePostal: 'City/State/Postal:',
        country: 'Country:'
      },
      ja: {
        quotation: '見積書',
        quotationNumber: '見積書番号:',
        quotationDate: '見積書発行日:',
        expiryDate: '有効期限:',
        validFor: '有効期間:',
        days: '日間',
        companyName: 'Driver (Thailand) Company Limited',
        companyAddress1: '580/17 Soi Ramkhamhaeng 39',
        companyAddress2: 'Wang Thong Lang',
        companyAddress3: 'Bangkok 10310',
        companyAddress4: 'Thailand',
        companyTaxId: 'Tax ID: 0105566135845',
        customerInfo: 'お客様情報:',
        billingAddress: '請求先住所:',
        serviceInfo: 'サービス情報:',
        serviceType: 'サービスタイプ:',
        vehicleType: '車両タイプ:',
        pickupDate: '送迎日:',
        pickupTime: '送迎時間:',
        duration: '利用時間:',
        hours: '時間',
        priceDetails: '価格詳細:',
        items: {
          description: '内容',
          price: '価格',
          total: '合計'
        },
        subtotal: '小計:',
        discount: '割引:',
        tax: '税金:',
        total: '合計:',
        thanksMessage: 'ご検討いただきありがとうございます。',
        contactMessage: 'この見積書に関するお問い合わせは info@japandriver.com までご連絡ください。',
        companyFooter: 'Driver (Thailand) Company Limited • www.japandriver.com',
        termsAndConditions: '利用規約',
        termsContent: '1. この見積書は発行日から指定された期間内有効です。\n2. 要件が変更された場合、価格も変更される場合があります。\n3. 支払条件: 前払い50%、サービス前に残りの50%。\n4. キャンセルポリシー: サービス開始7日以上前のキャンセルは全額返金、3～7日前は50%返金、3日未満は返金なし。',
        companyNameLabel: '会社名:',
        taxNumber: '税番号:',
        address: '住所:',
        cityStatePostal: '市区町村/都道府県/郵便番号:',
        country: '国:'
      }
    };
    
    const quotationT = quotationTranslations[language as 'en' | 'ja'];
    
    // Format currency helper
    const formatCurrency = (amount: number) => {
      const currency = quotation.currency || 'THB'; 
      return `${currency} ${amount.toLocaleString(isJapanese ? 'ja-JP' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; 
    };
    
    // Prepare quotation data
    const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    const creationDate = quotation.created_at ? new Date(quotation.created_at) : new Date();
    const validDays = quotation.valid_days || 2;
    const expiryDate = new Date(creationDate);
    expiryDate.setDate(expiryDate.getDate() + validDays);
    
    // Get service details
    const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
    const hours = quotation.duration_hours || quotation.hours_per_day || 8;
    const numDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
    
    // Calculate pricing (using the logic from send-reminder)
    let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 0;
    let baseAmount = hourlyRate * numDays;
    
    if (quotation.total_amount && baseAmount === 0) {
      const totalAmount = parseFloat(String(quotation.total_amount));
      const discountPercentage = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
      const taxPercentage = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
      let calculatedTotal = totalAmount;
      let subtotalBeforeTax = calculatedTotal;
      if (taxPercentage > 0) {
        subtotalBeforeTax = calculatedTotal / (1 + (taxPercentage / 100));
      }
      if (discountPercentage > 0) {
        baseAmount = subtotalBeforeTax / (1 - (discountPercentage / 100));
      } else {
        baseAmount = subtotalBeforeTax;
      }
      hourlyRate = baseAmount / numDays;
    }
    
    const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
    let discountAmount = 0;
    let subtotalAmount = baseAmount;
    if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      discountAmount = (baseAmount * discountPercentage) / 100;
      subtotalAmount = baseAmount - discountAmount;
    }
    
    const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
    let taxAmount = 0;
    let totalAmount = subtotalAmount;
    if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      taxAmount = (subtotalAmount * taxPercentage) / 100;
      totalAmount = subtotalAmount + taxAmount;
    }
    const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : totalAmount;
    
    // Base64 encoded logo placeholder (replaced by fetched logo)
    // const logoBase64 = '...'; // Placeholder removed

    // Generate the HTML content matching quotation-pdf-button.tsx
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quotation ${formattedQuotationId}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap">
      <style>
        body {
          font-family: 'Work Sans', Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #fff;
          font-size: 13px;
          line-height: 1.5;
        }
        .container {
          width: 180mm;
          margin: 10px auto;
          border-top: 2px solid #FF2600;
          padding: 10px 0 0;
          box-sizing: border-box;
          position: relative;
        }
        .logo-container {
          text-align: left;
          margin-bottom: 30px;
          margin-top: 30px;
        }
        .logo {
          height: 50px;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          width: 100%;
        }
        .quotation-details {
          flex: 1;
          text-align: left;
          max-width: 50%;
        }
        .quotation-title {
          color: #333;
          margin: 0 0 15px 0;
          font-size: 24px;
          font-weight: bold;
        }
        .company-info {
          flex: 1;
          max-width: 40%;
          text-align: right;
        }
        .company-name {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 16px;
          font-weight: bold;
        }
        .price-details-section {
          margin-bottom: 30px;
          width: 100%;
        }
        .section-title {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
          font-weight: bold;
        }
        .price-container {
          background-color: #f3f3f3;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 3px 0;
        }
        .price-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          font-weight: bold;
          text-transform: uppercase;
          color: #8898AA;
          font-size: 13px;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
          padding-bottom: 20px;
          text-align: center;
          margin-top: 20px;
          width: 100%;
        }
        p {
          margin: 0 0 3px 0;
          font-size: 13px;
        }
        h3 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 14px;
            font-weight: bold;
        }
        strong { font-weight: 500; }
        .bold { font-weight: bold; }
        .discount-row {
          color: #e53e3e;
        }
        .border-top {
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
        .customer-section {
          margin-bottom: 30px;
          width: 100%;
        }
        .terms-section {
          margin-bottom: 25px;
          width: 100%;
        }
        .terms-content {
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-line;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <img src="${logoBase64}" alt="Driver Logo" class="logo">
        </div>
        <div class="header-container">
          <div class="quotation-details">
            <h1 class="quotation-title">${quotationT.quotation}</h1>
            <p>${quotationT.quotationNumber} ${formattedQuotationId}</p>
            <p>${quotationT.quotationDate} ${creationDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}</p>
            <p>${quotationT.expiryDate} ${expiryDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}</p>
            <p>${quotationT.validFor} ${validDays} ${quotationT.days}</p>
          </div>
          <div class="company-info">
            <h2 class="company-name">${quotationT.companyName}</h2>
            <p>${quotationT.companyAddress1}</p>
            <p>${quotationT.companyAddress2}</p>
            <p>${quotationT.companyAddress3}</p>
            <p>${quotationT.companyAddress4}</p>
            <p>${quotationT.companyTaxId}</p>
          </div>
        </div>
        <div class="customer-section">
          <h3>${quotationT.billingAddress}</h3>
          <p>${quotation.customer_name || (quotation.customers?.name || 'N/A')}</p>
          <p>${quotation.customer_email || (quotation.customers?.email || 'N/A')}</p>
          <p style="margin-bottom: 15px;">${quotation.customer_phone || (quotation.customers?.phone || 'N/A')}</p>
          ${quotation.billing_company_name ? `<p><strong>${quotationT.companyNameLabel}</strong> ${quotation.billing_company_name}</p>` : ''}
          ${quotation.billing_tax_number ? `<p><strong>${quotationT.taxNumber}</strong> ${quotation.billing_tax_number}</p>` : ''}
          ${(quotation.billing_street_name || quotation.billing_street_number) ? 
            `<p><strong>${quotationT.address}</strong> ${quotation.billing_street_name || ''} ${quotation.billing_street_number || ''}</p>` : ''}
          ${(quotation.billing_city || quotation.billing_state || quotation.billing_postal_code) ? 
            `<p><strong>${quotationT.cityStatePostal}</strong> ${quotation.billing_city || ''} ${quotation.billing_state ? ', ' + quotation.billing_state : ''} ${quotation.billing_postal_code ? ', ' + quotation.billing_postal_code : ''}</p>` : ''}
          ${quotation.billing_country ? `<p><strong>${quotationT.country}</strong> ${quotation.billing_country}</p>` : ''}
        </div>
        <div class="price-details-section">
          <h3>${quotationT.priceDetails}</h3>
          <div class="price-container">
            <div class="price-header">
              <div>${quotationT.items.description}</div>
              <div>${quotationT.items.price}</div>
            </div>
            <div class="price-row">
              <div>${vehicleType}</div>
              <div></div>
            </div>
            <div class="price-row">
              <div>${isJapanese ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</div>
              <div>${formatCurrency(hourlyRate)}</div>
            </div>
            ${numDays > 1 ? `
            <div class="price-row">
              <div style="color: #666;">${isJapanese ? '日数' : 'Number of Days'}</div>
              <div>× ${numDays}</div>
            </div>
            ` : ''}
            <div class="price-row border-top">
              <div><strong>${isJapanese ? '基本料金' : 'Base Amount'}</strong></div>
              <div><strong>${formatCurrency(baseAmount)}</strong></div>
            </div>
            ${hasDiscount ? `
            <div class="price-row discount-row">
              <div>${isJapanese ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}</div>
              <div>-${formatCurrency(discountAmount)}</div>
            </div>
            <div class="price-row border-top">
              <div><strong>${isJapanese ? '小計' : 'Subtotal'}</strong></div>
              <div><strong>${formatCurrency(subtotalAmount)}</strong></div>
            </div>
            ` : ''}
            ${hasTax ? `
            <div class="price-row">
              <div style="color: #666;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</div>
              <div>+${formatCurrency(taxAmount)}</div>
            </div>
            ` : ''}
            <div class="price-row border-top">
              <div><strong class="bold">${isJapanese ? '合計金額' : 'Total Amount'}</strong></div>
              <div><strong class="bold">${formatCurrency(finalAmount)}</strong></div>
            </div>
          </div>
        </div>
        <div class="terms-section">
          <h3>${quotationT.termsAndConditions}</h3>
          <p class="terms-content">${quotation.terms || quotationT.termsContent}</p>
        </div>
        <div class="footer">
          <p><strong class="bold">${quotationT.thanksMessage}</strong></p>
          <p>${quotationT.contactMessage}</p>
          <p style="margin-top: 10px; font-size: 13px; color: #666;">${quotationT.companyFooter}</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Use puppeteer to generate the PDF
    console.log('🔄 [SEND-EMAIL API] Creating PDF with puppeteer using updated design');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' }); 
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    console.log('✅ [SEND-EMAIL API] PDF generation with updated design completed');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('❌ [SEND-EMAIL API] Error generating PDF with updated design:', error);
    return null;
  }
}
// --- End: Integrated PDF Generation Function ---

export async function POST(request: NextRequest) {
  try {
    // Use formData to handle the multipart/form-data request
    const formData = await request.formData();
    
    const email = formData.get('email') as string;
    const quotationId = formData.get('quotation_id') as string;
    const language = (formData.get('language') as string) || 'en';
    
    console.log('🔄 [SEND-EMAIL API] Received request for quotation:', quotationId);
    
    if (!email || !quotationId) {
      console.error('❌ [SEND-EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ [SEND-EMAIL API] Not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Always fetch the latest quotation data
    console.log('🔄 [SEND-EMAIL API] Fetching latest quotation data');
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, customers (*)') // Include customer data if needed for billing/info
      .eq('id', quotationId)
      .single();
    
    if (error || !quotation) {
      console.error('❌ [SEND-EMAIL API] Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ [SEND-EMAIL API] Found quotation:', { id: quotation.id, email: quotation.customer_email });
    
    // Generate a fresh PDF from the latest data using the new function
    console.log('🔄 [SEND-EMAIL API] Generating fresh PDF for email attachment');
    
    // Call the integrated PDF generation function
    const pdfBuffer = await generateQuotationPDF(quotation, language);
    
    if (!pdfBuffer) {
      console.error('❌ [SEND-EMAIL API] Failed to generate PDF');
      return NextResponse.json(
        { error: 'Failed to generate PDF attachment' },
        { status: 500 }
      );
    }
    
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ [SEND-EMAIL API] RESEND_API_KEY environment variable is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
    
    // Get the public URL for the Driver logo (needed for email body, not PDF)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    
    // Determine if this is an updated quotation
    const isUpdated = quotation.status === 'sent';
    
    // Create email content with appropriate subject line
    const subjectPrefix = isUpdated ? 
      (language === 'ja' ? '更新した見積書' : 'Your Updated Quotation') : 
      (language === 'ja' ? 'ドライバーからの見積書' : 'Your Quotation');
    
    const emailSubject = `${subjectPrefix} - ${formattedQuotationId}`;
    
    // Format the customer name nicely
    const customerName = quotation.customer_name || email.split('@')[0];
    
    // Create the email content using existing helper functions
    const emailHtml = generateEmailHtml(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated);
    const textContent = generateEmailText(language, customerName, formattedQuotationId, quotation, appUrl, isUpdated);
    
    console.log('🔄 [SEND-EMAIL API] Sending email with PDF attachment');
    
    try {
      const { data: emailData, error: resendError } = await resend.emails.send({
        from: `Driver Japan <booking@${emailDomain}>`,
        to: [email],
        subject: emailSubject,
        text: textContent,
        html: emailHtml,
        attachments: [{
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer.toString('base64') // Ensure content is base64 encoded
        }]
      });
    
      if (resendError) {
        console.error('❌ [SEND-EMAIL API] Error sending email with Resend:', resendError);
        throw resendError;
      }
      
      console.log('✅ [SEND-EMAIL API] Email sent successfully! ID:', emailData?.id);
      
      // Update quotation status to 'sent' and last_sent details
      await supabase
        .from('quotations')
        .update({ 
          status: 'sent',
          last_sent_at: new Date().toISOString(),
          last_sent_to: email,
          // Update expiry date to 30 days from now (or keep existing logic if preferred)
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', quotationId);
    
      // Log activity
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          user_id: session.user.id,
          action: 'email_sent',
          details: { 
            email: email,
            sent_at: new Date().toISOString(),
            sent_by: session.user.email
          }
        });
      
      return NextResponse.json({ 
        success: true,
        message: 'Email sent successfully',
        emailId: emailData?.id 
      });
      
    } catch (err) {
      console.error('❌ [SEND-EMAIL API] Error sending email:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to send email' },
        { status: 500 }
      );
    }
    
  } catch (err) {
    console.error('❌ [SEND-EMAIL API] Unhandled error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to generate email HTML content
function generateEmailHtml(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, isUpdated: boolean = false) {
  const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
  const isJapanese = language === 'ja';
    
  // Format quotation details for display
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  // Format pricing information
  const formatCurrency = (amount: number) => {
    const currency = quotation.currency || 'THB';
    return new Intl.NumberFormat(isJapanese ? 'ja-JP' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Recalculate values for email body display
  let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 0;
  let baseAmount = hourlyRate * serviceDays;

  if (quotation.total_amount && baseAmount === 0) {
    const totalAmt = parseFloat(String(quotation.total_amount));
    const discPerc = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
    const taxPerc = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
    let calcTotal = totalAmt;
    let subtotalPreTax = calcTotal;
    if (taxPerc > 0) subtotalPreTax = calcTotal / (1 + (taxPerc / 100));
    if (discPerc > 0) baseAmount = subtotalPreTax / (1 - (discPerc / 100));
    else baseAmount = subtotalPreTax;
    // Ensure hourlyRate is updated if derived
    if (serviceDays > 0) {
        hourlyRate = baseAmount / serviceDays; 
    }
  }

  const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
  let discountAmount = 0;
  let subtotalAmount = baseAmount;
  if (hasDiscount) {
    const discountPercentage = parseFloat(String(quotation.discount_percentage));
    discountAmount = (baseAmount * discountPercentage) / 100;
    subtotalAmount = baseAmount - discountAmount;
  }
  
  const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
  let taxAmount = 0;
  if (hasTax) {
    const taxPercentage = parseFloat(String(quotation.tax_percentage));
    taxAmount = (subtotalAmount * taxPercentage) / 100;
  }

  const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : (subtotalAmount + taxAmount);
    
  // Customize greeting based on whether this is an update
  const greetingText = isUpdated
    ? (isJapanese ? '見積書が更新されました。' : 'Your quotation has been updated.')
    : (isJapanese ? 'お見積りありがとうございます。' : 'Thank you for your quotation request.');
  
  // Email HTML template
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${emailTemplates[language].subject}</title>
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
          font-size: 14px;
        }
        @media only screen and (max-width:600px) {
          .container { width:100%!important; }
          .stack { display:block!important; width:100%!important; text-align:center!important; }
        }
        .details-table td, .details-table th {
          padding: 10px 0;
          font-size: 14px;
        }
        .details-table th {
           color: #8898AA;
           text-transform: uppercase;
           text-align: left;
        }
        .price-table th, .price-table td {
           padding: 10px 0;
           font-size: 14px;
        }
         .price-table th {
           color: #8898AA;
           text-transform: uppercase;
        }
      </style>
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
              
              <!-- HEADER -->
              <tr>
                <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
                  <table width="100%" role="presentation">
                    <tr>
                      <td align="center" style="padding:24px;">
                        <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                          <tr><td align="center" valign="middle" style="text-align:center;">
                              <img src="${logoUrl}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                          </td></tr>
                        </table>
                        <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
                          ${language === 'ja' ? 
                            `見積書${isUpdated ? '更新' : ''}` : 
                            `Your Quotation ${isUpdated ? 'Updated' : ''} from Driver`}
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${language === 'ja' ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
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
                    ${emailTemplates[language].greeting} ${customerName},<br><br>
                    ${greetingText}
                  </p>
                </td>
              </tr>
              
              <!-- SERVICE DETAILS BLOCK -->
              <tr>
                <td style="padding:12px 24px 12px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th width="30%">${isJapanese ? 'サービスタイプ:' : 'SERVICE TYPE'}</th>
                            <td>${serviceType}</td>
                          </tr>
                          <tr>
                            <th>${isJapanese ? '車両:' : 'VEHICLE'}</th>
                            <td>${vehicleType}</td>
                          </tr>
                          <tr>
                            <th>${isJapanese ? '時間:' : 'HOURS'}</th>
                            <td>${hours} ${durationUnit}</td>
                          </tr>
                          ${serviceDays > 1 ? `
                          <tr>
                            <th>${isJapanese ? '日数:' : 'NUMBER OF DAYS'}</th>
                            <td>${serviceDays}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- PRICE DETAILS BLOCK (using recalculated values) -->
              <tr>
                <td style="padding:12px 24px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${isJapanese ? '価格詳細' : 'PRICE DETAILS'}
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="price-table"
                        style="background:#F8FAFC; border-radius:8px;">
                    <tr>
                      <td style="padding:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                              ${isJapanese ? '内容' : 'DESCRIPTION'}
                            </th>
                            <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                              ${isJapanese ? '価格' : 'PRICE'}
                            </th>
                          </tr>
                          <tr>
                            <td style="padding-top: 15px;">${vehicleType}</td>
                            <td align="right" style="padding-top: 15px;"></td>
                          </tr>
                          <tr>
                            <td>${isJapanese ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</td>
                            <td align="right">${formatCurrency(hourlyRate)}</td>
                          </tr>
                          ${serviceDays > 1 ? `
                          <tr>
                            <td style="color: #666;">${isJapanese ? '日数' : 'Number of Days'}</td>
                            <td align="right">× ${serviceDays}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? '基本料金' : 'Base Amount'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(baseAmount)}</td>
                          </tr>
                          ${hasDiscount ? `
                          <tr>
                            <td style="color: #e53e3e;">${isJapanese ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}</td>
                            <td align="right" style="color: #e53e3e;">-${formatCurrency(discountAmount)}</td>
                          </tr>
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${isJapanese ? '小計' : 'Subtotal'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 500;">${formatCurrency(subtotalAmount)}</td>
                          </tr>
                          ` : ''}
                          ${hasTax ? `
                          <tr>
                            <td style="color: #666;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</td>
                            <td align="right" style="color: #666;">+${formatCurrency(taxAmount)}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${isJapanese ? '合計金額' : 'Total Amount'}</td>
                            <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: 700;">${formatCurrency(finalAmount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:12px 24px 24px; text-align: center;">
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align: left;">
                    ${emailTemplates[language].followup}
                  </p>
                  <a href="${appUrl}/quotations/${quotation.id}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600; text-align: center;">
                    ${emailTemplates[language].callToAction}
                  </a>
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${emailTemplates[language].regards}<br>
                    ${emailTemplates[language].company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${emailTemplates[language].company}</p>
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
    </html>`;
  
  return emailHtml;
}

// Helper function to generate email Text content
function generateEmailText(language: string, customerName: string, formattedQuotationId: string, quotation: any, appUrl: string, isUpdated: boolean = false) {
  const isJapanese = language === 'ja';
  const serviceType = quotation.service_type || 'Transportation Service';
  const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
  const hours = quotation.duration_hours || quotation.hours_per_day || 8;
  const serviceDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
  const durationUnit = isJapanese ? '時間' : 'hours';
  
  const formatCurrency = (amount: number) => {
    const currency = quotation.currency || 'THB';
    return `${currency} ${amount.toLocaleString(isJapanese ? 'ja-JP' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Recalculate final amount for text email
  let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 0;
  let baseAmount = hourlyRate * serviceDays;
  if (quotation.total_amount && baseAmount === 0) {
      const totalAmt = parseFloat(String(quotation.total_amount));
      const discPerc = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
      const taxPerc = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
      let calcTotal = totalAmt;
      let subtotalPreTax = calcTotal;
      if (taxPerc > 0) subtotalPreTax = calcTotal / (1 + (taxPerc / 100));
      if (discPerc > 0) baseAmount = subtotalPreTax / (1 - (discPerc / 100));
      else baseAmount = subtotalPreTax;
  }
  const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
  let subtotalAmount = baseAmount;
  if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      subtotalAmount = baseAmount - (baseAmount * discountPercentage / 100);
  }
  const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
  let taxAmount = 0;
  if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      taxAmount = (subtotalAmount * taxPercentage) / 100;
  }
  const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : (subtotalAmount + taxAmount);

  const greetingText = isUpdated
    ? (isJapanese ? '見積書が更新されました。' : 'Your quotation has been updated.')
    : (isJapanese ? 'お見積りありがとうございます。' : 'Thank you for your quotation request.');
    
  const textContent = `
${emailTemplates[language].subject} - #${formattedQuotationId}

${emailTemplates[language].greeting} ${customerName},

${greetingText} ${emailTemplates[language].intro}

${isJapanese ? 'サービス概要' : 'SERVICE SUMMARY'}:
- ${isJapanese ? 'サービスタイプ' : 'SERVICE TYPE'}: ${serviceType}
- ${isJapanese ? '車両' : 'VEHICLE'}: ${vehicleType}
- ${isJapanese ? '時間' : 'HOURS'}: ${hours} ${durationUnit}
${serviceDays > 1 ? `- ${isJapanese ? '日数' : 'NUMBER OF DAYS'}: ${serviceDays}` : ''}

${isJapanese ? '価格詳細' : 'PRICE DETAILS'}:
- ${isJapanese ? '合計金額' : 'TOTAL AMOUNT'}: ${formatCurrency(finalAmount)}

${emailTemplates[language].followup}

${emailTemplates[language].callToAction}: ${appUrl}/quotations/${quotation.id}

${emailTemplates[language].additionalInfo}
${emailTemplates[language].closing}

${emailTemplates[language].regards}
${emailTemplates[language].company}
  `;
  return textContent;
} 