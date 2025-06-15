"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"

interface DriverStatusBadgeProps {
  status: string;
}

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  const { t } = useI18n()

  const getStatusClasses = () => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'unavailable':
      case 'inactive':
        return 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'leave':
      case 'on_leave':
        return 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20';
      case 'training':
        return 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'booking':
      case 'assigned':
        return 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'cancelled':
        return 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'completed':
        return 'text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  }

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
      className={getStatusClasses()}
    >
      {t(`drivers.status.${getTranslationKey()}` as any, { defaultValue: status })}
    </Badge>
  );
}
