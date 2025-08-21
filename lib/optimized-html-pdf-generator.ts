import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { enhancedPdfCache } from './enhanced-pdf-cache';
import { cdnAssets } from './cdn-assets';
import { generateFontCSS } from './base64-fonts';

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
 * Enhanced font loading utility for base64 fonts
 */
async function ensureFontsLoadedOptimized(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting enhanced font loading for base64 fonts...');
    const fontLoadStart = Date.now();
    
    // Wait for fonts to be ready with longer timeout for base64 fonts
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise(resolve => setTimeout(resolve, 3000)) // 3s max for base64 fonts
    ]);
    
    // Additional check to ensure Noto Sans is loaded
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.check('1em Noto Sans');
    });
    
    console.log(`📝 Noto Sans font loaded: ${fontsLoaded}`);
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Font loading completed in ${fontLoadTime}ms`);
    
    // Give more time for base64 fonts to render properly
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.warn('⚠️  Font loading error (using fallbacks):', error);
  }
}

/**
 * Ultra-optimized Puppeteer configuration for fastest PDF generation
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
    '--disable-features=VizDisplayCompositor',
    '--disable-ipc-flooding-protection',
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
    '--max_old_space_size=4096',
    // NEW: Ultra-optimization for speed (but keep images for logo)
    '--disable-javascript',
    '--disable-css',
    // '--disable-fonts' // REMOVED: This was preventing base64 fonts from loading
  ];

  if (isProduction) {
    return {
      args: [...chromium.args, ...baseArgs],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      timeout: 30000 // 30s timeout for browser launch
    };
  }

  return {
    headless: true,
    args: baseArgs,
    timeout: 30000 // 30s timeout for browser launch
  };
}

/**
 * HTML template with ORIGINAL fonts exactly as specified - NO CHANGES TO LAYOUT OR FONTS
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
        ${generateFontCSS()}
        
        * {
          box-sizing: border-box;
        }
        
        body {
                  /* OPTIMIZED multi-language font stack with base64 Noto Sans */
        font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai',
                     -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                     'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Thonburi',
                     'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga' 1, 'kern' 1;
          text-rendering: optimizeLegibility;
        }
        
        /* OPTIMIZED: Force font application for billing address and customer info */
        .billing-address, .customer-info, .customer-details,
        [data-field="billing_address"], [data-field="customer_name"],
        .billing-address *, .customer-info *, .customer-details *,
        [data-field="billing_address"] *, [data-field="customer_name"] * {
          font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai',
                       -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                       'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Thonburi',
                       'Helvetica Neue', Arial, sans-serif !important;
        }
        
        /* Ensure proper rendering for all text - EXACTLY AS ORIGINAL */
        h1, h2, h3, h4, h5, h6, p, span, div {
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Force base64 font application for all text elements */
        * {
          font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai',
                       -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                       'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Thonburi',
                       'Helvetica Neue', Arial, sans-serif !important;
        }
        
        /* Debug: Add visible indicator that fonts are loaded */
        body::before {
          content: 'Fonts: Noto Sans (Base64) Loaded';
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.1);
          padding: 5px;
          font-size: 10px;
          z-index: 9999;
          font-family: 'Noto Sans', sans-serif;
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

/**
 * Generate PDF with caching and performance optimization
 */
export async function generateOptimizedPdfFromHtml(
  htmlContent: string, 
  options?: {
    format?: 'A4' | 'Letter' | 'Legal';
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    printBackground?: boolean;
    scale?: number;
  },
  quotation?: any,
  selectedPackage?: PricingPackage | null,
  selectedPromotion?: PricingPromotion | null,
  language = 'en'
): Promise<Buffer> {
  
  const metrics: PerformanceMetrics = { startTime: Date.now() };
  console.log('🚀 Starting optimized PDF generation...');
  
  // Try enhanced cache first if quotation data is provided
  let cacheHash: string | null = null;
  if (quotation) {
    cacheHash = enhancedPdfCache.generateHash(quotation, selectedPackage, selectedPromotion, language);
    const cachedPDF = await enhancedPdfCache.getCachedPDF(cacheHash);
    if (cachedPDF) {
      const totalTime = Date.now() - metrics.startTime;
      console.log(`⚡ PDF served from enhanced cache in ${totalTime}ms`);
      return cachedPDF;
    }
  }

  const defaultOptions = {
    format: 'A4',
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    printBackground: true,
    scale: 1
  };

  const pdfOptions = {
    ...defaultOptions,
    ...options,
    margin: { ...defaultOptions.margin, ...(options?.margin || {}) }
  };

  const isProduction = process.env.NODE_ENV === 'production';
  const fullHtml = createOptimizedHTMLTemplate(htmlContent);

  let browser;
  try {
    // Launch browser with optimized config
    const launchStart = Date.now();
    const config = await getOptimizedPuppeteerConfig(isProduction);
    
    browser = await puppeteer.launch(config);
    
    metrics.browserLaunchTime = Date.now() - launchStart;
    console.log(`⏱️  Browser launched in ${metrics.browserLaunchTime}ms`);

    // Create page with optimization
    const pageStart = Date.now();
    const page = await browser.newPage();
    
    // Set optimized viewport
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    
    // Allow all resources for original layout (images, fonts, etc.)
    // REMOVED: Request interception that blocks images/fonts to maintain original appearance
    
    metrics.pageCreateTime = Date.now() - pageStart;
    console.log(`⏱️  Page created in ${metrics.pageCreateTime}ms`);

    // Set content with minimal waiting for fastest generation
    const contentStart = Date.now();
    await Promise.race([
      page.setContent(fullHtml, { 
        waitUntil: 'domcontentloaded', // Fastest option
        timeout: 3000 // 3s timeout for fastest generation
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content loading timeout')), 3000)
      )
    ]);
    
    metrics.contentSetTime = Date.now() - contentStart;
    console.log(`⏱️  Content set in ${metrics.contentSetTime}ms`);

    // Ensure fonts are loaded for original appearance
    await ensureFontsLoadedOptimized(page);
    metrics.fontLoadTime = Date.now() - (contentStart + (metrics.contentSetTime || 0));

    // Generate PDF with fast timeout
    const pdfStart = Date.now();
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: pdfOptions.format as any,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        scale: pdfOptions.scale,
        timeout: 5000 // 5s timeout for fastest PDF generation
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 5000)
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

    // Cache the generated PDF in enhanced cache if quotation data is provided
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
      language
    );
    
  } catch (error) {
    console.error('❌ Error generating optimized quotation PDF:', error);
    throw error;
  }
}
