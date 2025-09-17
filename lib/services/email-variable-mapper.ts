// =============================================================================
// EMAIL VARIABLE MAPPER - Clean Data Transformation
// =============================================================================

import { PricingPackage, PricingPromotion } from '@/types/quotations'

export interface QuotationData {
  id: string
  quote_number: number
  customer_name: string
  customer_email: string
  service_type: string
  vehicle_type: string
  duration_hours: number
  service_days: number
  hours_per_day: number
  pickup_location: string
  dropoff_location: string
  date: string
  time: string
  currency: string
  display_currency: string
  total_amount: number
  service_total: number
  subtotal: number
  tax_amount: number
  tax_percentage: number
  discount_percentage: number
  regular_discount: number
  promotion_discount: number
  final_total: number
  selected_package_code?: string
  selected_promotion_code?: string
  status: string
  created_at: string
  updated_at: string
  last_sent_at?: string
  team_location?: string
}

export interface BookingData {
  id: string
  wp_id: string
  customer_name: string
  customer_email: string
  service_name: string
  vehicle_make: string
  vehicle_model: string
  vehicle_capacity: number
  pickup_location: string
  dropoff_location: string
  date: string
  time: string
  duration: number
  price_amount: number
  price_currency: string
  payment_status: string
  status: string
  created_at: string
  updated_at: string
}

export interface PaymentData {
  amount: number
  currency: string
  payment_method: string
  transaction_id: string
  paid_at: string
}

export class EmailVariableMapper {
  
  // =============================================================================
  // QUOTATION VARIABLES
  // =============================================================================

