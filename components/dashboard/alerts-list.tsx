"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

const MOCK_ALERTS = [
  {
    id: 1,
    title: "Vehicle Inspection Due",
    vehicle: "Toyota Camry",
    date: "2024-02-15",
    type: "inspection",
    status: "pending",
  },
  // ... other alerts
]

export function AlertsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm text-muted-foreground">
                  {alert.vehicle} • {formatDate(alert.date)}
                </p>
              </div>
              <Badge
                variant={
                  alert.status === "completed"
                    ? "success"
                    : alert.status === "in_progress"
                    ? "warning"
                    : "secondary"
                }
              >
                {alert.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 