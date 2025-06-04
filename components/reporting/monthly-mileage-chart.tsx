"use client"

import { useEffect, useState } from "react"
// import { supabase } from "@/lib/supabase"; // Remove direct supabase import
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
// import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"; // Not needed if data is pre-processed
import { useI18n } from "@/lib/i18n/context"
import { MonthlyMileageDataPoint } from "@/app/(dashboard)/reporting/page"; // Import shared type

// interface MileageData { // Use MonthlyMileageDataPoint
//   date: string
//   mileage: number
// }

interface MonthlyMileageChartProps {
  dateRange: DateRange // Keep for context, though data comes from prop
  initialData?: MonthlyMileageDataPoint[] // New prop for server-fetched data
}

export function MonthlyMileageChart({ dateRange, initialData }: MonthlyMileageChartProps) {
  const [data, setData] = useState<MonthlyMileageDataPoint[]>(initialData || [])
  const { theme } = useTheme()
  const { t } = useI18n()

  useEffect(() => {
    // Set data from prop when it changes
    setData(initialData || []);
  }, [initialData]);

  // useEffect(() => { // Remove old data fetching and processing logic
  //   async function fetchMileageData() {
  //     try {
  //       if (!dateRange.from || !dateRange.to) return;
  //
  //       // Get all vehicles
  //       const { data: vehicles, error: vehiclesError } = await supabase
  //         .from('vehicles')
  //         .select('id, name')
  //         .eq('status', 'active');
  //
  //       if (vehiclesError) throw vehiclesError;
  //
  //       // Get mileage entries for each vehicle
  //       const { data: mileageEntries, error } = await supabase
  //         .from('mileage_entries') // This was 'mileage_entries'
  //         .select('date, reading, vehicle_id')
  //         .gte('date', dateRange.from.toISOString())
  //         .lte('date', dateRange.to.toISOString())
  //         .order('date');
  //
  //       if (error) throw error;
  //
  //       // Create an array of all months in the date range
  //       const months = eachMonthOfInterval({
  //         start: dateRange.from,
  //         end: dateRange.to
  //       });
  //
  //       // Initialize monthly mileage data with zero values
  //       const monthlyMileage: { [key: string]: number } = {};
  //       months.forEach(month => {
  //         const monthKey = format(month, 'MMM yyyy');
  //         monthlyMileage[monthKey] = 0;
  //       });
  //
  //       // Group entries by vehicle
  //       const entriesByVehicle: { [key: string]: any[] } = {};
  //       mileageEntries.forEach(entry => {
  //         if (!entriesByVehicle[entry.vehicle_id]) {
  //           entriesByVehicle[entry.vehicle_id] = [];
  //         }
  //         entriesByVehicle[entry.vehicle_id].push({
  //           ...entry,
  //           reading: typeof entry.reading === 'string' ? parseFloat(entry.reading) : entry.reading,
  //           date: new Date(entry.date)
  //         });
  //       });
  //
  //       // Calculate monthly distance for each vehicle
  //       Object.values(entriesByVehicle).forEach(vehicleEntries => {
  //         // Sort entries by date
  //         vehicleEntries.sort((a, b) => a.date.getTime() - b.date.getTime());
  //
  //         // Process entries to calculate monthly distances
  //         for (let i = 1; i < vehicleEntries.length; i++) {
  //           const prevEntry = vehicleEntries[i - 1];
  //           const currEntry = vehicleEntries[i];
  //           
  //           // Skip if readings are invalid or if current reading is less than previous
  //           if (currEntry.reading <= prevEntry.reading) continue;
  //           
  //           const distance = currEntry.reading - prevEntry.reading;
  //           
  //           // Only count reasonable distances (avoid outliers)
  //           if (distance > 0 && distance < 10000) {
  //             // Determine which month to attribute the mileage to
  //             const monthKey = format(currEntry.date, 'MMM yyyy');
  //             monthlyMileage[monthKey] = (monthlyMileage[monthKey] || 0) + distance;
  //           }
  //         }
  //       });
  //
  //       // Convert to chart data format
  //       const chartData = Object.entries(monthlyMileage)
  //         .map(([date, mileage]) => ({
  //           date,
  //           mileage: Math.round(mileage)
  //         }))
  //         .sort((a, b) => {
  //           // Sort by date (MMM yyyy format)
  //           const dateA = new Date(a.date);
  //           const dateB = new Date(b.date);
  //           return dateA.getTime() - dateB.getTime();
  //         });
  //
  //       setData(chartData);
  //     } catch (error) {
  //       console.error('Error fetching mileage data:', error);
  //       setData([]);
  //     }
  //   }
  //
  //   if (dateRange.from && dateRange.to) {
  //     fetchMileageData();
  //   }
  // }, [dateRange]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">{t('reporting.noData')}</p>
      </div>
    );
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
            formatter={(value: number) => [`${value.toLocaleString()} km`, t('reporting.sections.monthlyMileage.title')]}
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
            name={t('reporting.sections.monthlyMileage.title')}
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 