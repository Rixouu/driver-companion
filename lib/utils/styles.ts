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
      // Treat active similar to confirmed/completed (green)
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'inactive':
      // Inactive shown as destructive (red) for clear visibility
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'completed':
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'cancelled':
    case 'canceled':
    case 'trash':
    case 'draft':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'assigned':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getPaymentStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getQuotationStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'expired':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'converted':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
} 