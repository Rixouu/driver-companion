"use client"

import { useState, useEffect } from "react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Info, History, Calendar, ClipboardCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface VehicleTabsListProps {
  value: string
  onValueChange: (value: string) => void
}

export function VehicleTabsList({ value, onValueChange }: VehicleTabsListProps) {
  const { t } = useI18n()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const tabs = [
    { value: "info", label: t("vehicles.tabs.info"), icon: Info },
    { value: "history", label: t("vehicles.tabs.history"), icon: History },
    { value: "bookings", label: t("vehicles.tabs.bookings"), icon: Calendar },
    { value: "inspections", label: t("vehicles.tabs.inspections"), icon: ClipboardCheck },
  ]

  const currentTab = tabs.find(tab => tab.value === value)

  if (isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full h-10">
          <div className="flex items-center gap-2">
            {currentTab && <currentTab.icon className="h-4 w-4" />}
            <span>{currentTab?.label || t("vehicles.tabs.info")}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {tabs.map((tab) => (
            <SelectItem key={tab.value} value={tab.value}>
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
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
  )
}
