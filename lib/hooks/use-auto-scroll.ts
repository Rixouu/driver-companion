import { useRef, useCallback } from 'react'

interface UseAutoScrollOptions {
  /**
   * Delay in milliseconds before scrolling (to ensure element is rendered)
   * @default 100
   */
  scrollDelay?: number
  /**
   * Scroll behavior
   * @default 'smooth'
   */
  behavior?: ScrollBehavior
  /**
   * Block position for scrollIntoView
   * @default 'start'
   */
  block?: ScrollLogicalPosition
  /**
   * Inline position for scrollIntoView
   * @default 'nearest'
   */
  inline?: ScrollLogicalPosition
}

/**
 * Custom hook for auto-scrolling to a target element when conditions are met
 * 
 * @param shouldScroll - Function that determines if scrolling should occur
 * @param options - Configuration options for scrolling behavior
 * @returns Object containing ref to attach to target element and scroll function
 * 
 * @example
 * ```tsx
 * const { targetRef, scrollToTarget } = useAutoScroll(
 *   (date) => getEventsForDate(date).length > 0,
 *   { scrollDelay: 150 }
 * )
 * 
 * const handleDayClick = (date: Date) => {
 *   setSelectedDate(date)
 *   scrollToTarget(date)
 * }
 * 
 * return <div ref={targetRef}>Target element</div>
 * ```
 */
export function useAutoScroll<T = any>(
  shouldScroll: (data: T) => boolean,
  options: UseAutoScrollOptions = {}
) {
  const {
    scrollDelay = 100,
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest'
  } = options

  const targetRef = useRef<HTMLDivElement>(null)

  const scrollToTarget = useCallback((data: T) => {
    if (shouldScroll(data) && targetRef.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ 
          behavior, 
          block,
          inline
        })
      }, scrollDelay)
    }
  }, [shouldScroll, scrollDelay, behavior, block, inline])

  return {
    targetRef,
    scrollToTarget
  }
}
