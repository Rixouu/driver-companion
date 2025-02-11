"use client"

import { useState, useCallback } from "react"

interface TouchPosition {
  x: number
  y: number
}

interface UseTouchGesturesProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: UseTouchGesturesProps) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const isSwipe = Math.abs(distanceX) > threshold

    if (isSwipe) {
      if (distanceX > 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }

    setTouchEnd(null)
    setTouchStart(null)
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  }
} 