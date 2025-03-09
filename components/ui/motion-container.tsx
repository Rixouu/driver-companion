"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/utils/animations"

interface MotionContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
}

export function MotionContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.1
}: MotionContainerProps) {
  // Create custom stagger container with specified delay
  const containerVariants = {
    ...staggerContainer,
    visible: {
      ...staggerContainer.visible,
      transition: {
        ...(staggerContainer.visible as any)?.transition,
        delayChildren: delay,
        staggerChildren: staggerDelay
      }
    }
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  )
}

interface MotionItemProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function MotionItem({
  children,
  className,
  delay = 0
}: MotionItemProps) {
  // Create custom item with specified delay
  const itemVariants = {
    ...staggerItem,
    visible: {
      ...staggerItem.visible,
      transition: {
        ...(staggerItem.visible as any)?.transition,
        delay
      }
    }
  }

  return (
    <motion.div
      className={className}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  )
} 