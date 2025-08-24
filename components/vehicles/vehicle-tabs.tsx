"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleHistory } from "./vehicle-history"
import { VehicleInfo } from "./vehicle-info"
import { VehicleBookings } from "./vehicle-bookings"
import { VehicleInspections } from "./vehicle-inspections"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { Info, History, Calendar, ClipboardCheck } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without page refresh
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('tab', value)
    router.replace(`?${newSearchParams.toString()}`, { scroll: false })
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
          <VehicleHistory vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="bookings" className="m-0">
          <VehicleBookings vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="inspections" className="m-0">
          <VehicleInspections vehicle={vehicle} />
        </TabsContent>
      </div>
    </Tabs>
  )
}