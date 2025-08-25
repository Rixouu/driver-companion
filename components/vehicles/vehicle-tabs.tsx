"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleInfo } from "./vehicle-info"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { Info, History, Calendar, ClipboardCheck } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense, lazy } from "react"

// Lazy load heavy components for better performance
const VehicleHistory = lazy(() => import("./vehicle-history").then(mod => ({ default: mod.VehicleHistory })))
const VehicleBookings = lazy(() => import("./vehicle-bookings").then(mod => ({ default: mod.VehicleBookings })))
const VehicleInspections = lazy(() => import("./vehicle-inspections").then(mod => ({ default: mod.VehicleInspections })))

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("info")

  const tabs = [
    { value: "info", label: t("vehicles.tabs.info"), icon: Info },
    { value: "history", label: t("vehicles.tabs.history"), icon: History },
    { value: "bookings", label: t("vehicles.tabs.bookings"), icon: Calendar },
    { value: "inspections", label: t("vehicles.tabs.inspections"), icon: ClipboardCheck },
  ]

  // Update active tab based on URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabs.some(tab => tab.value === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Prefetch data for the active tab on mount
  useEffect(() => {
    if (activeTab && activeTab !== 'info') {
      prefetchTabData(activeTab)
    }
  }, [activeTab, vehicle.id])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without page refresh
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('tab', value)
    router.replace(`?${newSearchParams.toString()}`, { scroll: false })
    
    // Prefetch data for the selected tab
    if (value === 'history' || value === 'bookings' || value === 'inspections') {
      prefetchTabData(value)
    }
  }

  // Prefetch data for better performance
  const prefetchTabData = async (tab: string) => {
    try {
      switch (tab) {
        case 'history':
          // Prefetch history data
          await Promise.all([
            fetch(`/api/vehicles/${vehicle.id}/maintenance/overview`),
            fetch(`/api/vehicles/${vehicle.id}/inspections`),
            fetch(`/api/vehicles/${vehicle.id}/bookings`)
          ])
          break
        case 'bookings':
          // Prefetch bookings data
          await fetch(`/api/vehicles/${vehicle.id}/bookings`)
          break
        case 'inspections':
          // Prefetch inspections data
          await fetch(`/api/vehicles/${vehicle.id}/inspections`)
          break
      }
    } catch (error) {
      // Silent fail for prefetching
      console.debug('Prefetch failed for tab:', tab, error)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <TabsList className="w-full grid grid-cols-4 gap-0 rounded-none border-b bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Mobile Bottom Navigation - Fixed height and better spacing */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden h-16 shadow-lg">
        <TabsList className="w-full grid grid-cols-4 gap-0 h-full bg-background">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col items-center justify-center py-1 px-2 gap-1 h-full data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-colors"
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center truncate w-full">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {/* Tab Content with Mobile Padding */}
      <div className="mt-4 pb-20 md:pb-0">
        <TabsContent value="info" className="space-y-6 m-0">
          <VehicleInfo vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="history" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehicleHistory vehicle={vehicle} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="bookings" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehicleBookings vehicle={vehicle} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="inspections" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehicleInspections vehicle={vehicle} />
          </Suspense>
        </TabsContent>
      </div>
    </Tabs>
  )
}