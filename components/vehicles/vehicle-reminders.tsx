"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DbVehicle } from "@/types"
import { Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface VehicleRemindersProps {
  vehicle: DbVehicle
}

export function VehicleReminders({ vehicle }: VehicleRemindersProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('vehicles.tabs.reminders')}</CardTitle>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('vehicles.tabs.addReminder')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('vehicles.tabs.noReminders')}
        </p>
      </CardContent>
    </Card>
  )
} 