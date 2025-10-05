import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { generateFontCSS } from './base64-fonts';
import { safeEncodeText } from '@/lib/utils/character-encoding';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { getTeamAddressHtml, getTeamFooterHtml } from '@/lib/team-addresses';
import { getTeamAddressHtmlFromDB, getTeamFooterHtmlFromDB } from '@/lib/partials-database-fetcher';

// Helper function to ensure special characters are properly displayed
function getStatusSymbol(status: string): string {
  switch (status) {
    case 'approved':
    case 'paid':
      return '✓'; // Checkmark
    case 'rejected':
      return '✖'; // Cross
    case 'converted':
      return '✓'; // Checkmark for converted
    default:
      return '';
  }
}

/**
 * Font loading utility for production environments
 */
async function ensureFontsLoaded(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting font loading for PDF generation...');
    const fontLoadStart = Date.now();
    
    // Wait for fonts to load with a timeout
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
    ]);
    
    // Additional wait for any pending font loads
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.fonts.status === 'loaded') {
          resolve(true);
        } else {
          document.fonts.onloadingdone = resolve;
          // Fallback timeout
          setTimeout(resolve, 2000);
        }
      });
    });
    
    // Force a small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Fonts loaded in ${fontLoadTime}ms`);
  } catch (error) {
    console.warn('Font loading timeout, proceeding with available fonts:', error);
  }
}

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

  // Create the full HTML document with embedded fonts and proper encoding for special characters
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta http-equiv="Content-Language" content="en, ja, th, fr">
      <title>PDF Export</title>
      
      <!-- Preload fonts for faster rendering -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      
      <style>
        /* Use base64 embedded fonts for reliable PDF generation */
        ${generateFontCSS()}
        
        /* Additional font definitions for Noto Sans Thai */
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('https://fonts.gstatic.com/s/notosansthai/v25/iJWQBXyIfDnIV7nBrXywgWqV5p5_mhJSZOA-FkuJ0Q.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        /* Special character support for status symbols */
        .status-symbol {
          font-family: 'Arial Unicode MS', 'Segoe UI Symbol', 'Apple Symbols', 'Noto Color Emoji', sans-serif !important;
          font-weight: bold;
          line-height: 1;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          /* Use optimized font stack for multi-language support */
          font-family: 'Noto Sans Thai', 'Noto Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
          text-rendering: optimizeLegibility;
        }
        
        /* Specific styling for Japanese text */
        .ja-text, [lang="ja"], .billing-address, .customer-info {
          font-family: 'Noto Sans JP', 'Noto Sans', sans-serif !important;
          line-height: 1.6;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Thai text */
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif !important;
          line-height: 1.5;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Ensure proper rendering for all text elements */
        h1, h2, h3, h4, h5, h6, p, span, div, td, th, label, input, textarea {
          font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai', sans-serif !important;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Special handling for billing address and customer info */
        .billing-address *, .customer-info * {
          font-family: 'Noto Sans JP', 'Noto Sans Thai', 'Noto Sans', sans-serif !important;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  let browser: any;
  
  try {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // Production/Serverless environment - use @sparticuz/chromium
      console.log('🚀 Using @sparticuz/chromium for production/serverless');
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--font-render-hinting=none',
          '--disable-font-subpixel-positioning',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-gpu-sandbox',
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
          '--lang=en-US,en,ja,th,fr',
          '--enable-font-antialiasing',
          '--force-color-profile=srgb',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--enable-blink-features=CSSFontMetrics',
          '--enable-font-antialiasing',
          '--enable-font-subpixel-positioning',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--disable-translate',
          '--disable-logging',
          '--disable-in-process-stack-traces',
          '--disable-histogram-customizer',
          '--disable-gl-extensions',
          '--disable-composited-antialiasing',
          '--disable-canvas-aa',
          '--disable-3d-apis',
          '--disable-accelerated-2d-canvas',
          '--disable-accelerated-jpeg-decoding',
          '--disable-accelerated-mjpeg-decode',
          '--disable-accelerated-video-decode',
          '--disable-accelerated-video-encode',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        executablePath: await chromium.executablePath()
      });
    } else {
      // Development environment - use full puppeteer
      console.log('🔧 Using full puppeteer for development');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
          '--disable-font-subpixel-positioning',
          '--lang=en-US,en,ja,th,fr'
        ]
      });
    }

    // Create a new page
    const page = await browser.newPage();
    
    // Set timeouts for page operations
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Set extra HTTP headers for better font loading
    await page.setExtraHTTPHeaders({
      'Accept-Charset': 'utf-8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,th;q=0.8,fr;q=0.7'
    });
    
    // Set content and wait for network idle and fonts to load
    console.log('📄 Setting HTML content for PDF generation...');
    try {
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    } catch (error) {
      console.log('⚠️ networkidle0 failed, trying domcontentloaded...');
      try {
        await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
      } catch (fallbackError) {
        console.log('⚠️ domcontentloaded failed, using basic setContent...');
        await page.setContent(fullHtml);
      }
    }
    
    // Use the enhanced font loading utility
    console.log('🔤 Ensuring fonts are loaded...');
    await ensureFontsLoaded(page);
    
    // Additional wait to ensure all content is rendered
    console.log('⏳ Waiting for content to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Additional wait to ensure all content is rendered
    console.log('⏳ Waiting for content to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));

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

    // Convert to proper Buffer
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // It's often better to throw a custom error or re-throw if you can't handle it
    throw new Error(`PDF generation failed: ${(error as Error).message}`);
  } finally {
    // Always close the browser to prevent memory leaks
    if (browser) {
      try {
        await browser.close();
        console.log('🧹 Browser closed successfully');
      } catch (closeError) {
        console.error('⚠️ Error closing browser:', closeError);
      }
    }
  }
}

