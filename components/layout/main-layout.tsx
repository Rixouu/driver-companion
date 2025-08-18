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
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also set up an interval to check the localStorage value
    const interval = setInterval(() => {
      const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
      if (savedCollapsedState && (savedCollapsedState === 'true') !== sidebarCollapsed) {
        setSidebarCollapsed(savedCollapsedState === 'true')
      }
    }, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [sidebarCollapsed])
  
  // Don't show layout on auth pages
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sidebar - hidden on mobile, visible on lg screens */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      <div className={`flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />
        
        {/* Main content area */}
        <div className="flex-1">
          <PageContainer>{children}</PageContainer>
        </div>
        
        {/* Mobile navigation - visible on mobile, hidden on lg screens */}
        <MobileNav />
      </div>
    </div>
  );
} 