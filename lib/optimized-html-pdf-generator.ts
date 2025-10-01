import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { enhancedPdfCache } from './enhanced-pdf-cache';
import { generateOptimizedFontCSS, createFontReadyCheck } from './optimized-fonts';
import { browserSingleton } from './browser-singleton';

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
 * Ultra-optimized font loading utility for reliable PDF generation
 */
async function ensureFontsLoadedOptimized(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting optimized font loading...');
    const fontLoadStart = Date.now();
    
    // Use a much faster font loading approach
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          // Check if fonts are already loaded
          if (document.fonts.status === 'loaded') {
            resolve(undefined);
            return;
          }
          // Wait for fonts to load with shorter timeout
          document.fonts.ready.then(() => {
            setTimeout(() => resolve(undefined), 100); // Reduced from 500ms
          });
        } else {
          // Fallback with shorter timeout
          setTimeout(() => resolve(undefined), 200); // Reduced from 1000ms
        }
      });
    });
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Fonts loaded in ${fontLoadTime}ms`);
    
    // Minimal wait for rendering stability - reduced from 500ms
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.warn('⚠️  Font loading error (proceeding anyway):', error);
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
    '--max_old_space_size=4096'
  ];

  if (isProduction || process.env.VERCEL) {
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
 * HTML template with OPTIMIZED CDN fonts for Japanese and Thai support
 * Maintains exact layout while ensuring proper character rendering
 */
function createOptimizedHTMLTemplate(htmlContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta http-equiv="Content-Language" content="en, ja, th, fr, ko">
      <title>PDF Export</title>
      
      <!-- Preload fonts for faster rendering -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      
      <style>
        ${generateOptimizedFontCSS()}
        
        * {
          box-sizing: border-box;
        }
        
        /* Ensure layout integrity - no font changes that affect spacing */
        body {
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          line-height: 1.4;
        }
        
        /* Maintain exact spacing and layout */
        table, tr, td, th {
          border-collapse: collapse;
          border-spacing: 0;
        }
        
        /* Preserve all original styling */
        .quotation-content, .billing-address, .customer-info {
          /* Keep original margins, padding, and positioning */
        }
        
        /* Print optimizations */
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
  selectedPackage?: any,
  selectedPromotion?: any,
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
    // Use browser singleton for reuse
    const launchStart = Date.now();
    browser = await browserSingleton.getBrowser();
    
    metrics.browserLaunchTime = Date.now() - launchStart;
    console.log(`⏱️  Browser obtained in ${metrics.browserLaunchTime}ms`);

    // Create page with optimization
    const pageStart = Date.now();
    const page = await browser.newPage();
    
    // Set optimized viewport
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    
    // Allow all resources for original layout (images, fonts, etc.)
    // REMOVED: Request interception that blocks images/fonts to maintain original appearance
    
    metrics.pageCreateTime = Date.now() - pageStart;
    console.log(`⏱️  Page created in ${metrics.pageCreateTime}ms`);

    // Set content with reasonable waiting for reliable generation
    const contentStart = Date.now();
    await Promise.race([
      page.setContent(fullHtml, { 
        waitUntil: 'domcontentloaded', // Reliable option
        timeout: 10000 // 10s timeout for reliable generation
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content loading timeout')), 10000)
      )
    ]);
    
    metrics.contentSetTime = Date.now() - contentStart;
    console.log(`⏱️  Content set in ${metrics.contentSetTime}ms`);

    // Ensure fonts are loaded for reliable appearance
    await ensureFontsLoadedOptimized(page);
    metrics.fontLoadTime = Date.now() - (contentStart + (metrics.contentSetTime || 0));

    // Generate PDF with reasonable timeout
    const pdfStart = Date.now();
    const pdfBuffer = await Promise.race([
      page.pdf({
        format: pdfOptions.format as any,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        scale: pdfOptions.scale,
        timeout: 15000 // 15s timeout for reliable PDF generation
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
      )
    ]);

    metrics.pdfGenerationTime = Date.now() - pdfStart;
    console.log(`⏱️  PDF generated in ${metrics.pdfGenerationTime}ms`);

    // Don't close browser - let singleton manage it
    
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
    // Don't close browser on error - let singleton manage it
    // The singleton will handle cleanup based on idle time
    
    metrics.totalTime = Date.now() - metrics.startTime;
    console.error('❌ Optimized PDF generation failed, trying fallback:', {
      error: error instanceof Error ? error.message : String(error),
      totalTime: `${metrics.totalTime}ms`,
      metrics
    });

    
    // Try fallback to regular generator
    try {
      console.log('🔄 Attempting fallback to regular PDF generator...');
      const { generatePdfFromHtml } = await import('./quotation-html-generator');
      const fallbackBuffer = await generatePdfFromHtml(htmlContent, options);
      console.log('✅ Fallback PDF generation successful');
      return fallbackBuffer;
    } catch (fallbackError) {
      console.error('❌ Fallback PDF generation also failed:', fallbackError);
      throw new Error(`PDF generation failed (optimized + fallback): ${(error as Error).message}`);
    }
  }
}

/**
 * Re-export the existing generateQuotationHtml function for compatibility
 */
export { generateQuotationHtml } from './quotation-html-generator';

/**
 * Generate quotation PDF with optimizations
 */
export async function generateOptimizedQuotationPDF(
  quotation: any,
  language: string,
  selectedPackage: any,
  selectedPromotion: any,
  showTeamInfo: boolean = true,
  statusConfigs: { [status: string]: { showSignature: boolean; showStatusBadge: boolean; statusBadgeColor: string; statusBadgeName: string } } = {}
): Promise<Buffer> {
  console.log(`🔄 Generating optimized PDF for quote: ${quotation?.id}, lang: ${language}`);
  
  try {
    // Import the HTML generator
    const { generateQuotationHtml } = await import('./quotation-html-generator');
    
    const htmlContent = generateQuotationHtml(
      quotation, 
      language as 'en' | 'ja', 
      selectedPackage, 
      selectedPromotion,
      showTeamInfo,
      statusConfigs
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