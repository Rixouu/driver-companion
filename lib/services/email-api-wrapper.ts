// =============================================================================
// EMAIL API WRAPPER - Clean API Interface
// =============================================================================

import { emailTemplateService } from '@/lib/email/template-service'
import { EmailVariableMapper, QuotationData, BookingData, PaymentData } from './email-variable-mapper'
import { PricingPackage, PricingPromotion } from '@/types/quotations'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailConfig {
  to: string | string[]
  bcc?: string[]
}

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

export interface SendCustomBookingEmailParams {
  booking: BookingData
  emailType: string
  templateVariables: Record<string, any>
  language?: 'en' | 'ja'
  bccEmails?: string
  customSubject?: string
  attachments?: Array<{
    filename: string
    content: string
  }>
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
      console.log('🔄 [EMAIL-API] Starting sendQuotationEmail')
      
      const {
        quotation,
        selectedPackage = null,
        selectedPromotion = null,
        magicLink = null,
        isUpdated = false,
        language = 'en',
        bccEmails = 'booking@japandriver.com'
      } = params

      console.log('🔄 [EMAIL-API] Quotation data:', {
        id: quotation.id,
        customer_email: quotation.customer_email,
        service_type: quotation.service_type,
        total_amount: quotation.total_amount
      })

      // Simplified variable mapping for testing
      const simpleVariables = {
        customer_name: quotation.customer_name,
        quotation_id: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`,
        service_type: quotation.service_type,
        service_name: quotation.service_type,
        vehicle_type: quotation.vehicle_type,
        total_amount: quotation.total_amount,
        currency: quotation.currency,
        date: quotation.date || 'N/A',
        time: quotation.time || 'N/A',
        pickup_location: quotation.pickup_location || 'Pick up location',
        dropoff_location: quotation.dropoff_location || 'Drop off location',
        greeting_text: isUpdated ? 'Thank you for your interest in our services. Please find your updated quotation below.' : 'Thank you for your interest in our services. Please find your quotation below.'
      }
      
      console.log('🔄 [EMAIL-API] Simple variables mapped:', Object.keys(simpleVariables).length)

      // Use the unified "Quotation Sent" template for all quotation emails
      // The template will handle different statuses through variables
      const templateName = 'Quotation Sent'

      // Prepare email config
      const config: EmailConfig = {
        to: quotation.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      console.log('🔄 [EMAIL-API] Attempting to render template:', templateName)
      
      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        templateName,
        simpleVariables,
        'japan', // team
        language
      )

      if (!rendered) {
        console.error('❌ [EMAIL-API] Template rendering failed for:', templateName)
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      console.log('✅ [EMAIL-API] Template rendered successfully:', {
        subject: rendered.subject,
        htmlLength: rendered.html.length,
        textLength: rendered.text.length
      })

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      console.log('🔄 [EMAIL-API] Sending email with config:', {
        from: emailData.from,
        to: emailData.to,
        bcc: emailData.bcc,
        subject: emailData.subject
      })

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        console.error('❌ [EMAIL-API] Resend error:', JSON.stringify(error, null, 2))
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      console.log('✅ [EMAIL-API] Email sent successfully:', data?.id)

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending quotation email:', JSON.stringify(error, null, 2))
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

      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        'Quotation Reminder',
        variables,
        'japan', // team
        language
      )

      if (!rendered) {
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        console.error('❌ [EMAIL-API] Resend error:', error)
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

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

      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        templateName,
        variables,
        'japan', // team
        language
      )

      if (!rendered) {
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        console.error('❌ [EMAIL-API] Resend error:', error)
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

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

      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        'Booking Reminder',
        variables,
        'japan',
        language
      )

      if (!rendered) {
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending booking reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send custom booking email using any template
   */
  static async sendBookingEmail(params: SendCustomBookingEmailParams): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const {
        booking,
        emailType,
        templateVariables,
        language = 'en',
        bccEmails = 'admin.rixou@gmail.com',
        customSubject,
        attachments
      } = params

      console.log('🔄 [EMAIL-API] Starting sendBookingEmail:', {
        emailType,
        bookingId: booking.id,
        customerEmail: booking.customer_email
      })

      // Map template name based on email type
      const templateNameMap: Record<string, string> = {
        'vehicle-upgrade-payment': 'Vehicle Upgrade Payment',
        'vehicle-downgrade-coupon': 'Vehicle Downgrade Coupon',
        'booking-confirmation': 'Booking Confirmed',
        'booking-details': 'Booking Details',
        'booking-invoice': 'Booking Invoice',
        'payment-complete': 'Payment Complete'
      }

      const templateName = templateNameMap[emailType] || emailType

      // Prepare email config
      const config: EmailConfig = {
        to: booking.customer_email,
        bcc: bccEmails.split(',').map(email => email.trim()).filter(email => email)
      }

      console.log('🔄 [EMAIL-API] Attempting to render template:', templateName)
      
      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        templateName,
        templateVariables,
        'japan', // team
        language
      )

      if (!rendered) {
        console.error('❌ [EMAIL-API] Template rendering failed for:', templateName)
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      console.log('✅ [EMAIL-API] Template rendered successfully:', {
        subject: rendered.subject,
        htmlLength: rendered.html.length,
        textLength: rendered.text.length
      })

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: customSubject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
        ...(attachments && attachments.length > 0 && { attachments })
      }

      console.log('🔄 [EMAIL-API] Sending email with config:', {
        from: emailData.from,
        to: emailData.to,
        bcc: emailData.bcc,
        subject: emailData.subject,
        hasAttachments: attachments ? attachments.length > 0 : false
      })

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        console.error('❌ [EMAIL-API] Resend error:', JSON.stringify(error, null, 2))
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      console.log('✅ [EMAIL-API] Email sent successfully:', data?.id)

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

    } catch (error) {
      console.error('❌ [EMAIL-API] Error sending custom booking email:', JSON.stringify(error, null, 2))
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
      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        templateName,
        variables,
        'japan',
        language
      )

      if (!rendered) {
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

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

      // Render template using existing template service
      const rendered = await emailTemplateService.renderTemplate(
        templateName,
        mergedVariables,
        'japan',
        language
      )

      if (!rendered) {
        return {
          success: false,
          error: 'Failed to render email template'
        }
      }

      // Send email using Resend
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: Array.isArray(config.to) ? config.to : [config.to],
        bcc: config.bcc && config.bcc.length > 0 ? config.bcc : undefined,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      }

      const { data, error } = await resend.emails.send(emailData)

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email'
        }
      }

      return {
        success: true,
        messageId: data?.id || 'unknown'
      }

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
    // Use emailTemplateService to get templates
    const templates = await emailTemplateService.getAllTemplates()
    return templates.filter(t => t.category === category)
  }

  /**
   * Clear template cache - placeholder for future implementation
   */
  static clearCache(): void {
    console.log('Template cache cleared (placeholder)')
  }

  /**
   * Get cache statistics - placeholder for future implementation
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return { size: 0, keys: [] }
  }
}
