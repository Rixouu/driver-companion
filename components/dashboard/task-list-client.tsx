"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Task } from "@/types/tasks"

interface TaskListClientProps {
  tasks: Task[]
}

const priorityColors = {
  low: "bg-blue-500",
  normal: "bg-green-500",
  high: "bg-yellow-500",
  urgent: "bg-red-500",
}

export function TaskListClient({ tasks }: TaskListClientProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No upcoming tasks
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
        >
          <div className="space-y-1">
            <p className="font-medium">{task.title}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {task.vehicle && (
                <span>{task.vehicle.plate_number}</span>
              )}
              {task.due_date && (
                <span>Due: {format(new Date(task.due_date), "PPP")}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                <AvatarFallback>
                  {task.assignee.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
} 