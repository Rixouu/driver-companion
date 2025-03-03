"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleSchedule } from "./vehicle-schedule"
import { VehicleHistory } from "./vehicle-history"
import { VehicleCosts } from "./vehicle-costs"
import { VehicleReminders } from "./vehicle-reminders"
import { DbVehicle } from "@/types"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  const { t } = useI18n()

  const tabs = [
    { value: "schedule", label: t("vehicles.tabs.schedule") },
    { value: "history", label: t("vehicles.tabs.history") },
    { value: "costs", label: t("vehicles.tabs.costs") },
    { value: "reminders", label: t("vehicles.tabs.reminders") }
  ]

  return (
    <Tabs defaultValue="schedule" className="w-full">
      <div className="border-b">
        <TabsList className="w-full justify-start overflow-x-auto">
          <div className="flex min-w-full md:min-w-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex-1 md:flex-none whitespace-nowrap",
                  "data-[state=active]:bg-background"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </div>
        </TabsList>
      </div>
      
      <div className="mt-6">
        <TabsContent value="schedule">
          <VehicleSchedule vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="history">
          <VehicleHistory vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="costs">
          <VehicleCosts vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="reminders">
          <VehicleReminders vehicle={vehicle} />
        </TabsContent>
      </div>
    </Tabs>
  )
}