"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"

interface UtilizationData {
  name: string
  utilization: number
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

        // Fetch mileage data
        const { data: mileageEntries, error: mileageError } = await supabase
          .from('mileage_entries')
          .select('reading, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (mileageError) throw mileageError

        // Calculate utilization for each vehicle
        const utilizationData = vehicles.map(vehicle => {
          // Get vehicle's mileage entries
          const vehicleMileageEntries = mileageEntries
            .filter(entry => entry.vehicle_id === vehicle.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Calculate total distance
          let totalDistance = 0;
          if (vehicleMileageEntries.length >= 2) {
            const firstReading = typeof vehicleMileageEntries[0].reading === 'string' 
              ? parseFloat(vehicleMileageEntries[0].reading) 
              : vehicleMileageEntries[0].reading;
            const lastReading = typeof vehicleMileageEntries[vehicleMileageEntries.length - 1].reading === 'string'
              ? parseFloat(vehicleMileageEntries[vehicleMileageEntries.length - 1].reading)
              : vehicleMileageEntries[vehicleMileageEntries.length - 1].reading;
            totalDistance = lastReading - firstReading;
          }

          return {
            name: vehicle.name,
            utilization: Math.round(totalDistance)
          }
        }).filter(item => item.utilization > 0)
          .sort((a, b) => b.utilization - a.utilization)

        setData(utilizationData)
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
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="utilization"
            label={({ name, utilization }) => `${name} (${utilization} km)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} km`, 'Utilization']}
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