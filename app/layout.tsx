import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ClientProviders } from "@/components/providers/client-providers"

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
        <ClientProviders session={session}>
          <div className="flex min-h-screen flex-col">
            {session && <Header />}
            <main className="flex-1">
              {children}
            </main>
          </div>
          <ServiceWorkerRegistration />
        </ClientProviders>
      </body>
    </html>
  )
}

