"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { VehicleInfo } from "./vehicle-info"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense, lazy } from "react"
import { VehicleTabsList } from "./vehicle-tabs-list"

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

  // Update active tab based on URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['info', 'history', 'bookings', 'inspections'].includes(tabParam)) {
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
      {/* Responsive Tabs Navigation */}
      <VehicleTabsList value={activeTab} onValueChange={handleTabChange} />
      
      {/* Tab Content */}
      <div className="mt-6 space-y-6">
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