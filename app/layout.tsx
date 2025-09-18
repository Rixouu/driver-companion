import { Noto_Sans_Thai } from "next/font/google"
import { Providers } from "@/components/providers"
import { FontProvider } from "@/components/providers/font-provider"
// Toaster is typically rendered by Providers or at a similar top level
import "@/styles/globals.css"
import { cn } from "@/lib/utils/styles"
// ThemeProvider is part of Providers
// import { getSession } from "@/lib/db/server" // Keeping for now, as it might affect initial render
import { I18nProvider } from "@/lib/i18n/context"
import type { Metadata } from "next"
import type { NextWebVitalsMetric } from 'next/app';
// Commenting out SupabaseProvider - AuthProvider creates its own client.
// If SupabaseProvider is for a general Supabase client context distinct from auth, it might be needed,
// but let's simplify first to address auth issues.
// import { SupabaseProvider } from "@/components/providers/supabase-provider" 
import { QueryProvider } from "@/components/providers/query-provider"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { PrefetchManager } from "@/components/prefetch-manager"


const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
})

export const metadata: Metadata = {
  title: "Driver Fleet Management",
  description: "Driver Fleet Management System",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
}

export const dynamic = 'force-dynamic'

// Web Vitals Reporting
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric); 
  // Can be extended to send to an analytics endpoint
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const session = await getSession() // This fetches session on server-side

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body 
        className={cn(
          notoSansThai.className,
          notoSansThai.variable,
          "min-h-screen bg-[hsl(var(--background))]"
        )}
        suppressHydrationWarning
      >
        <a 
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:m-3 focus:p-3 focus:bg-background focus:text-foreground focus:z-50 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-md"
        >
          Skip to main content
        </a>
        {/* Reinstate SupabaseProvider, wrapping QueryProvider and subsequent providers */}
        <SupabaseProvider>
          <QueryProvider>
            <I18nProvider>
              <FontProvider>
                <Providers> 
                  {children}
                  {/* Toaster is already inside Providers component, so not needed here. */}
                </Providers>
              </FontProvider>
            </I18nProvider>
          </QueryProvider>
        </SupabaseProvider>
        <PrefetchManager />
        <SpeedInsights />

      </body>
    </html>
  )
} 