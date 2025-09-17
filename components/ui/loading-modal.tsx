import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Mail, FileText, Clock, Zap, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingModalProps {
  open: boolean;
  title: string;
  label: string;
  value: number;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice' | 'upgrade';
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
          accentColor: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20',
          ringColor: 'ring-blue-500/20',
          titleColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'approval':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgGradient: 'from-green-500 to-green-600',
          progressColor: 'bg-green-500',
          accentColor: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20',
          ringColor: 'ring-green-500/20',
          titleColor: 'text-green-600 dark:text-green-400'
        };
      case 'rejection':
        return {
          icon: FileText,
          iconColor: 'text-red-500',
          bgGradient: 'from-red-500 to-red-600',
          progressColor: 'bg-red-500',
          accentColor: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20',
          ringColor: 'ring-red-500/20',
          titleColor: 'text-red-600 dark:text-red-400'
        };
      case 'reminder':
        return {
          icon: Clock,
          iconColor: 'text-orange-500',
          bgGradient: 'from-orange-500 to-orange-600',
          progressColor: 'bg-orange-500',
          accentColor: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20',
          ringColor: 'ring-orange-500/20',
          titleColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'invoice':
        return {
          icon: FileText,
          iconColor: 'text-purple-500',
          bgGradient: 'from-purple-500 to-purple-600',
          progressColor: 'bg-purple-500',
          accentColor: 'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20',
          ringColor: 'ring-purple-500/20',
          titleColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'upgrade':
        return {
          icon: CreditCard,
          iconColor: 'text-orange-500',
          bgGradient: 'from-orange-500 to-orange-600',
          progressColor: 'bg-orange-500',
          accentColor: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20',
          ringColor: 'ring-orange-500/20',
          titleColor: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          icon: Loader2,
          iconColor: 'text-primary',
          bgGradient: 'from-primary to-primary/80',
          progressColor: 'bg-primary',
          accentColor: 'border-border bg-muted/50',
          ringColor: 'ring-primary/20',
          titleColor: 'text-foreground'
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl duration-200">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 p-8">
          {/* Header with enhanced animated icon */}
          <div className="relative">
            <div className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg",
              config.accentColor,
              config.ringColor
            )}>
              <Icon className={cn(
                "h-10 w-10",
                config.iconColor,
                variant === 'default' && "animate-spin"
              )} />
            </div>
            
            {/* Enhanced animated ring for processing states */}
            {value < 100 && (
              <div className={cn(
                "absolute inset-0 rounded-full border-2 border-transparent animate-pulse",
                config.ringColor
              )} />
            )}
            
            {/* Success ring for completion */}
            {value === 100 && (
              <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-75" />
            )}
          </div>

          {/* Enhanced Title with route-specific styling */}
          <div className="text-center space-y-3">
            <h3 className={cn(
              "text-xl font-bold",
              config.titleColor
            )}>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {label}
            </p>
          </div>

          {/* Enhanced Progress bar */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-foreground">{value}%</span>
                {value === 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={value} 
                className="h-3 bg-muted/50"
              />
              {/* Progress glow effect */}
              {value > 0 && (
                <div 
                  className={cn(
                    "absolute top-0 left-0 h-3 rounded-full opacity-30 blur-sm",
                    config.progressColor
                  )} 
                  style={{ width: `${value}%` }} 
                />
              )}
            </div>
          </div>

          {/* Enhanced Steps indicator */}
          {showSteps && steps.length > 0 && (
            <div className="w-full space-y-3">
              <div className="text-sm font-semibold text-muted-foreground mb-3 text-center">
                Processing Steps
              </div>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 text-sm transition-all duration-300 p-2 rounded-lg",
                      step.completed 
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" 
                        : value >= step.value 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
                          : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                      step.completed 
                        ? "bg-green-500 text-white shadow-lg" 
                        : value >= step.value 
                          ? "bg-blue-500 text-white shadow-lg" 
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
                    <span className="flex-1 font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Performance indicator */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span className="font-medium">Optimized processing</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
