"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VehicleStats } from "@/types/vehicles"

interface StatsDisplayProps {
  stats: VehicleStats
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
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
      {/* ... other stat cards ... */}
    </div>
  )
} 