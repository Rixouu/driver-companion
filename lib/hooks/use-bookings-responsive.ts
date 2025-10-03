import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const useBookingsResponsive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  const checkIfMobile = useCallback(() => {
    const mobile = window.innerWidth < 768; // md breakpoint
    setIsMobile(mobile);
    return mobile;
  }, []);

  // Handle view change with mobile restrictions
  const handleViewChange = useCallback((newView: "list" | "grid", currentView: "list" | "grid", onViewChange: (view: "list" | "grid") => void) => {
    // Don't allow grid view on mobile devices
    if (isMobile && newView === "grid") {
      console.log("Grid view blocked on mobile");
      return;
    }
    
    console.log(`Changing view to ${newView}`);
    onViewChange(newView);
  }, [isMobile]);

  // Generate status button class based on active status
  const getStatusButtonClass = useCallback((buttonStatus: string, activeStatus: string) => {
    if (activeStatus === buttonStatus) {
      switch (buttonStatus) {
        case 'confirmed':
        case 'completed':
          return 'bg-green-600 hover:bg-green-700 border-green-600 text-white font-medium';
        case 'pending':
          return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600 text-white font-medium';
        case 'cancelled':
          return 'bg-red-600 hover:bg-red-700 border-red-600 text-white font-medium';
        case 'assigned':
          return 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-medium';
        default:
          return 'bg-primary text-primary-foreground font-medium';
      }
    }
    return 'bg-background hover:bg-muted border-border text-foreground';
  }, []);

  // Set up mobile detection and URL sync
  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Sync view with URL on mount
    const urlView = searchParams?.get('view') as "list" | "grid" | null;
    if (urlView === "grid" && isMobile) {
      // If URL has grid view but we're on mobile, switch to list
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set("view", "list");
      // @ts-ignore - Route string types are not matching but this works
      router.push(`/bookings?${params.toString()}`);
    }
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile, router, searchParams, checkIfMobile]);

  return {
    isMobile,
    checkIfMobile,
    handleViewChange,
    getStatusButtonClass,
  };
};
