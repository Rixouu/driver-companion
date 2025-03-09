"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fadeIn, scaleUp, slideUp } from "@/lib/utils/animations"

interface MotionCardProps {
  children: ReactNode
  className?: string
  animation?: "fade" | "scale" | "slide"
  delay?: number
  header?: {
    title?: ReactNode
    description?: ReactNode
    className?: string
  }
  footer?: {
    content?: ReactNode
    className?: string
  }
}

export function MotionCard({
  children,
  className,
  animation = "fade",
  delay = 0,
  header,
  footer
}: MotionCardProps) {
  // Select animation variant based on prop
  const getVariant = () => {
    switch (animation) {
      case "scale":
        return scaleUp
      case "slide":
        return slideUp
      case "fade":
      default:
        return fadeIn
    }
  }

  const variant = getVariant()
  
  // Add delay to animation if specified
  const transition = delay 
    ? { 
        ...(variant.visible as any)?.transition, 
        delay 
      } 
    : (variant.visible as any)?.transition

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variant}
      transition={transition}
    >
      <Card className={className}>
        {header && (
          <CardHeader className={header.className}>
            {header.title && <CardTitle>{header.title}</CardTitle>}
            {header.description && <CardDescription>{header.description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          {children}
        </CardContent>
        {footer && (
          <CardFooter className={footer.className}>
            {footer.content}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
} 