  /**
   * Map quotation data to email template variables
   */
  static mapQuotationVariables(
    quotation: QuotationData,
    selectedPackage: PricingPackage | null = null,
    selectedPromotion: PricingPromotion | null = null,
    magicLink: string | null = null,
    isUpdated: boolean = false
  ): Record<string, any> {
    const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`
    
    return {
      // Basic quotation info
      quotation_id: formattedQuotationId,
      quotation_number: quotation.quote_number,
      quotation_title: `${quotation.service_type} - ${quotation.vehicle_type}`,
      
      // Customer info
      customer_name: quotation.customer_name,
      customer_email: quotation.customer_email,
      
      // Service details
      service_type: quotation.service_type,
      vehicle_type: quotation.vehicle_type,
      duration_hours: quotation.duration_hours,
      service_days: quotation.service_days,
      hours_per_day: quotation.hours_per_day,
      
      // Location details
      pickup_location: quotation.pickup_location,
      dropoff_location: quotation.dropoff_location,
      date: quotation.date,
      time: quotation.time,
      
      // Pricing details
      currency: quotation.display_currency || quotation.currency,
      total_amount: quotation.total_amount,
      service_total: quotation.service_total,
      subtotal: quotation.subtotal,
      tax_amount: quotation.tax_amount,
      tax_percentage: quotation.tax_percentage,
      discount_percentage: quotation.discount_percentage,
      regular_discount: quotation.regular_discount,
      promotion_discount: quotation.promotion_discount,
      final_total: quotation.final_total,
      
      // Package and promotion
      selected_package: selectedPackage ? {
        name: selectedPackage.name,
        base_price: selectedPackage.base_price,
        description: selectedPackage.description
      } : null,
      selected_promotion: selectedPromotion ? {
        name: selectedPromotion.name,
        discount_percentage: selectedPromotion.discount_percentage,
        description: selectedPromotion.description
      } : null,
      selected_package_name: selectedPackage?.name,
      selected_promotion_name: selectedPromotion?.name,
      
      // Status and metadata
      status: quotation.status,
      is_updated: isUpdated,
      magic_link: magicLink,
      
      // Dates
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      last_sent_at: quotation.last_sent_at,
      
      // Team info
      team_location: quotation.team_location || 'japan',
      
      // Quotation items for detailed breakdown
      quotation_items: this.buildQuotationItems(quotation, selectedPackage, selectedPromotion),
      
      // Greeting text based on status
      greeting_text: this.getQuotationGreeting(quotation.status, isUpdated)
    }
  }

  /**
   * Build quotation items array for template rendering
   */
  private static buildQuotationItems(
    quotation: QuotationData,
    selectedPackage: PricingPackage | null,
    selectedPromotion: PricingPromotion | null
  ): Array<{
    description: string
    vehicle_type: string
    total_price: number
    service_days?: number
    hours_per_day?: number
  }> {
    const items = []
    
    // Main service item
    items.push({
      description: quotation.service_type,
      vehicle_type: quotation.vehicle_type,
      total_price: quotation.service_total,
      service_days: quotation.service_days,
      hours_per_day: quotation.hours_per_day
    })
    
    // Package item if selected
    if (selectedPackage) {
      items.push({
        description: `Package: ${selectedPackage.name}`,
        vehicle_type: '',
        total_price: selectedPackage.base_price
      })
    }
    
    return items
  }

  /**
   * Get appropriate greeting text based on quotation status
   */
  private static getQuotationGreeting(status: string, isUpdated: boolean): string {
    if (isUpdated) {
      return "Thank you for your interest in our services. Please find your updated quotation below."
    }
    
    switch (status) {
      case 'sent':
        return "Thank you for your interest in our services. Please find your quotation below."
      case 'approved':
        return "Great news! Your quotation has been approved."
      case 'rejected':
        return "Thank you for your interest. Unfortunately, we cannot proceed with this quotation."
      default:
        return "Thank you for your interest in our services."
    }
  }

  // =============================================================================
  // BOOKING VARIABLES
  // =============================================================================

  /**
   * Map booking data to email template variables
   */
  static mapBookingVariables(
    booking: BookingData,
    paymentData?: PaymentData
  ): Record<string, any> {
    const formattedBookingId = booking.wp_id || `BOO-${booking.id.slice(-8)}`
    
    return {
      // Basic booking info
      booking_id: formattedBookingId,
      booking_number: booking.wp_id,
      booking_title: `${booking.service_name} - ${booking.vehicle_make} ${booking.vehicle_model}`,
      
      // Customer info
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      
      // Service details
      service_name: booking.service_name,
      vehicle_make: booking.vehicle_make,
      vehicle_model: booking.vehicle_model,
      vehicle_capacity: booking.vehicle_capacity,
      duration: booking.duration,
      
      // Location details
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      date: booking.date,
      time: booking.time,
      
      // Pricing details
      price_amount: booking.price_amount,
      price_currency: booking.price_currency,
      
      // Status and metadata
      status: booking.status,
      payment_status: booking.payment_status,
      
      // Payment details
      payment_data: paymentData ? {
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
        paid_at: paymentData.paid_at
      } : null,
      
      // Dates
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      
      // Greeting text based on status
      greeting_text: this.getBookingGreeting(booking.status, booking.payment_status)
    }
  }

  /**
   * Get appropriate greeting text based on booking status
   */
  private static getBookingGreeting(status: string, paymentStatus: string): string {
    if (paymentStatus === 'paid') {
      return "Thank you for your payment! Your booking has been confirmed."
    }
    
    switch (status) {
      case 'confirmed':
        return "Your booking has been confirmed. We look forward to serving you."
      case 'cancelled':
        return "Your booking has been cancelled. If you have any questions, please contact us."
      case 'completed':
        return "Thank you for choosing our service. We hope you had a great experience."
      default:
        return "Thank you for your booking. We will process your request shortly."
    }
  }

  // =============================================================================
  // PAYMENT VARIABLES
  // =============================================================================

  /**
   * Map payment data to email template variables
   */
  static mapPaymentVariables(
    paymentData: PaymentData,
    bookingOrQuotation: BookingData | QuotationData
  ): Record<string, any> {
    const isQuotation = 'quote_number' in bookingOrQuotation
    const entityId = isQuotation 
      ? `QUO-JPDR-${(bookingOrQuotation as QuotationData).quote_number?.toString().padStart(6, '0') || 'N/A'}`
      : (bookingOrQuotation as BookingData).wp_id || `BOO-${bookingOrQuotation.id.slice(-8)}`
    
    return {
      // Payment details
      payment_amount: paymentData.amount,
      payment_currency: paymentData.currency,
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id,
      paid_at: paymentData.paid_at,
      
      // Entity details
      entity_id: entityId,
      entity_type: isQuotation ? 'quotation' : 'booking',
      entity_title: isQuotation 
        ? `${(bookingOrQuotation as QuotationData).service_type} - ${(bookingOrQuotation as QuotationData).vehicle_type}`
        : `${(bookingOrQuotation as BookingData).service_name} - ${(bookingOrQuotation as BookingData).vehicle_make} ${(bookingOrQuotation as BookingData).vehicle_model}`,
      
      // Customer info
      customer_name: bookingOrQuotation.customer_name,
      customer_email: bookingOrQuotation.customer_email,
      
      // Greeting text
      greeting_text: "Thank you for your payment! Your transaction has been processed successfully."
    }
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Get common variables that are used across all templates
   */
  static getCommonVariables(): Record<string, any> {
    return {
      // Company info
      company_name: 'Driver Japan',
      from_name: 'Driver Japan Team',
      
      // Contact info
      support_email: 'booking@japandriver.com',
      website_url: 'https://japandriver.com',
      
      // Current date/time
      current_date: new Date().toLocaleDateString(),
      current_time: new Date().toLocaleTimeString(),
      
      // App info
      app_name: 'Driver Companion',
      app_version: '2.0.0'
    }
  }

  /**
   * Merge common variables with specific variables and add helper functions
   */
  static mergeVariables(specific: Record<string, any>): Record<string, any> {
    return {
      ...this.getCommonVariables(),
      ...specific,
      
      // Helper functions for templates
      formatCurrency: (amount: number, currency: string) => {
        if (!amount || isNaN(amount)) return `${currency} 0`
        if (currency === 'JPY') {
          return `¥${Math.round(amount).toLocaleString()}`
        }
        if (currency === 'USD') {
          return `$${amount.toLocaleString()}`
        }
        if (currency === 'EUR') {
          return `€${amount.toLocaleString()}`
        }
        return `${currency} ${amount.toLocaleString()}`
      },
      
      formatDate: (date: string, language: string = 'en') => {
        if (!date) return ''
        try {
          const dateObj = new Date(date)
          if (language === 'ja') {
            return dateObj.toLocaleDateString('ja-JP')
          }
          return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          })
        } catch (error) {
          return date
        }
      },
      
      formatTime: (time: string) => {
        if (!time) return ''
        try {
          // Handle both HH:MM:SS and HH:MM formats
          const timeParts = time.split(':')
          return `${timeParts[0]}:${timeParts[1]}`
        } catch (error) {
          return time
        }
      }
    }
  }
}
