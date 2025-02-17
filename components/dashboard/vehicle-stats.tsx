"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, AlertTriangle, CheckCircle } from "lucide-react"

interface VehicleStats {
  total: number
  needsAttention: number
  inspectedToday: number
}

interface VehicleStatsProps {
  stats: VehicleStats
}

export function VehicleStats({ stats }: VehicleStatsProps) {

  const items = [
    {
      title: "dashboard.totalVehicles",
      value: stats.total,
      icon: Car,
    },
    {
      title: "dashboard.requiresAttention",
      value: stats.needsAttention,
      icon: AlertTriangle,
      variant: "warning",
    },
    {
      title: "dashboard.inspectedToday",
      value: stats.inspectedToday,
      icon: CheckCircle,
      variant: "success",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${
              item.variant === "warning" 
                ? "text-yellow-500" 
                : item.variant === "success"
                  ? "text-green-500"
                  : "text-primary"
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 