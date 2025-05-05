import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import puppeteer from 'puppeteer'
// Remove the import that might not exist
// import { generateQuotationHtml } from '../send/route'

// Email templates for different languages
const reminderTemplates = {
  en: {
    subject: 'Reminder: Your Quotation from Driver',
    greeting: 'Hello',
    intro: 'We wanted to remind you about the quotation we sent recently.',
    followup: 'Your quotation is still available for review. If you would like to proceed, please click the button below.',
    additionalInfo: 'From your online quote you can accept, decline, comment or print.',
    callToAction: 'View Your Quotation Online',
    closing: 'We look forward to hearing from you.',
    regards: 'Best regards,',
    company: 'Driver (Thailand) Company Limited'
  },
  ja: {
    subject: 'リマインダー: ドライバーからの見積書',
    greeting: 'こんにちは',
    intro: '先日お送りした見積書についてリマインドさせていただきます。',
    followup: 'お見積もりはまだご確認いただけます。ご検討いただける場合は、以下のボタンをクリックしてください。',
    additionalInfo: 'オンライン見積もりから、承諾、辞退、コメント、印刷ができます。',
    callToAction: 'オンラインで見積書を確認',
    closing: 'ご連絡をお待ちしております。',
    regards: '敬具',
    company: 'Driver (Thailand) Company Limited'
  }
};

