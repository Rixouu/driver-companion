"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"

interface VehiclePerformance {
  name: string
  mileage: number
  fuelEfficiency: number
  cost: number
}

interface BarChartProps {
  dateRange: DateRange
}

export function BarChart({ dateRange }: BarChartProps) {
  const [data, setData] = useState<VehiclePerformance[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        // Fetch vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name')

        if (vehiclesError) throw vehiclesError

        // Fetch mileage data
        const { data: mileageLogs, error: mileageError } = await supabase
          .from('mileage_logs')
          .select('reading, vehicle_id')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (mileageError) throw mileageError

        // Fetch fuel data
        const { data: fuelLogs, error: fuelError } = await supabase
          .from('fuel_logs')
          .select('liters, cost, vehicle_id')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())

        if (fuelError) throw fuelError

        // Calculate performance metrics for each vehicle
        const performanceData = vehicles.map(vehicle => {
          const vehicleMileage = mileageLogs
            .filter(log => log.vehicle_id === vehicle.id)
            .reduce((total, log) => {
              const reading = typeof log.reading === 'string' ? parseFloat(log.reading) : log.reading
              return total + reading
            }, 0)

          const vehicleFuel = fuelLogs
            .filter(log => log.vehicle_id === vehicle.id)
            .reduce((acc, log) => {
              const liters = typeof log.liters === 'string' ? parseFloat(log.liters) : log.liters
              const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost
              return {
                liters: acc.liters + (liters || 0),
                cost: acc.cost + (cost || 0)
              }
            }, { liters: 0, cost: 0 })

          return {
            name: vehicle.name,
            mileage: Math.round(vehicleMileage),
            fuelEfficiency: vehicleFuel.liters > 0 ? Math.round(vehicleMileage / vehicleFuel.liters * 100) / 100 : 0,
            cost: Math.round(vehicleFuel.cost)
          }
        })

        setData(performanceData.filter(item => item.mileage > 0))
      } catch (error) {
        console.error('Error fetching performance data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchPerformanceData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No performance data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
          <YAxis yAxisId="left" tick={{ fill: 'currentColor' }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'currentColor' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="mileage" name="Mileage (km)" fill="#3B82F6" />
          <Bar yAxisId="right" dataKey="fuelEfficiency" name="Fuel Efficiency (km/L)" fill="#10B981" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
} 