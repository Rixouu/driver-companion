import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { enhancedPdfCache } from './enhanced-pdf-cache';

// Performance monitoring
interface PerformanceMetrics {
  startTime: number;
  browserLaunchTime?: number;
  pageCreateTime?: number;
  contentSetTime?: number;
  fontLoadTime?: number;
  pdfGenerationTime?: number;
  totalTime?: number;
}

/**
 * Enhanced font loading utility with better timeout handling
 */
async function ensureFontsLoadedOptimized(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting enhanced font loading...');
    const fontLoadStart = Date.now();
    
    // Wait for document to be ready
    await page.waitForFunction('document.readyState === "complete"', { timeout: 15000 });
    
    // Wait for fonts to load with multiple fallback strategies
    await Promise.race([
      // Strategy 1: Wait for fonts.ready
      page.evaluateHandle('document.fonts.ready'),
      // Strategy 2: Wait for specific font families with polling
      page.evaluate(() => {
        return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 80; // 8 seconds with 100ms intervals
          
          const checkFonts = () => {
            attempts++;
            const workSans = document.fonts.check('1em "Work Sans"');
            const notoSansJP = document.fonts.check('1em "Noto Sans JP"');
            const notoSansThai = document.fonts.check('1em "Noto Sans Thai"');
            
            if (workSans && notoSansJP && notoSansThai) {
              resolve(true);
            } else if (attempts >= maxAttempts) {
              console.warn('Font loading timeout, proceeding with available fonts');
              resolve(false);
            } else {
              setTimeout(checkFonts, 100);
            }
          };
          checkFonts();
        });
      }),
      // Strategy 3: Timeout after 10 seconds
      new Promise(resolve => setTimeout(resolve, 10000))
    ]);
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Font loading completed in ${fontLoadTime}ms`);
    
    // Additional delay for rendering stability
    await new Promise(resolve => setTimeout(resolve, 800));
  } catch (error) {
    console.warn('⚠️  Font loading timeout (proceeding with available fonts):', error);
    // Continue anyway - fonts may still render
  }
}

/**
 * Optimized Puppeteer configuration for faster PDF generation
 */
async function getOptimizedPuppeteerConfig(isProduction: boolean) {
  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--font-render-hinting=none',
    '--disable-font-subpixel-positioning',
    '--lang=en-US,en,ja,th,fr',
    '--enable-font-antialiasing',
    '--force-color-profile=srgb',
    '--enable-blink-features=CSSFontMetrics',
    '--enable-font-subpixel-positioning',
    '--disable-web-security',
    '--allow-running-insecure-content',
    '--disable-features=VizDisplayCompositor',
    '--max_old_space_size=4096'
  ];

  if (isProduction) {
    return {
      args: [...chromium.args, ...baseArgs],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      timeout: 45000, // Increased timeout for browser launch
      protocolTimeout: 60000, // Increased protocol timeout
      ignoreHTTPSErrors: true
    };
  }

  return {
    headless: true,
    args: baseArgs,
    timeout: 45000,
    protocolTimeout: 60000,
    ignoreHTTPSErrors: true
  };
}

/**
 * Create optimized HTML template with embedded fonts and better encoding
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
        /* Import Google Fonts for reliable rendering */
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&display=swap');
        
        /* Fallback system fonts */
        body {
          font-family: 'Work Sans', 'Noto Sans JP', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        /* Ensure proper character rendering */
        * {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Specific styling for Japanese text */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
          line-height: 1.6;
        }
        
        /* Specific styling for Thai text */
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', sans-serif;
          line-height: 1.5;
        }
        
        /* Ensure proper rendering for all text */
        h1, h2, h3, h4, h5, h6, p, span, div {
          font-feature-settings: 'liga' 1, 'kern' 1;
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
    </html>`;
}

/**
 * Generate optimized PDF from HTML content with enhanced error handling
 */
