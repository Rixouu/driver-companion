import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseCountdownToastOptions {
  message?: string;
  redirectUrl?: string;
  duration?: number;
}

export function useCountdownToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<UseCountdownToastOptions>({});
  const router = useRouter();

  const showCountdownToast = useCallback((options: UseCountdownToastOptions = {}) => {
    setToastConfig({
      message: options.message || "Operation completed successfully!",
      redirectUrl: options.redirectUrl || "dashboard",
      duration: options.duration || 3,
    });
    setIsVisible(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    if (toastConfig.redirectUrl) {
      router.push(toastConfig.redirectUrl);
    }
  }, [router, toastConfig.redirectUrl]);

  const hideToast = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    toastConfig,
    showCountdownToast,
    handleComplete,
    hideToast,
  };
}
