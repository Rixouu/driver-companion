"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"

interface VehicleHistoryProps {
  vehicle: DbVehicle
}

export function VehicleHistory({ vehicle }: VehicleHistoryProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No maintenance history found.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Inspection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No inspection history found.</p>
        </CardContent>
      </Card>
    </div>
  )
} 