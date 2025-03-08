"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"

interface MaintenanceStats {
  totalTasks: number
  completedTasks: number
  averageCompletionTime: number
  upcomingTasks: number
  tasksByPriority: {
    high: number
    medium: number
    low: number
  }
  tasksByStatus: {
    scheduled: number
    in_progress: number
    completed: number
  }
  costsByMonth: {
    month: string
    cost: number
  }[]
}

export function MaintenanceMetrics() {
  const { t } = useI18n()
  const [stats, setStats] = useState<MaintenanceStats>({
    totalTasks: 0,
    completedTasks: 0,
    averageCompletionTime: 0,
    upcomingTasks: 0,
    tasksByPriority: { high: 0, medium: 0, low: 0 },
    tasksByStatus: { scheduled: 0, in_progress: 0, completed: 0 },
    costsByMonth: []
  })

  useEffect(() => {
    async function fetchStats() {
      // Fetch basic stats
      const { data: tasks, error } = await supabase
        .from('maintenance_tasks')
        .select('*')

      if (error) {
        console.error('Error fetching maintenance stats:', error)
        return
      }

      const now = new Date()
      const stats: MaintenanceStats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        averageCompletionTime: 0,
        upcomingTasks: tasks.filter(t => new Date(t.due_date) > now).length,
        tasksByPriority: {
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length
        },
        tasksByStatus: {
          scheduled: tasks.filter(t => t.status === 'scheduled').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length
        },
        costsByMonth: []
      }

      // Calculate average completion time for completed tasks
      const completedTasks = tasks.filter(t => t.status === 'completed' && t.created_at && t.updated_at)
      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((acc, task) => {
          const start = new Date(task.created_at)
          const end = new Date(task.updated_at)
          return acc + (end.getTime() - start.getTime())
        }, 0)
        stats.averageCompletionTime = totalTime / (completedTasks.length * 24 * 60 * 60 * 1000) // Convert to days
      }

      // Calculate costs by month
      const costsByMonth = new Map<string, number>()
      tasks.forEach(task => {
        if (task.cost) {
          const date = new Date(task.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          costsByMonth.set(monthKey, (costsByMonth.get(monthKey) || 0) + task.cost)
        }
      })

      stats.costsByMonth = Array.from(costsByMonth.entries())
        .map(([month, cost]) => ({ month, cost }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6) // Last 6 months

      setStats(stats)
    }

    fetchStats()
  }, [])

  const priorityData = [
    { name: t('maintenance.priority.high'), value: stats.tasksByPriority.high },
    { name: t('maintenance.priority.medium'), value: stats.tasksByPriority.medium },
    { name: t('maintenance.priority.low'), value: stats.tasksByPriority.low }
  ]

  const statusData = [
    { name: t('maintenance.status.scheduled'), value: stats.tasksByStatus.scheduled },
    { name: t('maintenance.status.in_progress'), value: stats.tasksByStatus.in_progress },
    { name: t('maintenance.status.completed'), value: stats.tasksByStatus.completed }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reporting.sections.maintenanceMetrics.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.maintenanceMetrics.totalTasks')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.maintenanceMetrics.completedTasks')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageCompletionTime.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.maintenanceMetrics.averageCompletionTime')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.upcomingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.maintenanceMetrics.upcomingTasks')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.maintenanceMetrics.tasksByPriority')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.maintenanceMetrics.tasksByStatus')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] md:col-span-2">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.maintenanceMetrics.costOverTime')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.costsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 