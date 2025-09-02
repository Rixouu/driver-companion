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
      <Tabs
        defaultValue="calendar"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 w-full"
      >
        <TabsList className="w-full grid grid-cols-2 h-auto">
          <TabsTrigger 
            value="calendar" 
            className="flex items-center justify-center py-2 px-2 text-sm sm:text-base"
          >
            <CalendarDays className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">
              {t("drivers.availability.calendarView", { defaultValue: "Calendar View" })}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="flex items-center justify-center py-2 px-2 text-sm sm:text-base"
          >
            <ListChecks className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">
              {t("drivers.availability.listView.title", { defaultValue: "List View" })}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4 mt-2">
          <DriverAvailabilityCalendar driver={driver} />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4 mt-2">
          <DriverAvailabilityList driver={driver} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 