"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"

interface DriverStatusBadgeProps {
  status: string
}

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  const { t } = useI18n()

  const getVariant = () => {
    switch (status) {
      case "active":
        return "success"
      case "inactive":
        return "destructive"
      case "on_leave":
        return "warning"
      default:
        return "secondary"
    }
  }

  return (
    <Badge variant={getVariant() as any}>
      {t(`drivers.status.${status}`)}
    </Badge>
  )
} 