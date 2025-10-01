"use client"

import { cn } from "@/lib/utils/styles"

interface CountryFlagProps {
  country: 'thailand' | 'japan' | 'both'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CountryFlag({ country, className, size = 'md' }: CountryFlagProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }

  const getFlagEmoji = (country: string) => {
    switch (country.toLowerCase()) {
      case 'thailand':
        return '🇹🇭'
      case 'japan':
        return '🇯🇵'
      case 'both':
        return '🌍'
      default:
        return '🏳️'
    }
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center text-lg leading-none",
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={`${country} flag`}
    >
      {getFlagEmoji(country)}
    </span>
  )
}
