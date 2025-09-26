'use client'

import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import { addDays } from 'date-fns'

interface StatusBadgeProps {
  status: string
  rejectedAt?: string | null
  approvedAt?: string | null
  paymentCompletedAt?: string | null
  createdAt?: string
  className?: string
  variant?: 'outline' | 'default' | 'secondary' | 'destructive'
}

export function StatusBadge({ 
  status, 
  rejectedAt, 
  approvedAt, 
  paymentCompletedAt, 
  createdAt,
  className = '',
  variant = 'outline'
}: StatusBadgeProps) {
  const { t } = useI18n()

  // Check if quotation is expired
  const isExpired = () => {
    if (!createdAt) return false
    const now = new Date()
    const createdDate = new Date(createdAt)
    const properExpiryDate = addDays(createdDate, 3)
    return now > properExpiryDate && (status === 'draft' || status === 'sent') && !approvedAt && !rejectedAt
  }

  // Determine the status to display and its styling
  const getStatusInfo = () => {
    // Check for expired status first (highest priority)
    if (isExpired()) {
      return {
        text: 'Expired',
        className: 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20'
      }
    }
    
    // Check for rejected status
    if (status === 'rejected' || rejectedAt) {
      return {
        text: t('quotations.status.rejected') || 'Rejected',
        className: 'text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-600 dark:bg-red-900/20'
      }
    }
    
    // Check for converted status
    if (status === 'converted') {
      return {
        text: t('quotations.status.converted') || 'Converted to Booking',
        className: 'text-purple-600 border-purple-300 bg-purple-100 dark:text-purple-400 dark:border-purple-600 dark:bg-purple-900/20'
      }
    }
    
    // Check for paid status
    if (status === 'paid' || paymentCompletedAt) {
      return {
        text: t('quotations.status.paid') || 'Paid',
        className: 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20'
      }
    }
    
    // Check for approved status
    if (status === 'approved' || approvedAt) {
      return {
        text: t('quotations.status.approved') || 'Approved',
        className: 'text-green-600 border-green-300 bg-green-100 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20'
      }
    }
    
    // Check for sent status
    if (status === 'sent') {
      return {
        text: t(`quotations.status.${status}`) || 'Sent',
        className: 'text-blue-600 border-blue-300 bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20'
      }
    }
    
    // Default status
    return {
      text: t(`quotations.status.${status}`) || status,
      className: 'text-gray-600 border-gray-300 bg-gray-100 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900/20'
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Badge 
      variant={variant} 
      className={`${statusInfo.className} ${className}`}
    >
      {statusInfo.text}
    </Badge>
  )
}
