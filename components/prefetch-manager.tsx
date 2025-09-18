"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchManagerProps {
  enabled?: boolean;
  criticalRoutes?: string[];
  prefetchDelay?: number;
}

export function PrefetchManager({ 
  enabled = true, 
  criticalRoutes = [
    '/dashboard',
    '/vehicles',
    '/bookings',
    '/quotations',
    '/inspections',
    '/maintenance'
  ],
  prefetchDelay = 2000
}: PrefetchManagerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    // Prefetch critical routes after a delay
    const timeoutId = setTimeout(() => {
      criticalRoutes.forEach(route => {
        try {
          router.prefetch(route);
        } catch (error) {
          console.warn(`Failed to prefetch route: ${route}`, error);
        }
      });
    }, prefetchDelay);

    return () => clearTimeout(timeoutId);
  }, [router, enabled, criticalRoutes, prefetchDelay]);

  return null;
}

// Hook for intelligent prefetching based on user behavior
export function useIntelligentPrefetch() {
  const router = useRouter();

  useEffect(() => {
    // Track user navigation patterns
    const navigationHistory: string[] = [];
    const maxHistory = 10;

    const handleRouteChange = (url: string) => {
      navigationHistory.push(url);
      if (navigationHistory.length > maxHistory) {
        navigationHistory.shift();
      }
    };

    // Prefetch likely next routes based on current page
    const prefetchMap: Record<string, string[]> = {
      '/dashboard': ['/vehicles', '/bookings', '/quotations'],
      '/vehicles': ['/vehicles/new', '/inspections', '/maintenance'],
      '/bookings': ['/bookings/new', '/quotations', '/customers'],
      '/quotations': ['/quotations/create', '/bookings', '/customers'],
      '/inspections': ['/inspections/create', '/vehicles', '/maintenance'],
      '/maintenance': ['/maintenance/schedule', '/vehicles', '/inspections'],
    };

    const currentPath = window.location.pathname;
    const routesToPrefetch = prefetchMap[currentPath] || [];

    // Prefetch routes after a short delay
    const timeoutId = setTimeout(() => {
      routesToPrefetch.forEach(route => {
        try {
          router.prefetch(route);
        } catch (error) {
          console.warn(`Failed to prefetch route: ${route}`, error);
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [router]);
}

// Component for prefetching based on hover
export function HoverPrefetch({ 
  route, 
  children, 
  prefetchDelay = 200 
}: { 
  route: string; 
  children: React.ReactNode; 
  prefetchDelay?: number;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;

    const timeoutId = setTimeout(() => {
      try {
        router.prefetch(route);
      } catch (error) {
        console.warn(`Failed to prefetch route: ${route}`, error);
      }
    }, prefetchDelay);

    return () => clearTimeout(timeoutId);
  }, [isHovered, route, router, prefetchDelay]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}
