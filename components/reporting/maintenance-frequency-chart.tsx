"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

interface MaintenanceData {
  name: string
  scheduled: number
  unscheduled: number
  total: number
}

interface MaintenanceFrequencyChartProps {
  dateRange: DateRange
}

const COLORS = {
  scheduled: '#10B981',
  unscheduled: '#EF4444',
  total: '#6366F1'
}

const SCHEDULED_KEYWORDS = [
  'scheduled',
  'routine',
  'regular',
  'periodic',
  'planned'
]

export function MaintenanceFrequencyChart({ dateRange }: MaintenanceFrequencyChartProps) {
  const [data, setData] = useState<MaintenanceData[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchMaintenanceData() {
      try {
        // Get vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name')

        if (vehiclesError) throw vehiclesError

        // Get maintenance tasks
        const { data: maintenanceTasks, error: maintenanceError } = await supabase
          .from('maintenance_tasks')
          .select('vehicle_id, title, completed_date')
          .gte('completed_date', dateRange.from?.toISOString())
          .lte('completed_date', dateRange.to?.toISOString())

        if (maintenanceError) throw maintenanceError

        // Calculate maintenance frequency for each vehicle
        const maintenanceData = vehicles.map(vehicle => {
          const vehicleTasks = maintenanceTasks.filter(task => task.vehicle_id === vehicle.id)
          
          const scheduled = vehicleTasks.filter(task => 
            SCHEDULED_KEYWORDS.some(keyword => 
              task.title.toLowerCase().includes(keyword)
            )
          ).length

          const total = vehicleTasks.length
          const unscheduled = total - scheduled

          return {
            name: vehicle.name,
            scheduled,
            unscheduled,
            total
          }
        }).filter(v => v.total > 0)
          .sort((a, b) => b.total - a.total)

        setData(maintenanceData)
      } catch (error) {
        console.error('Error fetching maintenance data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchMaintenanceData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No maintenance data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            tickFormatter={(value) => Math.round(value).toString()}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, name === 'total' ? 'Total Tasks' : `${name.charAt(0).toUpperCase() + name.slice(1)} Tasks`]}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="scheduled"
            name="Scheduled"
            fill={COLORS.scheduled}
            stackId="a"
          />
          <Bar 
            dataKey="unscheduled"
            name="Unscheduled"
            fill={COLORS.unscheduled}
            stackId="a"
          />
          <Bar 
            dataKey="total"
            name="Total"
            fill={COLORS.total}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 