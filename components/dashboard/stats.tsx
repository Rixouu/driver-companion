"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

export function DashboardStats() {

  const stats = [
    {
      title: "Total Vehicles",
      value: "12",
      icon: Car,
      description: "Active in fleet"
    },
    {
      title: "Completed Inspections",
      value: "24",
      icon: CheckCircle,
      description: "Last 30 days"
    },
    {
      title: "Pending Tasks",
      value: "8",
      icon: AlertTriangle,
      description: "Require attention"
    },
    {
      title: "Upcoming Services",
      value: "5",
      icon: Calendar,
      description: "Next 7 days"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 