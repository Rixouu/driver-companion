/**
 * Utility functions for formatting values
 */

/**
 * Format a duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format a date to a localized string
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use the browser's locale or fallback to 'en-US'
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date to DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format a number as currency
 * @param value - Number or string to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined, currency = 'USD'): string {
  if (!value) return '0.00'
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

/**
 * Format a number as Japanese currency
 */
export function formatCurrencyJP(value: number | string | null | undefined): string {
  if (!value) return '0'
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
} 