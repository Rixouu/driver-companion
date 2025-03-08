"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { format, parseISO } from "date-fns"

interface MileageData {
  date: string
  mileage: number
}

interface MonthlyMileageChartProps {
  dateRange: DateRange
}

export function MonthlyMileageChart({ dateRange }: MonthlyMileageChartProps) {
  const [data, setData] = useState<MileageData[]>([])
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchMileageData() {
      try {
        // Get mileage logs for each vehicle
        const { data: mileageLogs, error } = await supabase
          .from('mileage_logs')
          .select('date, reading, vehicle_id')
          .gte('date', dateRange.from?.toISOString())
          .lte('date', dateRange.to?.toISOString())
          .order('date')

        if (error) throw error

        // Group by vehicle and calculate daily mileage
        const vehicleMileage: { [key: string]: { [key: string]: number } } = {}
        
        mileageLogs.forEach(log => {
          const vehicleId = log.vehicle_id
          if (!vehicleMileage[vehicleId]) {
            vehicleMileage[vehicleId] = {}
          }
          const date = format(parseISO(log.date), 'MMM d')
          const reading = typeof log.reading === 'string' ? parseFloat(log.reading) : log.reading
          vehicleMileage[vehicleId][date] = reading
        })

        // Calculate daily distance for each vehicle
        const dailyDistance: { [key: string]: number } = {}
        
        Object.entries(vehicleMileage).forEach(([vehicleId, readings]) => {
          const dates = Object.keys(readings).sort()
          for (let i = 1; i < dates.length; i++) {
            const prevReading = readings[dates[i - 1]]
            const currentReading = readings[dates[i]]
            const distance = currentReading - prevReading
            if (distance > 0) {
              dailyDistance[dates[i]] = (dailyDistance[dates[i]] || 0) + distance
            }
          }
        })

        // Convert to chart data format
        const chartData = Object.entries(dailyDistance)
          .map(([date, mileage]) => ({
            date,
            mileage: Math.round(mileage)
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setData(chartData)
      } catch (error) {
        console.error('Error fetching mileage data:', error)
        setData([])
      }
    }

    if (dateRange.from && dateRange.to) {
      fetchMileageData()
    }
  }, [dateRange])

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No mileage data available for the selected period</p>
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
            tickFormatter={(value) => `${value.toLocaleString()} km`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()} km`, 'Mileage']}
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
            dataKey="mileage"
            name="Monthly Mileage"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 