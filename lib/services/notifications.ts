import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type Notification = Database['public']['Tables']['notifications']['Row']

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string) {
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
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: string) {
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
 * Get a single notification by ID
 */
export async function getNotification(id: string) {
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
 * Create a new notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
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
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string) {
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
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
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
 * Delete a notification
 */
export async function deleteNotification(id: string) {
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
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
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
 * Get upcoming maintenance and inspection notifications
 */
export async function getUpcomingNotifications(userId: string, days: number = 7) {
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