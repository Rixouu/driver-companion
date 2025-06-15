"use client"

import { Badge } from "@/components/ui/badge"
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"

interface InspectionStatusBadgeProps {
  status: string
}

export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  const { t } = useI18n()

  // Map inspection-specific statuses to the main status categories for styling
  const getUnifiedStatus = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'completed':
      case 'passed':
        return 'completed';
      case 'failed':
      case 'action_required':
        return 'cancelled'; // Use 'cancelled' for red styling
      case 'in_progress':
      case 'pending':
        return 'pending';
      default:
        return 'draft'; // Default to a neutral/gray style
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(getStatusBadgeClasses(getUnifiedStatus(status)), "capitalize")}
    >
      {t(`inspections.status.${status?.toLowerCase()}`, { defaultValue: status })}
    </Badge>
  )
} 