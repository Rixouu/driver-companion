"use client"

import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { useI18n } from "@/lib/i18n/context"

export function NewMaintenancePageContent() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('maintenance.newTask')}</h1>
        <p className="text-muted-foreground">
          {t('maintenance.description')}
        </p>
      </div>
      <MaintenanceForm />
    </div>
  )
} 