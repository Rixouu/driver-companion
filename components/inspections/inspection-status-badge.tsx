"use client"

import { Badge } from "@/components/ui/badge"
import { cn, getInspectionStatusBadgeClasses } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"

interface InspectionStatusBadgeProps {
  status: string
}

export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  const { t } = useI18n()

  return (
    <Badge
      variant="outline"
      className={cn(getInspectionStatusBadgeClasses(status), "capitalize")}
    >
      {t(`inspections.status.${status?.toLowerCase()}`, { defaultValue: status })}
    </Badge>
  )
} 