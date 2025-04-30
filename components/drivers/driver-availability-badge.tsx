"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Check, X, Info, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/styles"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isDriverAvailable } from "@/lib/services/driver-availability"
import type { DriverAvailabilityStatus } from "@/types/drivers"

interface DriverAvailabilityBadgeProps {
  driverId: string
  date?: Date
  showIcon?: boolean
}

export function DriverAvailabilityBadge({
  driverId,
  date = new Date(),
  showIcon = true,
}: DriverAvailabilityBadgeProps) {
  const [status, setStatus] = useState<DriverAvailabilityStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAvailability() {
      try {
        setIsLoading(true)
        const isAvailable = await isDriverAvailable(driverId, format(date, "yyyy-MM-dd"))
        const isUnavailable = await isDriverAvailable(driverId, format(date, "yyyy-MM-dd"), "unavailable")
        const isOnLeave = await isDriverAvailable(driverId, format(date, "yyyy-MM-dd"), "leave")
        const isInTraining = await isDriverAvailable(driverId, format(date, "yyyy-MM-dd"), "training")
        
        if (isAvailable) {
          setStatus("available")
        } else if (isUnavailable) {
          setStatus("unavailable")
        } else if (isOnLeave) {
          setStatus("leave")
        } else if (isInTraining) {
          setStatus("training")
        } else {
          // Default to available if no explicit status is set
          setStatus("available")
        }
      } catch (error) {
        console.error("Error checking driver availability:", error)
        // Default to available on error
        setStatus("available")
      } finally {
        setIsLoading(false)
      }
    }

    checkAvailability()
  }, [driverId, date])

  if (isLoading) {
    // Return null while loading instead of showing "Checking..."
    return null;
  }

  const badgeContent = getBadgeContent(status)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "transition-colors",
              badgeContent.className
            )}
          >
            {showIcon && (
              <span className="mr-1">
                {badgeContent.icon}
              </span>
            )}
            {badgeContent.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {badgeContent.tooltip}
            <span className="block text-xs text-muted-foreground mt-1">
              Date: {format(date, "PPP")}
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function getBadgeContent(status: DriverAvailabilityStatus | null) {
  switch (status) {
    case "available":
      return {
        label: "Available",
        icon: <Check className="h-3 w-3" />,
        className: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
        tooltip: "This driver is available for assignments"
      }
    case "unavailable":
      return {
        label: "Unavailable",
        icon: <X className="h-3 w-3" />,
        className: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
        tooltip: "This driver is currently unavailable"
      }
    case "leave":
      return {
        label: "On Leave",
        icon: <Calendar className="h-3 w-3" />,
        className: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
        tooltip: "This driver is on leave"
      }
    case "training":
      return {
        label: "Training",
        icon: <Info className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
        tooltip: "This driver is in training"
      }
    default:
      return {
        label: "Unknown",
        icon: <Info className="h-3 w-3" />,
        className: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
        tooltip: "Driver availability status is unknown"
      }
  }
} 