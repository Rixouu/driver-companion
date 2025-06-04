'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // useState to ensure QueryClient is only created once per component lifecycle
  // and not recreated on every render, which is important for Next.js App Router
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default staleTime can be set here, e.g., 5 minutes
        staleTime: 1000 * 60 * 5,
        // Default refetchOnWindowFocus can be true or false based on preference
        refetchOnWindowFocus: false, 
      },
    },
  }));

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryClientProvider>
  );
} 