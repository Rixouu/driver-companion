"use server"

import { createServiceClient } from '@/lib/supabase/server'
import { notificationService } from './notification-service'
import { NotificationType } from '@/types/notifications'

interface ScheduledNotificationJob {
  id: string
  type: NotificationType
  entity_type: 'booking' | 'quotation'
  entity_id: string
  scheduled_for: string
  user_id: string
  metadata?: Record<string, any>
}

export class ScheduledNotificationService {
  private supabase = createServiceClient()

  /**
   * Check and send quotation expiry notifications
   * Runs every hour via cron job
   */
  async processQuotationExpiryNotifications() {
    try {
      console.log('[Scheduled Notifications] Processing quotation expiry notifications...')

      // Get quotations expiring in 24 hours (haven't been notified yet)
      const { data: expiring24h } = await this.supabase
        .from('quotations')
        .select('*')
        .eq('status', 'sent')
        .gte('expiry_date', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()) // 23h from now
        .lte('expiry_date', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()) // 25h from now
        .is('converted_to_booking_id', null)

      if (expiring24h && expiring24h.length > 0) {
        for (const quotation of expiring24h) {
          // Check if we already sent 24h notification
          const { data: existing } = await this.supabase
            .from('notifications')
            .select('id')
            .eq('type', 'quotation_expiring_24h')
            .eq('related_id', quotation.id)
            .single()

          if (!existing) {
            await notificationService.createAdminNotification(
              'quotation_expiring_24h',
              quotation.id,
              `Quotation #${quotation.quote_number} expires in 24 hours`,
              `Quotation for ${quotation.customer_name} (${quotation.service_type}) expires tomorrow at ${new Date(quotation.expiry_date).toLocaleString()}`
            )
            console.log(`[Scheduled Notifications] Sent 24h expiry notification for quotation #${quotation.quote_number}`)
          }
        }
      }

      // Get quotations expiring in 2 hours (haven't been notified yet)
      const { data: expiring2h } = await this.supabase
        .from('quotations')
        .select('*')
        .eq('status', 'sent')
        .gte('expiry_date', new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()) // 1.5h from now
        .lte('expiry_date', new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()) // 2.5h from now
        .is('converted_to_booking_id', null)

      if (expiring2h && expiring2h.length > 0) {
        for (const quotation of expiring2h) {
          // Check if we already sent 2h notification
          const { data: existing } = await this.supabase
            .from('notifications')
            .select('id')
            .eq('type', 'quotation_expiring_2h')
            .eq('related_id', quotation.id)
            .single()

          if (!existing) {
            await notificationService.createAdminNotification(
              'quotation_expiring_2h',
              quotation.id,
              `Urgent: Quotation #${quotation.quote_number} expires in 2 hours`,
              `Quotation for ${quotation.customer_name} (${quotation.service_type}) expires soon at ${new Date(quotation.expiry_date).toLocaleString()}`
            )
            console.log(`[Scheduled Notifications] Sent 2h expiry notification for quotation #${quotation.quote_number}`)
          }
        }
      }

      // Mark expired quotations
      const { data: expired } = await this.supabase
        .from('quotations')
        .select('*')
        .eq('status', 'sent')
        .lt('expiry_date', new Date().toISOString())
        .is('converted_to_booking_id', null)

      if (expired && expired.length > 0) {
        for (const quotation of expired) {
          // Update status to expired
          await this.supabase
            .from('quotations')
            .update({ status: 'expired' })
            .eq('id', quotation.id)

          // Send expired notification
          const { data: existing } = await this.supabase
            .from('notifications')
            .select('id')
            .eq('type', 'quotation_expired')
            .eq('related_id', quotation.id)
            .single()

          if (!existing) {
            await notificationService.createAdminNotification(
              'quotation_expired',
              quotation.id,
              `Quotation #${quotation.quote_number} has expired`,
              `Quotation for ${quotation.customer_name} (${quotation.service_type}) expired at ${new Date(quotation.expiry_date).toLocaleString()}`
            )
            console.log(`[Scheduled Notifications] Marked quotation #${quotation.quote_number} as expired`)
          }
        }
      }

      console.log(`[Scheduled Notifications] Processed ${(expiring24h?.length || 0) + (expiring2h?.length || 0) + (expired?.length || 0)} quotation notifications`)
      
    } catch (error) {
      console.error('[Scheduled Notifications] Error processing quotation expiry notifications:', error)
      throw error
    }
  }