export async function generateOptimizedPdfFromHtml(
  htmlContent: string,
  pdfOptions: {
    format?: 'A4' | 'Letter' | 'Legal';
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    printBackground?: boolean;
    scale?: number;
  } = {},
  quotation?: any,
  selectedPackage?: PricingPackage | null,
  selectedPromotion?: PricingPromotion | null,
  language?: string,
  cacheHash?: string
): Promise<Buffer> {
  const metrics: PerformanceMetrics = { startTime: Date.now() };
  let browser: any = null;
  
  try {
    console.log('🚀 Starting optimized PDF generation...');
    
    // Check cache first
    if (cacheHash) {
      const cachedPdf = await enhancedPdfCache.getCachedPDF(cacheHash);
      if (cachedPdf) {
        console.log('✅ PDF served from cache');
        return cachedPdf;
      }
    }
    
    // Launch browser with optimized config
    const isProduction = process.env.NODE_ENV === 'production';
    const config = await getOptimizedPuppeteerConfig(isProduction);
    
    console.log('🌐 Launching browser...');
    const browserLaunchStart = Date.now();
    browser = await puppeteer.launch(config);
    metrics.browserLaunchTime = Date.now() - browserLaunchStart;
    console.log(`⏱️  Browser launched in ${metrics.browserLaunchTime}ms`);
    
    // Create page with optimized settings
    console.log('📄 Creating page...');
    const pageCreateStart = Date.now();
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable JavaScript and images
    await page.setJavaScriptEnabled(true);
    
    metrics.pageCreateTime = Date.now() - pageCreateStart;
    console.log(`⏱️  Page created in ${metrics.pageCreateTime}ms`);
    
    // Create optimized HTML template
    const optimizedHtml = createOptimizedHTMLTemplate(htmlContent);
    
    // Set content with timeout handling
    console.log('📝 Setting page content...');
    const contentSetStart = Date.now();
    
    await Promise.race([
      page.setContent(optimizedHtml, { 
        waitUntil: 'networkidle2', // More lenient than networkidle0
        timeout: 45000 // Increased timeout for content setting
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Content setting timeout')), 45000)
      )
    ]);
    
    metrics.contentSetTime = Date.now() - contentSetStart;
    console.log(`⏱️  Content set in ${metrics.contentSetTime}ms`);
    
    // Ensure fonts are loaded
    await ensureFontsLoadedOptimized(page);
    
    // Generate PDF with enhanced timeout handling
    console.log('🖨️  Generating PDF...');
    const pdfStart = Date.now();
    
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: pdfOptions.format as any || 'A4',
        margin: pdfOptions.margin || { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: pdfOptions.printBackground !== false,
        scale: pdfOptions.scale || 1,
        timeout: 45000 // Increased timeout for PDF generation
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 45000)
      )
    ]);
    
    metrics.pdfGenerationTime = Date.now() - pdfStart;
    console.log(`⏱️  PDF generated in ${metrics.pdfGenerationTime}ms`);
    
    await browser.close();
    
    const buffer = Buffer.from(pdfBuffer);
    metrics.totalTime = Date.now() - metrics.startTime;
    
    console.log('📊 PDF Generation Performance:', {
      totalTime: `${metrics.totalTime}ms`,
      browserLaunch: `${metrics.browserLaunchTime}ms`,
      pageCreate: `${metrics.pageCreateTime}ms`,
      contentSet: `${metrics.contentSetTime}ms`,
      pdfGeneration: `${metrics.pdfGenerationTime}ms`,
      fromCache: false
    });
    
    // Cache the generated PDF
    if (cacheHash) {
      await enhancedPdfCache.cachePDF(cacheHash, buffer);
    }
    
    return buffer;
    
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    metrics.totalTime = Date.now() - metrics.startTime;
    console.error('❌ PDF generation failed:', {
      error: error instanceof Error ? error.message : String(error),
      totalTime: `${metrics.totalTime}ms`,
      metrics
    });
    
    throw new Error(`Optimized PDF generation failed: ${(error as Error).message}`);
  }
}

/**
 * Re-export the existing generateQuotationHtml function for compatibility
 */
export { generateQuotationHtml } from './html-pdf-generator';

/**
 * Generate quotation PDF with optimizations
 */
export async function generateOptimizedQuotationPDF(
  quotation: any,
  language: string,
  selectedPackage: PricingPackage | null,
  selectedPromotion: PricingPromotion | null
): Promise<Buffer> {
  console.log(`🔄 Generating optimized PDF for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    // Import the HTML generator
    const { generateQuotationHtml } = await import('./html-pdf-generator');
    
    const htmlContent = generateQuotationHtml(
      quotation, 
      language as 'en' | 'ja', 
      selectedPackage, 
      selectedPromotion
    );
    
    // Generate cache hash for this quotation
    const cacheHash = quotation?.id ? `quote_${quotation.id}_${language}` : undefined;
    
    return await generateOptimizedPdfFromHtml(
      htmlContent,
      {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true
      },
      quotation,
      selectedPackage,
      selectedPromotion,
      language,
      cacheHash
    );
    
  } catch (error) {
    console.error('❌ Error generating optimized quotation PDF:', error);
    throw error;
  }
}
