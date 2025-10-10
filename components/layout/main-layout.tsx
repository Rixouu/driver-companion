"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { PageContainer } from "./page-container"
import { useState, useEffect } from "react"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Load sidebar collapsed state on mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState) {
      setSidebarCollapsed(savedCollapsedState === 'true')
    }
  }, [])
  
  // Watch for changes to sidebar state
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
      if (savedCollapsedState) {
        setSidebarCollapsed(savedCollapsedState === 'true')
      }
    }
    const handleSidebarCollapsedEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail as { collapsed?: boolean } | undefined
      if (detail && typeof detail.collapsed === 'boolean') setSidebarCollapsed(detail.collapsed)
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebar:collapsed', handleSidebarCollapsedEvent as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar:collapsed', handleSidebarCollapsedEvent as EventListener)
    }
  }, [])
  
  // Don't show layout on auth pages
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sidebar - hidden on mobile/tablet, visible on xl screens (1280px+) */}
      <div className="hidden xl:block">
        <Sidebar />
      </div>
      
      <div className={`flex flex-col min-h-screen transition-all duration-300
        ${sidebarCollapsed 
          ? 'xl:ml-16 2xl:ml-20 3xl:ml-24 4xl:ml-28 5xl:ml-32' 
          : 'xl:ml-64 2xl:ml-80 3xl:ml-96 4xl:ml-[28rem] 5xl:ml-[32rem]'
        }`}>
        <Header />
        
        {/* Main content area */}
        <div className="flex-1 pb-16 xl:pb-0">
          <PageContainer>{children}</PageContainer>
        </div>
        
        {/* Bottom navigation - visible on mobile/tablet, hidden on xl screens */}
        <MobileNav />
      </div>
    </div>
  );
} 