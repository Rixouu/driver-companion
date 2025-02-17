"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function VehicleTabNavigation() {

  return (
    <Tabs defaultValue="maintenance">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="maintenance">
          {"vehicles.management.tabs.maintenanceSchedule"}
        </TabsTrigger>
        <TabsTrigger value="inspection">
          {"vehicles.management.tabs.inspectionHistory"}
        </TabsTrigger>
        <TabsTrigger value="mileage">
          {"vehicles.management.tabs.mileageCurrent"}
        </TabsTrigger>
        <TabsTrigger value="fuel">
          {"vehicles.management.tabs.fuelConsumption"}
        </TabsTrigger>
        <TabsTrigger value="assignment">
          {"vehicles.management.tabs.assignmentList"}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
} 