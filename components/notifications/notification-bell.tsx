"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n/context"
import { getNotifications, markAllNotificationsAsRead, getUnreadNotificationsCount } from "@/lib/services/notifications"
import type { Notification } from "@/lib/services/notifications"
import { NotificationList } from "./notification-list"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/styles"
import { useToast } from "@/hooks/use-toast"

export function NotificationBell() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load notifications when the component mounts or when the user changes
  useEffect(() => {
    if (!user?.id) return

    const loadNotifications = async () => {
      setIsLoading(true)
      try {
        const { notifications } = await getNotifications(user.id)
        const { count } = await getUnreadNotificationsCount(user.id)
        
        setNotifications(notifications)
        setUnreadCount(count)
        
        // Show a toast for new notifications if there are any
        if (count > 0) {
          toast({
            title: t('notifications.newNotifications', { count: count.toString() }),
            description: t('notifications.clickToView'),
            duration: 5000,
          })
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Set up a polling interval to check for new notifications
    const interval = setInterval(async () => {
      try {
        const { count: newCount } = await getUnreadNotificationsCount(user.id)
        
        // If there are new notifications since the last check
        if (newCount > unreadCount && newCount > 0) {
          // Refresh the notifications list
          const { notifications: newNotifications } = await getNotifications(user.id)
          setNotifications(newNotifications)
          
          // Show a toast for new notifications
          toast({
            title: t('notifications.newNotifications', { count: (newCount - unreadCount).toString() }),
            description: t('notifications.clickToView'),
            duration: 5000,
          })
        }
        
        setUnreadCount(newCount)
      } catch (error) {
        console.error("Error checking for new notifications:", error)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user?.id, unreadCount, toast, t])

  // Mark all notifications as read when the popover is opened
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    
    if (open && user?.id && unreadCount > 0) {
      try {
        await markAllNotificationsAsRead(user.id)
        setUnreadCount(0)
        
        // Refresh the notifications list
        const { notifications } = await getNotifications(user.id)
        setNotifications(notifications)
      } catch (error) {
        console.error("Error marking notifications as read:", error)
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant={unreadCount > 0 ? "default" : "ghost"} 
          size="sm" 
          className={cn(
            "relative flex items-center gap-2 px-3",
            unreadCount > 0 && "animate-pulse"
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {unreadCount > 0 && (
            <>
              <span className="text-sm font-medium hidden sm:inline">
                {t('notifications.unread', { count: unreadCount.toString() })}
              </span>
              <Badge 
                variant="destructive" 
                className={cn(
                  "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs sm:relative sm:top-0 sm:right-0 sm:h-auto sm:w-auto sm:p-1",
                  unreadCount > 9 ? "min-w-[20px]" : ""
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 md:w-96" align="end">
        <NotificationList 
          notifications={notifications} 
          isLoading={isLoading} 
          onNotificationClick={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
} 