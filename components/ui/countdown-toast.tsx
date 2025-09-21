import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownToastProps {
  isVisible: boolean;
  onComplete: () => void;
  message?: string;
  redirectUrl?: string;
  duration?: number; // in seconds
}

export function CountdownToast({ 
  isVisible, 
  onComplete, 
  message = "Quotation sent successfully!",
  redirectUrl = "quotations",
  duration = 3 
}: CountdownToastProps) {
  const [countdown, setCountdown] = useState(duration);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    setIsAnimating(true);
    setCountdown(duration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 500); // Small delay before redirect
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={cn(
        "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md mx-4 transform transition-all duration-500",
        isAnimating ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
      )}>
        <div className="text-center space-y-6">
          {/* Success Icon with Animation */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {message}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to {redirectUrl} in...
            </p>
          </div>

          {/* Countdown Circle */}
          <div className="relative mx-auto w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / duration)}`}
                className="text-green-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Countdown Number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {countdown}
              </span>
            </div>
          </div>

          {/* Redirect Arrow */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Redirecting</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
