"use client"

import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { useI18n } from "@/lib/i18n/context"
import type { MaintenanceTask } from "@/types"

interface EditMaintenancePageContentProps {
  task: MaintenanceTask
}

function transformTaskForForm(task: MaintenanceTask) {
  return {
    ...task,
    // Convert number to string if it exists, otherwise keep as undefined
    cost: task.cost?.toString(),
    // Ensure other fields match expected types
    estimated_duration: task.estimated_duration?.toString(),
  }
}

export function EditMaintenancePageContent({ task }: EditMaintenancePageContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('maintenance.editTask')}</h1>
        <p className="text-muted-foreground">
          {t('maintenance.description')}
        </p>
      </div>
      <MaintenanceForm 
        initialData={transformTaskForForm(task)} 
        mode="edit" 
      />
    </div>
  )
} 