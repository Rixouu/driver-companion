"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"

interface CostData {
  name: string
  value: number
}

interface CostBreakdownChartProps {
  dateRange: DateRange
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6']

const MAINTENANCE_CATEGORIES = {
  'Oil Change': ['Oil Change', 'Oil Service', 'Regular Oil Change', 'Scheduled Oil Change', 'Routine Oil Change'],
  'Brake Service': ['Brake Service', 'Brake System Maintenance', 'Front Brake Service', 'Brake Pad Replacement'],
  'Tire Service': ['Tire Rotation', 'Tire Rotation and Balance', 'Wheel Alignment', 'Wheel Alignment Service'],
  'Air System': ['Air Filter Service', 'Air Filter Replacement', 'Air Conditioning Service', 'AC System Maintenance'],
  'Major Service': ['Transmission Service', 'Transmission Fluid Service', 'Suspension Service', 'Suspension System Service'],
  'General Maintenance': []
}

export function CostBreakdownChart({ dateRange }: CostBreakdownChartProps) {
  const [data, setData] = useState<CostData[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchCostData() {
      try {
        // Fetch maintenance costs
        const { data: maintenanceCosts, error: maintenanceError } = await supabase
          .from('maintenance_tasks')
          .select('cost, title')
          .gte('completed_date', dateRange.from?.toISOString())
          .lte('completed_date', dateRange.to?.toISOString())

        if (maintenanceError) throw maintenanceError

        // Fetch fuel costs
        const { data: fuelCosts, error: fuelError } = await supabase
          .from('fuel_logs')
          .select('cost')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())

        if (fuelError) throw fuelError

        // Calculate total fuel costs
        const totalFuelCost = fuelCosts.reduce((sum, log) => {
          const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost
          return sum + (cost || 0)
        }, 0)

        // Group maintenance costs by category
        const maintenanceCostsByCategory = maintenanceCosts.reduce((acc: { [key: string]: number }, task) => {
          const title = task.title || ''
          const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : task.cost

          // Find matching category
          let category = 'General Maintenance'
          for (const [cat, keywords] of Object.entries(MAINTENANCE_CATEGORIES)) {
            if (keywords.some(keyword => title.toLowerCase().includes(keyword.toLowerCase()))) {
              category = cat
              break
            }
          }

          acc[category] = (acc[category] || 0) + (cost || 0)
          return acc
        }, {})

        // Combine all costs
        const chartData = [
          { name: 'Fuel', value: Math.round(totalFuelCost) },
          ...Object.entries(maintenanceCostsByCategory)
            .filter(([_, cost]) => cost > 0)
            .map(([category, cost]) => ({
              name: category,
              value: Math.round(cost)
            }))
        ].sort((a, b) => b.value - a.value)

        setData(chartData)
      } catch (error) {
        console.error('Error fetching cost data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchCostData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No cost data available for the selected period</p>
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
            label={({ name, value }) => `${name} (${Math.round((value / total) * 100)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 