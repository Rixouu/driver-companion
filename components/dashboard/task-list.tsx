"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

const MOCK_TASKS = [
  {
    id: "1",
    title: "Monthly Inspection",
    vehicle: "Toyota Camry",
    dueDate: "2024-03-15",
    status: "pending"
  },
  {
    id: "2",
    title: "Oil Change",
    vehicle: "Honda Civic",
    dueDate: "2024-03-18",
    status: "overdue"
  },
  // Add more mock tasks as needed
]

export function TaskList() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_TASKS.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">
                  {task.vehicle} • Due {formatDate(task.dueDate)}
                </p>
              </div>
              <Badge variant={task.status === "overdue" ? "destructive" : "secondary"}>
                {task.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 