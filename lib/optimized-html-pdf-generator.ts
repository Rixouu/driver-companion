import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { enhancedPdfCache } from './enhanced-pdf-cache';
import { cdnAssets } from './cdn-assets';

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
 * Fast font loading utility optimized for serverless
 */
async function ensureFontsLoadedFast(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting fast font loading...');
    const fontLoadStart = Date.now();
    
    // Fast font ready check with minimal timeout
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise(resolve => setTimeout(resolve, 1000)) // 1s max for speed
    ]);
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Font loading completed in ${fontLoadTime}ms`);
    
    // Minimal delay for rendering
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.warn('⚠️  Font loading error (proceeding):', error);
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
    // REMOVED: --disable-fonts flag to allow local fonts
    '--disable-javascript',
    '--disable-css'
  ];

  if (isProduction) {
    return {
      args: [...chromium.args, ...baseArgs],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      timeout: 15000 // 15s timeout for browser launch
    };
  }

  return {
    headless: true,
    args: baseArgs,
    timeout: 15000 // 15s timeout for browser launch
  };
}

/**
 * HTML template with LOCAL fonts for fast, reliable rendering
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
        /* LOCAL FONTS - Fast and reliable for serverless */
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
          src: url('/fonts/WorkSans-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Japanese Font - Local file */
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF;
        }
        
        /* Thai Font - Local file */
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0E00-0E7F;
        }
        
        /* Korean Font - Local file */
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          /* OPTIMIZED font stack with local fonts first */
          font-family: 'Work Sans', 'Noto Sans JP', 'Noto Sans Thai', 'Noto Sans KR',
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
        
        /* Force font application for all text elements */
        * {
          font-family: 'Work Sans', 'Noto Sans JP', 'Noto Sans Thai', 'Noto Sans KR',
                       -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                       'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Thonburi',
                       'Helvetica Neue', Arial, sans-serif !important;
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
    
    metrics.pageCreateTime = Date.now() - pageStart;
    console.log(`⏱️  Page created in ${metrics.pageCreateTime}ms`);

    // Set content with minimal waiting for fastest generation
    const contentStart = Date.now();
    await Promise.race([
      page.setContent(fullHtml, { 
        waitUntil: 'domcontentloaded', // Fastest option
        timeout: 5000 // 5s timeout for fastest generation
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content loading timeout')), 5000)
      )
    ]);
    
    metrics.contentSetTime = Date.now() - contentStart;
    console.log(`⏱️  Content set in ${metrics.contentSetTime}ms`);

    // Fast font loading
    await ensureFontsLoadedFast(page);
    metrics.fontLoadTime = Date.now() - (contentStart + (metrics.contentSetTime || 0));

    // Generate PDF with fast timeout
    const pdfStart = Date.now();
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: pdfOptions.format as any,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        scale: pdfOptions.scale,
        timeout: 8000 // 8s timeout for fastest PDF generation
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 8000)
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
