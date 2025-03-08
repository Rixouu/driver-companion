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
        const { data: mileageEntries, error: mileageError } = await supabase
          .from('mileage_entries')
          .select('reading, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (mileageError) throw mileageError

        // Fetch fuel data
        const { data: fuelEntries, error: fuelError } = await supabase
          .from('fuel_entries')
          .select('fuel_amount, fuel_cost, vehicle_id')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())

        if (fuelError) throw fuelError

        // Calculate performance metrics for each vehicle
        const performanceData = vehicles.map(vehicle => {
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

          // Calculate fuel metrics
          const vehicleFuel = fuelEntries
            .filter(entry => entry.vehicle_id === vehicle.id)
            .reduce((acc, entry) => {
              const liters = typeof entry.fuel_amount === 'string' ? parseFloat(entry.fuel_amount) : entry.fuel_amount
              const cost = typeof entry.fuel_cost === 'string' ? parseFloat(entry.fuel_cost) : entry.fuel_cost
              return {
                liters: acc.liters + (liters || 0),
                cost: acc.cost + (cost || 0)
              }
            }, { liters: 0, cost: 0 })

          return {
            name: vehicle.name,
            mileage: Math.round(totalDistance),
            fuelEfficiency: vehicleFuel.liters > 0 ? Math.round(totalDistance / vehicleFuel.liters * 100) / 100 : 0,
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