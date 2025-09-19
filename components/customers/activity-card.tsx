'use client'

import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/formatting'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityCardProps {
  id: string
  type: 'quotation' | 'booking'
  number: string
  serviceName: string
  date: string
  amount?: number
  currency?: string
  status: string
  className?: string
}

export function ActivityCard({
  id,
  type,
  number,
  serviceName,
  date,
  amount,
  currency = 'JPY',
  status,
  className
}: ActivityCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return 'Unknown date'
    }
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const getStatusBadgeStyles = (status: string, type: 'quotation' | 'booking') => {
    if (type === 'quotation') {
      return cn(
        status === 'paid' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
        status === 'approved' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        status === 'rejected' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
        status === 'draft' && 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        status === 'sent' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        status === 'expired' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        status === 'converted' && 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      )
    } else {
      return cn(
        status === 'completed' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
        status === 'confirmed' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
        status === 'pending' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        status === 'cancelled' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
        status === 'in_progress' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        status === 'assigned' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      )
    }
  }

  return (
    <div className={cn("flex items-center justify-between p-3 border rounded-lg", className)}>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {type === 'quotation' ? 'Quotation' : 'Booking'} #{number}
        </div>
        <div className="text-sm text-muted-foreground">
          {serviceName} • {formatDate(date)}
        </div>
        {amount && (
          <div className="font-medium text-sm mt-1">
            {formatCurrency(amount, currency)}
          </div>
        )}
      </div>
      <div className="flex items-center">
        <Badge 
          variant="outline"
          className={getStatusBadgeStyles(status, type)}
        >
          {status}
        </Badge>
      </div>
    </div>
  )
}