// Function to generate custom PDF that matches the design in quotation-pdf-button.tsx
async function generateQuotationPDF(quotation: any, language: string): Promise<Buffer | null> {
  try {
    console.log('🔄 [SEND-REMINDER API] Starting PDF generation with updated design');
    
    const isJapanese = language === 'ja';
    
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
    
    // Format currency helper - adapted from quotation-pdf-button.tsx
    const formatCurrency = (amount: number) => {
      // Use quotation currency if available, otherwise default to THB as seen in the screenshot
      const currency = quotation.currency || 'THB'; 
      // Ensure 2 decimal places as seen in the screenshot
      return `${currency} ${amount.toLocaleString(isJapanese ? 'ja-JP' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; 
    };
    
    // Prepare quotation data
    const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
    const creationDate = quotation.created_at ? new Date(quotation.created_at) : new Date();
    const validDays = quotation.valid_days || 2;
    const expiryDate = new Date(creationDate);
    expiryDate.setDate(expiryDate.getDate() + validDays);
    
    // Get service details
    const vehicleType = quotation.vehicle_type || 'Standard Vehicle'; // Use a default if not present
    const hours = quotation.duration_hours || quotation.hours_per_day || 8;
    const numDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
    
    // Calculate pricing (using the logic added previously to handle 0 values)
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
    
    // Base64 encoded logo - Replace with the actual logo from quotation-pdf-button if needed
    // For now, using a placeholder to avoid excessively long code edit string
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVHhe7cExAQAAAMKg9U9tCj8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADipAQK8AAFEDckVAAAAAElFTkSuQmCC'; // Simplified placeholder

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
          padding: 0; /* Removed body padding */
          color: #333;
          background-color: #fff;
          font-size: 13px; /* Base font size */
          line-height: 1.5;
        }
        .container {
          width: 180mm; /* A4 width minus margins */
          margin: 10px auto; /* Center container, add top margin */
          border-top: 2px solid #FF2600;
          padding: 10px 0 0; /* Padding top inside container */
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
          font-weight: bold; /* Make company name bold */
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
          padding: 3px 0; /* Added slight padding */
        }
        .price-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          font-weight: bold;
          text-transform: uppercase; /* Uppercase header */
          color: #8898AA; /* Header color */
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
          margin: 0 0 3px 0; /* Reduced paragraph bottom margin */
          font-size: 13px;
        }
        h3 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 14px;
            font-weight: bold;
        }
        strong { font-weight: 500; } /* Medium weight for strong */
        .bold { font-weight: bold; } /* Actual bold */
        .alt-row {
          /* Alternating row style not explicitly used, use background on container */
        }
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
        <!-- Company Logo -->
        <div class="logo-container">
          <img src="${logoBase64}" alt="Driver Logo" class="logo">
        </div>
        
        <!-- Header with company and quotation info -->
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
        
        <!-- Customer info section -->
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
        
        <!-- Price details -->
        <div class="price-details-section">
          <h3>${quotationT.priceDetails}</h3>
          
          <div class="price-container">
            <div class="price-header">
              <div>${quotationT.items.description}</div>
              <div>${quotationT.items.price}</div>
            </div>
            
            <!-- Vehicle Type -->
            <div class="price-row">
              <div>${vehicleType}</div>
              <div></div> <!-- Empty price cell -->
            </div>
            
            <!-- Hourly Rate -->
            <div class="price-row">
              <div>${isJapanese ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</div>
              <div>${formatCurrency(hourlyRate)}</div>
            </div>
            
            <!-- Number of Days if more than 1 -->
            ${numDays > 1 ? `
            <div class="price-row">
              <div style="color: #666;">${isJapanese ? '日数' : 'Number of Days'}</div>
              <div>× ${numDays}</div>
            </div>
            ` : ''}
            
            <!-- Base Amount -->
            <div class="price-row border-top">
              <div><strong>${isJapanese ? '基本料金' : 'Base Amount'}</strong></div>
              <div><strong>${formatCurrency(baseAmount)}</strong></div>
            </div>
            
            <!-- Discount if applicable -->
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
            
            <!-- Tax if applicable -->
            ${hasTax ? `
            <div class="price-row">
              <div style="color: #666;">${isJapanese ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}</div>
              <div>+${formatCurrency(taxAmount)}</div>
            </div>
            ` : ''}
            
            <!-- Total Amount -->
            <div class="price-row border-top">
              <div><strong class="bold">${isJapanese ? '合計金額' : 'Total Amount'}</strong></div>
              <div><strong class="bold">${formatCurrency(finalAmount)}</strong></div>
            </div>
          </div>
        </div>
        
        <!-- Terms and Conditions -->
        <div class="terms-section">
          <h3>${quotationT.termsAndConditions}</h3>
          <p class="terms-content">${quotation.terms || quotationT.termsContent}</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong class="bold">${quotationT.thanksMessage}</strong></p>
          <p>${quotationT.contactMessage}</p>
          <p style="margin-top: 10px; font-size: 13px; color: #666;">${quotationT.companyFooter}</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Use puppeteer to generate the PDF with improved compatibility and error handling
    console.log('🔄 [SEND-REMINDER API] Creating PDF with puppeteer using updated design');
    
    let browser: any = null;
    try {
      // Enhanced puppeteer launch configuration that works in both environments
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set reasonable timeout and monitor for console errors
      page.setDefaultNavigationTimeout(30000);
      page.on('console', msg => console.log(`🔍 [PDF-BROWSER] ${msg.text()}`));
      page.on('pageerror', error => console.error(`❌ [PDF-BROWSER] ${error.message}`));
      
      await page.setContent(htmlContent, { 
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 30000 
      });
      
      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        preferCSSPageSize: true,
        scale: 0.98 // Slightly reduce scale to ensure fitting
      });
      
      const bufferSize = pdfBuffer.length / 1024 / 1024; // Size in MB
      console.log(`✅ [SEND-REMINDER API] PDF generation completed. Size: ${bufferSize.toFixed(2)}MB`);
      
      if (bufferSize > 9) {
        console.warn(`⚠️ [SEND-REMINDER API] PDF size approaching Resend's 10MB limit: ${bufferSize.toFixed(2)}MB`);
      }
      
      return Buffer.from(pdfBuffer);
    } catch (puppeteerError) {
      console.error('❌ [SEND-REMINDER API] Error during Puppeteer PDF generation:', puppeteerError);
      throw puppeteerError; // Let the caller handle this error
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('✅ [SEND-REMINDER API] Browser instance closed successfully');
        } catch (closeError) {
          console.error('❌ [SEND-REMINDER API] Error closing browser:', closeError);
        }
      }
    }
  } catch (error) {
    console.error('❌ [SEND-REMINDER API] Error in PDF generation process:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON request body
    const { id, language = 'en', includeQuotation = true } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get template based on language
    const lang = language === 'ja' ? 'ja' : 'en';
    const template = reminderTemplates[lang];
    
    // Fetch quotation data for email content
    const supabase = await createServerSupabaseClient();
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: quotationData, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !quotationData) {
      console.error('Error fetching quotation data:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Use type assertion to handle potentially missing properties
    const quotation = quotationData as any;
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com';
    
    // Get the public URL for the Driver logo
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const logoUrl = `${appUrl}/img/driver-invoice-logo.png`;
    
    // Create the quotation view URL
    const quotationUrl = `${appUrl}/quotations/${id}`;
    
    // Format quotation ID to use JPDR prefix
    const formattedQuotationId = `JPDR-${quotation.quote_number || id}`;
    
    // Customer name with fallback
    const customerName = quotation.customer_name || 
                        (quotation.customer_email?.split('@')[0]) || 
                        (lang === 'ja' ? 'お客様' : 'Customer');
    
    // Format currency
    const formatCurrency = (amount) => {
      const currency = quotation.currency || 'JPY';
      return new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
        style: 'currency',
        currency
      }).format(amount);
    };
    
    // Get service details
    const serviceType = quotation.service_type || 'Transportation Service';
    const vehicleType = quotation.vehicle_type || 'Standard Vehicle';
    const hours = quotation.duration_hours || quotation.hours_per_day || 8;
    const numDays = quotation.service_days || quotation.number_of_days || quotation.duration_days || 1;
    const durationUnit = lang === 'ja' ? '時間' : 'hours';
    
    // Calculate pricing
    let hourlyRate = quotation.price_per_day || quotation.hourly_rate || quotation.daily_rate || 
                     (quotation.price_details?.hourly_rate) || 0;
    let baseAmount = hourlyRate * numDays;
    
    // If we have total_amount but the calculated baseAmount is 0, work backwards
    if (quotation.total_amount && baseAmount === 0) {
      const totalAmount = parseFloat(String(quotation.total_amount));
      
      // Get tax and discount percentages
      const discountPercentage = quotation.discount_percentage ? parseFloat(String(quotation.discount_percentage)) : 0;
      const taxPercentage = quotation.tax_percentage ? parseFloat(String(quotation.tax_percentage)) : 0;
      
      // Calculate backwards to get the base amount
      let calculatedTotal = totalAmount;
      let subtotalBeforeTax = calculatedTotal;
      
      // If there's tax, remove it
      if (taxPercentage > 0) {
        subtotalBeforeTax = calculatedTotal / (1 + (taxPercentage / 100));
      }
      
      // If there's discount, add it back
      if (discountPercentage > 0) {
        baseAmount = subtotalBeforeTax / (1 - (discountPercentage / 100));
      } else {
        baseAmount = subtotalBeforeTax;
      }
      
      // Calculate hourly rate
      hourlyRate = baseAmount / numDays;
      
      console.log('Recalculated pricing from total:', {
        totalAmount,
        baseAmount,
        hourlyRate,
        numDays,
        taxPercentage,
        discountPercentage
      });
    }
    
    // Calculate discount amount if applicable
    const hasDiscount = quotation.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
    let discountAmount = 0;
    let subtotalAmount = baseAmount;
    
    if (hasDiscount) {
      const discountPercentage = parseFloat(String(quotation.discount_percentage));
      discountAmount = (baseAmount * discountPercentage) / 100;
      subtotalAmount = baseAmount - discountAmount;
    }
    
    // Calculate tax amount if applicable
    const hasTax = quotation.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
    let taxAmount = 0;
    let totalAmount = subtotalAmount;
    
    if (hasTax) {
      const taxPercentage = parseFloat(String(quotation.tax_percentage));
      taxAmount = (subtotalAmount * taxPercentage) / 100;
      totalAmount = subtotalAmount + taxAmount;
    }

    // Ensure total_amount is set - if we have a value from the database, use it
    const finalAmount = quotation.total_amount ? parseFloat(String(quotation.total_amount)) : totalAmount;
    
    // Generate quotation details HTML if includeQuotation is true
    const quotationDetailsHtml = includeQuotation ? `
      <!-- SERVICE DETAILS SECTION -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#F8FAFC; border-radius:8px; margin-bottom: 20px;">
        <tr>
          <td style="padding:12px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="30%" style="padding: 10px 0 15px 0;"><span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${lang === 'ja' ? 'サービスタイプ:' : 'SERVICE TYPE'}</span></td>
                <td width="70%" style="padding: 10px 0 15px 0;">${serviceType}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0 15px 0;"><span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${lang === 'ja' ? '車両:' : 'VEHICLE'}</span></td>
                <td style="padding: 10px 0 15px 0;">${vehicleType}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0 15px 0;"><span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${lang === 'ja' ? '時間:' : 'HOURS'}</span></td>
                <td style="padding: 10px 0 15px 0;">${hours} ${durationUnit}</td>
              </tr>
              ${numDays > 1 ? `
              <tr>
                <td style="padding: 10px 0 15px 0;"><span style="font-size:14px; color:#8898AA; text-transform:uppercase;">${lang === 'ja' ? '日数:' : 'NUMBER OF DAYS'}</span></td>
                <td style="padding: 10px 0 15px 0;">${numDays}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- PRICE DETAILS SECTION -->
      <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
        ${lang === 'ja' ? '価格詳細' : 'PRICE DETAILS'}
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="background:#F8FAFC; border-radius:8px;">
        <tr>
          <td style="padding:12px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; padding-top: 10px; color: #8898AA; text-transform: uppercase;">
                  ${lang === 'ja' ? '内容' : 'DESCRIPTION'}
                </th>
                <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; padding-top: 10px; color: #8898AA; text-transform: uppercase;">
                  ${lang === 'ja' ? '価格' : 'PRICE'}
                </th>
              </tr>
              
              <!-- Vehicle Type -->
              <tr>
                <td style="padding-top: 15px; padding-bottom: 5px; background-color: #f8f9fa;">${vehicleType}</td>
                <td align="right" style="padding-top: 15px; padding-bottom: 5px; background-color: #f8f9fa;"></td>
              </tr>
              
              <!-- Hourly Rate -->
              <tr>
                <td style="padding-top: 10px; padding-bottom: 10px;">${lang === 'ja' ? `時間料金 (${hours} 時間 / 日)` : `Hourly Rate (${hours} hours / day)`}</td>
                <td align="right" style="padding-top: 10px; padding-bottom: 10px;">${formatCurrency(hourlyRate)}</td>
              </tr>
              
              <!-- Number of Days if more than 1 -->
              ${numDays > 1 ? `
              <tr>
                <td style="color: #666; padding-top: 10px; padding-bottom: 10px; background-color: #f8f9fa;">${lang === 'ja' ? '日数' : 'Number of Days'}</td>
                <td align="right" style="padding-top: 10px; padding-bottom: 10px; background-color: #f8f9fa;">× ${numDays}</td>
              </tr>
              ` : ''}
              
              <!-- Base Amount -->
              <tr>
                <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 500; ${numDays > 1 ? '' : 'background-color: #f8f9fa;'}">
                  ${lang === 'ja' ? '基本料金' : 'Base Amount'}
                </td>
                <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 500; ${numDays > 1 ? '' : 'background-color: #f8f9fa;'}">
                  ${formatCurrency(baseAmount)}
                </td>
              </tr>
              
              <!-- Discount if applicable -->
              ${hasDiscount ? `
              <tr>
                <td style="color: #e53e3e; padding-top: 10px; padding-bottom: 10px;">
                  ${lang === 'ja' ? `割引 (${quotation.discount_percentage}%)` : `Discount (${quotation.discount_percentage}%)`}
                </td>
                <td align="right" style="color: #e53e3e; padding-top: 10px; padding-bottom: 10px;">
                  -${formatCurrency(discountAmount)}
                </td>
              </tr>
              
              <!-- Subtotal after discount -->
              <tr>
                <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 500; background-color: #f8f9fa;">
                  ${lang === 'ja' ? '小計' : 'Subtotal'}
                </td>
                <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 500; background-color: #f8f9fa;">
                  ${formatCurrency(subtotalAmount)}
                </td>
              </tr>
              ` : ''}
              
              <!-- Tax if applicable -->
              ${hasTax ? `
              <tr>
                <td style="color: #666; padding-top: 10px; padding-bottom: 10px; ${hasDiscount ? '' : 'background-color: #f8f9fa;'}">
                  ${lang === 'ja' ? `税金 (${quotation.tax_percentage}%)` : `Tax (${quotation.tax_percentage}%)`}
                </td>
                <td align="right" style="color: #666; padding-top: 10px; padding-bottom: 10px; ${hasDiscount ? '' : 'background-color: #f8f9fa;'}">
                  +${formatCurrency(taxAmount)}
                </td>
              </tr>
              ` : ''}
              
              <!-- Total Amount -->
              <tr>
                <td style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 700; ${(hasDiscount && hasTax) || (!hasDiscount && !hasTax) ? 'background-color: #f8f9fa;' : ''}">
                  ${lang === 'ja' ? '合計金額' : 'Total Amount'}
                </td>
                <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 15px; padding-bottom: 10px; font-weight: 700; ${(hasDiscount && hasTax) || (!hasDiscount && !hasTax) ? 'background-color: #f8f9fa;' : ''}">
                  ${formatCurrency(finalAmount)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    ` : '';
    
    // Generate the plain text version of the email
    const textContent = `${template.subject} - #${formattedQuotationId}
      
${template.greeting} ${customerName},

${template.intro}

${includeQuotation ? `${lang === 'ja' ? 'サービス概要' : 'SERVICE SUMMARY'}:
${lang === 'ja' ? 'サービスタイプ' : 'SERVICE TYPE'}: ${serviceType}
${lang === 'ja' ? '車両' : 'VEHICLE'}: ${vehicleType}
${lang === 'ja' ? '時間' : 'HOURS'}: ${hours} ${durationUnit}
${numDays > 1 ? `${lang === 'ja' ? '日数' : 'NUMBER OF DAYS'}: ${numDays}` : ''}

${lang === 'ja' ? '価格詳細' : 'PRICE DETAILS'}:
${lang === 'ja' ? '合計金額' : 'TOTAL AMOUNT'}: ${formatCurrency(finalAmount)}
` : ''}

${template.followup}

${template.callToAction}: ${quotationUrl}

${template.additionalInfo}
${template.closing}

${template.regards}
${template.company}
`;
    
    // Email HTML template with improved styling to match quotation look and feel
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${template.subject}</title>
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
                              <img src="${logoUrl}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                            </td>
                          </tr>
                        </table>
                        <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">${template.subject}</h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          ${lang === 'ja' ? '見積書番号' : 'Quotation'} #${formattedQuotationId}
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
                    ${template.greeting} ${customerName},<br><br>
                    ${template.intro}
                  </p>
                </td>
              </tr>
              
              <!-- QUOTATION DETAILS if includeQuotation is true -->
              ${includeQuotation ? `
              <tr>
                <td style="padding:12px 24px 24px;">
                  <h3 style="margin:0 0 12px; font-size:16px; font-family: Work Sans, sans-serif; color:#32325D; text-transform: uppercase;">
                    ${lang === 'ja' ? 'サービス概要' : 'SERVICE SUMMARY'}
                  </h3>
                  ${quotationDetailsHtml}
                </td>
              </tr>
              ` : ''}
              
              <!-- CTA SECTION -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:0 0 16px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6;">
                    ${template.followup}
                  </p>
                </td>
              </tr>
              
              <!-- CTA BUTTON -->
              <tr>
                <td align="center" style="padding:0 24px 24px;">
                  <a href="${quotationUrl}"
                     style="display:inline-block; padding:12px 24px; background:#E03E2D; color:#FFF;
                            text-decoration:none; border-radius:4px; font-family: Work Sans, sans-serif;
                            font-size:16px; font-weight:600;">
                    ${template.callToAction}
                  </a>
                </td>
              </tr>
              
              <!-- ADDITIONAL INFO BELOW BUTTON -->
              <tr>
                <td style="padding:0px 24px 24px;">
                  <p style="margin:20px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.additionalInfo}
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.closing}
                  </p>
                  <p style="margin:16px 0 8px; font-size:14px; color:#32325D; font-family: Work Sans, sans-serif; line-height:1.6; text-align:center;">
                    ${template.regards}<br>
                    ${template.company}
                  </p>
                </td>
              </tr>
              
              <!-- FOOTER -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">${template.company}</p>
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
    
    // Generate PDF for attachment using the updated function
    let pdfBuffer: Buffer | null = null;
    if (includeQuotation) {
      try {
        pdfBuffer = await generateQuotationPDF(quotation, language);
      } catch (pdfError) {
        console.error('Error generating PDF attachment:', pdfError);
        // Continue without PDF attachment if it fails
      }
    }
    
    // Send the email using the Resend API
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Driver Japan <booking@${emailDomain}>`,
      to: [quotation.customer_email],
      subject: `${template.subject} - #${formattedQuotationId}`,
      text: textContent,
      html: emailHtml,
      attachments: pdfBuffer ? [
        {
          filename: `quotation-${formattedQuotationId}.pdf`,
          content: pdfBuffer.toString('base64')
        }
      ] : []
    });
    
    if (emailError) {
      console.error('Resend API error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reminder email' },
        { status: 500 }
      );
    }
    
    // Record the reminder activity
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session.user.id,
        action: 'reminder_sent',
        details: { 
          sent_at: new Date().toISOString(),
          sent_by: session.user.email
        }
      });
    
    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder email' },
      { status: 500 }
    );
  }
} 