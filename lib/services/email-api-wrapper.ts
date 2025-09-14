// =============================================================================
// EMAIL API WRAPPER - Clean API Interface
// =============================================================================

import { unifiedEmailService, EmailConfig } from './unified-email-service'
import { EmailVariableMapper, QuotationData, BookingData, PaymentData } from './email-variable-mapper'
import { PricingPackage, PricingPromotion } from '@/types/pricing'

export interface SendQuotationEmailParams {
  quotation: QuotationData
  selectedPackage?: PricingPackage | null
  selectedPromotion?: PricingPromotion | null
  magicLink?: string | null
  isUpdated?: boolean
  language?: 'en' | 'ja'
  bccEmails?: string
}

export interface SendBookingEmailParams {
  booking: BookingData
  paymentData?: PaymentData
  language?: 'en' | 'ja'
  bccEmails?: string
}

export interface SendPaymentEmailParams {
  paymentData: PaymentData
  bookingOrQuotation: BookingData | QuotationData
  language?: 'en' | 'ja'
  bccEmails?: string
}

export class EmailAPIWrapper {
  
  // =============================================================================
  // QUOTATION EMAILS
  // =============================================================================

  /**
   * Send quotation email using database template
   */
  static async sendQuotationEmail(params: SendQuotationEmailParams): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const {
        quotation,
        selectedPackage = null,
        selectedPromotion = null,
        magicLink = null,
        isUpdated = false,
        language = 'en',
        bccEmails = 'booking@japandriver.com'
      } = params

      // Map quotation data to template variables
      const variables = EmailVariableMapper.mergeVariables(
        EmailVariableMapper.mapQuotationVariables(
          quotation,
          selectedPackage,
          selectedPromotion,
          magicLink,
          isUpdated
        )
      )

      // Use the unified "Quotation Sent" template for all quotation emails
      // The template will handle different statuses through variables
      const templateName = 'Quotation Sent'

      // Prepare email config
      const config: EmailConfig = {
        to: quotation.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      // Send email using unified service
      return await unifiedEmailService.sendTemplateEmail(
        templateName,
        variables,
        config,
        'quotation',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending quotation email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send quotation reminder email
   */
  static async sendQuotationReminder(
    quotation: QuotationData,
    language: 'en' | 'ja' = 'en',
    bccEmails: string = 'booking@japandriver.com'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const variables = EmailVariableMapper.mergeVariables(
        EmailVariableMapper.mapQuotationVariables(quotation)
      )

      const config: EmailConfig = {
        to: quotation.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      return await unifiedEmailService.sendTemplateEmail(
        'Quotation Reminder',
        variables,
        config,
        'quotation',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending quotation reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =============================================================================
  // BOOKING EMAILS
  // =============================================================================

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(params: SendBookingEmailParams): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const {
        booking,
        paymentData,
        language = 'en',
        bccEmails = 'booking@japandriver.com'
      } = params

      // Map booking data to template variables
      const variables = EmailVariableMapper.mergeVariables(
        EmailVariableMapper.mapBookingVariables(booking, paymentData)
      )

      // Use the unified "Booking Confirmed" template for all booking emails
      // The template will handle different statuses through variables
      const templateName = 'Booking Confirmed'

      // Prepare email config
      const config: EmailConfig = {
        to: booking.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      // Send email using unified service
      return await unifiedEmailService.sendTemplateEmail(
        templateName,
        variables,
        config,
        'booking',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending booking confirmation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send booking reminder email
   */
  static async sendBookingReminder(
    booking: BookingData,
    language: 'en' | 'ja' = 'en',
    bccEmails: string = 'booking@japandriver.com'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const variables = EmailVariableMapper.mergeVariables(
        EmailVariableMapper.mapBookingVariables(booking)
      )

      const config: EmailConfig = {
        to: booking.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      return await unifiedEmailService.sendTemplateEmail(
        'Booking Reminder',
        variables,
        config,
        'booking',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending booking reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =============================================================================
  // PAYMENT EMAILS
  // =============================================================================

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(params: SendPaymentEmailParams): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const {
        paymentData,
        bookingOrQuotation,
        language = 'en',
        bccEmails = 'booking@japandriver.com'
      } = params

      // Map payment data to template variables
      const variables = EmailVariableMapper.mergeVariables(
        EmailVariableMapper.mapPaymentVariables(paymentData, bookingOrQuotation)
      )

      // Determine template name based on entity type
      const isQuotation = 'quote_number' in bookingOrQuotation
      const templateName = isQuotation ? 'Quotation Payment Complete' : 'Booking Payment Complete'

      // Prepare email config
      const config: EmailConfig = {
        to: bookingOrQuotation.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      // Send email using unified service
      return await unifiedEmailService.sendTemplateEmail(
        templateName,
        variables,
        config,
        isQuotation ? 'quotation' : 'booking',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending payment confirmation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =============================================================================
  // SYSTEM EMAILS
  // =============================================================================

  /**
   * Send system notification email
   */
  static async sendSystemNotification(
    templateName: string,
    variables: Record<string, any>,
    to: string | string[],
    language: 'en' | 'ja' = 'en',
    bccEmails?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mergedVariables = EmailVariableMapper.mergeVariables(variables)

      const config: EmailConfig = {
        to,
        ...(bccEmails && { bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email) })
      }

      return await unifiedEmailService.sendTemplateEmail(
        templateName,
        mergedVariables,
        config,
        'system',
        language
      )

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending system notification:', error)
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
   * Get available templates for a category
   */
  static async getTemplates(category: 'quotation' | 'booking' | 'system'): Promise<any[]> {
    return await unifiedEmailService.getTemplatesByCategory(category)
  }

  /**
   * Clear template cache
   */
  static clearCache(): void {
    unifiedEmailService.clearCache()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return unifiedEmailService.getCacheStats()
  }
}
