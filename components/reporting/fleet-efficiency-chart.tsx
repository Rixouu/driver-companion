"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

interface VehicleEfficiency {
  name: string
  efficiency: number
  utilization: number
  costPerKm: number
}

interface FleetEfficiencyChartProps {
  dateRange: DateRange
}

const COLORS = {
  efficiency: '#3B82F6',
  utilization: '#10B981',
  costPerKm: '#8B5CF6'
}

export function FleetEfficiencyChart({ dateRange }: FleetEfficiencyChartProps) {
  const [data, setData] = useState<VehicleEfficiency[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchFleetData() {
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

        // Get fuel logs
        const { data: fuelLogs, error: fuelError } = await supabase
          .from('fuel_logs')
          .select('liters, cost, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())

        if (fuelError) throw fuelError

        // Calculate metrics for each vehicle
        const fleetData = vehicles.map(vehicle => {
          // Get vehicle's mileage logs
          const vehicleMileageLogs = mileageLogs.filter(log => log.vehicle_id === vehicle.id)
          
          // Calculate total distance
          let totalDistance = 0
          if (vehicleMileageLogs.length >= 2) {
            const firstReading = vehicleMileageLogs[0].reading
            const lastReading = vehicleMileageLogs[vehicleMileageLogs.length - 1].reading
            totalDistance = lastReading - firstReading
          }

          // Get vehicle's fuel logs
          const vehicleFuelLogs = fuelLogs.filter(log => log.vehicle_id === vehicle.id)
          
          // Calculate total fuel and cost
          const totalFuel = vehicleFuelLogs.reduce((sum, log) => {
            const liters = typeof log.liters === 'string' ? parseFloat(log.liters) : log.liters
            return sum + (liters || 0)
          }, 0)

          const totalCost = vehicleFuelLogs.reduce((sum, log) => {
            const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost
            return sum + (cost || 0)
          }, 0)

          // Calculate metrics
          const efficiency = totalFuel > 0 ? totalDistance / totalFuel : 0
          const utilization = totalDistance > 0 ? (totalDistance / 1000) : 0 // km per 1000
          const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0

          return {
            name: vehicle.name,
            efficiency: Math.round(efficiency * 100) / 100,
            utilization: Math.round(utilization * 100) / 100,
            costPerKm: Math.round(costPerKm * 100) / 100
          }
        }).filter(v => v.efficiency > 0 || v.utilization > 0 || v.costPerKm > 0)
          .sort((a, b) => b.efficiency - a.efficiency)

        setData(fleetData)
      } catch (error) {
        console.error('Error fetching fleet data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchFleetData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No fleet efficiency data available for the selected period</p>
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
            yAxisId="left"
            tickFormatter={(value) => `${value} km/L`}
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `$${value}`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              switch (name) {
                case 'efficiency':
                  return [`${value} km/L`, 'Fuel Efficiency']
                case 'utilization':
                  return [`${value}k km`, 'Distance']
                case 'costPerKm':
                  return [`$${value}`, 'Cost per KM']
                default:
                  return [value, name]
              }
            }}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="efficiency"
            name="Fuel Efficiency"
            fill={COLORS.efficiency}
          />
          <Bar 
            yAxisId="left"
            dataKey="utilization"
            name="Distance (1000s km)"
            fill={COLORS.utilization}
          />
          <Bar 
            yAxisId="right"
            dataKey="costPerKm"
            name="Cost per KM"
            fill={COLORS.costPerKm}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 