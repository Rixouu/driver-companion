'use client';

import { useEffect } from 'react';
import { loadNotoSansFont } from '@/lib/base64-fonts';

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  useEffect(() => {
    // Load the Noto Sans font for Japanese and Thai support
    loadNotoSansFont().catch(console.error);
  }, []);

  return <>{children}</>;
}
