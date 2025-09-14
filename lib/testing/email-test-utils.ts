// =============================================================================
// EMAIL TESTING UTILITIES - Professional Testing Tools
// =============================================================================

import { EmailAPIWrapper } from '@/lib/services/email-api-wrapper'

export interface EmailTestResult {
  success: boolean
  messageId?: string
  error?: string
  duration?: number
  template?: string
  subject?: string
  htmlLength?: number
  textLength?: number
}

export interface EmailTestConfig {
  email: string
  language: 'en' | 'ja'
  bccEmails?: string
  quotationId?: string
  bookingId?: string
}

export class EmailTestUtils {
  
  // =============================================================================
  // QUOTATION EMAIL TESTS
  // =============================================================================

  /**
   * Test quotation email sending
   */
  static async testQuotationEmail(config: EmailTestConfig): Promise<EmailTestResult> {
    const startTime = Date.now()
    
    try {
      if (!config.quotationId) {
        throw new Error('Quotation ID is required for quotation email test')
      }

      // Get quotation data (mock for testing)
      const quotationData = {
        id: config.quotationId,
        quote_number: 1,
        customer_name: 'Test Customer',
        customer_email: config.email,
        service_type: 'Airport Transfer',
        vehicle_type: 'Toyota Alphard',
        duration_hours: 2,
        service_days: 1,
        hours_per_day: 2,
        pickup_location: 'Narita Airport',
        dropoff_location: 'Tokyo Station',
        date: '2024-01-15',
        time: '14:00',
        currency: 'JPY',
        display_currency: 'JPY',
        total_amount: 15000,
        service_total: 15000,
        subtotal: 15000,
        tax_amount: 1500,
        tax_percentage: 10,
        discount_percentage: 0,
        regular_discount: 0,
        promotion_discount: 0,
        final_total: 16500,
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        team_location: 'japan'
      }

      const result = await EmailAPIWrapper.sendQuotationEmail({
        quotation: quotationData as any,
        selectedPackage: null,
        selectedPromotion: null,
        magicLink: 'https://example.com/magic-link',
        isUpdated: false,
        language: config.language,
        bccEmails: config.bccEmails || 'booking@japandriver.com'
      })

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        duration: Date.now() - startTime,
        template: 'Quotation Sent',
        subject: `Your Quotation from Driver - QUO-JPDR-000001`
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test quotation reminder email
   */
  static async testQuotationReminder(config: EmailTestConfig): Promise<EmailTestResult> {
    const startTime = Date.now()
    
    try {
      if (!config.quotationId) {
        throw new Error('Quotation ID is required for reminder email test')
      }

      // Mock quotation data
      const quotationData = {
        id: config.quotationId,
        quote_number: 1,
        customer_name: 'Test Customer',
        customer_email: config.email,
        service_type: 'Airport Transfer',
        vehicle_type: 'Toyota Alphard',
        duration_hours: 2,
        pickup_location: 'Narita Airport',
        dropoff_location: 'Tokyo Station',
        date: '2024-01-15',
        time: '14:00',
        currency: 'JPY',
        total_amount: 15000,
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await EmailAPIWrapper.sendQuotationReminder(
        quotationData as any,
        config.language,
        config.bccEmails || 'booking@japandriver.com'
      )

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        duration: Date.now() - startTime,
        template: 'Quotation Reminder'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  // =============================================================================
  // BOOKING EMAIL TESTS
  // =============================================================================

  /**
   * Test booking confirmation email
   */
  static async testBookingConfirmation(config: EmailTestConfig): Promise<EmailTestResult> {
    const startTime = Date.now()
    
    try {
      if (!config.bookingId) {
        throw new Error('Booking ID is required for booking email test')
      }

      // Mock booking data
      const bookingData = {
        id: config.bookingId,
        wp_id: 'BOO-000001',
        customer_name: 'Test Customer',
        customer_email: config.email,
        service_name: 'Airport Transfer',
        vehicle_make: 'Toyota',
        vehicle_model: 'Alphard',
        vehicle_capacity: 4,
        pickup_location: 'Narita Airport',
        dropoff_location: 'Tokyo Station',
        date: '2024-01-15',
        time: '14:00',
        duration: 2,
        price_amount: 15000,
        price_currency: 'JPY',
        payment_status: 'paid',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const paymentData = {
        amount: 15000,
        currency: 'JPY',
        payment_method: 'Credit Card',
        transaction_id: 'TXN123456',
        paid_at: new Date().toISOString()
      }

      const result = await EmailAPIWrapper.sendBookingConfirmation({
        booking: bookingData as any,
        paymentData,
        language: config.language,
        bccEmails: config.bccEmails || 'booking@japandriver.com'
      })

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        duration: Date.now() - startTime,
        template: 'Booking Confirmed'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  // =============================================================================
  // SYSTEM EMAIL TESTS
  // =============================================================================

  /**
   * Test system notification email
   */
  static async testSystemNotification(config: EmailTestConfig): Promise<EmailTestResult> {
    const startTime = Date.now()
    
    try {
      const variables = {
        subject: 'Test System Notification',
        title: 'System Test',
        message: 'This is a test system notification email.',
        language: config.language
      }

      const result = await EmailAPIWrapper.sendSystemNotification(
        'System Notification',
        variables,
        config.email,
        config.language,
        config.bccEmails
      )

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        duration: Date.now() - startTime,
        template: 'System Notification'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  // =============================================================================
  // BATCH TESTING
  // =============================================================================

  /**
   * Run all email tests
   */
  static async runAllTests(config: EmailTestConfig): Promise<{
    results: EmailTestResult[]
    summary: {
      total: number
      passed: number
      failed: number
      totalDuration: number
    }
  }> {
    const results: EmailTestResult[] = []
    const startTime = Date.now()

    // Test quotation email
    results.push(await this.testQuotationEmail(config))
    
    // Test quotation reminder
    results.push(await this.testQuotationReminder(config))
    
    // Test booking confirmation
    results.push(await this.testBookingConfirmation(config))
    
    // Test system notification
    results.push(await this.testSystemNotification(config))

    const totalDuration = Date.now() - startTime
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        totalDuration
      }
    }
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Generate test data
   */
  static generateTestData() {
    return {
      quotationId: `test-quotation-${Date.now()}`,
      bookingId: `test-booking-${Date.now()}`,
      email: 'test@example.com',
      language: 'en' as const
    }
  }

  /**
   * Format test results
   */
  static formatResults(results: EmailTestResult[]): string {
    return results.map((result, index) => {
      const status = result.success ? '✅' : '❌'
      const duration = result.duration ? `${result.duration}ms` : 'N/A'
      return `${status} Test ${index + 1}: ${result.template || 'Unknown'} (${duration})`
    }).join('\n')
  }
}
