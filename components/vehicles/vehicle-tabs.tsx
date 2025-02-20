"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { VehicleSchedule } from "./vehicle-schedule"
import { VehicleHistory } from "./vehicle-history"
import { VehicleCosts } from "./vehicle-costs"
import { VehicleReminders } from "./vehicle-reminders"
import { DbVehicle } from "@/types"

interface VehicleTabsProps {
  vehicle: DbVehicle
}

export function VehicleTabs({ vehicle }: VehicleTabsProps) {
  return (
    <Tabs defaultValue="schedule" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="costs">Costs</TabsTrigger>
        <TabsTrigger value="reminders">Reminders</TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule" className="space-y-4">
        <VehicleSchedule vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="history" className="space-y-4">
        <VehicleHistory vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="costs" className="space-y-4">
        <VehicleCosts vehicle={vehicle} />
      </TabsContent>
      
      <TabsContent value="reminders" className="space-y-4">
        <VehicleReminders vehicle={vehicle} />
      </TabsContent>
    </Tabs>
  )
}