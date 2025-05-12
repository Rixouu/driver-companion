import React, { useEffect, ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useEffect(() => {
    // Fix for "Cannot set property ethereum of #<Window> which has only a getter"
    const handleEthereumInjection = () => {
      // Only run this code in the browser, not during SSR
      if (typeof window !== 'undefined') {
        // Save original defineProperty to restore it later
        const originalDefineProperty = Object.defineProperty;
        
        // Create a safer version that doesn't throw on ethereum property
        Object.defineProperty = function(obj, prop, descriptor) {
          // Check if we're trying to set window.ethereum and it's already a getter
          if (obj === window && prop === 'ethereum' && 
              Object.getOwnPropertyDescriptor(window, 'ethereum')?.get) {
            // Skip this property definition to avoid the error
            console.log('Prevented redefining window.ethereum property');
            return obj;
          }
          
          // For all other properties, use the original defineProperty
          return originalDefineProperty(obj, prop, descriptor);
        };
        
        // Restore the original defineProperty after a short delay
        // By then the MetaMask/EVMask script should have completed initialization
        setTimeout(() => {
          Object.defineProperty = originalDefineProperty;
        }, 1000);
      }
    };
    
    handleEthereumInjection();
    
    // Clean up function
    return () => {
      // Additional cleanup if needed
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
} 