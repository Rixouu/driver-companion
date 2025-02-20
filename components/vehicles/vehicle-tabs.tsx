"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleSchedule } from "./vehicle-schedule"
import { VehicleHistory } from "./vehicle-history"
import { VehicleCosts } from "./vehicle-costs"
import { VehicleReminders } from "./vehicle-reminders"
import { DbVehicle } from "@/types"
import { cn } from "@/lib/utils"

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  return (
    <Tabs defaultValue="schedule" className="w-full">
      <div className="border-b">
        <TabsList className="w-full justify-start overflow-x-auto">
          <div className="flex min-w-full md:min-w-0">
            {[
              { value: "schedule", label: "Schedule" },
              { value: "history", label: "History" },
              { value: "costs", label: "Costs" },
              { value: "reminders", label: "Reminders" }
            ].map((tab) => (
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