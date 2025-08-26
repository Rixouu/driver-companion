import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils/styles';

interface PricingTabHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PricingTabHeader({
  title,
  description,
  icon,
  badges,
  actions,
  className
}: PricingTabHeaderProps) {
  return (
    <CardHeader className={cn(
      "border-b bg-gradient-to-r from-muted/50 to-background dark:from-muted/20 dark:to-muted/10",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center">
            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mr-3">
              <div className="text-primary">
                {icon}
              </div>
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            {description}
            {badges && (
              <div className="flex items-center gap-3 mt-2 text-sm">
                {badges}
              </div>
            )}
          </CardDescription>
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2">
            {actions}
          </div>
        )}
      </div>
    </CardHeader>
  );
}

interface StatusBadgeProps {
  type: 'success' | 'warning' | 'info' | 'error';
  children: React.ReactNode;
}

export function StatusBadge({ type, children }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[type]
    )}>
      {children}
    </span>
  );
}
