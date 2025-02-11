"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

const MOCK_MAINTENANCE = [
  {
    id: 1,
    vehicle: "Toyota Alphard",
    type: "oil",
    dueDate: "2024-02-15",
    status: "upcoming",
  },
  {
    id: 2,
    vehicle: "Mercedes V-Class",
    type: "tire",
    dueDate: "2024-02-20",
    status: "overdue",
  },
  {
    id: 3,
    vehicle: "BMW 7 Series",
    type: "brake",
    dueDate: "2024-03-01",
    status: "scheduled",
  },
]

export function MaintenanceOverview() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("vehicles.management.maintenance.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {MOCK_MAINTENANCE.length} {t("vehicles.management.maintenance.upcoming")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/maintenance/schedule">
            <Calendar className="mr-2 h-4 w-4" />
            {t("vehicles.management.maintenance.schedule")}
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {MOCK_MAINTENANCE.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="flex items-center space-x-4">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{task.vehicle}</p>
                <p className="text-sm text-muted-foreground">
                  {t(`vehicles.management.maintenance.types.${task.type}`)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  task.status === "overdue"
                    ? "destructive"
                    : task.status === "upcoming"
                    ? "secondary"
                    : "outline"
                }
              >
                {t(`vehicles.management.maintenance.status.${task.status}`)}
              </Badge>
              <Button size="icon" variant="ghost">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 