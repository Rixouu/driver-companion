/**
 * Email System Configuration
 * Centralized configuration for email sending performance and behavior
 */

export const emailConfig = {
  // Timeout settings (in milliseconds)
  timeouts: {
    totalRequest: 45000,        // 45 seconds for entire request
    emailSending: 30000,        // 30 seconds for email sending
    pdfGeneration: 25000,       // 25 seconds for PDF generation
    databaseQuery: 10000,       // 10 seconds for database operations
    browserLaunch: 30000,       // 30 seconds for browser launch
    pageLoad: 15000,            // 15 seconds for page loading
    fontLoading: 2000,          // 2 seconds for font loading
  },

  // PDF generation settings
  pdf: {
    cacheEnabled: true,
    cacheExpiryHours: 24,
    maxCacheSize: 100,
    
    // Performance optimizations
    skipImages: true,
    skipJavaScript: true,
    useSystemFonts: true,
    
    // Quality settings
    format: 'A4' as const,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    },
    printBackground: true,
    scale: 1
  },

  // Email sending settings
  email: {
    maxRetries: 3,
    retryDelayMs: 1000,
    batchSize: 10,
    
    // Queue settings for async processing
    queue: {
      maxSize: 1000,
      processingInterval: 1000,  // 1 second between emails
      priorities: ['high', 'normal', 'low'] as const
    }
  },

  // Performance monitoring
  monitoring: {
    logPerformanceMetrics: true,
    slowRequestThreshold: 10000, // 10 seconds
    errorReporting: true
  },

  // Feature flags
  features: {
    asyncEmailProcessing: true,
    pdfCaching: true,
    performanceLogging: true,
    errorTracking: true
  }
};

export type EmailConfig = typeof emailConfig;
