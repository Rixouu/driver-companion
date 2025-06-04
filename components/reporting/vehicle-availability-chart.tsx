"use client"

import { useEffect, useState, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { differenceInDays } from "date-fns"

interface AvailabilityDataPoint {
  name: string
  available: number
  maintenance: number
  availability: number
}

interface VehicleAvailabilityChartProps {
  dateRange: DateRange
  initialData?: AvailabilityDataPoint[]
}

const COLORS = {
  available: '#10B981',
  maintenance: '#EF4444',
  availability: '#6366F1'
}

export function VehicleAvailabilityChart({ dateRange, initialData }: VehicleAvailabilityChartProps) {
  const [data, setData] = useState<AvailabilityDataPoint[]>(initialData || [])
  const { theme } = useTheme()
  const supabase = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    async function fetchAvailabilityData() {
      try {
        if (!dateRange.from || !dateRange.to) return

        // Get vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name')

        if (vehiclesError) throw vehiclesError

        // Get maintenance periods
        const { data: maintenanceTasks, error: maintenanceError } = await supabase
          .from('maintenance_tasks')
          .select('vehicle_id, completed_date, title')
          .gte('completed_date', dateRange.from.toISOString())
          .lte('completed_date', dateRange.to.toISOString())

        if (maintenanceError) throw maintenanceError

        const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1

        // Calculate availability for each vehicle
        const availabilityData = vehicles.map(vehicle => {
          const vehicleTasks = maintenanceTasks.filter(task => task.vehicle_id === vehicle.id)
          
          // Estimate maintenance days (assume 1 day per task unless it's a major service)
          const maintenanceDays = vehicleTasks.reduce((total, task) => {
            const isMajorService = task.title.toLowerCase().includes('major') || 
                                 task.title.toLowerCase().includes('overhaul')
            return total + (isMajorService ? 3 : 1) // 3 days for major service, 1 for regular
          }, 0)

          const availableDays = totalDays - maintenanceDays
          const availabilityPercentage = (availableDays / totalDays) * 100

          return {
            name: vehicle.name || `Vehicle ${vehicle.id}`,
            available: availableDays,
            maintenance: maintenanceDays,
            availability: Math.round(availabilityPercentage * 10) / 10
          }
        }).sort((a, b) => b.availability - a.availability)

        setData(availabilityData)
      } catch (error) {
        console.error('Error fetching availability data:', error)
        setData([])
      }
    }

    if (!initialData || (initialData && initialData.length === 0)) {
      if (dateRange.from && dateRange.to) {
        fetchAvailabilityData()
      }
    } else if (initialData && initialData.length > 0) {
      if (dateRange.from && dateRange.to) {
        fetchAvailabilityData()
      }
    }
  }, [dateRange, supabase, initialData])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No availability data for the selected period</p>
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
            tickFormatter={(value) => `${value} days`}
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              switch (name) {
                case 'available':
                  return [`${value} days`, 'Available Days']
                case 'maintenance':
                  return [`${value} days`, 'Maintenance Days']
                case 'availability':
                  return [`${value}%`, 'Availability']
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
            dataKey="available"
            name="Available Days"
            fill={COLORS.available}
            stackId="a"
          />
          <Bar 
            yAxisId="left"
            dataKey="maintenance"
            name="Maintenance Days"
            fill={COLORS.maintenance}
            stackId="a"
          />
          <Bar 
            yAxisId="right"
            dataKey="availability"
            name="Availability %"
            fill={COLORS.availability}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 