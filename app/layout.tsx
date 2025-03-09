import { Work_Sans } from "next/font/google"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
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
              <div className="flex min-h-screen flex-col">
                {!children?.toString().includes('LoginForm') && <Header />}
                <main className="flex-1">
                  {children?.toString().includes('LoginForm') ? (
                    children
                  ) : (
                    <div className="container mx-auto px-4 pt-6">{children}</div>
                  )}
                </main>
              </div>
              <Toaster />
            </Providers>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 