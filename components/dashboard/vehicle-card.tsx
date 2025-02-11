"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Car, AlertTriangle, CheckCircle, History, ImageIcon, ChevronRight, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTouchGestures } from "@/hooks/use-touch-gestures"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"

export function VehicleCard() {
  const { t } = useLanguage()
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Touch gesture handling
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false),
  })

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vehicle.name,
          text: `Check out this ${vehicle.name}`,
          url: window.location.href,
        })
      } catch (err) {
        toast.error(t("errors.shareFailed"))
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success(t("common.clipboard.copied"))
    }
  }

  const vehicle = {
    name: "Toyota Alphard Z-Class",
    plateNumber: "ABC-123",
    nextInspection: "2024-02-15",
    nextMaintenance: "2024-02-20",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
    status: "active",
    lastInspection: "2024-02-01",
    daysUntilInspection: 5,
    daysUntilMaintenance: 10,
  }

  const quickActions = [
    {
      label: "dashboard.vehicle.actions.startInspection",
      icon: CheckCircle,
      href: "/inspections/new",
      primary: true,
    },
    {
      label: "dashboard.vehicle.actions.reportIssue",
      icon: AlertTriangle,
      href: "/vehicles/report-issue",
    },
    {
      label: "dashboard.vehicle.actions.viewHistory",
      icon: History,
      href: "/vehicles/history",
    },
  ]

  return (
    <Card 
      className={cn(
        "overflow-hidden relative transition-transform",
        showActions && "shadow-lg translate-x-[-4rem]"
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Quick Actions Overlay */}
      <div className={cn(
        "absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent",
        "flex flex-col items-center justify-center gap-4",
        "opacity-0 transition-opacity duration-200",
        showActions && "opacity-100"
      )}>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
          <span className="sr-only">{t("common.actionLabels.share")}</span>
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full"
            >
              <History className="h-5 w-5" />
              <span className="sr-only">{t("common.actionLabels.view")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("dashboard.vehicle.history.title")}
              </h3>
              {/* History content */}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Existing CardContent */}
      <CardContent className="p-0">
        {/* Vehicle Image and Status */}
        <div className={cn(
          "relative w-full transition-all duration-500 ease-in-out",
          "h-[400px] lg:h-[500px]"
        )}>
          {/* Loading Skeleton with Shimmer */}
          {imageLoading && (
            <div className="absolute inset-0 bg-muted overflow-hidden">
              <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error State */}
          {imageError && (
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-4">
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          )}

          {/* Main Image */}
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.name}
            fill
            className={cn(
              "object-cover transition-all duration-700 ease-in-out",
              imageLoading ? "scale-105 blur-sm opacity-0" : "scale-100 blur-0 opacity-100"
            )}
            priority
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
          />

          {/* Status Badge with Touch Feedback */}
          <div className={cn(
            "absolute top-4 right-4 transition-all duration-300",
            showActions && "translate-y-1"
          )}>
            <Badge 
              variant={vehicle.status === "active" ? "success" : "default"}
              className={cn(
                "shadow-lg transition-all duration-300",
                vehicle.status === "active" && "animate-pulse-subtle",
                showActions && "scale-110"
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  vehicle.status === "active" ? "bg-green-500" : "bg-gray-500"
                )} />
                {t(`dashboard.vehicle.status.${vehicle.status}`)}
              </span>
            </Badge>
          </div>
          
          {/* Vehicle Info Overlay with Touch Feedback */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0",
            "bg-gradient-to-t from-black/90 via-black/60 to-transparent",
            "p-6 text-white transition-all duration-500",
            showActions ? "pb-10 from-black/95" : "pb-6"
          )}>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold transform transition-all duration-300 group-hover:translate-y-1">
                {vehicle.name}
              </h2>
              <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-y-1">
                <Car className="h-4 w-4 text-white/70" />
                <p className="text-white/80">{vehicle.plateNumber}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60 transform transition-all duration-300 group-hover:translate-y-1">
                <Clock className="h-4 w-4" />
                <p>{t("dashboard.vehicle.lastInspection")}: {vehicle.lastInspection}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info and Actions */}
        <div className="p-6 space-y-6">
          {/* Next Tasks with Touch Feedback */}
          <div className="grid gap-4">
            {/* Inspection Task */}
            <Link href="/inspections/schedule">
              <div className={cn(
                "group/task flex items-center gap-4 p-4 rounded-lg",
                "bg-muted/50 hover:bg-muted/70 active:bg-muted/90",
                "transition-all duration-200",
                "touch-action-manipulation", // Optimize touch behavior
                showActions && "bg-muted/70"
              )}>
                <Calendar className={cn(
                  "h-5 w-5 text-primary transition-transform duration-200",
                  "group-hover/task:scale-110",
                  showActions && "scale-110"
                )} />
                <div className="flex-1">
                  <p className="font-medium">{t("dashboard.vehicle.nextInspection")}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{vehicle.nextInspection}</p>
                    <p className={cn(
                      "text-sm font-medium text-primary",
                      vehicle.daysUntilInspection <= 7 && "text-destructive"
                    )}>
                      {vehicle.daysUntilInspection} {t("common.days")}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  "group-hover/task:translate-x-1",
                  showActions && "translate-x-1"
                )} />
              </div>
            </Link>

            {/* Similar update for maintenance task */}
          </div>

          {/* Quick Actions with Touch Feedback */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                className={cn(
                  "transition-all duration-200",
                  "active:scale-95",
                  "group/button relative overflow-hidden",
                  index === 0 ? "col-span-2" : "",
                  action.primary && "hover:shadow-lg hover:shadow-primary/20",
                  showActions && action.primary && "shadow-lg shadow-primary/20"
                )}
                asChild
              >
                <Link href={action.href}>
                  <action.icon className={cn(
                    "mr-2 h-4 w-4 transition-transform duration-200",
                    "group-hover/button:scale-110",
                    showActions && "scale-110"
                  )} />
                  <span className="relative z-10">{t(action.label)}</span>
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0",
                    "translate-x-[-100%] transition-transform duration-1000",
                    showActions && "translate-x-[100%]"
                  )} />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Mobile Action Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="absolute bottom-4 right-4 rounded-full shadow-lg md:hidden"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{t("common.actionLabels.more")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh]">
          <div className="grid gap-4 p-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                className="w-full justify-start"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {t(action.label)}
                </Link>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
} 