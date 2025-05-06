import puppeteer from 'puppeteer';

/**
 * Generates a PDF from HTML content using Puppeteer
 * This server-side implementation matches the client-side html2pdf implementation
 * 
 * @param htmlContent The HTML content to convert to PDF
 * @param options Additional options for PDF generation
 * @returns Buffer containing the PDF data
 */
export async function generatePdfFromHtml(htmlContent: string, options?: {
  format?: 'A4' | 'Letter' | 'Legal';
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  printBackground?: boolean;
  scale?: number;
}): Promise<Buffer> {
  // Default options
  const defaultOptions = {
    format: 'A4',
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    printBackground: true,
    scale: 1
  };

  // Merge default options with provided options
  const pdfOptions = {
    ...defaultOptions,
    ...options,
    margin: { ...defaultOptions.margin, ...(options?.margin || {}) }
  };

  // Create the full HTML document with Work Sans font
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PDF Export</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap">
      <style>
        body {
          font-family: 'Work Sans', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  try {
    // Launch a new browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Set content and wait for network idle
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: pdfOptions.format as any, 
      margin: {
        top: pdfOptions.margin.top,
        right: pdfOptions.margin.right,
        bottom: pdfOptions.margin.bottom,
        left: pdfOptions.margin.left
      },
      printBackground: pdfOptions.printBackground,
      scale: pdfOptions.scale
    });

    // Close the browser
    await browser.close();

    // Convert to proper Buffer
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generates HTML for quotation that exactly matches the design in quotation-pdf-button.tsx
 * 
 * @param quotation The quotation data
 * @param language Language code ('en' or 'ja')
 * @returns HTML content string
 */
export function generateQuotationHtml(quotation: any, language: 'en' | 'ja' = 'en'): string {
  // Quotation translations for different languages (same as client-side)
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
        price: 'Price'
      },
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax',
      total: 'Total Amount',
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
        price: '価格'
      },
      subtotal: '小計',
      discount: '割引',
      tax: '税金',
      total: '合計金額',
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

  // Get translations for the selected language
  const quotationT = quotationTranslations[language];
  const isJapanese = language === 'ja';

  // Format quotation number with JPDR prefix and padding
  const formattedQuotationId = `JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  // Prepare dates
  const creationDate = quotation?.created_at ? new Date(quotation.created_at) : new Date();
  const validDays = quotation?.valid_days || 2;
  const expiryDate = new Date(creationDate);
  expiryDate.setDate(expiryDate.getDate() + validDays);
  
  // Get service details
  const vehicleType = quotation?.vehicle_type || 'Toyota Alphard Executive Lounge';
  const hours = quotation?.duration_hours || quotation?.hours_per_day || 8;
  const serviceDays = quotation?.service_days || 1;
  
  // Calculate pricing
  let hourlyRate = quotation?.amount ? (quotation.amount / serviceDays) : 0;
  let baseAmount = quotation?.amount || 0;
  const currency = quotation?.currency || 'THB';
  
  // Format currency helper
  const formatCurrency = (value: number): string => {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  // Process discount and tax calculations
  const hasDiscount = quotation?.discount_percentage && parseFloat(String(quotation.discount_percentage)) > 0;
  let discountAmount = 0;
  let subtotalAmount = baseAmount;
  
  if (hasDiscount) {
    const discountPercentage = parseFloat(String(quotation.discount_percentage));
    discountAmount = (baseAmount * discountPercentage) / 100;
    subtotalAmount = baseAmount - discountAmount;
  }
  
  const hasTax = quotation?.tax_percentage && parseFloat(String(quotation.tax_percentage)) > 0;
  let taxAmount = 0;
  let totalAmount = subtotalAmount;
  
  if (hasTax) {
    const taxPercentage = parseFloat(String(quotation.tax_percentage));
    taxAmount = (subtotalAmount * taxPercentage) / 100;
    totalAmount = subtotalAmount + taxAmount;
  }
  
  const finalAmount = quotation?.total_amount || totalAmount;

  // Customer information
  const customerName = quotation?.customer_name || (quotation?.customers?.name || 'N/A');
  const customerEmail = quotation?.customer_email || (quotation?.customers?.email || 'N/A');
  const customerPhone = quotation?.customer_phone || (quotation?.customers?.phone || 'N/A');
  
  // Billing information check
  const hasBillingInfo = quotation?.billing_company_name || 
                         quotation?.billing_tax_number || 
                         quotation?.billing_street_name || 
                         quotation?.billing_street_number ||
                         quotation?.billing_city ||
                         quotation?.billing_state ||
                         quotation?.billing_postal_code ||
                         quotation?.billing_country;

  // Generate HTML that exactly matches the client-side implementation
  const html = `
    <div style="font-family: 'Work Sans', sans-serif; color: #333; background-color: #fff; padding: 10px 0px 0px; width: 180mm; box-sizing: border-box; position: relative; margin: 0 auto; border-top: 2px solid #FF2600;">
      
      <!-- Company Logo -->
      <div style="text-align: left; margin-bottom: 30px; margin-top: 30px;">
        <img src="https://driver-companion.vercel.app/img/driver-header-logo.png" alt="Driver Logo" style="height: 50px;">
      </div>
      
      <!-- Header Container -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; width: 100%;">
        
        <!-- Quotation Title and Details (Left) -->
        <div style="flex: 1; text-align: left; max-width: 50%;">
          <h1 style="color: #333; margin: 0 0 15px 0; font-size: 24px; font-weight: bold;">${quotationT.quotation}</h1>
          <p style="margin: 0 0 5px 0; font-weight: normal; font-size: 13px;">${quotationT.quotationNumber} ${formattedQuotationId}</p>
          <p style="margin: 0 0 5px 0; font-size: 13px;">${quotationT.quotationDate} ${creationDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}</p>
          <p style="margin: 0 0 5px 0; font-size: 13px;">${quotationT.expiryDate} ${expiryDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US')}</p>
          <p style="margin: 0; font-size: 13px;">${quotationT.validFor} ${validDays} ${quotationT.days}</p>
        </div>
        
        <!-- Company Information (Right) -->
        <div style="flex: 1; max-width: 40%; text-align: right;">
          <h2 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">${quotationT.companyName}</h2>
          <p style="margin: 0 0 2px 0; font-size: 13px;">${quotationT.companyAddress1}</p>
          <p style="margin: 0 0 2px 0; font-size: 13px;">${quotationT.companyAddress2}</p>
          <p style="margin: 0 0 2px 0; font-size: 13px;">${quotationT.companyAddress3}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px;">${quotationT.companyAddress4}</p>
          <p style="margin: 0 0 10px 0; font-size: 13px;">${quotationT.companyTaxId}</p>
        </div>
      </div>
      
      <!-- Customer Info Section -->
      <div style="margin-bottom: 30px; width: 100%;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">${quotationT.billingAddress}</h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; font-size: 13px;">${customerName}</p>
        <p style="margin: 0 0 3px 0; font-size: 13px;">${customerEmail}</p>
        <p style="margin: 0 0 15px 0; font-size: 13px;">${customerPhone}</p>
        
        ${hasBillingInfo ? `
          ${quotation?.billing_company_name ? `
            <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>${quotationT.companyNameLabel}</strong> ${quotation.billing_company_name}</p>
          ` : ''}
          
          ${quotation?.billing_tax_number ? `
            <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>${quotationT.taxNumber}</strong> ${quotation.billing_tax_number}</p>
          ` : ''}
          
          ${quotation?.billing_street_name || quotation?.billing_street_number ? `
            <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>${quotationT.address}</strong> ${quotation.billing_street_name || ''} ${quotation.billing_street_number || ''}</p>
          ` : ''}
          
          ${quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code ? `
            <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>${quotationT.cityStatePostal}</strong> ${quotation.billing_city || ''} ${quotation.billing_state ? ', ' + quotation.billing_state : ''} ${quotation.billing_postal_code ? ', ' + quotation.billing_postal_code : ''}</p>
          ` : ''}
          
          ${quotation?.billing_country ? `
            <p style="margin: 0; font-size: 13px;"><strong>${quotationT.country}</strong> ${quotation.billing_country}</p>
          ` : ''}
        ` : ''}
      </div>
      
      <!-- Price Details Section -->
      <div style="margin-bottom: 30px; width: 100%;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold;">${quotationT.priceDetails}</h3>
        
        <div style="background-color: #f3f3f3; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
          <!-- Header Row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">
            <div style="font-weight: bold; font-size: 13px;">${quotationT.items.description}</div>
            <div style="font-weight: bold; font-size: 13px;">${quotationT.items.price}</div>
          </div>
          
          <!-- Vehicle Type Row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div style="font-size: 13px;">${vehicleType}</div>
            <div style="font-size: 13px;"></div>
          </div>
          
          <!-- Hourly Rate Row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div style="font-size: 13px;">Hourly Rate (${hours} hours / day)</div>
            <div style="font-size: 13px; font-weight: medium;">${formatCurrency(hourlyRate)}</div>
          </div>
          
          <!-- Number of Days Row (if more than 1) -->
          ${serviceDays > 1 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <div style="font-size: 13px; color: #666;">Number of Days</div>
              <div style="font-size: 13px;">× ${serviceDays}</div>
            </div>
          ` : ''}
          
          <!-- Base Amount Row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 13px; font-weight: medium;">Base Amount</div>
            <div style="font-size: 13px; font-weight: medium;">${formatCurrency(baseAmount)}</div>
          </div>
          
          <!-- Discount Row (if applicable) -->
          ${hasDiscount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #e53e3e;">
              <div style="font-size: 13px;">Discount (${parseFloat(String(quotation.discount_percentage))}%)</div>
              <div style="font-size: 13px;">-${formatCurrency(discountAmount)}</div>
            </div>
            
            <!-- Subtotal Row -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 13px; font-weight: medium;">Subtotal</div>
              <div style="font-size: 13px; font-weight: medium;">${formatCurrency(subtotalAmount)}</div>
            </div>
          ` : ''}
          
          <!-- Tax Row (if applicable) -->
          ${hasTax ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #666;">
              <div style="font-size: 13px;">Tax (${parseFloat(String(quotation.tax_percentage))}%)</div>
              <div style="font-size: 13px;">+${formatCurrency(taxAmount)}</div>
            </div>
          ` : ''}
          
          <!-- Total Amount Row -->
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 13px; font-weight: bold;">Total Amount</div>
            <div style="font-size: 13px; font-weight: bold;">${formatCurrency(finalAmount)}</div>
          </div>
        </div>
      </div>
      
      <!-- Terms and Conditions -->
      <div style="margin-bottom: 25px; width: 100%;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold;">${quotationT.termsAndConditions}</h3>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; white-space: pre-line;">${quotation?.terms || quotationT.termsContent}</p>
      </div>
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; padding-bottom: 20px; text-align: center; margin-top: 20px; width: 100%;">
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333; text-align: center;">${quotationT.thanksMessage}</p>
        <p style="margin: 0 0 5px 0; font-size: 13px; text-align: center;">${quotationT.contactMessage}</p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; text-align: center;">${quotationT.companyFooter}</p>
      </div>
    </div>
  `;

  return html;
} 