"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ShieldX } from 'lucide-react';
import { supabase } from "@/lib/supabase/client";
import { Icons } from "@/components/icons";
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from "@/lib/i18n/context";

export default function NotAuthorizedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleGoogleLogin() {
    try {
      setIsLoading(true);
      
      // Sign out first to ensure clean authentication
      await supabase.auth.signOut();
      
      // Get the default callback URL
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     (process.env.NODE_ENV === 'development' 
                        ? 'http://localhost:3000' 
                        : currentOrigin);
      
      const callbackUrl = new URL('/auth/callback', baseUrl);
      callbackUrl.searchParams.set('origin', currentOrigin);
      callbackUrl.searchParams.set('redirect_to', '/dashboard');
      
      // Sign in with Google OAuth
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted dark:bg-background">
      <div className="max-w-md w-full p-8 bg-white dark:bg-muted/30 rounded-lg shadow-lg text-center relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex justify-center mb-6 mt-4">
          <ShieldX className="h-16 w-16 text-[#ff3e33]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('notAuthorized.title')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('notAuthorized.description')}
        </p>
        <div className="space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium dark:bg-muted dark:text-white dark:hover:bg-muted/80"
            variant="outline"
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('notAuthorized.loginButton')}
          </Button>
        </div>
      </div>
    </div>
  );
} 