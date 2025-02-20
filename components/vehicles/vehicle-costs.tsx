"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"

interface VehicleCostsProps {
  vehicle: DbVehicle
}

export function VehicleCosts({ vehicle }: VehicleCostsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Fuel Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No fuel costs recorded.</p>
      </CardContent>
    </Card>
  )
} 