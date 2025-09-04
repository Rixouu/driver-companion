"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  className?: string
  iconColor?: string
  valueColor?: string
}

export function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  className,
  iconColor = 'text-blue-600',
  valueColor = 'text-foreground'
}: MetricsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
              {badge && (
                <Badge variant={badge.variant || 'secondary'} className="text-xs flex-shrink-0">
                  {badge.text}
                </Badge>
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className={cn("text-lg sm:text-2xl font-bold", valueColor)}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs sm:text-sm font-medium flex-shrink-0",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  <span className={cn(
                    "text-xs",
                    trend.isPositive ? "rotate-0" : "rotate-180"
                  )}>
                    ↗
                  </span>
                  <span>{Math.abs(trend.value).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            {description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              "flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-muted/50 flex-shrink-0",
              iconColor
            )}>
              <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
