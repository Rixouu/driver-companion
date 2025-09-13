"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { UICustomizationProvider } from "@/components/providers/ui-customization-provider"
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
        <UICustomizationProvider>
          {children}
          <Toaster />
        </UICustomizationProvider>
      </ThemeProvider>
    </AuthProvider>
  )
} 