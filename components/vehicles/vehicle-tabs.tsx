"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleSchedule } from "./vehicle-schedule"
import { VehicleHistory } from "./vehicle-history"
import { VehicleInfo } from "./vehicle-info"
import { VehicleInProgress } from "./vehicle-in-progress"
import { VehicleFuelLogs } from "./vehicle-fuel-logs"
import { VehicleMileageLogs } from "./vehicle-mileage-logs"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { Info, Calendar, History, Play } from "lucide-react"
import { Suspense } from "react"

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  const { t } = useI18n()

  const tabs = [
    { value: "info", label: t("vehicles.tabs.info"), icon: Info },
    { value: "schedule", label: t("vehicles.tabs.schedule"), icon: Calendar },
    { value: "in_progress", label: t("vehicles.tabs.inProgress"), icon: Play },
    { value: "history", label: t("vehicles.tabs.history"), icon: History },
  ]

  return (
    <Tabs defaultValue="info" className="w-full">
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden h-16">
        <TabsList className="w-full grid grid-cols-4 gap-0 h-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col items-center justify-center py-1 px-2 gap-1 h-full"
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium text-center truncate w-full">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {/* Tab Content with Mobile Padding */}
      <div className="mt-4 pb-20 md:pb-0">
        <TabsContent value="info" className="space-y-6">
          <VehicleInfo vehicle={vehicle} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div>Loading fuel logs...</div>}>
              <VehicleFuelLogs vehicleId={vehicle.id} />
            </Suspense>
            <Suspense fallback={<div>Loading mileage logs...</div>}>
              <VehicleMileageLogs vehicleId={vehicle.id} />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule">
          <VehicleSchedule vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="in_progress">
          <VehicleInProgress vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="history">
          <VehicleHistory vehicle={vehicle} />
        </TabsContent>
      </div>
    </Tabs>
  )
}