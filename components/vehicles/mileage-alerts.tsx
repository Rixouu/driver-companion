"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Bell } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { format, addDays } from "date-fns"

interface MaintenanceAlert {
  id: string
  type: string
  dueAt: number
  currentMileage: number
  status: 'upcoming' | 'due' | 'overdue'
}

interface MileageAlertsProps {
  vehicleId: string
  currentMileage: number
}

export function MileageAlerts({ vehicleId, currentMileage }: MileageAlertsProps) {
  const { t } = useLanguage()

  // TODO: Replace with actual API call
  const alerts: MaintenanceAlert[] = [
    {
      id: "1",
      type: "oil",
      dueAt: 13000,
      currentMileage: currentMileage,
      status: 'upcoming',
    },
    {
      id: "2",
      type: "tire",
      dueAt: 12000,
      currentMileage: currentMileage,
      status: 'overdue',
    },
  ]

  const getAlertVariant = (status: MaintenanceAlert['status']) => {
    switch (status) {
      case 'overdue':
        return 'destructive'
      case 'due':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getAlertIcon = (status: MaintenanceAlert['status']) => {
    switch (status) {
      case 'overdue':
        return AlertCircle
      case 'due':
        return AlertTriangle
      default:
        return Bell
    }
  }

  const getDistanceRemaining = (alert: MaintenanceAlert) => {
    const remaining = alert.dueAt - alert.currentMileage
    return remaining > 0 ? remaining : 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.mileage.alerts.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.status)
          return (
            <Alert key={alert.id} variant={getAlertVariant(alert.status)}>
              <Icon className="h-4 w-4" />
              <AlertTitle>
                {t(`vehicles.management.maintenance.types.${alert.type}`)}
              </AlertTitle>
              <AlertDescription>
                {alert.status === 'overdue' 
                  ? t("vehicles.management.mileage.alerts.overdue", {
                      distance: (alert.currentMileage - alert.dueAt).toLocaleString(),
                    })
                  : t("vehicles.management.mileage.alerts.upcoming", {
                      distance: getDistanceRemaining(alert).toLocaleString(),
                    })
                }
              </AlertDescription>
            </Alert>
          )
        })}
      </CardContent>
    </Card>
  )
} 