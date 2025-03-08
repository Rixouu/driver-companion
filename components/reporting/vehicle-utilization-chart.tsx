"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"

interface UtilizationData {
  name: string
  value: number
}

interface VehicleUtilizationChartProps {
  dateRange: DateRange
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

export function VehicleUtilizationChart({ dateRange }: VehicleUtilizationChartProps) {
  const [data, setData] = useState<UtilizationData[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchUtilizationData() {
      try {
        // Get vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name')

        if (vehiclesError) throw vehiclesError

        // Get mileage logs
        const { data: mileageLogs, error: mileageError } = await supabase
          .from('mileage_logs')
          .select('reading, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (mileageError) throw mileageError

        // Calculate distance traveled per vehicle
        const vehicleDistances: { [key: string]: { id: string; name: string; distance: number } } = {}
        
        vehicles.forEach(vehicle => {
          vehicleDistances[vehicle.id] = {
            id: vehicle.id,
            name: vehicle.name,
            distance: 0
          }
        })

        // Group logs by vehicle and calculate distances
        mileageLogs.forEach(log => {
          const vehicleId = log.vehicle_id
          if (!vehicleDistances[vehicleId]) return

          const reading = typeof log.reading === 'string' ? parseFloat(log.reading) : log.reading
          if (vehicleDistances[vehicleId].distance === 0) {
            vehicleDistances[vehicleId].distance = reading
          } else {
            const distance = reading - vehicleDistances[vehicleId].distance
            if (distance > 0) {
              vehicleDistances[vehicleId].distance = reading
            }
          }
        })

        // Calculate total distance and percentages
        const totalDistance = Object.values(vehicleDistances).reduce((sum, v) => sum + v.distance, 0)
        
        // Create chart data with percentages
        const chartData = Object.values(vehicleDistances)
          .map(vehicle => ({
            name: vehicle.name,
            value: totalDistance > 0 ? Math.round((vehicle.distance / totalDistance) * 100) : 0
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value)

        setData(chartData)
      } catch (error) {
        console.error('Error fetching utilization data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchUtilizationData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No utilization data available for the selected period</p>
      </div>
    )
  }

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
            label={({ name, value }) => `${name} (${value}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Utilization']}
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