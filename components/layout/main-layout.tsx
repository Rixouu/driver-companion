"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { PageContainer } from "./page-container"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  
  // Don't show layout on auth pages
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile, visible on lg screens */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <PageContainer>{children}</PageContainer>
      </div>
      
      {/* Mobile navigation - visible on mobile, hidden on lg screens */}
      <MobileNav />
    </div>
  )
} 