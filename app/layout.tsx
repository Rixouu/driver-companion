import { Work_Sans } from "next/font/google"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import "@/styles/globals.css"
import { cn } from "@/lib/utils/styles"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getSession } from "@/lib/db/server"
import { I18nProvider } from "@/lib/i18n/context"

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-work-sans",
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        workSans.className,
        workSans.variable,
        "min-h-screen bg-[hsl(var(--background))]"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 