"use client";

import { useState } from 'react';
import { Bell, Check, X, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { useI18n } from '@/lib/i18n/context';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    counts, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications,
    getConnectionStatus
  } = useNotifications({ limit: 50 });
  
  const { t } = useI18n();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };


  const unreadNotifications = notifications.filter(n => !n.is_read);
  const hasUnread = counts.unread > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {counts.unread > 99 ? '99+' : counts.unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-96 p-0"
        sideOffset={8}
      >
        <div className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">
                {t('notifications.title', 'Notifications')}
              </h3>
              {hasUnread && (
                <Badge variant="secondary" className="text-xs">
                  {counts.unread} {t('notifications.unread', 'unread')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {hasUnread && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleMarkAllAsRead}
                  title={t('notifications.markAllRead', 'Mark all as read')}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('notifications.loading', 'Loading notifications...')}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-destructive">
              {t('notifications.error', 'Failed to load notifications')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2" />
              <p>{t('notifications.empty.title', 'No notifications')}</p>
              <p className="text-xs">{t('notifications.empty.description', 'You\'re all caught up!')}</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <div className="text-xs text-muted-foreground text-center">
                {counts.total} total notifications
              </div>
            </div>
          </>
        )}
        
        {/* Debug section - removed for cleaner UI */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
