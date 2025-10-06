"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/index';
import { useAuth } from '@/components/providers/auth-provider';
import { Notification, NotificationWithDetails, NotificationType, NotificationCounts } from '@/types/notifications';
import { subscribeToCollection, getConnectionHealth } from '@/lib/services/realtime';

// Singleton Supabase client instance to prevent multiple subscriptions
let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient();
  }
  return supabaseClientInstance;
}

interface UseNotificationsOptions {
  limit?: number;
  autoMarkAsRead?: boolean;
  markAsReadDelay?: number;
}

interface UseNotificationsReturn {
  notifications: NotificationWithDetails[];
  counts: NotificationCounts;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getConnectionStatus: () => any;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    limit = 50,
    autoMarkAsRead = false,
    markAsReadDelay = 5000
  } = options;

  const { user } = useAuth();
  const supabase = getSupabaseClient();
  
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    unread: 0,
    by_type: {} as Record<NotificationType, number>
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);


      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform notifications with basic related entity details
      const notificationsWithDetails: NotificationWithDetails[] = (data || []).map(notification => {
        let relatedEntity = undefined;

        // Determine related entity based on type and related_id
        if (notification.type.startsWith('booking_') && notification.related_id) {
          relatedEntity = {
            id: notification.related_id,
            type: 'booking' as const,
            title: `Booking ${notification.related_id.slice(-8)}`,
            status: 'pending',
            url: `/bookings/${notification.related_id}`
          };
        } else if (notification.type.startsWith('quotation_') && notification.related_id) {
          relatedEntity = {
            id: notification.related_id,
            type: 'quotation' as const,
            title: `Quote ${notification.related_id.slice(-8)}`,
            status: 'pending',
            url: `/quotations/${notification.related_id}`
          };
        }

        return {
          ...notification,
          related_entity: relatedEntity
        };
      });

      setNotifications(notificationsWithDetails);

      // Calculate counts
      const unreadCount = notificationsWithDetails.filter(n => !n.is_read).length;
      const byType = notificationsWithDetails.reduce((acc, notification) => {
        const type = notification.type as NotificationType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<NotificationType, number>);

      const counts = {
        total: notificationsWithDetails.length,
        unread: unreadCount,
        by_type: byType
      };

      setCounts(counts);

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit, supabase]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id || '');

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  }, [supabase, user?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        unread: 0
      }));

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  }, [supabase, user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id || '');

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );

      // Update counts
      setCounts(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        const wasUnread = deletedNotification?.is_read === false;
        
        return {
          total: prev.total - 1,
          unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
          by_type: {
            ...prev.by_type,
            [deletedNotification?.type as NotificationType]: 
              Math.max(0, (prev.by_type[deletedNotification?.type as NotificationType] || 0) - 1)
          }
        };
      });

    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete notification'));
    }
  }, [supabase, user?.id, notifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Create subscription with retry logic
  const createSubscription = useCallback(() => {
    if (!user?.id) return;

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }


    try {
      unsubscribeRef.current = subscribeToCollection<Notification>(
        {
          table: 'notifications',
          event: '*',
          filter: `user_id=eq.${user.id}`
        },
        // onInsert
        (newNotification) => {
          setNotifications(prev => [newNotification as NotificationWithDetails, ...prev]);
          setCounts(prev => ({
            total: prev.total + 1,
            unread: prev.unread + 1,
            by_type: {
              ...prev.by_type,
              [newNotification.type as NotificationType]: 
                (prev.by_type[newNotification.type as NotificationType] || 0) + 1
            }
          }));
          // Reset retry count on successful subscription
          retryCountRef.current = 0;
        },
        // onUpdate
        (updatedNotification, oldNotification) => {
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification as NotificationWithDetails
                : notification
            )
          );

          // Update counts if read status changed
          if (oldNotification.is_read !== updatedNotification.is_read) {
            setCounts(prev => ({
              ...prev,
              unread: updatedNotification.is_read 
                ? Math.max(0, prev.unread - 1)
                : prev.unread + 1
            }));
          }
        },
        // onDelete
        (deletedNotification) => {
          setNotifications(prev => 
            prev.filter(notification => notification.id !== deletedNotification.id)
          );
          setCounts(prev => {
            const wasUnread = !deletedNotification.is_read;
            return {
              total: prev.total - 1,
              unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
              by_type: {
                ...prev.by_type,
                [deletedNotification.type as NotificationType]: 
                  Math.max(0, (prev.by_type[deletedNotification.type as NotificationType] || 0) - 1)
              }
            };
          });
        },
        supabase
      );

      // Reset retry count on successful subscription creation
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Error creating notification subscription:', error);
      handleSubscriptionError();
    }
  }, [user?.id, supabase]);

  // Handle subscription errors with retry logic
  const handleSubscriptionError = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      console.log(`Subscription failed, retrying in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        createSubscription();
      }, retryDelay);
    } else {
      console.error('Max retry attempts reached for notification subscription');
      setError(new Error('Failed to establish notification subscription after multiple attempts'));
    }
  }, [createSubscription, retryDelay, maxRetries]);

  // Get connection status for debugging
  const getConnectionStatus = useCallback(() => {
    return getConnectionHealth(supabase);
  }, [supabase]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Create subscription with retry logic
    createSubscription();

    return () => {
      // Clean up subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Clean up retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Reset retry count
      retryCountRef.current = 0;
    };
  }, [user?.id, createSubscription]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-mark as read functionality
  useEffect(() => {
    if (autoMarkAsRead && notifications.length > 0) {
      // Clear existing timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }

      // Set new timeout
      markAsReadTimeoutRef.current = setTimeout(() => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length > 0) {
          markAllAsRead();
        }
      }, markAsReadDelay);

      return () => {
        if (markAsReadTimeoutRef.current) {
          clearTimeout(markAsReadTimeoutRef.current);
          markAsReadTimeoutRef.current = null;
        }
      };
    }
  }, [autoMarkAsRead, markAsReadDelay, notifications, markAllAsRead]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
        markAsReadTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    notifications,
    counts,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    getConnectionStatus
  };
}
