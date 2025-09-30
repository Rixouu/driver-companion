"use client"

import { useState, useEffect } from "react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { ClipboardCheck, Mail } from "lucide-react"

interface TemplatesTabsListProps {
  value: string
  onValueChange?: (value: string) => void
}

export function TemplatesTabsList({ value, onValueChange }: TemplatesTabsListProps) {
  const { t } = useI18n()
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if we're on mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const tabs = [
    { value: "inspections", label: t('templates.tabs.inspections') || "Inspection Templates", icon: ClipboardCheck },
    { value: "emails", label: t('templates.tabs.emails') || "Email Templates", icon: Mail },
  ]

  const currentTab = tabs.find(tab => tab.value === value)
  
  if (isMobile) {
    return (
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3">
        <div className="flex items-center gap-2">
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-full h-10 text-sm">
              <SelectValue placeholder={currentTab?.label || "Select a template type"} />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <TabsList className="flex flex-wrap h-auto min-h-12 items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </div>
  )
}
