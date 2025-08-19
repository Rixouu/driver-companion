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
 * Optimized font loading utility with local font support
 */
async function ensureFontsLoadedOptimized(page: any): Promise<void> {
  try {
    console.log('⏱️  Starting local font loading...');
    const fontLoadStart = Date.now();
    
    // Wait for fonts to be ready with longer timeout for local fonts
    await Promise.race([
      page.evaluateHandle('document.fonts.ready'),
      new Promise(resolve => setTimeout(resolve, 5000)) // 5s for local fonts
    ]);
    
    // Additional check for font loading status
    await Promise.race([
      page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.fonts.status === 'loaded') {
            resolve(true);
          } else {
            document.fonts.onloadingdone = resolve;
            // Fallback timeout for local fonts
            setTimeout(resolve, 3000);
          }
        });
      }),
      new Promise(resolve => setTimeout(resolve, 3000)) // 3s max
    ]);
    
    // Verify specific fonts are loaded
    const fontsLoaded = await page.evaluate(() => {
      const requiredFonts = [
        'Work Sans',
        'Noto Sans JP', 
        'Noto Sans Thai',
        'Noto Sans KR'
      ];
      
      return requiredFonts.every(font => {
        return document.fonts.check(`12px ${font}`);
      });
    });
    
    if (fontsLoaded) {
      console.log('✅ All required fonts loaded successfully');
    } else {
      console.warn('⚠️  Some fonts may not be fully loaded');
    }
    
    const fontLoadTime = Date.now() - fontLoadStart;
    console.log(`⏱️  Font loading completed in ${fontLoadTime}ms`);
    
    // Delay for rendering stability
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.warn('⚠️  Font loading error:', error);
    // Continue with available fonts
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
    // REMOVED: '--disable-images' - Keep images for original layout
    // REMOVED: '--disable-javascript' - Keep JS for font loading
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
    '--enable-font-subpixel-positioning'
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
        /* LOCAL FONTS FOR RELIABLE PDF GENERATION */
        @import url('/fonts/fonts.css');
        
        /* Additional font-face definitions for better browser support */
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-SemiBold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        @font-face {
          font-family: 'Work Sans';
          src: url('/fonts/WorkSans-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
          unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF;
        }
        
        @font-face {
          font-family: 'Noto Sans JP';
          src: url('/fonts/NotoSansJP-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
          unicode-range: U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0E00-0E7F;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0E00-0E7F;
        }
        
        @font-face {
          font-family: 'Noto Sans Thai';
          src: url('/fonts/NotoSansThai-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
          unicode-range: U+0E00-0E7F;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
          unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
          unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F;
        }
        
        @font-face {
          font-family: 'Noto Sans KR';
          src: url('/fonts/NotoSansKR-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
          unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F;
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
    
    // Additional wait for rendering stability
    await new Promise(resolve => setTimeout(resolve, 500));

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
