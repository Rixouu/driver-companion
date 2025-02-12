"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MileageAlertsProps {
  vehicleId: string
  currentMileage: number
}

export function MileageAlerts({ vehicleId, currentMileage }: MileageAlertsProps) {
  const { t } = useLanguage()

  const alerts = [
    {
      id: 1,
      type: "oil",
      status: "upcoming",
      message: "vehicles.management.mileage.alerts.upcoming"
    },
    {
      id: 2,
      type: "tire",
      status: "overdue",
      message: "vehicles.management.mileage.alerts.overdue"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.mileage.alerts.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <p>{t("vehicles.management.mileage.alerts.upcomingService")}</p>
            <p className="text-sm text-muted-foreground">
              {t("vehicles.details.maintenance.types.oil")}
            </p>
          </div>
          <div className="p-4 border rounded bg-destructive/10">
            <p>{t("vehicles.management.mileage.alerts.overdueService")}</p>
            <p className="text-sm text-muted-foreground">
              {t("vehicles.details.maintenance.types.tire")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 