  /**
   * Check and send booking reminder notifications
   * Runs every hour via cron job
   */
  async processBookingReminderNotifications() {
    try {
      console.log('[Scheduled Notifications] Processing booking reminder notifications...')

      // Get bookings starting in 24 hours
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
      const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)

      const { data: bookings24h } = await this.supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .gte('date', tomorrowStart.toISOString().split('T')[0])
        .lt('date', tomorrowEnd.toISOString().split('T')[0])

      if (bookings24h && bookings24h.length > 0) {
        for (const booking of bookings24h) {
          // Check if we already sent 24h notification
          const { data: existing } = await this.supabase
            .from('notifications')
            .select('id')
            .eq('type', 'booking_reminder_24h')
            .eq('related_id', booking.id)
            .single()

          if (!existing) {
            await notificationService.createAdminNotification(
              'booking_reminder_24h',
              booking.id,
              `Booking reminder: ${booking.service_name} tomorrow`,
              `Booking for ${booking.customer_name} (${booking.service_name}) is scheduled for tomorrow at ${booking.time}. Pickup: ${booking.pickup_location}`
            )
            console.log(`[Scheduled Notifications] Sent 24h reminder for booking ${booking.wp_id}`)
          }
        }
      }

      // Get bookings starting in 2 hours
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const currentDate = now.toISOString().split('T')[0]

      const { data: bookings2h } = await this.supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'pending'])
        .eq('date', currentDate)

      if (bookings2h && bookings2h.length > 0) {
        for (const booking of bookings2h) {
          // Parse booking time and check if it's within 2 hours
          const [hours, minutes] = booking.time.split(':').map(Number)
          const bookingDateTime = new Date()
          bookingDateTime.setHours(hours, minutes, 0, 0)

          const timeDiff = bookingDateTime.getTime() - now.getTime()
          const hoursDiff = timeDiff / (1000 * 60 * 60)

          if (hoursDiff > 1.5 && hoursDiff < 2.5) {
            // Check if we already sent 2h notification
            const { data: existing } = await this.supabase
              .from('notifications')
              .select('id')
              .eq('type', 'booking_reminder_2h')
              .eq('related_id', booking.id)
              .single()

            if (!existing) {
              await notificationService.createAdminNotification(
                'booking_reminder_2h',
                booking.id,
                `Urgent: Booking starts in 2 hours - ${booking.service_name}`,
                `Booking for ${booking.customer_name} (${booking.service_name}) starts at ${booking.time}. Pickup: ${booking.pickup_location}`
              )
              console.log(`[Scheduled Notifications] Sent 2h reminder for booking ${booking.wp_id}`)
            }
          }
        }
      }

      console.log(`[Scheduled Notifications] Processed ${(bookings24h?.length || 0)} booking reminder notifications`)
      
    } catch (error) {
      console.error('[Scheduled Notifications] Error processing booking reminder notifications:', error)
      throw error
    }
  }

  /**
   * Main scheduler function that runs all notification checks
   */
  async processAllScheduledNotifications() {
    console.log('[Scheduled Notifications] Starting scheduled notification processing...')
    
    try {
      await Promise.all([
        this.processQuotationExpiryNotifications(),
        this.processBookingReminderNotifications()
      ])
      
      console.log('[Scheduled Notifications] All scheduled notifications processed successfully')
    } catch (error) {
      console.error('[Scheduled Notifications] Error in scheduled notification processing:', error)
      throw error
    }
  }

  /**
   * Get upcoming notifications that will be sent
   * Useful for debugging and monitoring
   */
  async getUpcomingNotifications() {
    try {
      const results = {
        quotations_expiring_24h: 0,
        quotations_expiring_2h: 0,
        bookings_starting_24h: 0,
        bookings_starting_2h: 0
      }

      // Count quotations expiring in 24h
      const { count: quotations24h } = await this.supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('expiry_date', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString())
        .lte('expiry_date', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString())
        .is('converted_to_booking_id', null)

      results.quotations_expiring_24h = quotations24h || 0

      // Count quotations expiring in 2h
      const { count: quotations2h } = await this.supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('expiry_date', new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString())
        .lte('expiry_date', new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString())
        .is('converted_to_booking_id', null)

      results.quotations_expiring_2h = quotations2h || 0

      // Count bookings starting tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
      const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)

      const { count: bookings24h } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'pending'])
        .gte('date', tomorrowStart.toISOString().split('T')[0])
        .lt('date', tomorrowEnd.toISOString().split('T')[0])

      results.bookings_starting_24h = bookings24h || 0

      // Count bookings starting in 2h (rough estimate)
      const currentDate = new Date().toISOString().split('T')[0]
      const { count: bookings2h } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'pending'])
        .eq('date', currentDate)

      results.bookings_starting_2h = bookings2h || 0

      return results
    } catch (error) {
      console.error('[Scheduled Notifications] Error getting upcoming notifications:', error)
      throw error
    }
  }
}

// Export singleton instance
export const scheduledNotificationService = new ScheduledNotificationService()
