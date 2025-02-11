"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Wrench, FileText, UserCheck } from "lucide-react"
import { format } from "date-fns"

const MOCK_ACTIVITY = [
  {
    id: 1,
    type: "inspection",
    vehicle: "Toyota Alphard",
    user: "John Doe",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: "completed",
  },
  {
    id: 2,
    type: "maintenance",
    vehicle: "Mercedes V-Class",
    user: "Jane Smith",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: "completed",
  },
  {
    id: 3,
    type: "document",
    vehicle: "BMW 7 Series",
    user: "Mike Johnson",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    status: "uploaded",
  },
  {
    id: 4,
    type: "assignment",
    vehicle: "Toyota Hiace",
    user: "Sarah Wilson",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    status: "assigned",
  },
]

export function RecentActivity() {
  const { t } = useLanguage()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "inspection":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "assignment":
        return <UserCheck className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("dashboard.activity.title")}
          </h2>
        </div>
        <Button variant="outline" size="sm">
          {t("dashboard.activity.viewAll")}
        </Button>
      </div>

      <div className="space-y-4">
        {MOCK_ACTIVITY.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="mt-1">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {t(`dashboard.activity.${activity.type}`)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.activity.timeAgo", {
                  time: format(activity.timestamp, "PPp"),
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 