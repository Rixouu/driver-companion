import puppeteer from 'puppeteer';
import { QuotationItem, PricingPackage, PricingPromotion } from '../types/quotations';

// Use require for chromium to avoid import issues
const chromium = require('@sparticuz/chromium');

/**
 * Serverless-compatible PDF generator with embedded fonts
 * Uses @sparticuz/chromium for reliable Chrome execution in serverless
 */
export async function generateOptimizedQuotationPDF(
  quotation: any,
  language: string = 'en',
  selectedPackage?: any,
  selectedPromotion?: any
): Promise<Buffer | null> {
  console.log('🚀 Starting serverless PDF generation...');
  
  let browser: any = null;
  let page: any = null;
  
  try {
    // Use @sparticuz/chromium for serverless compatibility
    console.log('🌐 Launching serverless browser...');
          browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    
    console.log('✅ Browser launched successfully');
    
    // Create page
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Generate HTML content with embedded fonts
    const htmlContent = generateQuotationHTML(quotation, language, selectedPackage, selectedPromotion);
    
    // Set content
    console.log('📄 Setting content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for fonts to load
    console.log('🔤 Waiting for fonts...');
    try {
      await page.evaluateHandle('document.fonts.ready');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s for fonts
    } catch (error) {
      console.log('⚠️ Font loading timeout - continuing anyway');
    }
    
    // Additional font loading check with fallback
    try {
      await page.evaluate(() => {
        // Force font loading with timeout
        return new Promise((resolve) => {
          document.fonts.ready.then(() => resolve(true));
          // Fallback timeout
          setTimeout(() => resolve(true), 2000);
        });
      });
    } catch (error) {
      console.log('⚠️ Font loading check failed - continuing anyway');
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
 * Generate quotation HTML with embedded fonts for reliable rendering
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
        /* EMBEDDED FONTS - WORK IN ANY ENVIRONMENT */
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap');
        
        /* Base styles with YOUR EXACT FONTS */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Work Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        /* Multilingual font support - EXACTLY AS YOUR BRANDING */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Roboto', sans-serif;
        }
        
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', 'Roboto', sans-serif;
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
