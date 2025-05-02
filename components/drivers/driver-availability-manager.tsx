"use client"

import { useState } from "react"
import { CalendarDays, ListChecks } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverAvailabilityCalendar } from "./driver-availability-calendar"
import { DriverAvailabilityList } from "./driver-availability-list"
import { useI18n } from "@/lib/i18n/context"
import type { Driver } from "@/types/drivers"

interface DriverAvailabilityManagerProps {
  driver: Driver
}

export function DriverAvailabilityManager({ driver }: DriverAvailabilityManagerProps) {
  const [activeTab, setActiveTab] = useState("calendar")
  const { t } = useI18n()
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("drivers.availability.title")}</h2>
      <p className="text-muted-foreground">
        {t("drivers.availability.description", { defaultValue: "Manage availability periods for this driver. Set when they are available, on leave, or in training." })}
      </p>
      
      <Tabs
        defaultValue="calendar"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            {t("drivers.availability.calendarView", { defaultValue: "Calendar View" })}
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center">
            <ListChecks className="mr-2 h-4 w-4" />
            {t("drivers.availability.listView.title", { defaultValue: "List View" })}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <DriverAvailabilityCalendar driver={driver} />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <DriverAvailabilityList driver={driver} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 