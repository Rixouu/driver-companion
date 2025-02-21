"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"

export function MaintenanceHistory({ vehicleId }: { vehicleId: string }) {

  const maintenanceHistory = [
    {
      id: 1,
      type: "oilChange",
      date: new Date("2024-01-15"),
      cost: 150.00,
      performedBy: "Service Center A",
      status: "completed",
      serviceCenter: "Service Center A"
    },
    // ... more history items
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"vehicles.details.maintenance.history.title"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h3>{"vehicles.details.maintenance.history.title"}</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <Label>{"vehicles.details.maintenance.types.inspection"}</Label>
                <p>2023-05-10</p>
              </div>
              <Badge>{"status.completed"}</Badge>
            </div>
            <div className="flex justify-between">
              <div>
                <Label>{"vehicles.details.maintenance.types.oilChange"}</Label>
                <p>2023-04-15</p>
              </div>
              <Badge>{"status.completed"}</Badge>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {maintenanceHistory.map((record) => (
            <div key={record.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">
                    {record.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {"vehicles.details.maintenance.history.serviceCenter"}: {record.serviceCenter}
                  </p>
                </div>
                <Badge>
                  {record.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                <p>
                  {"vehicles.details.maintenance.history.serviceDate"}: {format(record.date, "PPP")}
                </p>
                <p>
                  {"vehicles.details.maintenance.history.performedBy"}: {record.performedBy}
                </p>
                <p>
                  {"vehicles.details.maintenance.costs.amount"}: ${record.cost}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 