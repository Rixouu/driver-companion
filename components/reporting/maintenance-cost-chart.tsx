"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

interface MaintenanceData {
  date: string
  cost: number
}

interface MaintenanceCostChartProps {
  dateRange: DateRange
}

export function MaintenanceCostChart({ dateRange }: MaintenanceCostChartProps) {
  const [data, setData] = useState<MaintenanceData[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchMaintenanceData() {
      try {
        const { data: maintenanceLogs, error } = await supabase
          .from('maintenance_tasks')
          .select('completed_date, cost')
          .gte('completed_date', dateRange.from?.toISOString())
          .lte('completed_date', dateRange.to?.toISOString())
          .order('completed_date')

        if (error) throw error

        // Group maintenance costs by date
        const costsByDate = maintenanceLogs.reduce((acc: { [key: string]: number }, log) => {
          const date = format(parseISO(log.completed_date), 'MMM d')
          const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost
          acc[date] = (acc[date] || 0) + (cost || 0)
          return acc
        }, {})

        // Convert to array format for the chart
        const chartData = Object.entries(costsByDate)
          .map(([date, cost]) => ({
            date,
            cost: Math.round(cost)
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setData(chartData)
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
        <p className="text-muted-foreground">No maintenance cost data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Line 
            type="monotone"
            dataKey="cost"
            name="Maintenance Cost"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 