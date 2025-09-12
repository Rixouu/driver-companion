import { createClient } from '@/lib/supabase/index';
import { NotificationInsert, NotificationType } from '@/types/notifications';

interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  dueDate?: string;
}

interface NotificationTemplate {
  title: string;
  message: string;
}

const notificationTemplates: Record<NotificationType, (data: any) => NotificationTemplate> = {
  // Booking notifications
  booking_created: (data) => ({
    title: 'New Booking Created',
    message: `Booking ${data.bookingId || data.id?.slice(-8)} has been created for ${data.customerName || 'customer'}.`
  }),
  
  booking_confirmed: (data) => ({
    title: 'Booking Confirmed',
    message: `Booking ${data.bookingId || data.id?.slice(-8)} has been confirmed by ${data.customerName || 'customer'}.`
  }),
  
  booking_cancelled: (data) => ({
    title: 'Booking Cancelled',
    message: `Booking ${data.bookingId || data.id?.slice(-8)} has been cancelled. ${data.reason ? `Reason: ${data.reason}` : ''}`
  }),
  
  booking_completed: (data) => ({
    title: 'Booking Completed',
    message: `Booking ${data.bookingId || data.id?.slice(-8)} has been completed successfully.`
  }),

  // Quotation notifications
  quotation_created: (data) => ({
    title: 'New Quotation Created',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has been created for ${data.customerName || 'customer'}.`
  }),
  
  quotation_sent: (data) => ({
    title: 'Quotation Sent',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has been sent to ${data.customerEmail || 'customer'}.`
  }),
  
  quotation_approved: (data) => ({
    title: 'Quotation Approved',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has been approved by ${data.customerName || 'customer'}.`
  }),
  
  quotation_rejected: (data) => ({
    title: 'Quotation Rejected',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has been rejected by ${data.customerName || 'customer'}. ${data.reason ? `Reason: ${data.reason}` : ''}`
  }),
  
  quotation_expired: (data) => ({
    title: 'Quotation Expired',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has expired and is no longer valid.`
  }),
  
  quotation_converted: (data) => ({
    title: 'Quotation Converted',
    message: `Quotation #${data.quoteNumber || data.id?.slice(-8)} has been converted to booking ${data.bookingId || data.booking_id}.`
  }),

  // Payment notifications
  payment_received: (data) => ({
    title: 'Payment Received',
    message: `Payment of ${data.amount ? `$${data.amount}` : 'amount'} has been received for ${data.bookingId ? `booking ${data.bookingId}` : 'quotation'}.`
  }),
  
  payment_failed: (data) => ({
    title: 'Payment Failed',
    message: `Payment failed for ${data.bookingId ? `booking ${data.bookingId}` : 'quotation'}. ${data.reason ? `Reason: ${data.reason}` : ''}`
  }),

  // Dispatch notifications
  dispatch_assigned: (data) => ({
    title: 'Dispatch Assignment',
    message: `New dispatch assignment created for booking ${data.bookingId || data.booking_id}.`
  }),
  
  dispatch_completed: (data) => ({
    title: 'Dispatch Completed',
    message: `Dispatch assignment for booking ${data.bookingId || data.booking_id} has been completed.`
  }),

  // Maintenance notifications
  maintenance_due: (data) => ({
    title: 'Maintenance Due',
    message: `Vehicle ${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.vehicleId || data.id}) requires maintenance.`
  }),

  // Inspection notifications
  inspection_due: (data) => ({
    title: 'Inspection Due',
    message: `Vehicle ${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.vehicleId || data.id}) requires inspection.`
  }),
  
  inspection_completed: (data) => ({
    title: 'Inspection Completed',
    message: `Inspection for vehicle ${data.vehicleMake || ''} ${data.vehicleModel || ''} (${data.vehicleId || data.id}) has been completed.`
  })
};

export class NotificationService {
  private supabase = createClient();

  /**
   * Create a notification for a specific user
   */
  async createNotification(options: CreateNotificationOptions): Promise<void> {
    try {
      const template = notificationTemplates[options.type];
      const { title, message } = template ? template(options) : { 
        title: options.title, 
        message: options.message 
      };

      const notificationData: NotificationInsert = {
        type: options.type,
        title: title,
        message: message,
        user_id: options.userId,
        related_id: options.relatedId,
        due_date: options.dueDate,
        is_read: false
      };

      const { error } = await this.supabase
        .from('notifications')
        .insert(notificationData);

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }
    } catch (error) {
      console.error('NotificationService.createNotification error:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    type: NotificationType,
    userIds: string[],
    data: any,
    relatedId?: string,
    dueDate?: string
  ): Promise<void> {
    try {
      const template = notificationTemplates[type];
      const { title, message } = template ? template(data) : { 
        title: 'Notification', 
        message: 'You have a new notification' 
      };

      const notifications = userIds.map(userId => ({
        type,
        title,
        message,
        user_id: userId,
        related_id: relatedId,
        due_date: dueDate,
        is_read: false
      }));

      const { error } = await this.supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating bulk notifications:', error);
        throw new Error(`Failed to create bulk notifications: ${error.message}`);
      }
    } catch (error) {
      console.error('NotificationService.createBulkNotifications error:', error);
      throw error;
    }
  }

  /**
   * Create notification for all admin users
   */
  async createAdminNotification(
    type: NotificationType,
    data: any,
    relatedId?: string,
    dueDate?: string
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await this.supabase
        .from('admin_users')
        .select('id');

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        throw new Error(`Failed to fetch admin users: ${adminError.message}`);
      }

      if (adminUsers && adminUsers.length > 0) {
        const userIds = adminUsers.map(user => user.id);
        await this.createBulkNotifications(type, userIds, data, relatedId, dueDate);
      }
    } catch (error) {
      console.error('NotificationService.createAdminNotification error:', error);
      throw error;
    }
  }

  /**
   * Create notification for specific team location
   */
  async createTeamNotification(
    type: NotificationType,
    teamLocation: 'japan' | 'thailand',
    data: any,
    relatedId?: string,
    dueDate?: string
  ): Promise<void> {
    try {
      // Get users from specific team location
      const { data: teamUsers, error: teamError } = await this.supabase
        .from('admin_users')
        .select('id')
        .eq('team_location', teamLocation);

      if (teamError) {
        console.error('Error fetching team users:', teamError);
        throw new Error(`Failed to fetch team users: ${teamError.message}`);
      }

      if (teamUsers && teamUsers.length > 0) {
        const userIds = teamUsers.map(user => user.id);
        await this.createBulkNotifications(type, userIds, data, relatedId, dueDate);
      }
    } catch (error) {
      console.error('NotificationService.createTeamNotification error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    } catch (error) {
      console.error('NotificationService.markAsRead error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
    } catch (error) {
      console.error('NotificationService.markAllAsRead error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (error) {
      console.error('NotificationService.deleteNotification error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
