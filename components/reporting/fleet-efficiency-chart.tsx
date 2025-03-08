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
        const { data: mileageEntries, error: mileageError } = await supabase
          .from('mileage_entries')
          .select('reading, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (mileageError) throw mileageError

        // Get fuel logs
        const { data: fuelEntries, error: fuelError } = await supabase
          .from('fuel_entries')
          .select('fuel_amount, fuel_cost, vehicle_id, date')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())

        if (fuelError) throw fuelError

        // Calculate metrics for each vehicle
        const fleetData = vehicles.map(vehicle => {
          // Get vehicle's mileage entries
          const vehicleMileageEntries = mileageEntries.filter(entry => entry.vehicle_id === vehicle.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Calculate total distance
          let totalDistance = 0
          if (vehicleMileageEntries.length >= 2) {
            const firstReading = typeof vehicleMileageEntries[0].reading === 'string' 
              ? parseFloat(vehicleMileageEntries[0].reading) 
              : vehicleMileageEntries[0].reading;
            const lastReading = typeof vehicleMileageEntries[vehicleMileageEntries.length - 1].reading === 'string'
              ? parseFloat(vehicleMileageEntries[vehicleMileageEntries.length - 1].reading)
              : vehicleMileageEntries[vehicleMileageEntries.length - 1].reading;
            totalDistance = lastReading - firstReading;
          }

          // Get vehicle's fuel entries
          const vehicleFuelEntries = fuelEntries.filter(entry => entry.vehicle_id === vehicle.id)
          
          // Calculate total fuel and cost
          const totalFuel = vehicleFuelEntries.reduce((sum, entry) => {
            const liters = typeof entry.fuel_amount === 'string' ? parseFloat(entry.fuel_amount) : entry.fuel_amount
            return sum + (liters || 0)
          }, 0)

          const totalCost = vehicleFuelEntries.reduce((sum, entry) => {
            const cost = typeof entry.fuel_cost === 'string' ? parseFloat(entry.fuel_cost) : entry.fuel_cost
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