"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils/styles"
import { getStatusBadgeClasses } from "@/lib/utils/styles"

interface DriverStatusBadgeProps {
  status: string;
}

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  const { t } = useI18n()

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
    <Badge
      variant="outline"
      className={cn(getStatusBadgeClasses(status), "capitalize")}
    >
      {t(`drivers.status.${getTranslationKey()}` as any, { defaultValue: status })}
    </Badge>
  );
}
