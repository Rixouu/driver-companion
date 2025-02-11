"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle } from "lucide-react"
import type { Vehicle, DailyInspection } from "@/types"

export function DriverDashboard({
  assignedVehicles,
}: {
  assignedVehicles: Vehicle[]
}) {
  const [inspections, setInspections] = useState<DailyInspection[]>([])
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Today's Inspections</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignedVehicles.map((vehicle) => {
          const inspection = inspections.find((i) => i.vehicleId === vehicle.id && i.date === today)

          return (
            <Card key={vehicle.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{vehicle.name}</CardTitle>
                <Badge variant={inspection?.status === "completed" ? "default" : "secondary"}>
                  {inspection?.status === "completed" ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <Clock className="w-4 h-4 mr-1" />
                  )}
                  {inspection?.status === "completed" ? "Completed" : "Pending"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {inspection?.completedAt
                      ? `Completed at ${new Date(inspection.completedAt).toLocaleTimeString()}`
                      : "Not inspected yet"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={inspection?.status === "completed"}
                    onClick={() => {
                      /* Add navigation to inspection */
                    }}
                  >
                    Start Inspection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

