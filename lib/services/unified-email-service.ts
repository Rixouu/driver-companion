import { createServiceClient } from '@/lib/supabase/service-client'
import { Resend } from 'resend'

// =============================================================================
// UNIFIED EMAIL SERVICE - Clean Architecture
// =============================================================================

export interface EmailTemplate {
  id: string
  name: string
  type: 'email' | 'push' | 'sms'
  category: 'booking' | 'quotation' | 'maintenance' | 'system'
  subject: string
  html_content: string
  text_content: string
  variables: Record<string, any>
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface EmailVariables {
  [key: string]: string | number | boolean | object | null | undefined
}

export interface EmailConfig {
  to: string | string[]
  bcc?: string | string[]
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

// Template cache for performance
const templateCache = new Map<string, EmailTemplate>()
const cacheExpiry = new Map<string, number>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export class UnifiedEmailService {
  private supabase = createServiceClient()
  private resend = new Resend(process.env.RESEND_API_KEY)

  // =============================================================================
  // TEMPLATE MANAGEMENT
  // =============================================================================

  /**
   * Get template from database with caching
   */
  async getTemplate(templateName: string, category?: string): Promise<EmailTemplate | null> {
    const cacheKey = `${templateName}-${category || 'default'}`
    
    // Check cache first
    if (templateCache.has(cacheKey)) {
      const expiry = cacheExpiry.get(cacheKey) || 0
      if (Date.now() < expiry) {
        return templateCache.get(cacheKey)!
      }
    }

    try {
      let query = this.supabase
        .from('notification_templates')
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error(`❌ [UNIFIED-EMAIL] Error fetching template ${templateName}:`, error)
        return null
      }

      if (!data || data.length === 0) {
        console.warn(`⚠️ [UNIFIED-EMAIL] Template ${templateName} not found`)
        return null
      }

      const template = data[0] as EmailTemplate
      
      // Cache the template
      templateCache.set(cacheKey, template)
      cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION)
      
      console.log(`✅ [UNIFIED-EMAIL] Template ${templateName} loaded and cached`)
      return template

    } catch (error) {
      console.error(`❌ [UNIFIED-EMAIL] Error in getTemplate:`, error)
      return null
    }
  }

