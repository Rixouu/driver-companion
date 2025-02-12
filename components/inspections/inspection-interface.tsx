"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function InspectionInterface() {
  const { t } = useLanguage()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/inspections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("inspections.back.toInspections")}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {t("inspections.vehicleInformationTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("inspections.vehicleInformationSubtitle")}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm">
          {t("inspections.progressCompleted")}
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-green-500">
            {t("inspections.progressStatsPassed")}
          </span>
          <span className="text-destructive">
            {t("inspections.progressStatsFailed")}
          </span>
          <span>
            {t("inspections.progressStatsRemaining")}
          </span>
        </div>
      </div>

      <Tabs defaultValue="front">
        <TabsList>
          <TabsTrigger value="front">
            {t("inspections.sections.front")}
          </TabsTrigger>
          <TabsTrigger value="leftSide">
            {t("inspections.sections.leftSide")}
          </TabsTrigger>
          <TabsTrigger value="rightSide">
            {t("inspections.sections.rightSide")}
          </TabsTrigger>
          <TabsTrigger value="rear">
            {t("inspections.sections.rear")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Rest of the component */}
    </div>
  )
} 