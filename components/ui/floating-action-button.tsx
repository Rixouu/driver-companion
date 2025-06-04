'use client';

import * as React from 'react';
import Link, { type LinkProps } from 'next/link';
import { Plus } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/styles';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingActionButtonProps extends Omit<ButtonProps, 'asChild'> { 
  onClick?: React.MouseEventHandler<HTMLButtonElement>; 
  href?: string; // Next.js Link href
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string; // For the Button/Link wrapper
  iconClassName?: string; // Added back
  // children for sr-only text or complex content (passed to Button)
}

export function FloatingActionButton({
  onClick,
  href,
  icon,
  tooltip,
  className, // This className applies to the Button or the Link wrapper
  iconClassName,
  children,
  variant = "default",
  size = "icon", 
  ...props // Remaining ButtonProps
}: FloatingActionButtonProps) {

  const fabBaseStyling = cn(
    "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center",
    "md:bottom-8 md:right-8",
    "transition-transform duration-150 ease-in-out hover:scale-110 active:scale-100"
  );

  const buttonContent = (
    <>
      {icon || <Plus className={cn("h-7 w-7", iconClassName)} />}
      {children && typeof children === 'string' && <span className="sr-only">{children}</span>}
      {children && typeof children !== 'string' && children}
    </>
  );

  let fabElement;

  if (href) {
    // Combine fabBaseStyling with any additional className from props for the Link/Button
    // The Button (asChild) will get variant and size applied automatically.
    fabElement = (
      <Link href={href as any} legacyBehavior={false} passHref>
        <Button
          asChild
          variant={variant}
          size={size}
          className={cn(fabBaseStyling, className)} // Apply combined styling here
          {...props} 
        >
          <a>{buttonContent}</a>
        </Button>
      </Link>
    );
  } else {
    fabElement = (
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        className={cn(fabBaseStyling, className)} // Apply combined styling here
        {...props}
        type="button"
      >
        {buttonContent}
      </Button>
    );
  }

  if (tooltip) {
    const tooltipText = typeof children === 'string' && children ? children : tooltip;
    if (tooltipText) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              {fabElement}
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-foreground text-background">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }

  return fabElement;
}