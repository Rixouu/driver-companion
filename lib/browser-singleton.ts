import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

/**
 * Browser Singleton for PDF Generation
 * Reuses browser instances to avoid the 1155ms launch time
 */
class BrowserSingleton {
  private static instance: BrowserSingleton;
  private browser: any = null;
  private isLaunching: boolean = false;
  private lastUsed: number = 0;
  private readonly MAX_IDLE_TIME = 30000; // 30 seconds

  private constructor() {}

  public static getInstance(): BrowserSingleton {
    if (!BrowserSingleton.instance) {
      BrowserSingleton.instance = new BrowserSingleton();
    }
    return BrowserSingleton.instance;
  }

  public async getBrowser() {
    const now = Date.now();
    
    // If browser exists and is not too old, reuse it
    if (this.browser && (now - this.lastUsed) < this.MAX_IDLE_TIME) {
      this.lastUsed = now;
      return this.browser;
    }

    // If browser is too old, close it
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.warn('⚠️ Error closing old browser:', error);
      }
      this.browser = null;
    }

    // If already launching, wait for it
    if (this.isLaunching) {
      while (this.isLaunching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.browser) {
        this.lastUsed = now;
        return this.browser;
      }
    }

    // Launch new browser
    this.isLaunching = true;
    try {
      console.log('🚀 Launching new browser instance...');
      const launchStart = Date.now();
      
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      
      if (isProduction) {
        this.browser = await puppeteer.launch({
          args: [
            ...chromium.args,
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
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          timeout: 30000
        });
      } else {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
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
          ],
          timeout: 30000
        });
      }

      const launchTime = Date.now() - launchStart;
      console.log(`✅ Browser launched in ${launchTime}ms`);
      
      this.lastUsed = now;
      return this.browser;
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  public async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('🔒 Browser closed');
      } catch (error) {
        console.warn('⚠️ Error closing browser:', error);
      }
      this.browser = null;
    }
  }

  public async cleanup() {
    await this.closeBrowser();
  }
}

export const browserSingleton = BrowserSingleton.getInstance();

// Cleanup on process exit
process.on('SIGINT', async () => {
  await browserSingleton.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserSingleton.cleanup();
  process.exit(0);
});
