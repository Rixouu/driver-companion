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
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'unavailable':
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'leave':
      case 'on_leave':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
      case 'training':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      case 'booking':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
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
