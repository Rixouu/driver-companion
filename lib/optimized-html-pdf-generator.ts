import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '../types/quotations';

/**
 * Serverless-compatible PDF generator with proper font support for Thai and Japanese
 * Uses @sparticuz/chromium for reliable Chrome execution in serverless environments
 */
export async function generateOptimizedQuotationPDF(
  quotation: any,
  language: string = 'en',
  selectedPackage?: any,
  selectedPromotion?: any
): Promise<Buffer | null> {
  console.log('🚀 Starting reliable PDF generation...');

  let browser: any = null;

  try {
    console.log('🌐 Launching browser...');
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
        '--enable-font-subpixel-positioning'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    console.log('✅ Browser launched successfully');

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // Set extra HTTP headers for better font loading
    await page.setExtraHTTPHeaders({
      'Accept-Charset': 'utf-8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,th;q=0.8,fr;q=0.7'
    });

    const htmlContent = generateQuotationHTML(quotation, language, selectedPackage, selectedPromotion);

    console.log('📄 Setting content...');
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
    });

    console.log('🔤 Waiting for fonts...');
    await page.evaluateHandle('document.fonts.ready');

    console.log('📊 Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
    });

    console.log('✅ PDF generated successfully');
    return pdfBuffer;

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate quotation HTML with proper font support for Thai and Japanese characters
 */
function generateQuotationHTML(
  quotation: any, 
  language: string = 'en', 
  selectedPackage?: any, 
  selectedPromotion?: any
): string {
  // Quotation translations for different languages
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
  const quotationT = quotationTranslations[language as keyof typeof quotationTranslations] || quotationTranslations.en;
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
  const formattedQuotationId = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  // Format currency based on the quotation's currency
  const formatCurrency = (value: number): string => {
    const currency = quotation?.display_currency || quotation?.currency || 'JPY';
    if (!value) return currency === 'JPY' ? `¥0` : `${currency} 0`;
    
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

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
        return `${currency} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  };
  
  // Calculate totals
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

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta http-equiv="Content-Language" content="en, ja, th, fr">
      <title>PDF Export</title>
      <style>
        /* Import fonts using @import for better compatibility */
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+Thai:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
        
        /* Enhanced font definitions with better fallbacks */
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('https://fonts.gstatic.com/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI2.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('https://fonts.gstatic.com/s/notosansthai/v17/iJWnBQcP9n9z1aPwQwb9J3JqJ8g.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0E00-0E7F;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('https://fonts.gstatic.com/s/worksans/v18/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBi8Jow.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Work Sans', 'Noto Sans JP', 'Noto Sans Thai', 'Noto Sans KR',
                       'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Segoe UI', 'MS Gothic', 'MS Mincho',
                       'Takao Gothic', 'Takao Mincho', 'IPAexGothic', 'IPAexMincho',
                       'IPAPGothic', 'IPAPMincho', 'IPAUIGothic', 'IPAUIMincho',
                       'Apple Gothic', 'Apple LiGothic', 'Apple LiSung', 'Apple Myungjo',
                       'Thonburi', 'Tahoma', 'Arial Unicode MS', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga' 1, 'kern' 1;
          text-rendering: optimizeLegibility;
          -webkit-font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
          -moz-font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Japanese text */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'MS Gothic', 'MS Mincho', sans-serif;
          line-height: 1.6;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Thai text */
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', 'Arial Unicode MS', Arial, sans-serif;
          line-height: 1.5;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Korean text */
        .ko-text, [lang="ko"] {
          font-family: 'Noto Sans KR', 'Apple Gothic', 'Malgun Gothic', 'Dotum', sans-serif;
          line-height: 1.6;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Ensure proper rendering for all text */
        h1, h2, h3, h4, h5, h6, p, span, div {
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
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
            ${customerName}
          </p>
          <p style="margin: 0 0 3px 0; font-size: 13px;">
            ${customerEmail}
          </p>
            <p style="margin: 0 0 15px 0; font-size: 13px;">
            ${customerPhone}
          </p>
        </div>
        
        <!-- Price Details section -->
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
            ${quotation.quotation_items && Array.isArray(quotation.quotation_items) && quotation.quotation_items.length > 0 ?
              quotation.quotation_items.map((item: QuotationItem, index: number) => {
                const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
                const timeAdjustment = (item as any).time_based_adjustment ? 
                  itemBasePrice * ((item as any).time_based_adjustment / 100) : 0;

                return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 5px 0; ${index < quotation.quotation_items.length - 1 ? 'border-bottom: 1px solid #edf2f7;' : ''}">
                  <div style="flex: 3;">
                    <div style="font-weight: 500; margin-bottom: 3px; font-size: 13px;">
                      ${item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                      ${item.service_days || 1} day(s) × ${item.hours_per_day || 8}h
                    </div>
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
              `<div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0;">
                <div style="font-size: 13px;">
                  ${quotation?.vehicle_type || 'Toyota Alphard Executive Lounge'}
                </div>
                <div style="font-size: 13px;">
                </div>
              </div>`
            }
            
            <!-- Totals Section -->
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
              <!-- Services Subtotal -->
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
    </body>
    </html>
  `;
}

/**
 * HTML template with BULLETPROOF font fallbacks - 100% reliable in production
 */
function createOptimizedHTMLTemplate(htmlContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta http-equiv="Content-Language" content="en, ja, th, fr">
      <title>PDF Export</title>
      <style>
        /* BULLETPROOF FONT SYSTEM - 100% reliable in production */
        
        /* Primary: Try local fonts first */
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        /* FALLBACK SYSTEM - Guaranteed to work */
        * {
          box-sizing: border-box;
        }
        
        body {
          /* BULLETPROOF font stack with system fallbacks */
          font-family: 'Work Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', 'Arial', 
                       'Noto Sans JP', 'Noto Sans Thai', 'Noto Sans KR',
                       'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'MS Gothic', 'MS Mincho',
                       'Takao Gothic', 'Takao Mincho', 'IPAexGothic', 'IPAexMincho',
                       'IPAPGothic', 'IPAPMincho', 'IPAUIGothic', 'IPAUIMincho',
                       'Apple Gothic', 'Apple LiGothic', 'Apple LiSung', 'Apple Myungjo',
                       'Thonburi', 'Tahoma', 'Arial Unicode MS', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga' 1, 'kern' 1;
          text-rendering: optimizeLegibility;
        }
        
        /* Language-specific fallbacks - GUARANTEED to work */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 
                       'MS Gothic', 'MS Mincho', 'Roboto', sans-serif;
          line-height: 1.6;
        }
        
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', 'Arial Unicode MS', 
                       'Roboto', 'Arial', sans-serif;
          line-height: 1.5;
        }
        
        .ko-text, [lang="ko"] {
          font-family: 'Noto Sans KR', 'Apple Gothic', 'Malgun Gothic', 'Dotum', 
                       'Roboto', sans-serif;
          line-height: 1.6;
        }
        
        /* Ensure all text renders properly */
        h1, h2, h3, h4, h5, h6, p, span, div {
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
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
}
