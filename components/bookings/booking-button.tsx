'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/styles'

interface BookingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'outline' | 'primary'
  icon?: ReactNode
}

export function BookingButton({ 
  children, 
  variant = 'outline', 
  icon, 
  className, 
  ...props 
}: BookingButtonProps) {
  const baseStyles = "flex items-center gap-2 h-10 px-4 rounded-md"
  
  const variantStyles = {
    default: "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
    outline: "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-gray-700",
    primary: "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-600 dark:hover:bg-gray-700",
  }
  
  return (
    <Button 
      className={cn(baseStyles, variantStyles[variant], className)}
      variant={variant === 'primary' ? 'default' : 'outline'}
      {...props}
    >
      {icon}
      {children}
    </Button>
  )
} 