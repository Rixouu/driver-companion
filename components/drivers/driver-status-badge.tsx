"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"

interface DriverStatusBadgeProps {
  status: string
}

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  const { t } = useI18n()

  const getVariant = () => {
    switch (status?.toLowerCase()) {
      case "available":
      case "active": // For backward compatibility
        return "success"
      case "unavailable":
      case "inactive": // For backward compatibility
        return "destructive"
      case "leave":
      case "on_leave": // For backward compatibility
        return "warning"
      case "training":
        return "info"
      default:
        return "secondary"
    }
  }

  // Map old status values to new ones for translation
  const getTranslationKey = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return "available"
      case "inactive":
        return "unavailable"
      case "on_leave":
        return "leave"
      default:
        return status
    }
  }

  return (
    <Badge variant={getVariant() as any}>
      {t(`drivers.status.${getTranslationKey()}`)}
    </Badge>
  )
} 