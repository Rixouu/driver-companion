"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Bell, Wrench, Clipboard, Info, Check, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/services/notifications"
import { deleteNotification } from "@/lib/services/notifications"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils/styles"
import { useToast } from "@/hooks/use-toast"

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  onNotificationClick?: () => void
}

export function NotificationList({ notifications, isLoading, onNotificationClick }: NotificationListProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // Handle notification click
  const handleClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick()
    }

    // Navigate based on notification type
    if (notification.type === 'maintenance' && notification.related_id) {
      router.push(`/maintenance/${notification.related_id}`)
    } else if (notification.type === 'inspection' && notification.related_id) {
      router.push(`/inspections/${notification.related_id}`)
    }
  }

  // Handle notification deletion
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent triggering the parent click handler
    
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      await deleteNotification(id)
      toast({
        title: t('notifications.deleteSuccess'),
      })
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: t('notifications.deleteError'),
        variant: "destructive",
      })
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-blue-500" />
      case 'inspection':
        return <Clipboard className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t('notifications.title')}
        </h3>
      </div>
      
      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p>{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                  notification.is_read ? "opacity-70" : ""
                )}
                onClick={() => handleClick(notification)}
              >
                <div className="flex-shrink-0 mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={(e) => handleDelete(e, notification.id)}
                  disabled={deletingIds.has(notification.id)}
                >
                  {deletingIds.has(notification.id) ? (
                    <Skeleton className="h-4 w-4 rounded-full" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{t('notifications.delete')}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 