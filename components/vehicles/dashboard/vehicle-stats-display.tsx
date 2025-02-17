"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VehicleStats } from "@/types/vehicles"

interface VehicleStatsDisplayProps {
  stats: VehicleStats
}

export function VehicleStatsDisplay({ stats }: VehicleStatsDisplayProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Mileage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalMileage.toLocaleString()} km</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.avgFuelEfficiency.toFixed(2)} km/L</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${stats.totalMaintenanceCost.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Service</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.nextServiceDue}</p>
        </CardContent>
      </Card>
    </div>
  )
} 