  /**
   * Get all templates for a category
   */
  async getTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error(`❌ [UNIFIED-EMAIL] Error fetching templates for category ${category}:`, error)
        return []
      }

      return (data || []) as EmailTemplate[]
    } catch (error) {
      console.error(`❌ [UNIFIED-EMAIL] Error in getTemplatesByCategory:`, error)
      return []
    }
  }

  // =============================================================================
  // TEMPLATE RENDERING
  // =============================================================================

  /**
   * Render template with variables using Handlebars-like syntax
   */
  async renderTemplate(
    template: EmailTemplate, 
    variables: EmailVariables,
    language: 'en' | 'ja' = 'en'
  ): Promise<RenderedEmail> {
    try {
      const processedVariables = await this.processVariables(variables, language)
      
      const subject = this.renderString(template.subject, processedVariables)
      const html = this.renderString(template.html_content, processedVariables)
      const text = this.renderString(template.text_content, processedVariables)

      return {
        subject: subject.trim(),
        html: html.trim(),
        text: text.trim()
      }
    } catch (error) {
      console.error(`❌ [UNIFIED-EMAIL] Error rendering template ${template.name}:`, error)
      throw new Error(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process and enhance variables before rendering
   */
  private async processVariables(variables: EmailVariables, language: 'en' | 'ja'): Promise<EmailVariables> {
    const processed = { ...variables }
    
    // Add language-specific translations
    processed.language = language
    processed.is_japanese = language === 'ja'
    
    // Add common formatting functions
    processed.formatCurrency = (amount: number, currency: string = 'JPY') => {
      return this.formatCurrency(amount, currency)
    }
    
    processed.formatDate = (date: string | Date) => {
      return this.formatDate(date, language)
    }
    
    // Add company branding from app settings
    try {
      const { data: appSettings } = await this.supabase
        .from('app_settings')
        .select('*')
        .in('key', ['ui_sidebar_logo_text', 'ui_sidebar_logo_color', 'ui_primary_button_color'])
      
      if (appSettings) {
        const settings = appSettings.reduce((acc, item) => {
          acc[item.key] = item.value
          return acc
        }, {} as Record<string, string>)
        
        processed.company_name = settings.ui_sidebar_logo_text || 'Driver Japan'
        processed.primary_color = settings.ui_primary_button_color || '#dc2626'
        processed.logo_color = settings.ui_sidebar_logo_color || '#dc2626'
      }
    } catch (error) {
      console.warn('⚠️ [UNIFIED-EMAIL] Could not load app settings for branding')
    }
    
    return processed
  }

  /**
   * Simple template rendering (Handlebars-like)
   */
  private renderString(template: string, variables: EmailVariables): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      
      // Handle conditional logic
      if (trimmedKey.startsWith('#if ')) {
        return this.renderConditional(template, trimmedKey, variables)
      }
      
      // Handle loops
      if (trimmedKey.startsWith('#each ')) {
        return this.renderLoop(template, trimmedKey, variables)
      }
      
      // Handle unless
      if (trimmedKey.startsWith('#unless ')) {
        return this.renderUnless(template, trimmedKey, variables)
      }
      
      // Handle helper functions
      if (trimmedKey.includes(' ')) {
        const parts = trimmedKey.split(' ')
        const helperName = parts[0]
        const args = parts.slice(1)
        
        if (helperName === 'formatCurrency' && args.length >= 1) {
          const amount = this.getNestedValue(variables, args[0])
          const currency = args[1] || 'JPY'
          return this.formatCurrency(Number(amount) || 0, currency)
        }
        
        if (helperName === 'formatDate' && args.length >= 1) {
          const date = this.getNestedValue(variables, args[0])
          const language = args[1] || 'en'
          return this.formatDate(date, language as 'en' | 'ja')
        }
      }
      
      // Regular variable replacement
      const value = this.getNestedValue(variables, trimmedKey)
      return value !== undefined ? String(value) : ''
    })
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Format currency helper
   */
  private formatCurrency(amount: number, currency: string = 'JPY'): string {
    if (!amount) return currency === 'JPY' ? '¥0' : `${currency} 0`
    
    // Exchange rates (simplified for demo)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    }

    // Convert amount from JPY to selected currency
    const originalCurrency = 'JPY'
    const convertedAmount = amount * (exchangeRates[currency] / exchangeRates[originalCurrency])
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(convertedAmount)
    }
  }

  /**
   * Format date helper
   */
  private formatDate(date: string | Date, language: 'en' | 'ja' = 'en'): string {
    if (!date) return ''
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return ''
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    
    const locale = language === 'ja' ? 'ja-JP' : 'en-US'
    return dateObj.toLocaleDateString(locale, options)
  }

  /**
   * Render conditional blocks
   */
  private renderConditional(template: string, condition: string, variables: EmailVariables): string {
    // Simplified conditional rendering
    const conditionKey = condition.replace('#if ', '').trim()
    const value = this.getNestedValue(variables, conditionKey)
    return value ? '' : '' // For now, just return empty - can be enhanced
  }

  /**
   * Render loop blocks
   */
  private renderLoop(template: string, loop: string, variables: EmailVariables): string {
    // Simplified loop rendering
    return '' // For now, just return empty - can be enhanced
  }

  /**
   * Render unless blocks
   */
  private renderUnless(template: string, condition: string, variables: EmailVariables): string {
    // Simplified unless rendering
    return '' // For now, just return empty - can be enhanced
  }

  // =============================================================================
  // EMAIL SENDING
  // =============================================================================

  /**
   * Send email using template from database
   */
  async sendTemplateEmail(
    templateName: string,
    variables: EmailVariables,
    config: EmailConfig,
    category?: string,
    language: 'en' | 'ja' = 'en'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`🔄 [UNIFIED-EMAIL] Sending template email: ${templateName}`)
      
      // Get template
      const template = await this.getTemplate(templateName, category)
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }

      // Render template
      const rendered = await this.renderTemplate(template, variables, language)
      
      // Send email
      const result = await this.sendEmail(rendered, config)
      
      console.log(`✅ [UNIFIED-EMAIL] Template email sent successfully: ${templateName}`)
      return result

    } catch (error) {
      console.error(`❌ [UNIFIED-EMAIL] Error sending template email ${templateName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send email with rendered content
   */
  async sendEmail(
    rendered: RenderedEmail,
    config: EmailConfig
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured')
      }

      const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '')
      
      const emailData = {
        from: config.from || `Driver Japan <booking@${emailDomain}>`,
        to: Array.isArray(config.to) ? config.to : [config.to],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        ...(config.bcc && { bcc: Array.isArray(config.bcc) ? config.bcc : [config.bcc] }),
        ...(config.replyTo && { reply_to: config.replyTo }),
        ...(config.attachments && { attachments: config.attachments })
      }

      const result = await this.resend.emails.send(emailData)
      
      return {
        success: true,
        messageId: result.data?.id
      }

    } catch (error) {
      console.error('❌ [UNIFIED-EMAIL] Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Format currency based on currency code
   */
  private formatCurrency(amount: number, currency: string = 'JPY'): string {
    if (!amount) return currency === 'JPY' ? '¥0' : `${currency} 0`
    
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    }

    const convertedAmount = amount * (exchangeRates[currency] / exchangeRates['JPY'])
    
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else if (currency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
      return `${currency} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  /**
   * Format date based on language
   */
  private formatDate(date: string | Date, language: 'en' | 'ja'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const locale = language === 'ja' ? 'ja-JP' : 'en-US'
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    templateCache.clear()
    cacheExpiry.clear()
    console.log('🧹 [UNIFIED-EMAIL] Template cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: templateCache.size,
      keys: Array.from(templateCache.keys())
    }
  }
}

// Export singleton instance
export const unifiedEmailService = new UnifiedEmailService()
