/**
 * Formats a date string into a localized format
 * @param dateString - ISO date string or any valid date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }
): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

/**
 * Returns a relative time string (e.g., "2 days ago")
 * @param dateString - ISO date string or any valid date string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second')
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return rtf.format(-diffInMinutes, 'minute')
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return rtf.format(-diffInHours, 'hour')
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return rtf.format(-diffInDays, 'day')
    }
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return rtf.format(-diffInMonths, 'month')
    }
    
    const diffInYears = Math.floor(diffInMonths / 12)
    return rtf.format(-diffInYears, 'year')
  } catch (error) {
    console.error('Error calculating relative time:', error)
    return 'Unknown time'
  }
} 