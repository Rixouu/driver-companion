"use client"

import { useI18n } from "@/lib/i18n/context"
import { ScheduleInspectionForm } from "@/components/inspections/schedule-inspection-form"
import type { DbVehicle } from "@/types"

interface ScheduleInspectionContentProps {
  vehicle: DbVehicle
}

export function ScheduleInspectionContent({ vehicle }: ScheduleInspectionContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("inspections.schedule.title")}</h1>
        <p className="text-muted-foreground">
          {t("inspections.schedule.description", { vehicle: vehicle.name })}
        </p>
      </div>

      <div className="grid gap-6">
        <ScheduleInspectionForm vehicleId={vehicle.id} />
      </div>
    </div>
  )
} 