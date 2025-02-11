import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Header } from "@/components/header"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import type { Metadata } from "next"
import { LanguageProvider } from "@/components/providers/language-provider"
import { NextAuthProvider } from "@/components/providers/session-provider"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Driver Inspection App",
  description: "Daily vehicle inspection app for drivers",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextAuthProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              suppressHydrationWarning
            >
              <LanguageProvider>
                <div className="flex min-h-screen flex-col">
                  {session && <Header />}
                  <main className="flex-1">
                    {children}
                  </main>
                </div>
                <ServiceWorkerRegistration />
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}

