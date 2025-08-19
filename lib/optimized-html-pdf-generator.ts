import puppeteer from 'puppeteer';
import { QuotationItem, PricingPackage, PricingPromotion } from '../types/quotations';

/**
 * Simple, reliable PDF generator for serverless environments
 * Uses your exact fonts and branding without any compromises
 */
export async function generateOptimizedQuotationPDF(
  quotation: any,
  language: string = 'en',
  selectedPackage?: any,
  selectedPromotion?: any
): Promise<Buffer | null> {
  console.log('🚀 Starting simple PDF generation...');
  
  let browser: any = null;
  let page: any = null;
  
  try {
    // Simple browser launch with minimal options for serverless
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--single-process',
        '--no-zygote'
      ],
      timeout: 30000
    });
    
    console.log('✅ Browser launched successfully');
    
    // Create page
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Generate HTML content
    const htmlContent = generateQuotationHTML(quotation, language, selectedPackage, selectedPromotion);
    
    // Set content with minimal waiting
    console.log('📄 Setting content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Simple font loading check
    console.log('🔤 Checking fonts...');
    try {
      await page.evaluateHandle('document.fonts.ready');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s for fonts
    } catch (error) {
      console.log('⚠️ Font loading timeout - continuing anyway');
    }
    
    // Generate PDF
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
      preferCSSPageSize: true
    });
    
    console.log('✅ PDF generated successfully');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return null;
  } finally {
    // Clean up resources
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.log('⚠️ Error closing page:', error);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.log('⚠️ Error closing browser:', error);
      }
    }
  }
}

/**
 * Generate quotation HTML with your exact fonts and branding
 */
function generateQuotationHTML(
  quotation: any, 
  language: string = 'en', 
  selectedPackage?: any, 
  selectedPromotion?: any
): string {
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quotation - ${quotation.quotation_number || 'Q-' + quotation.id}</title>
      <style>
        /* YOUR EXACT FONTS - NO CHANGES TO BRANDING */
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-SemiBold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Japanese Font - EXACTLY AS YOUR BRANDING */
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Thai Font - EXACTLY AS YOUR BRANDING */
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Korean Font - EXACTLY AS YOUR BRANDING */
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Base styles with YOUR EXACT FONTS */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        /* Multilingual font support - EXACTLY AS YOUR BRANDING */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
        }
        
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', sans-serif;
        }
        
        .ko-text, [lang="ko"] {
          font-family: 'Noto Sans KR', 'Malgun Gothic', 'AppleGothic', sans-serif;
        }
        
        /* Layout styles */
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .quotation-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .quotation-details {
          flex: 1;
        }
        
        .quotation-number {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .date {
          margin-bottom: 5px;
        }
        
        .customer-info {
          flex: 1;
          text-align: right;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .items-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .total-section {
          text-align: right;
          margin-bottom: 20px;
        }
        
        .total-row {
          margin-bottom: 5px;
        }
        
        .grand-total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-box {
          width: 200px;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">Your Company Name</div>
          <div>Professional Vehicle Inspection Services</div>
        </div>
        
        <div class="quotation-info">
          <div class="quotation-details">
            <div class="quotation-number">Quotation: ${quotation.quotation_number || 'Q-' + quotation.id}</div>
            <div class="date">Date: ${new Date(quotation.created_at).toLocaleDateString()}</div>
            <div class="date">Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}</div>
          </div>
          
          <div class="customer-info">
            <div><strong>Customer:</strong></div>
            <div>${quotation.customer_name || 'N/A'}</div>
            <div>${quotation.customer_email || 'N/A'}</div>
            <div>${quotation.customer_phone || 'N/A'}</div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.quotation_items?.map((item: any) => `
              <tr>
                <td>${item.description || 'N/A'}</td>
                <td>${item.quantity || 1}</td>
                <td>$${(item.unit_price || 0).toFixed(2)}</td>
                <td>$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">Subtotal: $${(quotation.subtotal || 0).toFixed(2)}</div>
          ${quotation.tax_rate ? `<div class="total-row">Tax (${quotation.tax_rate}%): $${(quotation.tax_amount || 0).toFixed(2)}</div>` : ''}
          ${quotation.discount_amount ? `<div class="total-row">Discount: -$${quotation.discount_amount.toFixed(2)}</div>` : ''}
          <div class="grand-total">Total: $${(quotation.total_amount || 0).toFixed(2)}</div>
        </div>
        
        ${quotation.signature ? `
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Customer Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Authorized Signature</div>
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for choosing our services. This quotation is valid for 30 days from the date of issue.</p>
          <p>For any questions, please contact us at support@yourcompany.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
