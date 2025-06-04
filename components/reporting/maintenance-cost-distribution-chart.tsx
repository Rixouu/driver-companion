"use client"

import { useEffect, useState, useMemo } from "react"
// import { supabase } from "@/lib/supabase"; // Ensure this is not used
import { createBrowserClient } from "@supabase/ssr"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"

interface CostDistributionData {
  name: string
  value: number
  count: number
}

interface MaintenanceCostDistributionChartProps {
  dateRange: DateRange
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

const COST_RANGES = [
  { min: 0, max: 100, name: '$0-100' },
  { min: 100, max: 250, name: '$100-250' },
  { min: 250, max: 500, name: '$250-500' },
  { min: 500, max: 750, name: '$500-750' },
  { min: 750, max: 1000, name: '$750-1000' },
  { min: 1000, max: 1500, name: '$1000-1500' },
  { min: 1500, max: 2000, name: '$1500-2000' },
  { min: 2000, max: Infinity, name: '$2000+' }
]

export function MaintenanceCostDistributionChart({ dateRange }: MaintenanceCostDistributionChartProps) {
  const [data, setData] = useState<CostDistributionData[]>([])
  const { theme } = useTheme()

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    async function fetchDistributionData() {
      try {
        // Get maintenance tasks
        const { data: maintenanceTasks, error } = await supabase
          .from('maintenance_tasks')
          .select('cost')
          .gte('completed_date', dateRange.from?.toISOString())
          .lte('completed_date', dateRange.to?.toISOString())

        if (error) throw error

        // Initialize cost ranges
        const costDistribution = COST_RANGES.map(range => ({
          name: range.name,
          value: 0,
          count: 0
        }))

        // Calculate distribution
        maintenanceTasks.forEach(task => {
          const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : task.cost
          if (cost === null || isNaN(cost)) return

          const range = COST_RANGES.find(r => cost >= r.min && cost < r.max)
          if (range) {
            const index = COST_RANGES.indexOf(range)
            costDistribution[index].value += cost
            costDistribution[index].count++
          }
        })

        // Filter out ranges with no tasks and sort by value
        const filteredData = costDistribution
          .filter(item => item.count > 0)
          .sort((a, b) => b.value - a.value)

        setData(filteredData)
      } catch (error) {
        console.error('Error fetching distribution data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchDistributionData()
    }
  }, [dateRange, supabase])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No maintenance cost data available for the selected period</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value, count }) => 
              `${name} (${Math.round((value / total) * 100)}%, ${count} tasks)`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Cost']}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 