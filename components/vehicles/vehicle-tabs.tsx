"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleInfo } from "./vehicle-info"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { Info, History, Calendar, ClipboardCheck, Package, Activity } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState("overview")

  const tabs = [
    { value: "overview", label: t("vehicles.tabs.overview", { defaultValue: "Overview" }), icon: Info },
    { value: "inspections", label: t("vehicles.tabs.inspections", { defaultValue: "Inspections" }), icon: ClipboardCheck },
    { value: "bookings", label: t("vehicles.tabs.bookings", { defaultValue: "Bookings" }), icon: Calendar },
    { value: "activity", label: t("vehicles.tabs.activity", { defaultValue: "Activity Log" }), icon: Activity },
    { value: "pricing", label: t("vehicles.tabs.pricing", { defaultValue: "Vehicle Pricing" }), icon: Package },
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
    if (activeTab && activeTab !== 'overview') {
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
    if (value === 'history' || value === 'bookings' || value === 'inspections' || value === 'activity' || value === 'pricing') {
      prefetchTabData(value)
    }
  }

  // Prefetch data for better performance
  const prefetchTabData = async (tab: string) => {
    try {
      switch (tab) {
        case 'activity':
          // Prefetch activity data (inspections + bookings)
          await Promise.all([
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
        case 'pricing':
          // Prefetch pricing data
          await fetch(`/api/vehicles/${vehicle.id}/pricing`)
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
        <TabsList className="w-full grid grid-cols-5 gap-0 rounded-none border-b bg-transparent p-0">
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
        <TabsList className="w-full grid grid-cols-5 gap-0 h-full bg-background">
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
        <TabsContent value="overview" className="space-y-6 m-0">
          <VehicleOverview vehicle={vehicle} />
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
        
        <TabsContent value="bookings" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehicleBookings vehicle={vehicle} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="activity" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehicleActivityLog vehicle={vehicle} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pricing" className="m-0">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <VehiclePricing vehicle={vehicle} />
          </Suspense>
        </TabsContent>
      </div>
    </Tabs>
  )
}

// Vehicle Overview Component - Shows upcoming bookings and recent inspections
function VehicleOverview({ vehicle }: { vehicle: DbVehicle }) {
  const { t } = useI18n()
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [recentInspections, setRecentInspections] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch upcoming bookings
        const bookingsResponse = await fetch(`/api/vehicles/${vehicle.id}/bookings?upcoming=true&limit=5`)
        const bookingsData = await bookingsResponse.json()
        
        // Fetch recent inspections
        const inspectionsResponse = await fetch(`/api/vehicles/${vehicle.id}/inspections?limit=5`)
        const inspectionsData = await inspectionsResponse.json()
        
        setUpcomingBookings(bookingsData.bookings || [])
        setRecentInspections(inspectionsData.inspections || [])
      } catch (error) {
        console.error('Error fetching overview data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicle.id) {
      fetchOverviewData()
    }
  }, [vehicle.id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Bookings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Scheduled bookings for this vehicle
            </p>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.service_name || 'Booking'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No Upcoming Bookings</p>
                <p className="text-xs">This vehicle has no upcoming bookings scheduled.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Recent Inspections
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest vehicle inspections performed
            </p>
          </CardHeader>
          <CardContent>
            {recentInspections.length > 0 ? (
              <div className="space-y-3">
                {recentInspections.map((inspection: any) => (
                  <div key={inspection.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {inspection.type || 'Inspection'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inspection.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {inspection.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No Recent Inspections</p>
                <p className="text-xs">This vehicle has no inspections recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Vehicle Activity Log Component - Mix of inspections and bookings
function VehicleActivityLog({ vehicle }: { vehicle: DbVehicle }) {
  const { t } = useI18n()
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch both inspections and bookings
        const [inspectionsResponse, bookingsResponse] = await Promise.all([
          fetch(`/api/vehicles/${vehicle.id}/inspections?limit=20`),
          fetch(`/api/vehicles/${vehicle.id}/bookings?limit=20`)
        ])
        
        const inspectionsData = await inspectionsResponse.json()
        const bookingsData = await bookingsResponse.json()
        
        // Combine and sort by date
        const combined = [
          ...(inspectionsData.inspections || []).map((i: any) => ({ ...i, type: 'inspection' })),
          ...(bookingsData.bookings || []).map((b: any) => ({ ...b, type: 'booking' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setActivities(combined.slice(0, 20))
      } catch (error) {
        console.error('Error fetching activity data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicle.id) {
      fetchActivityData()
    }
  }, [vehicle.id])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recent inspections and bookings for this vehicle
        </p>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'inspection' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {activity.type === 'inspection' ? (
                      <ClipboardCheck className="h-4 w-4" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {activity.type === 'inspection' 
                        ? (activity.type || 'Inspection')
                        : (activity.service_name || 'Booking')
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={activity.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No Activity</p>
            <p className="text-xs">This vehicle has no recent activity.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Vehicle Pricing Component - Shows pricing information from price_items table
function VehiclePricing({ vehicle }: { vehicle: DbVehicle }) {
  const { t } = useI18n()
  const [pricingData, setPricingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch vehicle pricing data
        const response = await fetch(`/api/vehicles/${vehicle.id}/pricing`)
        const data = await response.json()
        
        setPricingData(data)
      } catch (error) {
        console.error('Error fetching pricing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicle.id) {
      fetchPricingData()
    }
  }, [vehicle.id])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Vehicle Pricing
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pricing information and service costs for this vehicle
        </p>
      </CardHeader>
      <CardContent>
        {pricingData && pricingData.items && pricingData.items.length > 0 ? (
          <div className="space-y-4">
            {pricingData.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.service_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {item.duration_hours} hours
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {item.currency} {item.price}
                  </p>
                  <Badge 
                    variant={item.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No Pricing Information</p>
            <p className="text-xs">No pricing data available for this vehicle.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}