/**
 * Generates HTML for quotation that exactly matches the design in quotation-pdf-button.tsx
 * 
 * @param quotation The quotation data
 * @param language Language code ('en' or 'ja')
 * @returns HTML content string
 */
export async function generateQuotationHtml(
  quotation: any, 
  language: 'en' | 'ja' = 'en',
  selectedPackage: PricingPackage | null = null,
  selectedPromotion: PricingPromotion | null = null,
  showTeamInfo: boolean = true,
  statusConfigs: { [status: string]: { showSignature: boolean; showStatusBadge: boolean; statusBadgeColor: string; statusBadgeName: string } } = {}
): Promise<string> {
  // Quotation translations for different languages (same as client-side)
  const quotationTranslations = {
    en: {
      quotation: 'QUOTATION',
      quotationNumber: 'Quotation #:',
      quotationDate: 'Quotation Date:',
      expiryDate: 'Expiry Date:',
      validFor: 'Valid for:',
      days: 'days',
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
      termsAndConditions: 'Terms and Conditions',
      termsContent: '1. This quotation is valid for the specified period from the date of issue.\n2. Prices are subject to change if requirements change.\n3. Cancellation policy: 100% refund if cancelled 7+ days before service, 50% refund if 3-7 days, no refund if less than 3 days.',
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
  
  // Format date values - Always use DD/MM/YYYY format
  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  
  // Keep localeCode for time formatting
  const localeCode = language === 'ja' ? 'ja-JP' : 'en-US';
  
  // Prepare dates
  const creationDate = quotation?.created_at ? new Date(quotation.created_at) : new Date();
  const quotationDate = formatDateToDDMMYYYY(creationDate);
  
  const validDays = quotation?.valid_days || 2;
  const expiryDate = new Date(creationDate);
  expiryDate.setDate(expiryDate.getDate() + validDays);
  const expiryDateString = formatDateToDDMMYYYY(expiryDate);
  
  // Format quotation number with JPDR prefix and padding
  const formattedQuotationId = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
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
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (item.service_type_name?.toLowerCase().includes('charter')) {
          itemBasePrice = item.unit_price * (item.service_days || 1);
        } else {
          itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        }
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
    <div style="font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; color: #333; box-sizing: border-box; width: 100%; margin: 0; padding: 0;">
      <!-- Red line at top -->
      <div style="border-top: 2px solid #FF2600; width: 100%; margin-bottom: 20px;"></div>
      
      <!-- Logo -->
      <div style="text-align: left; margin-bottom: 20px; margin-top: 20px;">
        <img src="data:image/png;base64,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" alt="Driver Logo" style="height: 50px;">
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
          ${statusConfigs[quotation.status]?.showStatusBadge ? `
            <div style="background: ${statusConfigs[quotation.status]?.statusBadgeColor || '#6B7280'}; color: white; padding: 8px 12px; border-radius: 5px; margin-bottom: 5px; font-weight: bold; font-size: 14px; display: inline-block;">
              ${statusConfigs[quotation.status]?.statusBadgeName || quotation.status.toUpperCase()}
            </div>
            <p style="margin: 5px 0 0 0; font-size: 13px;">
              ${quotation.status === 'approved' ? 
                (quotation.approved_at ? 
                  `${isJapanese ? '承認日時:' : 'Approved on:'} ${formatDateDDMMYYYY(quotation.approved_at)} ${new Date(quotation.approved_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                  `${isJapanese ? '承認日時:' : 'Approved on:'} ${quotationDate}`) :
                quotation.status === 'paid' ?
                  (quotation.payment_date ? 
                    `${isJapanese ? '支払い完了日時:' : 'Paid on:'} ${formatDateDDMMYYYY(quotation.payment_date)} ${quotation.payment_completed_at ? new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' }) : ''}` :
                    quotation.payment_completed_at ? 
                      `${isJapanese ? '支払い完了日時:' : 'Payment completed on:'} ${formatDateDDMMYYYY(quotation.payment_completed_at)} ${new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                      `${isJapanese ? '支払い完了日時:' : 'Payment completed on:'} ${quotationDate}`) :
                quotation.status === 'converted' ?
                  (quotation.updated_at ? 
                    `${isJapanese ? '予約変換日時:' : 'Converted on:'} ${formatDateDDMMYYYY(quotation.updated_at)} ${new Date(quotation.updated_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                    `${isJapanese ? '予約変換日時:' : 'Converted on:'} ${quotationDate}`) :
                quotation.status === 'sent' ?
                  (quotation.sent_at ? 
                    `${isJapanese ? '送信日時:' : 'Sent on:'} ${formatDateDDMMYYYY(quotation.sent_at)} ${new Date(quotation.sent_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                    `${isJapanese ? '送信日時:' : 'Sent on:'} ${quotationDate}`) :
                quotation.status === 'pending' ?
                  `${isJapanese ? '作成日時:' : 'Created on:'} ${quotationDate}` :
                (quotation.rejected_at ?
                  `${isJapanese ? '却下日時:' : 'Rejected on:'} ${formatDateDDMMYYYY(quotation.rejected_at)} ${new Date(quotation.rejected_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                  `${isJapanese ? '却下日時:' : 'Rejected on:'} ${quotationDate}`)}
            </p>
          ` : `
            <p style="margin: 0 0 5px 0; font-size: 13px;">
              ${quotationT.quotationDate} ${quotationDate}
            </p>
            <p style="margin: 0 0 5px 0; font-size: 13px;">
              ${quotationT.expiryDate} ${expiryDateString}
            </p>
            <p style="margin: 0; font-size: 13px;">
              ${quotationT.validFor} ${validDays} ${quotationT.days}
            </p>
          `}
        </div>
        
        <div style="flex: 1; max-width: 40%; text-align: right; padding-top: 5px;">
          ${await getTeamAddressHtmlFromDB(quotation.team_location || 'thailand', 'quotation', isJapanese)}
        </div>
      </div>
      
      <!-- Billing Address section -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">
          ${quotationT.billingAddress}
        </h3>
        <p style="margin: 0 0 3px 0; font-weight: normal; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_name)}
        </p>
        <p style="margin: 0 0 3px 0; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_email)}
        </p>
        <p style="margin: 0 0 15px 0; font-size: 13px;">
          ${safeEncodeText(quotation?.customer_phone)}
        </p>
        
        ${quotation?.billing_company_name ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.companyNameLabel}</strong> ${safeEncodeText(quotation.billing_company_name)}
          </p>
        ` : ''}
        
        ${quotation?.billing_tax_number ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.taxNumber}</strong> ${safeEncodeText(quotation.billing_tax_number)}
          </p>
        ` : ''}
        
        ${(quotation?.billing_street_name || quotation?.billing_street_number) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.address}</strong> ${safeEncodeText(quotation.billing_street_name || '')} ${safeEncodeText(quotation.billing_street_number || '')}
          </p>
        ` : ''}
        
        ${(quotation?.billing_city || quotation?.billing_state || quotation?.billing_postal_code) ? `
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            <strong>${quotationT.cityStatePostal}</strong> ${safeEncodeText(quotation.billing_city || '')} ${quotation.billing_state ? ', ' + safeEncodeText(quotation.billing_state) : ''} ${quotation.billing_postal_code ? ', ' + safeEncodeText(quotation.billing_postal_code) : ''}
          </p>
        ` : ''}
        
        ${quotation?.billing_country ? `
          <p style="margin: 0; font-size: 13px;">
            <strong>${quotationT.country}</strong> ${safeEncodeText(quotation.billing_country)}
          </p>
        ` : ''}
      </div>
      
      <!-- Payment Information section for paid or converted quotations -->
      ${quotation.status === 'paid' || quotation.status === 'converted' ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: bold;">
            ${isJapanese ? '支払い情報' : 'Payment Information'}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            ${quotation.payment_date ? `
              <div>
                <strong style="color: #166534;">${isJapanese ? '支払い日:' : 'Payment Date:'}</strong>
                <span style="color: #374151;"> ${formatDateDDMMYYYY(quotation.payment_date)}</span>
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
      
      <!-- Conversion Information section for converted quotations -->
      ${quotation.status === 'converted' ? `
        <div style="margin-bottom: 20px; padding: 15px; background: #f0f0ff; border: 1px solid #c4b5fd; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; color: #7c3aed; font-size: 14px; font-weight: bold;">
            ${isJapanese ? '予約変換情報' : 'Conversion Information'}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            ${quotation.converted_at ? `
              <div>
                <strong style="color: #7c3aed;">${isJapanese ? '変換日時:' : 'Converted at:'}</strong>
                <span style="color: #374151;"> ${formatDateDDMMYYYY(quotation.converted_at)} ${new Date(quotation.converted_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ` : ''}
            ${quotation.converted_by ? `
              <div>
                <strong style="color: #7c3aed;">${isJapanese ? '変換担当者:' : 'Converted by:'}</strong>
                <span style="color: #374151;"> ${quotation.converted_by}</span>
              </div>
            ` : ''}
            ${quotation.booking_reference ? `
              <div>
                <strong style="color: #7c3aed;">${isJapanese ? '予約番号:' : 'Booking Reference:'}</strong>
                <span style="color: #374151;"> ${quotation.booking_reference}</span>
              </div>
            ` : ''}
            ${quotation.conversion_method ? `
              <div>
                <strong style="color: #7c3aed;">${isJapanese ? '変換方法:' : 'Conversion Method:'}</strong>
                <span style="color: #374151;"> ${quotation.conversion_method}</span>
              </div>
            ` : ''}
          </div>
          ${quotation.conversion_notes ? `
            <div style="margin-top: 10px; padding: 8px; background: #e9d5ff; border-radius: 4px;">
              <strong style="color: #7c3aed; font-size: 12px;">${isJapanese ? '変換メモ:' : 'Conversion Notes:'}</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #374151; line-height: 1.4;">${quotation.conversion_notes}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
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
                // For Charter Services, calculate as unit_price × service_days
                const itemBasePrice = item.service_type_name?.toLowerCase().includes('charter') 
                  ? item.unit_price * (item.service_days || 1)
                  : item.unit_price * (item.quantity || 1) * (item.service_days || 1);
                const timeAdjustment = (item as any).time_based_adjustment ? 
                  itemBasePrice * ((item as any).time_based_adjustment / 100) : 0;
                const isPackage = item.service_type_name?.toLowerCase().includes('package');

                return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; ${index < quotation.quotation_items.length - 1 ? 'border-bottom: 1px solid #edf2f7;' : ''}">
                  <div style="flex: 3;">
                    <div style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">
                      ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}
                    </div>
                    ${!isPackage ? `
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${item.service_type_name?.toLowerCase().includes('charter') ?
                          `Hourly Rate (${item.hours_per_day || 8} hours / day): ${formatCurrency(item.unit_price)}` :
                          `${item.duration_hours || 1} hour(s)`
                        }
                      </div>
                      ${item.service_type_name?.toLowerCase().includes('charter') ? `
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        Number of Days: × ${item.service_days || 1}
                      </div>` : ''}
                      ${item.pickup_date ? `
                      <div style="font-size: 12px; color: #666;">
                        ${quotationT.pickupDate} ${formatDateDDMMYYYY(item.pickup_date)}${item.pickup_time ? `, ${quotationT.pickupTime} ${item.pickup_time}` : ''}
                      </div>` : ''}` : ''
                    }
                    ${selectedPackage && isPackage ? `
                      <div style="font-size: 11px; color: #666; margin-top: 5px; padding-left: 10px;">
                        <strong>Included Services:</strong>
                        ${selectedPackage.items && selectedPackage.items.length > 0 ? 
                          selectedPackage.items.map(pkgItem => `<div style="color: #8b5cf6; font-weight: 500;">• ${pkgItem.name}${pkgItem.vehicle_type ? ` <span style="color: #666;">(${pkgItem.vehicle_type})</span>` : ''}</div>`).join('') :
                          '<div style="color: #8b5cf6; font-weight: 500;">• All package services included</div>'
                        }
                      </div>
                    ` : ''}
                    ${timeAdjustment !== 0 ? `
                      <div style="font-size: 11px; margin-top: 5px; padding: 3px 5px; background-color: #fffbeb; border-radius: 3px; color: #d97706;">
                        <div>${quotationT.basePrice}: ${formatCurrency(itemBasePrice)}</div>
                        <div>${quotationT.timeAdjustment} (${(item as any).time_based_adjustment}%): ${timeAdjustment > 0 ? '+' : ''}${formatCurrency(timeAdjustment)}</div>
                        ${(item as any).time_based_rule_name ? `
                          <div style="font-size: 10px; color: #92400e; margin-top: 2px;">
                            ${(item as any).time_based_rule_name}
                          </div>
                        ` : ''}
                      </div>
                    `: ''}
                  </div>
                  <div style="flex: 1; font-size: 13px; text-align: right; font-weight: 500;">
                    ${formatCurrency((() => {
                      // For Charter Services, always recalculate based on service_days
                      if (item.service_type_name?.toLowerCase().includes('charter')) {
                        return item.unit_price * (item.service_days || 1) + timeAdjustment;
                      }
                      // For other services, use total_price if available, otherwise calculate
                      return item.total_price || itemBasePrice + timeAdjustment;
                    })())}
                  </div>
                </div>
              `}).join('')
              :
              // Fallback to a single service display if no items
              `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0;">
                <div style="flex: 3;">
                  <div style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">
                    ${quotation?.vehicle_type || 'Toyota Alphard Executive Lounge'}
                  </div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                    ${language === 'ja' ? `時間料金 (${quotation?.hours_per_day || 8} 時間 / 日)` : 
                                         `Hourly Rate (${quotation?.hours_per_day || 8} hours / day)`}: ${formatCurrency(quotation?.hourly_rate || quotation?.daily_rate || (totals.baseTotal / (quotation?.service_days || 1)))}
                  </div>
                  ${(quotation?.service_days || 1) > 1 ? `
                  <div style="font-size: 12px; color: #666;">
                    ${language === 'ja' ? '日数' : 'Number of Days'}: × ${quotation?.service_days || 1}
                  </div>
                  ` : ''}
                </div>
                <div style="flex: 1; font-size: 13px; text-align: right; font-weight: 500;">
                  ${formatCurrency(totals.baseTotal)}
                </div>
              </div>`
          }
          
          <!-- Totals Section -->
          <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
            <!-- Services Subtotal (includes time adjustments) -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
              <span>Services Subtotal</span>
              <span>${formatCurrency(totals.serviceTotal)}</span>
            </div>
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
              </div>` : totals.regularDiscount > 0 ? `
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
      
      <!-- Signature Section removed from first page -->
      
      <!-- Page break before Terms and Conditions -->
      <div style="page-break-before: always; margin-top: 20px;"></div>
      
      <!-- Signature Section on second page above Terms and Conditions -->
      ${statusConfigs[quotation.status]?.showSignature ? `
        <div style="margin-bottom: 30px; margin-top: 20px;">
          <!-- Customer Signature Section -->
          <div style="margin-bottom: 20px;">        
            <!-- Right-aligned signature block -->
            <div style="display: flex; justify-content: flex-end;">
              <div style="max-width: 400px; text-align: center;">
                <!-- Customer Signature label at the top -->
                <div style="margin-bottom: 15px;">
                  <h4 style="margin: 0; color: #333; font-size: 16px; font-weight: bold; text-align: center;">
                    Customer Signature
                  </h4>
                </div>
                
                <!-- Signature image or placeholder - bigger size -->
                <div style="border: 2px solid #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb; min-height: 120px; max-height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                  ${quotation.status === 'approved' && quotation.approval_signature ? `
                    <img src="${quotation.approval_signature}" alt="Customer Signature" style="max-width: 100%; max-height: 100px; object-fit: contain;">
                  ` : quotation.status === 'approved' ? `
                    <div class="status-symbol" style="color: #10b981; font-size: 48px;">${getStatusSymbol(quotation.status)}</div>
                  ` : quotation.status === 'paid' ? `
                    <div class="status-symbol" style="color: #10b981; font-size: 48px;">${getStatusSymbol(quotation.status)}</div>
                  ` : quotation.status === 'converted' ? `
                    <div class="status-symbol" style="color: #8b5cf6; font-size: 48px;">${getStatusSymbol(quotation.status)}</div>
                  ` : quotation.status === 'rejected' && quotation.rejection_signature && (quotation.rejection_signature.startsWith('data:') || quotation.rejection_signature.startsWith('http')) ? `
                    <img src="${quotation.rejection_signature}" alt="Customer Signature" style="max-width: 100%; max-height: 100px; object-fit: contain;">
                  ` : quotation.status === 'rejected' ? `
                    <div class="status-symbol" style="color: #dc2626; font-size: 48px;">${getStatusSymbol(quotation.status)}</div>
                  ` : `
                    <div style="color: #9ca3af; font-size: 18px; text-align: center; line-height: 1.4;">
                      Customer<br>Signature
                    </div>
                  `}
                </div>
                
                <!-- Signature line with date and time side by side -->
                <div style="border-top: 1px solid #333; padding-top: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #666;">
                    <span>
                      Date: ${quotation.status === 'approved' ? 
                        (quotation.approved_at ? 
                          `${formatDateDDMMYYYY(quotation.approved_at)}` :
                          quotationDate) : 
                        quotation.status === 'paid' ?
                          (quotation.payment_date ? 
                            `${formatDateDDMMYYYY(quotation.payment_date)}` :
                            quotation.payment_completed_at ? 
                              `${formatDateDDMMYYYY(quotation.payment_completed_at)}` :
                              quotationDate) :
                        quotation.status === 'converted' ?
                          (quotation.updated_at ? 
                            `${formatDateDDMMYYYY(quotation.updated_at)}` :
                            quotationDate) :
                          (quotation.rejected_at ?
                            `${formatDateDDMMYYYY(quotation.rejected_at)}` :
                            quotationDate)}
                    </span>
                    <span>
                      Time: ${quotation.status === 'approved' ? 
                        (quotation.approved_at ? 
                          `${new Date(quotation.approved_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                          '') : 
                        quotation.status === 'paid' ?
                          (quotation.payment_completed_at ? 
                            `${new Date(quotation.payment_completed_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                            '') :
                        quotation.status === 'converted' ?
                          (quotation.updated_at ? 
                            `${new Date(quotation.updated_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                            '') :
                          (quotation.rejected_at ?
                            `${new Date(quotation.rejected_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}` :
                            '')}
                    </span>
                  </div>
                </div>
                
                <!-- Additional notes or status info -->
                ${quotation.status === 'approved' ? `
                  <div style="margin-top: 15px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                    <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.3;">
                      <strong>Status:</strong> ${getStatusSymbol(quotation.status)} APPROVED
                    </p>
                    ${quotation.approval_notes ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #166534; line-height: 1.3;">
                      <strong>Notes:</strong> ${quotation.approval_notes}
                    </p>
                    ` : ''}
                  </div>
                ` : quotation.status === 'paid' ? `
                  <div style="margin-top: 15px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
                    <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.3;">
                      <strong>Status:</strong> ${getStatusSymbol(quotation.status)} Payment Completed
                    </p>
                    ${quotation.payment_amount ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #166534; line-height: 1.3;">
                      <strong>Amount:</strong> ${quotation.currency || 'JPY'} ${quotation.payment_amount.toLocaleString()}
                    </p>
                    ` : ''}
                    ${quotation.payment_method ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #166534; line-height: 1.3;">
                      <strong>Method:</strong> ${quotation.payment_method}
                    </p>
                    ` : ''}
                  </div>
                ` : quotation.status === 'converted' ? `
                  <div style="margin-top: 15px; padding: 10px; background: #f0f0ff; border: 1px solid #c4b5fd; border-radius: 6px;">
                    <p style="margin: 0; font-size: 12px; color: #7c3aed; line-height: 1.3;">
                      <strong>Status:</strong> ${getStatusSymbol(quotation.status)} CONVERTED TO BOOKING
                    </p>
                    ${quotation.converted_at ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #7c3aed; line-height: 1.3;">
                      <strong>Converted on:</strong> ${formatDateDDMMYYYY(quotation.converted_at)} ${new Date(quotation.converted_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    ` : quotation.updated_at ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #7c3aed; line-height: 1.3;">
                      <strong>Converted on:</strong> ${formatDateDDMMYYYY(quotation.updated_at)} ${new Date(quotation.updated_at).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    ` : ''}
                    ${quotation.booking_reference ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #7c3aed; line-height: 1.3;">
                      <strong>Booking Ref:</strong> ${quotation.booking_reference}
                    </p>
                    ` : ''}
                    ${quotation.converted_by ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #7c3aed; line-height: 1.3;">
                      <strong>Converted by:</strong> ${quotation.converted_by}
                    </p>
                    ` : ''}
                  </div>
                ` : quotation.status === 'rejected' ? `
                  <div style="margin-top: 15px; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
                    <p style="margin: 0; font-size: 12px; color: #dc2626; line-height: 1.3;">
                      <strong>Status:</strong> ${getStatusSymbol(quotation.status)} REJECTED
                    </p>
                    ${quotation.rejection_reason ? `
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #dc2626; line-height: 1.3;">
                      <strong>Reason:</strong> ${quotation.rejection_reason}
                    </p>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
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
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; margin-bottom: 30px;">
        ${await getTeamFooterHtmlFromDB(quotation.team_location || 'thailand', 'quotation', isJapanese)}
      </div>
    </div>
  `;
  
  return html;
} 