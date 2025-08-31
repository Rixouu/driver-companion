"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { User, ClipboardCheck, Package, Activity, Truck } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense, lazy } from "react"

// Lazy load heavy components for better performance
const VehicleBookings = lazy(() => import("./vehicle-bookings").then(mod => ({ default: mod.VehicleBookings })))
const VehicleInspections = lazy(() => import("./vehicle-inspections").then(mod => ({ default: mod.VehicleInspections })))
const VehicleActivityLog = lazy(() => import("./vehicle-activity-log").then(mod => ({ default: mod.VehicleActivityLog })))
const VehiclePricing = lazy(() => import("./vehicle-pricing").then(mod => ({ default: mod.VehiclePricing })))
const UpcomingBookingsContent = lazy(() => import("./vehicle-overview-content").then(mod => ({ default: mod.UpcomingBookingsContent })))
const RecentInspectionsContent = lazy(() => import("./vehicle-overview-content").then(mod => ({ default: mod.RecentInspectionsContent })))

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if we're on mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    { value: "overview", label: t("vehicles.tabs.overview", { defaultValue: "Overview" }), icon: User },
    { value: "inspections", label: t("vehicles.tabs.inspections", { defaultValue: "Inspections" }), icon: ClipboardCheck },
    { value: "bookings", label: t("vehicles.tabs.bookings", { defaultValue: "Bookings" }), icon: Truck },
    { value: "activity", label: t("vehicles.tabs.activity", { defaultValue: "Activity Log" }), icon: Activity },
    { value: "pricing", label: t("vehicles.tabs.pricing", { defaultValue: "Pricing" }), icon: Package },
  ]

  // Prefetch data for better performance - only for non-overview tabs
  const prefetchTabData = async (tab: string) => {
    // Skip prefetching to improve performance
    return
  }

  // Update active tab based on URL search params
  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam && tabs.some(tab => tab.value === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams, tabs])

  // No prefetching on mount for better performance
  useEffect(() => {
    // Skip prefetching to improve performance
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without page refresh
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '')
    newSearchParams.set('tab', value)
    router.replace(`?${newSearchParams.toString()}`, { scroll: false })
    
    // No prefetching for better performance
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* Mobile/Tablet Dropdown Navigation */}
      {isMobile ? (
        <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full h-12 bg-background border-border justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {(() => {
                    const currentTab = tabs.find(tab => tab.value === activeTab);
                    return currentTab ? (
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <currentTab.icon className="w-5 h-5 text-primary" />
                      </div>
                    ) : null;
                  })()}
                  <span className="text-sm font-medium truncate text-left">
                    {(() => {
                      const currentTab = tabs.find(tab => tab.value === activeTab);
                      return currentTab ? currentTab.label : "Select a tab";
                    })()}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-4 w-full">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {tab.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        /* Desktop Tabs */
        <TabsList className="w-full grid grid-cols-5 gap-0 rounded-none border-b bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{tab.label}</span>
              {tab.value === 'pricing' && <span className="lg:hidden">Pricing</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      )}

      {/* Tab Content */}
      <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-6">
        {/* Upcoming Bookings */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Upcoming Bookings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Scheduled bookings for this vehicle
            </p>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            <Suspense fallback={<LoadingFallback title="Upcoming Bookings" />}>
            <UpcomingBookingsContent vehicleId={vehicle.id} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Recent Inspections
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest vehicle inspections performed
            </p>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6">
            <Suspense fallback={<LoadingFallback title="Recent Inspections" />}>
            <RecentInspectionsContent vehicleId={vehicle.id} />
            </Suspense>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inspections" className="space-y-4 sm:space-y-6 mt-6">
        <Suspense fallback={<LoadingFallback title="Inspections" />}>
          <VehicleInspections vehicle={vehicle} />
        </Suspense>
      </TabsContent>

      <TabsContent value="bookings" className="space-y-4 sm:space-y-6 mt-6">
        <Suspense fallback={<LoadingFallback title="Bookings" />}>
          <VehicleBookings vehicle={vehicle} />
        </Suspense>
      </TabsContent>

      <TabsContent value="activity" className="space-y-4 sm:space-y-6 mt-6">
        <Suspense fallback={<LoadingFallback title="Activity Log" />}>
          <VehicleActivityLog vehicle={vehicle} />
        </Suspense>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-4 sm:space-y-6 mt-6">
        <Suspense fallback={<LoadingFallback title="Pricing" />}>
          <VehiclePricing vehicle={vehicle} />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}

// Loading Fallback Component - Lightweight for better performance
function LoadingFallback({ title }: { title: string }) {
  return (
    <div className="w-full p-8 text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
      <p className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</p>
    </div>
  )
}