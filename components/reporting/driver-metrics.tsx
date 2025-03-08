"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"

interface DriverMetricsStats {
  vehiclePerformance: {
    vehicle_name: string
    inspection_pass_rate: number
    maintenance_completion_rate: number
    active_days: number
  }[]
  maintenanceEfficiency: {
    month: string
    avg_completion_time: number
    tasks_completed: number
  }[]
  vehicleUptime: {
    vehicle_name: string
    uptime_percentage: number
    days_active: number
    days_maintenance: number
  }[]
}

export function DriverMetrics() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DriverMetricsStats>({
    vehiclePerformance: [],
    maintenanceEfficiency: [],
    vehicleUptime: []
  })

  useEffect(() => {
    async function fetchStats() {
      // Fetch vehicles with their maintenance and inspection data
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          name,
          status,
          maintenance_tasks (
            status,
            created_at,
            completed_date
          ),
          inspections (
            status,
            inspection_items (
              status
            )
          )
        `)

      if (vehiclesError) {
        console.error('Error fetching driver metrics:', vehiclesError)
        return
      }

      // Calculate vehicle performance metrics
      const vehiclePerformance = vehicles.map(vehicle => {
        // Calculate inspection pass rate
        const allInspectionItems = vehicle.inspections.flatMap((i: any) => i.inspection_items || [])
        const passRate = allInspectionItems.length > 0
          ? (allInspectionItems.filter((item: any) => item.status === 'pass').length / allInspectionItems.length) * 100
          : 0

        // Calculate maintenance completion rate
        const maintenanceTasks = vehicle.maintenance_tasks || []
        const completionRate = maintenanceTasks.length > 0
          ? (maintenanceTasks.filter((t: any) => t.status === 'completed').length / maintenanceTasks.length) * 100
          : 0

        // Calculate active days (days since first maintenance or inspection)
        const allDates = [
          ...maintenanceTasks.map((t: any) => new Date(t.created_at)),
          ...vehicle.inspections.map((i: any) => new Date(i.created_at))
        ].filter(Boolean)

        const activeDays = allDates.length > 0
          ? Math.ceil((new Date().getTime() - Math.min(...allDates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24))
          : 0

        return {
          vehicle_name: vehicle.name,
          inspection_pass_rate: Math.round(passRate),
          maintenance_completion_rate: Math.round(completionRate),
          active_days: activeDays
        }
      }).sort((a, b) => b.inspection_pass_rate - a.inspection_pass_rate)

      // Calculate maintenance efficiency over time
      const maintenanceByMonth = new Map<string, { total_time: number; count: number }>()
      vehicles.forEach(vehicle => {
        const completedTasks = (vehicle.maintenance_tasks || []).filter((t: any) => 
          t.status === 'completed' && t.created_at && t.completed_date
        )

        completedTasks.forEach((task: any) => {
          const monthKey = new Date(task.created_at).toISOString().slice(0, 7)
          const completionTime = (new Date(task.completed_date).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
          
          const current = maintenanceByMonth.get(monthKey) || { total_time: 0, count: 0 }
          maintenanceByMonth.set(monthKey, {
            total_time: current.total_time + completionTime,
            count: current.count + 1
          })
        })
      })

      const maintenanceEfficiency = Array.from(maintenanceByMonth.entries())
        .map(([month, data]) => ({
          month,
          avg_completion_time: Math.round(data.total_time / data.count),
          tasks_completed: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)

      // Calculate vehicle uptime
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const vehicleUptime = vehicles.map(vehicle => {
        const recentTasks = (vehicle.maintenance_tasks || []).filter((t: any) => 
          new Date(t.created_at) >= thirtyDaysAgo
        )

        const maintenanceDays = recentTasks.reduce((acc: number, task: any) => {
          if (task.completed_date) {
            const days = (new Date(task.completed_date).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
            return acc + days
          }
          return acc
        }, 0)

        const daysActive = 30 - maintenanceDays
        return {
          vehicle_name: vehicle.name,
          uptime_percentage: Math.round((daysActive / 30) * 100),
          days_active: Math.round(daysActive),
          days_maintenance: Math.round(maintenanceDays)
        }
      }).sort((a, b) => b.uptime_percentage - a.uptime_percentage)

      setStats({
        vehiclePerformance,
        maintenanceEfficiency,
        vehicleUptime
      })
    }

    fetchStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver & Fleet Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">Vehicle Performance Score</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vehiclePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inspection_pass_rate" name="Inspection Pass Rate %" fill="#10B981" />
                <Bar dataKey="maintenance_completion_rate" name="Maintenance Completion %" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">Maintenance Efficiency Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.maintenanceEfficiency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avg_completion_time" name="Avg. Completion Time (days)" stroke="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="tasks_completed" name="Tasks Completed" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] md:col-span-2">
            <h3 className="text-sm font-medium mb-2">30-Day Vehicle Uptime</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vehicleUptime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="days_active" name="Days Active" stackId="days" fill="#10B981" />
                <Bar dataKey="days_maintenance" name="Days in Maintenance" stackId="days" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 