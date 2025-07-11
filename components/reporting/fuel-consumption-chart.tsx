"use client"

import { useEffect, useState, useMemo } from "react"
// import { supabase } from "@/lib/supabase"; // Ensure this is not used
// import { createBrowserClient } from "@supabase/ssr" // No longer needed for fetching
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
// import { format, parseISO } from "date-fns" // No longer needed for processing if data is pre-formatted
import { FuelChartDataPoint } from "@/app/(dashboard)/reporting/page"; // Import the shared type

// interface FuelData { // Use FuelChartDataPoint instead
//   date: string
//   consumption: number
//   cost: number
// }

interface FuelConsumptionChartProps {
  dateRange?: DateRange | undefined // Keep for potential future client-side filtering, though primary data is from props
  initialData?: FuelChartDataPoint[] // New prop for server-fetched data
}

export function FuelConsumptionChart({ dateRange, initialData }: FuelConsumptionChartProps) {
  const [data, setData] = useState<FuelChartDataPoint[]>(initialData || [])
  const { theme } = useTheme()

  // const supabase = useMemo(() => { // Remove Supabase client instantiation
  //   return createBrowserClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  //   )
  // }, [])

  useEffect(() => {
    // Set data from prop when it changes
    setData(initialData || []);
  }, [initialData]);

  // useEffect(() => { // Remove old data fetching logic
  //   async function fetchFuelData() {
  //     try {
  //       const { data: fuelEntries, error } = await supabase
  //         .from('fuel_entries')
  //         .select('date, fuel_amount, fuel_cost')
  //         .gte('date', dateRange?.from?.toISOString())
  //         .lte('date', dateRange?.to?.toISOString())
  //         .order('date')
  //
  //       if (error) throw error
  //
  //       // Group fuel data by date
  //       const fuelByDate = fuelEntries.reduce((acc: { [key: string]: { liters: number; cost: number } }, entry) => {
  //         const date = format(parseISO(entry.date), 'MMM d')
  //         if (!acc[date]) {
  //           acc[date] = { liters: 0, cost: 0 }
  //         }
  //         const liters = typeof entry.fuel_amount === 'string' ? parseFloat(entry.fuel_amount) : entry.fuel_amount
  //         const cost = typeof entry.fuel_cost === 'string' ? parseFloat(entry.fuel_cost) : entry.fuel_cost
  //         acc[date].liters += liters || 0
  //         acc[date].cost += cost || 0
  //         return acc
  //       }, {})
  //
  //       // Convert to chart data format
  //       const chartData = Object.entries(fuelByDate)
  //         .map(([date, { liters, cost }]) => ({
  //           date,
  //           consumption: Math.round(liters),
  //           cost: Math.round(cost)
  //         }))
  //         .sort((a, b) => a.date.localeCompare(b.date))
  //
  //       setData(chartData)
  //     } catch (error) {
  //       console.error('Error fetching fuel data:', error)
  //       setData([])
  //     }
  //   }
  //
  //   if (dateRange?.from && dateRange?.to) {
  //     fetchFuelData()
  //   }
  // }, [dateRange, supabase])

  if (!data || data.length === 0) { // Check if data is null or empty
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No fuel consumption data available for the selected period</p>
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
            yAxisId="left"
            tickFormatter={(value) => `${value}L`}
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `$${value}`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              name === 'consumption' ? `${value}L` : `$${value}`,
              name === 'consumption' ? 'Consumption' : 'Cost'
            ]}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone"
            dataKey="consumption"
            name="Fuel Consumption"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6' }}
          />
          <Line 
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            name="Fuel Cost"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 