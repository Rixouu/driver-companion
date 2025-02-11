"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

export function UpcomingTasks() {
  const { t } = useLanguage()

  const tasks = [
    {
      id: 1,
      type: "inspection",
      date: "2024-02-15",
      time: "09:00",
      priority: "high",
    },
    {
      id: 2,
      type: "maintenance",
      date: "2024-02-20",
      time: "14:30",
      priority: "medium",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.upcomingTasks")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-4 p-4 rounded-lg border"
            >
              {task.type === "inspection" ? (
                <Calendar className="h-5 w-5 text-primary" />
              ) : (
                <Clock className="h-5 w-5 text-primary" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {t(`dashboard.tasks.${task.type}`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.tasks.time", { 
                    date: task.date,
                    time: task.time,
                  })}
                </p>
              </div>
              <Badge
                variant={task.priority === "high" ? "destructive" : "secondary"}
              >
                {t(`dashboard.priority.${task.priority}`)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 