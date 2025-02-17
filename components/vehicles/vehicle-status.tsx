"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function VehicleStatus({ vehicleId }: { vehicleId: string }) {

  const status = {
    current: "active",
    lastInspection: new Date("2024-01-15"),
    nextInspection: new Date("2024-04-15"),
    mileage: 50000,
    alerts: [
      {
        id: 1,
        type: "maintenance",
        message: "maintenanceDue",
        priority: "high",
      },
      // ... more alerts
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"vehicles.details.status"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {"vehicles.details.status"}
            </span>
            <Badge>
             {status.current}
            </Badge>
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {"vehicles.details.lastInspection"}
              </p>
              <p className="font-medium">{format(status.lastInspection, "PPP")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {"vehicles.details.nextInspection"}
              </p>
              <p className="font-medium">{format(status.nextInspection, "PPP")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {"vehicles.details.mileage"}
              </p>
              <p className="font-medium">{status.mileage.toLocaleString()} km</p>
            </div>
          </div>

          {status.alerts.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">{"common.alerts"}</p>
              {status.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-2 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                >
                 {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 