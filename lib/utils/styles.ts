/**
 * Utility functions for styling
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'available':
      // Treat active similar to confirmed/completed (green) - improved contrast
      return 'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    case 'inactive':
    case 'unavailable':
      // Inactive shown as destructive (red) for clear visibility - improved contrast
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    case 'completed':
    case 'confirmed':
      return 'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    case 'pending':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
    case 'cancelled':
    case 'canceled':
    case 'trash':
    case 'draft':
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    case 'assigned':
    case 'booking':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
    case 'leave':
    case 'on_leave':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
    case 'training':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40';
  }
}

export function getPaymentStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    case 'pending':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40';
  }
}

export function getQuotationStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    case 'rejected':
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    case 'expired':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';
    case 'sent':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40';
    case 'converted':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40';
    case 'draft':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40';
  }
} 