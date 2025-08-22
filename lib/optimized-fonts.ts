/**
 * OPTIMIZED FONT SYSTEM FOR JAPANESE AND THAI SUPPORT
 * Uses CDN-hosted Noto Sans fonts for reliable multi-language rendering
 * Maintains exact layout while ensuring proper character display
 */

export const optimizedFonts = {
  // Primary fonts with full Japanese and Thai support
  notoSans: {
    regular: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap',
    japanese: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:ital,wght@0,400;0,500;0,700;1,400&display=swap',
    thai: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:ital,wght@0,400;0,500;0,700;1,400&display=swap'
  },
  
  // Fallback fonts for reliability
  fallbacks: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    webSafe: 'Arial, Helvetica, sans-serif'
  }
};

/**
 * Generate optimized CSS for PDF generation
 * Ensures proper font loading and fallbacks
 */
export function generateOptimizedFontCSS(): string {
  return `
    /* OPTIMIZED MULTI-LANGUAGE FONT SYSTEM */
    /* Import CDN fonts for reliable rendering */
    @import url('${optimizedFonts.notoSans.regular}');
    @import url('${optimizedFonts.notoSans.japanese}');
    @import url('${optimizedFonts.notoSans.thai}');
    
    /* Base font stack with proper fallbacks */
    * {
      font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai', 
                   ${optimizedFonts.fallbacks.system}, ${optimizedFonts.fallbacks.webSafe};
    }
    
    /* Ensure all text elements use the optimized fonts */
    body, h1, h2, h3, h4, h5, h6, p, span, div, td, th, label, input, textarea, 
    .billing-address, .customer-info, .customer-details,
    [data-field="billing_address"], [data-field="customer_name"] {
      font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans Thai', 
                   ${optimizedFonts.fallbacks.system}, ${optimizedFonts.fallbacks.webSafe} !important;
      font-feature-settings: 'liga' 1, 'kern' 1, 'locl' 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Specific language optimizations */
    .japanese-text, [lang="ja"], .ja-text {
      font-family: 'Noto Sans JP', 'Noto Sans', ${optimizedFonts.fallbacks.system} !important;
      line-height: 1.6;
    }
    
    .thai-text, [lang="th"], .th-text {
      font-family: 'Noto Sans Thai', 'Noto Sans', ${optimizedFonts.fallbacks.system} !important;
      line-height: 1.5;
    }
    
    /* Print optimizations */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;
}

/**
 * Font preloading utility for faster rendering
 */
export function generateFontPreloadHTML(): string {
  return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="${optimizedFonts.notoSans.regular}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="${optimizedFonts.notoSans.japanese}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="${optimizedFonts.notoSans.thai}" as="style" onload="this.onload=null;this.rel='stylesheet'">
  `;
}

/**
 * Check if fonts are loaded and ready
 */
export function createFontReadyCheck(): string {
  return `
    // Font loading check for PDF generation
    function checkFontsReady() {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            // Additional check for Japanese and Thai fonts
            const testElement = document.createElement('div');
            testElement.style.fontFamily = 'Noto Sans JP, Noto Sans Thai';
            testElement.style.position = 'absolute';
            testElement.style.visibility = 'hidden';
            testElement.textContent = 'あア美咲みさきกขคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ';
            document.body.appendChild(testElement);
            
            // Wait a bit more for Japanese and Thai fonts to fully load
            setTimeout(() => {
              document.body.removeChild(testElement);
              resolve(true);
            }, 500);
          });
        } else {
          // Fallback for older browsers
          setTimeout(resolve, 1000);
        }
      });
    }
    
    // Wait for fonts to be ready
    await checkFontsReady();
  `;
}
