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
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40'; 
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
    case 'paid':
      return 'bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    case 'rejected':
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    case 'expired':
      return 'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
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

export function getDispatchStatusDotColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#f59e0b'; // amber-500
    case 'assigned':
      return '#3b82f6'; // blue-500
    case 'confirmed':
      return '#10b981'; // emerald-500
    case 'en_route':
      return '#8b5cf6'; // violet-500
    case 'arrived':
      return '#6366f1'; // indigo-500
    case 'in_progress':
      return '#06b6d4'; // cyan-500
    case 'completed':
      return '#22c55e'; // green-500
    case 'cancelled':
    case 'canceled':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getDispatchStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'assigned':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700';
    case 'en_route':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
    case 'arrived':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700';
    case 'in_progress':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getDispatchStatusBorderColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'border-l-amber-500 dark:border-l-amber-400';
    case 'assigned':
      return 'border-l-blue-500 dark:border-l-blue-400';
    case 'confirmed':
      return 'border-l-emerald-500 dark:border-l-emerald-400';
    case 'en_route':
      return 'border-l-purple-500 dark:border-l-purple-400';
    case 'arrived':
      return 'border-l-indigo-500 dark:border-l-indigo-400';
    case 'in_progress':
      return 'border-l-cyan-500 dark:border-l-cyan-400';
    case 'completed':
      return 'border-l-green-500 dark:border-l-green-400';
    case 'cancelled':
    case 'canceled':
      return 'border-l-red-500 dark:border-l-red-400';
    default:
      return 'border-l-gray-400 dark:border-l-gray-500';
  }
}

export function getInspectionStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'passed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'in_progress':
    case 'in progress':
    case 'progress':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'failed':
    case 'fail':
    case 'action_required':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getVehicleStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'available':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'maintenance':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700';
    case 'inactive':
    case 'unavailable':
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getMaintenanceStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'in_progress':
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'scheduled':
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getBookingStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'assigned':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    case 'converted':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getInspectionStatusDotColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'passed':
      return 'bg-green-500';
    case 'in_progress':
    case 'in progress':
    case 'progress':
      return 'bg-amber-500';
    case 'failed':
    case 'fail':
    case 'action_required':
      return 'bg-red-500';
    case 'scheduled':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
}

export function getQuotationStatusDotColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'paid':
      return 'bg-green-500';
    case 'sent':
      return 'bg-blue-500';
    case 'converted':
      return 'bg-purple-500';
    case 'rejected':
    case 'expired':
      return 'bg-red-500';
    case 'draft':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

export function getBookingStatusDotColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-green-500';
    case 'confirmed':
    case 'assigned':
      return 'bg-blue-500';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-500';
    case 'pending':
      return 'bg-amber-500';
    default:
      return 'bg-blue-500';
  }
}

export function getDriverStatusBadgeClasses(status: string): string {
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
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function getDriverStatusDotColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'active':
      return 'bg-green-500';
    case 'unavailable':
    case 'inactive':
      return 'bg-red-500';
    case 'leave':
    case 'on_leave':
      return 'bg-amber-500';
    case 'training':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

export function getDriverStatusBorderColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'active':
      return 'border-l-green-500';
    case 'unavailable':
    case 'inactive':
      return 'border-l-red-500';
    case 'leave':
    case 'on_leave':
      return 'border-l-amber-500';
    case 'training':
      return 'border-l-blue-500';
    default:
      return 'border-l-gray-500';
  }
} 