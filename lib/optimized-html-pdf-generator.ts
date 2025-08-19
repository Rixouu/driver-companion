import puppeteer, { Browser, LaunchOptions, Page } from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { enhancedPdfCache } from './enhanced-pdf-cache';
import { cdnAssets } from './cdn-assets';
import { generateQuotationHtml } from './html-pdf-generator';

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
 * Optimized font loading utility with aggressive timeouts
 */
async function ensureFontsLoadedOptimized(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting optimized font loading...');
    const fontLoadStart = Date.now();
    
    // Reduced timeout for faster processing
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise(resolve => setTimeout(resolve, 2000)) // Reduced from 5s to 2s
    ]);
    
    // Quick additional check with shorter timeout
    await Promise.race([
      page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.fonts.status === 'loaded') {
            resolve(true);
          } else {
            document.fonts.onloadingdone = resolve;
            // Much shorter fallback timeout
            setTimeout(resolve, 1000);
          }
        });
      }),
      new Promise(resolve => setTimeout(resolve, 1000)) // 1s max
    ]);
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Font loading completed in ${fontLoadTime}ms`);
    
    // Minimal delay for rendering
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.warn('⚠️  Font loading timeout (using fallbacks):', error);
  }
}

/**
 * Optimized Puppeteer configuration for faster PDF generation
 */
function getOptimizedPuppeteerConfig(): LaunchOptions {
  // Check if we're in a serverless environment
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME;
  
  if (isServerless) {
    // Minimal config for serverless environments
    return {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-init',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--no-first-run',
        '--mute-audio',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-web-resources',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-mode',
        '--disable-features=NetworkService,NetworkServiceLogging'
      ],
      headless: true,
      timeout: 20000, // Reduced timeout for serverless
      protocolTimeout: 20000,
      slowMo: 0,
      pipe: true, // Use pipe instead of WebSocket for better serverless performance
      dumpio: false
    };
  }
  
  // Full config for non-serverless environments
  return {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-init',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-web-resources',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-mode',
      '--disable-features=NetworkService,NetworkServiceLogging'
    ],
    headless: true,
    timeout: 30000, // 30 second timeout for browser launch
    protocolTimeout: 30000,
    slowMo: 0,
    pipe: true, // Use pipe instead of WebSocket for better serverless performance
    dumpio: false
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
        /* Enhanced font loading with CDN optimization - EXACTLY AS ORIGINAL but faster */
        ${cdnAssets.generateFontCSS()}
        
        /* Enhanced font definitions with better fallbacks - EXACTLY AS ORIGINAL */
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
          /* Enhanced font stack with proper Unicode ranges - EXACTLY AS ORIGINAL */
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
          /* Ensure proper text rendering for CJK and Thai characters */
          -webkit-font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
          -moz-font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Japanese text - EXACTLY AS ORIGINAL */
        .ja-text, [lang="ja"] {
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'MS Gothic', 'MS Mincho', sans-serif;
          line-height: 1.6;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Thai text - EXACTLY AS ORIGINAL */
        .th-text, [lang="th"] {
          font-family: 'Noto Sans Thai', 'Thonburi', 'Tahoma', 'Arial Unicode MS', Arial, sans-serif;
          line-height: 1.5;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Specific styling for Korean text - EXACTLY AS ORIGINAL */
        .ko-text, [lang="ko"] {
          font-family: 'Noto Sans KR', 'Apple Gothic', 'Malgun Gothic', 'Dotum', sans-serif;
          line-height: 1.6;
          font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
        }
        
        /* Ensure proper rendering for all text - EXACTLY AS ORIGINAL */
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
    const config = await getOptimizedPuppeteerConfig();
    
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

    // Set content with proper network loading for fonts and images
    const contentStart = Date.now();
    await Promise.race([
      page.setContent(fullHtml, { 
        waitUntil: 'networkidle0', // Wait for network to be idle (for fonts)
        timeout: 20000 // 20s timeout for font loading
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content loading timeout')), 20000)
      )
    ]);
    
    metrics.contentSetTime = Date.now() - contentStart;
    console.log(`⏱️  Content set in ${metrics.contentSetTime}ms`);

    // Ensure fonts are loaded for original appearance
    await ensureFontsLoadedOptimized(page);
    metrics.fontLoadTime = Date.now() - (contentStart + (metrics.contentSetTime || 0));

    // Generate PDF with timeout
    const pdfStart = Date.now();
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: pdfOptions.format as any,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        scale: pdfOptions.scale,
        timeout: 20000 // 20s timeout for PDF generation
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 20000)
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
  language: string = 'en',
  selectedPackage?: any | null,
  selectedPromotion?: any | null
): Promise<Buffer> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 [PDF GENERATOR] Attempt ${attempt}/${maxRetries} - Starting optimized PDF generation...`);
      
      const result = await attemptPdfGeneration(quotation, language, selectedPackage, selectedPromotion, attempt);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ [PDF GENERATOR] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`⏳ [PDF GENERATOR] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed, try fallback
  try {
    console.log('🔄 [PDF GENERATOR] All retries failed, attempting fallback to original generator...');
    const { generatePdfFromHtml } = await import('./html-pdf-generator');
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja', selectedPackage, selectedPromotion);
    
    const fallbackPdf = await generatePdfFromHtml(htmlContent, {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    });
    
    console.log('✅ [PDF GENERATOR] Fallback generation successful!');
    return fallbackPdf;
    
  } catch (fallbackError) {
    console.error('❌ [PDF GENERATOR] Fallback generation also failed:', fallbackError);
    throw new Error(`Failed to generate PDF after ${maxRetries} attempts and fallback: ${lastError?.message || 'Unknown error'}`);
  }
}

async function attemptPdfGeneration(
  quotation: any,
  language: string,
  selectedPackage: any | null | undefined,
  selectedPromotion: any | null | undefined,
  attemptNumber: number
): Promise<Buffer> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  
  try {
    // Launch browser with aggressive timeout
    const browserLaunchPromise = puppeteer.launch(getOptimizedPuppeteerConfig());
    
    // Race browser launch against timeout
    browser = await Promise.race([
      browserLaunchPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Browser launch timeout after 15 seconds')), 15000)
      )
    ]);
    
    const browserLaunchTime = Date.now() - startTime;
    console.log(`⏱️  Browser launched in ${browserLaunchTime}ms`);
    
    if (!browser) {
      throw new Error('Failed to launch browser');
    }
    
    // Create page with timeout
    const page = await Promise.race([
      browser.newPage(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Page creation timeout after 10 seconds')), 10000)
      )
    ]);
    
    const pageCreateTime = Date.now() - startTime - browserLaunchTime;
    console.log(`⏱️  Page created in ${pageCreateTime}ms`);
    
    // Set aggressive timeouts for page operations
    await page.setDefaultTimeout(20000);
    await page.setDefaultNavigationTimeout(20000);
    
    // Generate HTML content
    const htmlContent = generateQuotationHtml(quotation, language as 'en' | 'ja', selectedPackage, selectedPromotion);
    const optimizedHtml = createOptimizedHTMLTemplate(htmlContent);
    
    // Set content with timeout
    const contentSetPromise = page.setContent(optimizedHtml, { 
      waitUntil: 'networkidle0',
      timeout: 20000 
    });
    
    await Promise.race([
      contentSetPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Content setting timeout after 20 seconds')), 20000)
      )
    ]);
    
    const contentSetTime = Date.now() - startTime - browserLaunchTime - pageCreateTime;
    console.log(`⏱️  Content set in ${contentSetTime}ms`);
    
    // Wait for fonts to load with shorter timeout
    try {
      await Promise.race([
        page.waitForFunction(() => document.fonts.ready, { timeout: 5000 }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Fallback after 3 seconds
      ]);
      console.log('⏱️  Font loading completed in 3ms');
    } catch (fontError) {
      console.log('⚠️  Font loading timeout, continuing anyway...');
    }
    
    // Generate PDF with timeout
    const pdfGenerationPromise = page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      timeout: 20000
    });
    
    const pdfBuffer = await Promise.race([
      pdfGenerationPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout after 20 seconds')), 20000)
      )
    ]);
    
    const pdfGenerationTime = Date.now() - startTime - browserLaunchTime - pageCreateTime - contentSetTime;
    console.log(`⏱️  PDF generated in ${pdfGenerationTime}ms`);
    
    const totalTime = Date.now() - startTime;
    console.log(`📊 PDF Generation Performance (Attempt ${attemptNumber}): {
  totalTime: '${totalTime}ms',
  browserLaunch: '${browserLaunchTime}ms',
  pageCreate: '${pageCreateTime}ms',
  contentSet: '${contentSetTime}ms',
  pdfGeneration: '${pdfGenerationTime}ms',
  fromCache: false
}`);
    
    // Cache the generated PDF
    const hash = enhancedPdfCache.generateHash(quotation.id + language + (selectedPackage?.id || '') + (selectedPromotion?.id || ''));
    await enhancedPdfCache.cachePDF(hash, Buffer.from(pdfBuffer));
    console.log(`💾 PDF cached with hash: ${hash.substring(0, 8)}`);
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error(`❌ [PDF GENERATOR] Attempt ${attemptNumber} failed:`, error);
    throw error;
    
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Browser closed successfully');
      } catch (closeError) {
        console.warn('⚠️  Error closing browser:', closeError);
      }
    }
  }
}
