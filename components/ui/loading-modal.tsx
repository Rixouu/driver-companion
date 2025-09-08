import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Mail, FileText, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingModalProps {
  open: boolean;
  title: string;
  label: string;
  value: number;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'email' | 'approval' | 'rejection';
  showSteps?: boolean;
  steps?: Array<{
    label: string;
    value: number;
    completed?: boolean;
  }>;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  open,
  title,
  label,
  value,
  onOpenChange,
  variant = 'default',
  showSteps = false,
  steps = []
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'email':
        return {
          icon: Mail,
          iconColor: 'text-blue-500',
          bgGradient: 'from-blue-500 to-blue-600',
          progressColor: 'bg-blue-500',
          accentColor: 'border-blue-200 bg-blue-50/50'
        };
      case 'approval':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgGradient: 'from-green-500 to-green-600',
          progressColor: 'bg-green-500',
          accentColor: 'border-green-200 bg-green-50/50'
        };
      case 'rejection':
        return {
          icon: FileText,
          iconColor: 'text-red-500',
          bgGradient: 'from-red-500 to-red-600',
          progressColor: 'bg-red-500',
          accentColor: 'border-red-200 bg-red-50/50'
        };
      default:
        return {
          icon: Loader2,
          iconColor: 'text-primary',
          bgGradient: 'from-primary to-primary/80',
          progressColor: 'bg-primary',
          accentColor: 'border-border bg-muted/50'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Header with animated icon */}
          <div className="relative">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              config.accentColor
            )}>
              <Icon className={cn(
                "h-8 w-8",
                config.iconColor,
                variant === 'default' && "animate-spin"
              )} />
            </div>
            
            {/* Animated ring for processing states */}
            {value < 100 && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse" />
            )}
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {label}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{value}%</span>
            </div>
            <Progress 
              value={value} 
              className="h-2"
              // @ts-ignore - custom className for progress bar color
              style={{
                '--progress-background': `hsl(var(--${config.progressColor.replace('bg-', '')}))`
              }}
            />
          </div>

          {/* Steps indicator */}
          {showSteps && steps.length > 0 && (
            <div className="w-full space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Processing Steps
              </div>
              <div className="space-y-1">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-2 text-xs transition-colors duration-200",
                      step.completed 
                        ? "text-green-600 dark:text-green-400" 
                        : value >= step.value 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                      step.completed 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                        : value >= step.value 
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                          : "bg-muted text-muted-foreground"
                    )}>
                      {step.completed ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : value >= step.value ? (
                        <Zap className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    <span className="flex-1">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance indicator */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Optimized processing</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
