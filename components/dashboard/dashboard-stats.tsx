"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { Activity, Car, Wrench, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function DashboardStats() {
  const { t } = useLanguage()

  const stats = [
    {
      title: "dashboard.metrics.inspectionRate",
      value: "94%",
      icon: Activity,
      change: "+5.2%",
      progress: 94,
      color: "text-blue-500",
    },
    {
      title: "dashboard.metrics.vehicleUtilization",
      value: "87%",
      icon: Car,
      change: "+2.1%",
      progress: 87,
      color: "text-green-500",
    },
    {
      title: "dashboard.metrics.maintenanceCompliance",
      value: "92%",
      icon: Wrench,
      change: "-0.4%",
      progress: 92,
      color: "text-orange-500",
    },
    {
      title: "dashboard.metrics.fleetHealth",
      value: "96%",
      icon: CheckCircle,
      change: "+1.8%",
      progress: 96,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t(stat.title)}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </h3>
                </div>
              </div>
              <span className={`text-sm ${
                stat.change.startsWith("+") ? "text-green-500" : "text-red-500"
              }`}>
                {stat.change}
              </span>
            </div>
            <Progress value={stat.progress} className="mt-4 h-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 