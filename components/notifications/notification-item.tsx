"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  FileText, 
  CreditCard, 
  Wrench, 
  Search,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NotificationWithDetails } from '@/types/notifications';
import { useI18n } from '@/lib/i18n/context';

interface NotificationItemProps {
  notification: NotificationWithDetails;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'booking_completed':
      return Calendar;
    case 'quotation_created':
    case 'quotation_sent':
    case 'quotation_approved':
    case 'quotation_rejected':
    case 'quotation_expired':
    case 'quotation_converted':
      return FileText;
    case 'payment_received':
    case 'payment_failed':
      return CreditCard;
    case 'dispatch_assigned':
    case 'dispatch_completed':
      return Truck;
    case 'maintenance_due':
      return Wrench;
    case 'inspection_due':
    case 'inspection_completed':
      return Search;
    default:
      return AlertCircle;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'quotation_approved':
    case 'payment_received':
    case 'dispatch_completed':
    case 'inspection_completed':
      return 'text-green-600';
    case 'booking_cancelled':
    case 'quotation_rejected':
    case 'payment_failed':
      return 'text-red-600';
    case 'quotation_expired':
    case 'maintenance_due':
    case 'inspection_due':
      return 'text-orange-600';
    case 'booking_created':
    case 'quotation_created':
    case 'quotation_sent':
    case 'dispatch_assigned':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusIcon = (type: string) => {
  switch (type) {
    case 'booking_confirmed':
    case 'quotation_approved':
    case 'payment_received':
    case 'dispatch_completed':
    case 'inspection_completed':
      return CheckCircle;
    case 'booking_cancelled':
    case 'quotation_rejected':
    case 'payment_failed':
      return XCircle;
    case 'quotation_expired':
    case 'maintenance_due':
    case 'inspection_due':
      return Clock;
    default:
      return null;
  }
};

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const { t } = useI18n();

  const Icon = getNotificationIcon(notification.type);
  const StatusIcon = getStatusIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);

  const handleMarkAsRead = async () => {
    if (notification.is_read) return;
    
    setIsMarkingAsRead(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getStatusText = (type: string) => {
    switch (type) {
      case 'booking_created':
        return t('notifications.booking.created', 'New booking created');
      case 'booking_confirmed':
        return t('notifications.booking.confirmed', 'Booking confirmed');
      case 'booking_cancelled':
        return t('notifications.booking.cancelled', 'Booking cancelled');
      case 'booking_completed':
        return t('notifications.booking.completed', 'Booking completed');
      case 'quotation_created':
        return t('notifications.quotation.created', 'New quotation created');
      case 'quotation_sent':
        return t('notifications.quotation.sent', 'Quotation sent to customer');
      case 'quotation_approved':
        return t('notifications.quotation.approved', 'Quotation approved by customer');
      case 'quotation_rejected':
        return t('notifications.quotation.rejected', 'Quotation rejected by customer');
      case 'quotation_expired':
        return t('notifications.quotation.expired', 'Quotation expired');
      case 'quotation_converted':
        return t('notifications.quotation.converted', 'Quotation converted to booking');
      case 'payment_received':
        return t('notifications.payment.received', 'Payment received');
      case 'payment_failed':
        return t('notifications.payment.failed', 'Payment failed');
      case 'dispatch_assigned':
        return t('notifications.dispatch.assigned', 'Dispatch assignment created');
      case 'dispatch_completed':
        return t('notifications.dispatch.completed', 'Dispatch completed');
      case 'maintenance_due':
        return t('notifications.maintenance.due', 'Maintenance due');
      case 'inspection_due':
        return t('notifications.inspection.due', 'Inspection due');
      case 'inspection_completed':
        return t('notifications.inspection.completed', 'Inspection completed');
      default:
        return notification.title;
    }
  };

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-xl transition-all duration-200 hover:shadow-md border",
        !notification.is_read 
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 shadow-sm" 
          : "bg-card border-border hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 mt-1 p-2 rounded-full transition-colors",
          !notification.is_read 
            ? "bg-blue-100 dark:bg-blue-900/50" 
            : "bg-muted"
        )}>
          <Icon className={cn("h-4 w-4", colorClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground break-words">
                  {getStatusText(notification.type)}
                </p>
                {StatusIcon && (
                  <StatusIcon className={cn("h-3 w-3 flex-shrink-0", colorClass)} />
                )}
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 break-words leading-relaxed">
                {notification.message}
              </p>
              
              {notification.related_entity && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      notification.related_entity.type === 'booking' && "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
                      notification.related_entity.type === 'quotation' && "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
                      notification.related_entity.type === 'inspection' && "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
                      notification.related_entity.type === 'maintenance' && "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300"
                    )}
                  >
                    {notification.related_entity.type}
                  </Badge>
                  {notification.related_entity.status && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        notification.related_entity.status === 'pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        notification.related_entity.status === 'confirmed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        notification.related_entity.status === 'cancelled' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                        notification.related_entity.status === 'completed' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      )}
                    >
                      {notification.related_entity.status}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatTime(notification.created_at || '')}
                </span>
                
                {notification.related_entity?.url && (
                  <Link
                    href={notification.related_entity.url}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={handleMarkAsRead}
                  >
                    {t('notifications.view', 'View')}
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                  title={t('notifications.markAsRead', 'Mark as read')}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                title={t('notifications.delete', 'Delete')}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
