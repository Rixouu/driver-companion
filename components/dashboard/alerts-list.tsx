"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle } from "lucide-react"

export function AlertsList() {
  const { t } = useLanguage()

  const alerts = [
    {
      id: 1,
      message: "dashboard.alerts.types.inspection",
      priority: "high",
      count: 1,
    },
    {
      id: 2,
      message: "dashboard.alerts.types.maintenance",
      priority: "medium",
      count: 2,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.alerts.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-muted/50"
            >
              {alert.priority === "high" ? (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {t(alert.message, { count: alert.count })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`dashboard.priority.${alert.priority}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 