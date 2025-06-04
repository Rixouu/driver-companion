"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { MaintenanceCharts } from "./maintenance-charts"
import type { Database } from "@/types/supabase"
import { DatabaseError } from "@/lib/errors/app-error"

// Define types directly used by this server component or passed to client component
interface MaintenanceTaskForStats extends Pick<Database['public']['Tables']['maintenance_tasks']['Row'], 'status' | 'priority' | 'due_date' | 'created_at' | 'completed_date' | 'cost'> {}

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

async function fetchMaintenanceStats(): Promise<MaintenanceStats> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('status, priority, due_date, created_at, completed_date, cost')

  if (error) {
    console.error('Error fetching maintenance stats:', error)
    throw new DatabaseError('Failed to fetch maintenance statistics', error.stack)
  }
  
  const tasks: MaintenanceTaskForStats[] = data || []
  const now = new Date()

  const stats: MaintenanceStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    averageCompletionTime: 0,
    upcomingTasks: tasks.filter(t => t.due_date && new Date(t.due_date) > now).length,
    tasksByPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
    tasksByStatus: {
      scheduled: tasks.filter(t => t.status === 'scheduled').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    },
    costsByMonth: [],
  }

  const completedTasksWithTimes = tasks.filter(
    t => t.status === 'completed' && t.created_at && t.completed_date
  )

  if (completedTasksWithTimes.length > 0) {
    const totalTimeMs = completedTasksWithTimes.reduce((acc, task) => {
      const start = new Date(task.created_at!).getTime()
      const end = new Date(task.completed_date!).getTime()
      return acc + (end - start)
    }, 0)
    stats.averageCompletionTime = totalTimeMs / (completedTasksWithTimes.length * 24 * 60 * 60 * 1000)
  }

  const costsByMonthMap = new Map<string, number>()
  tasks.forEach(task => {
    if (task.cost && task.created_at) {
      const date = new Date(task.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      costsByMonthMap.set(monthKey, (costsByMonthMap.get(monthKey) || 0) + task.cost)
    }
  })

  stats.costsByMonth = Array.from(costsByMonthMap.entries())
    .map(([month, cost]) => ({ month, cost }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6) // Take the last 6 months for the chart

  return stats
}

export async function MaintenanceMetrics() {
  const { t } = await getDictionary()
  let stats: MaintenanceStats
  let fetchError = false

  try {
    stats = await fetchMaintenanceStats()
  } catch (error) {
    console.error("[MaintenanceMetrics] Error fetching stats:", error)
    stats = {
      totalTasks: 0,
      completedTasks: 0,
      averageCompletionTime: 0,
      upcomingTasks: 0,
      tasksByPriority: { high: 0, medium: 0, low: 0 },
      tasksByStatus: { scheduled: 0, in_progress: 0, completed: 0 },
      costsByMonth: [],
    }
    fetchError = true
  }

  const priorityData = [
    { name: t('maintenance.priority.high'), value: stats.tasksByPriority.high },
    { name: t('maintenance.priority.medium'), value: stats.tasksByPriority.medium },
    { name: t('maintenance.priority.low'), value: stats.tasksByPriority.low },
  ]

  const statusData = [
    { name: t('maintenance.status.scheduled'), value: stats.tasksByStatus.scheduled },
    { name: t('maintenance.status.in_progress'), value: stats.tasksByStatus.in_progress },
    { name: t('maintenance.status.completed'), value: stats.tasksByStatus.completed },
  ]
  
  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.sections.maintenanceMetrics.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{t('errors.dataLoadingError') || 'Could not load maintenance metrics data.'}</p>
        </CardContent>
      </Card>
    )
  }

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
                {stats.averageCompletionTime.toFixed(1)} {stats.averageCompletionTime > 0 ? t('units.days') : ''}
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
        <MaintenanceCharts 
          priorityData={priorityData} 
          statusData={statusData} 
          costsByMonthData={stats.costsByMonth}
          tasksByPriorityTitle={t('reporting.sections.maintenanceMetrics.tasksByPriority')}
          tasksByStatusTitle={t('reporting.sections.maintenanceMetrics.tasksByStatus')}
          costOverTimeTitle={t('reporting.sections.maintenanceMetrics.costOverTime')}
        />
      </CardContent>
    </Card>
  )
} 