"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GoogleMapsProvider>
          {children}
          <Toaster />
        </GoogleMapsProvider>
      </ThemeProvider>
    </AuthProvider>
  )
} 