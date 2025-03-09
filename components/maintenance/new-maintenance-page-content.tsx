"use client"

import { MaintenanceScheduleForm } from "@/components/maintenance/maintenance-schedule-form"
import { useI18n } from "@/lib/i18n/context"

export function NewMaintenancePageContent() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <MaintenanceScheduleForm />
    </div>
  )
} 