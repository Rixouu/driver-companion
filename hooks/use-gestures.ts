"use client"

import { useSpring, animated } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import { useState } from "react"

interface UseGestureCardProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  swipeThreshold?: number
}

export function useGestureCard({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
}: UseGestureCardProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [{ x, scale }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
    config: {
      tension: 300,
      friction: 20,
    },
  }))

  const bind = useDrag(({ down, movement: [mx], velocity: [vx], direction: [dx] }) => {
    const trigger = Math.abs(mx) > swipeThreshold
    
    if (!down && trigger) {
      if (mx > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (mx < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    
    api.start({
      x: down ? mx : 0,
      scale: down ? 0.95 : 1,
      immediate: down,
    })
  })

  return { 
    bind, 
    x, 
    scale, 
    isOpen, 
    setIsOpen,
    AnimatedDiv: animated.div 
  }
} 