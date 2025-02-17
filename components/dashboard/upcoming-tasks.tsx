import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUpcomingTasks } from "@/lib/api/tasks"
import { TaskListClient } from "./task-list-client"

export async function UpcomingTasks() {
  const tasks = await getUpcomingTasks()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <TaskListClient tasks={tasks} />
      </CardContent>
    </Card>
  )
} 