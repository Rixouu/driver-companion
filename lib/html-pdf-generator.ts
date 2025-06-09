import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';

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
      <meta charset=\"utf-8\">
      <title>PDF Export</title>
      <link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap\">
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
    // Check if we're in a production environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    let browser;
    if (isProduction) {
      // Use @sparticuz/chromium for serverless environments (production)
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless, // Use chromium.headless for serverless
      });
    } else {
      // Use regular Puppeteer for local development
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

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
    // It's often better to throw a custom error or re-throw if you can't handle it
    throw new Error(`PDF generation failed: ${(error as Error).message}`);
  }
  // console.warn("PDF generation with Puppeteer is currently disabled due to missing dependencies.");
  // return Promise.reject(new Error("PDF generation (Puppeteer) is disabled."));
}

/**
 * Generates HTML for quotation that exactly matches the design in quotation-pdf-button.tsx
 * 
 * @param quotation The quotation data
 * @param language Language code ('en' or 'ja')
 * @returns HTML content string
 */
export function generateQuotationHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en',
  selectedPackage: PricingPackage | null = null,
  selectedPromotion: PricingPromotion | null = null
): string {
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
      country: 'Country:',
      package: 'Package',
      timeAdjustment: 'Time Adjustment',
      basePrice: 'Base Price',
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
      country: '国:',
      package: 'パッケージ',
      timeAdjustment: '時間調整',
      basePrice: '基本料金',
    }
  };

  // Get translations for the selected language
  const quotationT = quotationTranslations[language];
  const isJapanese = language === 'ja';
  
  // Format date values
  const localeCode = language === 'ja' ? 'ja-JP' : 'en-US';
  const dateFormat = new Intl.DateTimeFormat(localeCode, { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  // Prepare dates
  const creationDate = quotation?.created_at ? new Date(quotation.created_at) : new Date();
  const quotationDate = dateFormat.format(creationDate);
  
  const validDays = quotation?.valid_days || 2;
  const expiryDate = new Date(creationDate);
  expiryDate.setDate(expiryDate.getDate() + validDays);
  const expiryDateString = dateFormat.format(expiryDate);
  
  // Format quotation number with JPDR prefix and padding
  const formattedQuotationId = `JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  // Get service details
  const vehicleType = quotation?.vehicle_type || 'Toyota Alphard Executive Lounge';
  const hours = quotation?.duration_hours || quotation?.hours_per_day || 8;
  const serviceDays = quotation?.service_days || 1;
  
  // Format currency based on the quotation's currency
  const formatCurrency = (value: number): string => {
    // Use the quotation's display_currency if available, otherwise default to JPY
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!value) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    // Exchange rates (simplified for demo)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    // Convert amount from JPY to selected currency
    const convertedAmount = value * (exchangeRates[currency] / exchangeRates['JPY']);
    
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2
        }).format(convertedAmount);
      } catch (error) {
        // Fallback if currency code is invalid
        return `${currency} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  };
  
  // Calculate final totals based on all data
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotation.quotation_items && quotation.quotation_items.length > 0) {
      quotation.quotation_items.forEach((item: QuotationItem) => {
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    } else {
      // Fallback for older quotations
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
      serviceBaseTotal,
      serviceTimeAdjustment,
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
  
  // Generate the HTML
  const html = `
    <div style="font-family: 'Work Sans', sans-serif; color: #333; box-sizing: border-box; width: 100%; margin: 0; padding: 0;">
      <!-- Red line at top -->
      <div style="border-top: 2px solid #FF2600; width: 100%; margin-bottom: 20px;"></div>
      
      <!-- Logo -->
      <div style="text-align: left; margin-bottom: 20px; margin-top: 20px;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app'}/img/driver-header-logo.png" alt="Driver Logo" style="height: 50px;">
      </div>
      
      <!-- Header with quotation and company info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
        <div style="flex: 1; max-width: 50%;">
          <h1 style="color: #333; margin: 0 0 15px 0; font-size: 24px; font-weight: bold;">
            ${quotationT.quotation}
          </h1>
          <p style="margin: 0 0 5px 0; font-weight: normal; font-size: 13px;">
            ${quotationT.quotationNumber} ${formattedQuotationId}
          </p>
          <p style="margin: 0 0 5px 0; font-size: 13px;">
            ${quotationT.quotationDate} ${quotationDate}
          </p>
          <p style="margin: 0 0 5px 0; font-size: 13px;">
            ${quotationT.expiryDate} ${expiryDateString}
          </p>
          <p style="margin: 0; font-size: 13px;">
            ${quotationT.validFor} ${validDays} ${quotationT.days}
          </p>
        </div>
        
        <div style="flex: 1; max-width: 40%; text-align: right; padding-top: 5px;">
          <h2 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">
            ${quotationT.companyName}
          </h2>
          <p style="margin: 0 0 2px 0; font-size: 13px;">
            ${quotationT.companyAddress1}
          </p>
          <p style="margin: 0 0 2px 0; font-size: 13px;">
            ${quotationT.companyAddress2}
          </p>
          <p style="margin: 0 0 2px 0; font-size: 13px;">
            ${quotationT.companyAddress3}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 13px;">
            ${quotationT.companyAddress4}
          </p>
          <p style="margin: 0 0 10px 0; font-size: 13px;">
            ${quotationT.companyTaxId}
          </p>
        </div>
      </div>
      
      <!-- Billing Address section -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">
          ${quotationT.billingAddress}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; font-size: 13px;">
          ${quotation?.customer_name || 'N/A'}
        </p>
        <p style="margin: 0 0 3px 0; font-size: 13px;">
          ${quotation?.customer_email || 'N/A'}
        </p>
        <p style="margin: 0 0 15px 0; font-size: 13px;">
          ${quotation?.customer_phone || 'N/A'}
        </p>
        
        ${quotation?.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.companyNameLabel}</strong> ${quotation.billing_company_name}
          </p>
        ` : ''}
        
        ${quotation?.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.taxNumber}</strong> ${quotation.billing_tax_number}
          </p>
        ` : ''}
        
        ${(quotation?.billing_street_name || quotation?.billing_street_number) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.address}</strong> ${quotation.billing_street_name || ''} ${quotation.billing_street_number || ''}
          </p>
        ` : ''}
        
        ${(quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.cityStatePostal}</strong> ${quotation.billing_city || ''} ${quotation.billing_state ? ', ' + quotation.billing_state : ''} ${quotation.billing_postal_code ? ', ' + quotation.billing_postal_code : ''}
          </p>
        ` : ''}
        
        ${quotation?.billing_country ? `
          <p style="margin: 0; font-size: 13px;">
            <strong>${quotationT.country}</strong> ${quotation.billing_country}
          </p>
        ` : ''}
      </div>
      
      <!-- Price Details section with service breakdown -->
      <div style="margin-bottom: 15px; margin-top: 0px;">
        <h3 style="color: #333; font-size: 14px; font-weight: bold; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-bottom: 8px;">
          ${quotationT.priceDetails}
        </h3>
        
        <div style="background-color: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 15px; margin-top: 5px;">
          <!-- Header row -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <div style="font-weight: bold; font-size: 13px; color: #555; flex: 3;">
              ${quotationT.items.description}
            </div>
            <div style="font-weight: bold; font-size: 13px; color: #555; flex: 1; text-align: right;">
              ${quotationT.items.price}
            </div>
          </div>
          
          <!-- Service items rows -->
          ${
            // Check if we have multiple service items
            quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
              // If we have items, display each one
              quotation.quotation_items.map((item: QuotationItem, index: number) => {
                const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
                const timeAdjustment = (item as any).time_based_adjustment ? 
                  itemBasePrice * ((item as any).time_based_adjustment / 100) : 0;
                const isPackage = item.service_type_name?.toLowerCase().includes('package');

                return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 5px 0; ${index < quotation.quotation_items.length - 1 ? 'border-bottom: 1px solid #edf2f7;' : ''}">
                  <div style="flex: 3;">
                    <div style="font-weight: 500; margin-bottom: 3px; font-size: 13px;">
                      ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}
                    </div>
                    ${!isPackage ? `
                      <div style="font-size: 12px; color: #666;">
                        ${item.service_type_name?.toLowerCase().includes('charter') ?
                          `${item.service_days || 1} day(s) × ${item.hours_per_day || 8}h` :
                          `${item.duration_hours || 1} hour(s)`
                        }
                      </div>
                      ${item.pickup_date ? `
                      <div style="font-size: 12px; color: #666;">
                        ${quotationT.pickupDate} ${new Date(item.pickup_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}${item.pickup_time ? `, ${quotationT.pickupTime} ${item.pickup_time}` : ''}
                      </div>` : ''}` : ''
                    }
                    ${selectedPackage && isPackage && selectedPackage.items && selectedPackage.items.length > 0 ? `
                      <div style="font-size: 11px; color: #666; margin-top: 5px; padding-left: 10px;">
                        <strong>Included:</strong>
                        ${selectedPackage.items.map(pkgItem => `<div>- ${pkgItem.name} (${pkgItem.vehicle_type})</div>`).join('')}
                      </div>
                    ` : ''}
                    ${timeAdjustment !== 0 ? `
                      <div style="font-size: 11px; margin-top: 5px; padding: 3px 5px; background-color: #fffbeb; border-radius: 3px; color: #d97706;">
                        <div>${quotationT.basePrice}: ${formatCurrency(itemBasePrice)}</div>
                        <div>${quotationT.timeAdjustment} (${(item as any).time_based_adjustment}%): ${timeAdjustment > 0 ? '+' : ''}${formatCurrency(timeAdjustment)}</div>
                      </div>
                    `: ''}
                  </div>
                  <div style="flex: 1; font-size: 13px; text-align: right; font-weight: 500;">
                    ${formatCurrency(item.total_price || itemBasePrice + timeAdjustment)}
                  </div>
                </div>
              `}).join('')
              :
              // Fallback to a single service display if no items
              `<div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0;">
                <div style="font-size: 13px;">
                  ${quotation?.vehicle_type || 'Toyota Alphard Executive Lounge'}
                </div>
                <div style="font-size: 13px;">
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0;">
                <div style="font-size: 13px;">
                  ${language === 'ja' ? `時間料金 (${quotation?.hours_per_day || 8} 時間 / 日)` : 
                                       `Hourly Rate (${quotation?.hours_per_day || 8} hours / day)`}
                </div>
                <div style="font-size: 13px; font-weight: medium;">
                  ${formatCurrency(quotation?.hourly_rate || quotation?.daily_rate || (totals.baseTotal / (quotation?.service_days || 1)))}
                </div>
              </div>
              
              ${(quotation?.service_days || 1) > 1 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0;">
                <div style="font-size: 13px; color: #666;">
                  ${language === 'ja' ? '日数' : 'Number of Days'}
                </div>
                <div style="font-size: 13px;">
                  × ${quotation?.service_days || 1}
                </div>
              </div>
              ` : ''}`
          }
          
          <!-- Totals Section -->
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
            <!-- Service Base Total -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
              <span>Services Subtotal</span>
              <span>${formatCurrency(totals.serviceBaseTotal)}</span>
            </div>
            <!-- Time Adjustment -->
            ${totals.serviceTimeAdjustment !== 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #d97706;">
                <span>${quotationT.timeAdjustment}</span>
                <span>${totals.serviceTimeAdjustment > 0 ? '+' : ''}${formatCurrency(totals.serviceTimeAdjustment)}</span>
              </div>` : ''
            }
            <!-- Package Price -->
            ${selectedPackage ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                <span>${quotationT.package}: ${selectedPackage.name}</span>
                <span>${formatCurrency(totals.packageTotal)}</span>
              </div>` : ''
            }
            <!-- Subtotal -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 500; padding-top: 5px; border-top: 1px solid #eee;">
              <span>${quotationT.subtotal}</span>
              <span>${formatCurrency(totals.baseTotal)}</span>
            </div>
            <!-- Discounts -->
            ${totals.promotionDiscount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #16a34a;">
                <span>Promotion: ${selectedPromotion?.name}</span>
                <span>-${formatCurrency(totals.promotionDiscount)}</span>
              </div>` : ''
            }
            ${totals.regularDiscount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #e53e3e;">
                <span>${quotationT.discount} (${quotation.discount_percentage}%)</span>
                <span>-${formatCurrency(totals.regularDiscount)}</span>
              </div>` : ''
            }
            <!-- Tax -->
            ${totals.taxAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; padding-top: 5px; border-top: 1px solid #eee;">
                <span>${quotationT.tax} (${quotation.tax_percentage}%)</span>
                <span>+${formatCurrency(totals.taxAmount)}</span>
              </div>` : ''
            }
            <!-- Final Total -->
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding-top: 8px; border-top: 2px solid #333;">
              <span>${quotationT.total}</span>
              <span>${formatCurrency(totals.finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Page break before Terms and Conditions -->
      <div style="page-break-after: always; height: 1px;"></div>
      
      <!-- Terms and Conditions -->
      <div style="margin-bottom: 25px; margin-top: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
          ${quotationT.termsAndConditions}
        </h3>
        <p style="margin: 0; font-size: 12px; line-height: 1.5; white-space: pre-line;">
          ${quotation?.terms || quotationT.termsContent}
        </p>
      </div>
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; padding-bottom: 20px; text-align: center; margin-top: auto;">
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #333; text-align: center;">
          ${quotationT.thanksMessage}
        </p>
        <p style="margin: 0 0 5px 0; font-size: 13px; text-align: center;">
          ${quotationT.contactMessage}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; text-align: center;">
          ${quotationT.companyFooter}
        </p>
      </div>
    </div>
  `;
  
  return html;
} 