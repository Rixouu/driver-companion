"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context";

export function VehicleTabNavigation() {
  const { t } = useI18n();

  return (
    <Tabs defaultValue="maintenance">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="maintenance">
          {t("vehicles.management.tabs.maintenanceSchedule")}
        </TabsTrigger>
        <TabsTrigger value="inspection">
          {t("vehicles.management.tabs.inspectionHistory")}
        </TabsTrigger>
        <TabsTrigger value="mileage">
          {t("vehicles.management.tabs.mileageCurrent")}
        </TabsTrigger>
        <TabsTrigger value="fuel">
          {t("vehicles.management.tabs.fuelConsumption")}
        </TabsTrigger>
        <TabsTrigger value="assignment">
          {t("vehicles.management.tabs.assignmentList")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
} 