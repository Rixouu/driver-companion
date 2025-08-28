/**
 * Format currency values for display
 */
export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

/**
 * Format numbers with proper locale formatting
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value)
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
