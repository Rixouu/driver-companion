import { format, parseISO } from 'date-fns';

/**
 * Format a date string into a human-readable format
 * @param dateString ISO date string
 * @param formatString Format string for date-fns
 * @returns Formatted date string
 */
export function formatDate(dateString: string, formatString: string = 'PPP'): string {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a date string into a short format (e.g., "Jan 1, 2023")
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatShortDate(dateString: string): string {
  return formatDate(dateString, 'MMM d, yyyy');
}

/**
 * Format a date string into a time format (e.g., "3:30 PM")
 * @param dateString ISO date string
 * @returns Formatted time string
 */
export function formatTime(dateString: string): string {
  return formatDate(dateString, 'h:mm a');
}

/**
 * Format a date string into a date and time format (e.g., "Jan 1, 2023, 3:30 PM")
 * @param dateString ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  return formatDate(dateString, 'PPP p');
} 