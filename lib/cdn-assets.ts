/**
 * CDN Asset Management System
 * Host fonts and images on CDN for faster loading
 */

export interface CDNAsset {
  url: string;
  fallbackUrl?: string;
  integrity?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}

export interface FontAsset extends CDNAsset {
  family: string;
  weight: string | number;
  style: 'normal' | 'italic';
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  unicodeRange?: string;
}

/**
 * CDN Configuration
 */
class CDNAssetManager {
  private cdnBaseUrl: string;
  private fallbackBaseUrl: string;

  constructor() {
    // You can use any CDN service (Cloudflare, AWS CloudFront, etc.)
    this.cdnBaseUrl = process.env.CDN_BASE_URL || process.env.NEXT_PUBLIC_CDN_URL || '';
    this.fallbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
  }

  /**
   * Get optimized font URLs from CDN
   */
  getFontAssets(): FontAsset[] {
    const cdnUrl = this.cdnBaseUrl;
    const fallbackUrl = 'https://fonts.gstatic.com';

    return [

      // Noto Sans JP
      {
        family: 'Noto Sans JP',
        weight: 400,
        style: 'normal',
        display: 'swap',
        url: cdnUrl ? `${cdnUrl}/fonts/notosansjp-regular.woff2` : `${fallbackUrl}/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI2.woff2`,
        fallbackUrl: `${fallbackUrl}/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI2.woff2`,
        unicodeRange: 'U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF'
      },
      {
        family: 'Noto Sans JP',
        weight: 500,
        style: 'normal',
        display: 'swap',
        url: cdnUrl ? `${cdnUrl}/fonts/notosansjp-medium.woff2` : `${fallbackUrl}/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI3.woff2`,
        fallbackUrl: `${fallbackUrl}/s/notosansjp/v52/-F62fjtqLzI2JPCgQBnw7HFowAIO2lZ9hgI3.woff2`,
        unicodeRange: 'U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FAF, U+FF00-FFEF'
      },

      // Noto Sans Thai
      {
        family: 'Noto Sans Thai',
        weight: 400,
        style: 'normal',
        display: 'swap',
        url: cdnUrl ? `${cdnUrl}/fonts/notosansthai-regular.woff2` : `${fallbackUrl}/s/notosansthai/v17/iJWnBQcP9n9z1aPwQwb9J3JqJ8g.woff2`,
        fallbackUrl: `${fallbackUrl}/s/notosansthai/v17/iJWnBQcP9n9z1aPwQwb9J3JqJ8g.woff2`,
        unicodeRange: 'U+0E00-0E7F'
      },

      // Noto Sans KR
      {
        family: 'Noto Sans KR',
        weight: 400,
        style: 'normal',
        display: 'swap',
        url: cdnUrl ? `${cdnUrl}/fonts/notosanskr-regular.woff2` : `${fallbackUrl}/s/notosanskr/v35/PbykFmXiEBPT4ITbgNA5Cgm20HTs4JMMuA.woff2`,
        fallbackUrl: `${fallbackUrl}/s/notosanskr/v35/PbykFmXiEBPT4ITbgNA5Cgm20HTs4JMMuA.woff2`,
        unicodeRange: 'U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F, U+D7B0-D7FF'
      }
    ];
  }

  /**
   * Get image assets from CDN
   */
  getImageAssets(): Record<string, CDNAsset> {
    const cdnUrl = this.cdnBaseUrl;
    const fallback = this.fallbackBaseUrl;

    return {
      'driver-logo': {
        url: cdnUrl ? `${cdnUrl}/img/driver-header-logo.png` : `${fallback}/img/driver-header-logo.png`,
        fallbackUrl: `${fallback}/img/driver-header-logo.png`
      },
      'driver-invoice-logo': {
        url: cdnUrl ? `${cdnUrl}/img/driver-invoice-logo.png` : `${fallback}/img/driver-invoice-logo.png`,
        fallbackUrl: `${fallback}/img/driver-invoice-logo.png`
      }
    };
  }

  /**
   * Generate font CSS with CDN URLs
   */
  generateFontCSS(): string {
    const fonts = this.getFontAssets();
    
    return fonts.map(font => `
@font-face {
  font-family: '${font.family}';
  src: url('${font.url}') format('woff2');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: ${font.display};${font.unicodeRange ? `\n  unicode-range: ${font.unicodeRange};` : ''}
}`).join('\n');
  }

  /**
   * Generate Google Fonts preload links
   */
  generatePreloadLinks(): string[] {
    const fonts = this.getFontAssets();
    
    return fonts.map(font => 
      `<link rel="preload" href="${font.url}" as="font" type="font/woff2" crossorigin="anonymous">`
    );
  }

  /**
   * Get optimized image URL with fallback
   */
  getImageUrl(imageName: string): string {
    const images = this.getImageAssets();
    const asset = images[imageName];
    
    if (!asset) {
      console.warn(`Image asset '${imageName}' not found`);
      return `${this.fallbackBaseUrl}/img/${imageName}`;
    }
    
    return asset.url;
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets(): Promise<void> {
    if (typeof window === 'undefined') return; // Server-side check

    const fonts = this.getFontAssets().filter(font => 
      font.family === 'Noto Sans Thai' && [400, 500, 600].includes(font.weight as number)
    );

    // Preload critical fonts
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.url;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      
      link.onerror = () => {
        // Fallback to Google Fonts if CDN fails
        if (font.fallbackUrl && font.fallbackUrl !== font.url) {
          link.href = font.fallbackUrl;
        }
      };
      
      document.head.appendChild(link);
    });

    // Preload critical images
    const images = this.getImageAssets();
    ['driver-logo', 'driver-invoice-logo'].forEach(imageName => {
      const asset = images[imageName];
      if (asset) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = asset.url;
        link.as = 'image';
        
        link.onerror = () => {
          if (asset.fallbackUrl && asset.fallbackUrl !== asset.url) {
            link.href = asset.fallbackUrl;
          }
        };
        
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Generate service worker cache manifest
   */
  generateCacheManifest(): { fonts: string[], images: string[] } {
    const fonts = this.getFontAssets().map(font => font.url);
    const images = Object.values(this.getImageAssets()).map(asset => asset.url);
    
    return { fonts, images };
  }
}

// Export singleton instance
export const cdnAssets = new CDNAssetManager();

// Helper functions for easy usage
export const getFontCSS = () => cdnAssets.generateFontCSS();
export const getImageUrl = (imageName: string) => cdnAssets.getImageUrl(imageName);
export const preloadAssets = () => cdnAssets.preloadCriticalAssets();
