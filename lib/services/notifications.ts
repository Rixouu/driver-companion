import { createServiceClient } from "@/lib/supabase/service-client"
import type { Database } from "@/types/supabase"

export type Notification = Database['public']['Tables']['notifications']['Row']

/**
 * Retrieves all notifications for a specific user, ordered by creation date (newest first).
 *
 * @param userId - The unique identifier of the user whose notifications are to be fetched.
 * @returns A promise that resolves to an object containing an array of Notification objects and an error object (null if successful).
 *          `{ notifications: Notification[], error: Error | null }`
 */
export async function getNotifications(userId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], error }
  }

  return { notifications: data as Notification[], error: null }
}

/**
 * Retrieves the count of unread notifications for a specific user.
 *
 * @param userId - The unique identifier of the user.
 * @returns A promise that resolves to an object containing the count of unread notifications and an error object (null if successful).
 *          `{ count: number, error: Error | null }`
 */
export async function getUnreadNotificationsCount(userId: string) {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread notifications count:', error)
    return { count: 0, error }
  }

  return { count: count || 0, error: null }
}

/**
 * Retrieves a single notification by its unique identifier.
 *
 * @param id - The unique identifier of the notification.
 * @returns A promise that resolves to an object containing the Notification object or null (if not found), and an error object (null if successful).
 *          `{ notification: Notification | null, error: Error | null }`
 */
export async function getNotification(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching notification:', error)
    return { notification: null, error }
  }

  return { notification: data as Notification, error: null }
}

/**
 * Creates a new notification.
 *
 * @param notification - The notification data to create. 
 *                       Should exclude 'id' and 'created_at' as these are auto-generated.
 *                       Conforms to Omit<Notification, 'id' | 'created_at'>.
 * @returns A promise that resolves to an object containing the newly created Notification object or null (if creation failed), 
 *          and an error object (null if successful).
 *          `{ notification: Notification | null, error: Error | null }`
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return { notification: null, error }
  }

  return { notification: data as Notification, error: null }
}

/**
 * Marks a specific notification as read.
 *
 * @param id - The unique identifier of the notification to mark as read.
 * @returns A promise that resolves to an object containing the updated Notification object or null (if update failed/not found), 
 *          and an error object (null if successful).
 *          `{ notification: Notification | null, error: Error | null }`
 */
export async function markNotificationAsRead(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error marking notification as read:', error)
    return { notification: null, error }
  }

  return { notification: data as Notification, error: null }
}

/**
 * Marks all unread notifications for a specific user as read.
 *
 * @param userId - The unique identifier of the user.
 * @returns A promise that resolves to an object containing an error object if one occurred during the update, or null for success.
 *          `{ error: Error | null }`
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Deletes a specific notification by its ID.
 *
 * @param id - The unique identifier of the notification to delete.
 * @returns A promise that resolves to an object containing an error object if one occurred during deletion, or null for success.
 *          `{ error: Error | null }`
 */
export async function deleteNotification(id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting notification:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Deletes all notifications for a specific user.
 *
 * @param userId - The unique identifier of the user whose notifications are to be deleted.
 * @returns A promise that resolves to an object containing an error object if one occurred, or null for success.
 *          `{ error: Error | null }`
 */
export async function deleteAllNotifications(userId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all notifications:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Retrieves upcoming notifications (e.g., maintenance, inspections) for a user within a specified number of days.
 * Notifications are filtered by `due_date` being within the range [today, today + days].
 * Ordered by `due_date` in ascending order.
 *
 * @param userId - The unique identifier of the user.
 * @param days - The number of days into the future to check for upcoming notifications (default: 7).
 * @returns A promise that resolves to an object containing an array of Notification objects and an error object (null if successful).
 *          `{ notifications: Notification[], error: Error | null }`
 */
export async function getUpcomingNotifications(userId: string, days: number = 7) {
  const supabase = createServiceClient()
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + days)
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming notifications:', error)
    return { notifications: [], error }
  }

  return { notifications: data as Notification[], error: null }
} 