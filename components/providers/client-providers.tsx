"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { LanguageProvider } from "@/components/providers/language-provider"

interface ClientProvidersProps {
  children: React.ReactNode
  session: any
}

export function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  )
} 