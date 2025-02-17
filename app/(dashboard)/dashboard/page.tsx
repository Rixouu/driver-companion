import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/stats"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { TaskList } from "@/components/dashboard/task-list"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DashboardPage() {
  return (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Here's an overview of your fleet status and upcoming tasks
          </p>
        </div>      
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<LoadingSpinner />}>
          <AlertsList />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <TaskList />
        </Suspense>
      </div>

    </div>
  )
} 