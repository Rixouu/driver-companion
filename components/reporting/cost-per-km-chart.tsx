"use client"

import { useEffect, useState, useMemo } from "react"
// import { createBrowserClient } from "@supabase/ssr" // No longer needed for fetching
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useTheme } from "next-themes"
import { DateRange } from "react-day-picker"
import { useI18n } from "@/lib/i18n/context"
import { CostPerKmDataPoint } from "@/app/(dashboard)/reporting/page"; // Import shared type

// interface CostData { // Use CostPerKmDataPoint
//   name: string
//   fuelCost: number // These were per km in the original client component state
//   maintenanceCost: number
//   totalCost: number 
//   distance: number // Raw distance was also stored
// }

interface CostPerKmChartProps {
  dateRange: DateRange // Keep for context
  initialData?: CostPerKmDataPoint[] // New prop for server-fetched data
}

const COLORS = {
  fuelCost: '#3B82F6',
  maintenanceCost: '#F59E0B',
  // totalCost: '#8B5CF6' // totalCost was a separate bar in original, now it's stacked
}

// Exchange rate: 1 USD = approximately 150 JPY (as of 2023)
const USD_TO_JPY_RATE = 150;

export function CostPerKmChart({ dateRange, initialData }: CostPerKmChartProps) {
  // The initialData should already contain fuelCostPerKm, maintenanceCostPerKm, totalCostPerKm
  const [data, setData] = useState<CostPerKmDataPoint[]>(initialData || []) 
  const { theme } = useTheme()
  const { t, language } = useI18n()

  // const supabase = useMemo(() => { // Remove Supabase client
  //   return createBrowserClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  //   )
  // }, [])

  useEffect(() => {
    // Process initialData for currency conversion if needed, and set it.
    const processedData = (initialData || []).map(item => {
      const conversionRate = language === 'ja' ? USD_TO_JPY_RATE : 1;
      return {
        ...item,
        fuelCostPerKm: item.fuelCostPerKm * conversionRate,
        maintenanceCostPerKm: item.maintenanceCostPerKm * conversionRate,
        // totalCostPerKm is the sum of the two above, so it will also be converted implicitly if they are.
        // If totalCostPerKm was passed directly and not as sum, it would need conversion too.
        // For stacked bar, we only need fuel and maintenance. totalCostPerKm can be for a tooltip or a different bar.
      };
    }).sort((a,b) => (b.fuelCostPerKm + b.maintenanceCostPerKm) - (a.fuelCostPerKm + a.maintenanceCostPerKm)); // Sort by total cost per km
    setData(processedData);
  }, [initialData, language]);

  // useEffect(() => { // Remove old data fetching and processing logic
  //   async function fetchCostData() {
  //     try {
  //       // Get vehicles
  //       const { data: vehicles, error: vehiclesError } = await supabase
  //         .from('vehicles')
  //         .select('id, name')
  //
  //       if (vehiclesError) throw vehiclesError
  //
  //       // Get fuel logs
  //       const { data: fuelEntries, error: fuelError } = await supabase
  //         .from('fuel_entries')
  //         .select('vehicle_id, fuel_cost, odometer_reading')
  //         .gte('date', dateRange.from?.toISOString())
  //         .lte('date', dateRange.to?.toISOString())
  //
  //       if (fuelError) throw fuelError
  //
  //       // Get mileage entries for distance calculation
  //       const { data: mileageEntries, error: mileageError } = await supabase
  //         .from('mileage_entries')
  //         .select('vehicle_id, reading, date')
  //         .gte('date', dateRange.from?.toISOString())
  //         .lte('date', dateRange.to?.toISOString())
  //         .order('date')
  //
  //       if (mileageError) throw mileageError
  //
  //       // Get maintenance costs
  //       const { data: maintenanceLogs, error: maintenanceError } = await supabase
  //         .from('maintenance_tasks')
  //         .select('vehicle_id, cost')
  //         .gte('completed_date', dateRange.from?.toISOString())
  //         .lte('completed_date', dateRange.to?.toISOString())
  //
  //       if (maintenanceError) throw maintenanceError
  //
  //       // Calculate costs per vehicle
  //       const costData = vehicles.map(vehicle => {
  //         // Calculate fuel costs
  //         const vehicleFuelEntries = fuelEntries.filter(entry => entry.vehicle_id === vehicle.id)
  //         const fuelCost = vehicleFuelEntries.reduce((sum, entry) => {
  //           const cost = typeof entry.fuel_cost === 'string' ? parseFloat(entry.fuel_cost) : entry.fuel_cost
  //           return sum + (cost || 0)
  //         }, 0)
  //
  //         // Calculate total distance from mileage entries
  //         let distance = 0;
  //         const vehicleMileageEntries = mileageEntries
  //           .filter(entry => entry.vehicle_id === vehicle.id)
  //           .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  //         
  //         if (vehicleMileageEntries.length >= 2) {
  //           const firstReading = vehicleMileageEntries[0].reading;
  //           const lastReading = vehicleMileageEntries[vehicleMileageEntries.length - 1].reading;
  //           distance = lastReading - firstReading;
  //         }
  //
  //         // If no mileage entries, try to use odometer readings from fuel entries
  //         if (distance <= 0) {
  //           const vehicleFuelEntriesWithOdometer = vehicleFuelEntries
  //             .filter(entry => entry.odometer_reading)
  //             .sort((a, b) => a.odometer_reading - b.odometer_reading);
  //           
  //           if (vehicleFuelEntriesWithOdometer.length >= 2) {
  //             const firstReading = vehicleFuelEntriesWithOdometer[0].odometer_reading;
  //             const lastReading = vehicleFuelEntriesWithOdometer[vehicleFuelEntriesWithOdometer.length - 1].odometer_reading;
  //             distance = lastReading - firstReading;
  //           }
  //         }
  //
  //         // Calculate maintenance costs
  //         const maintenanceCost = maintenanceLogs
  //           .filter(log => log.vehicle_id === vehicle.id)
  //           .reduce((sum, log) => {
  //             const cost = typeof log.cost === 'string' ? parseFloat(log.cost) : log.cost
  //             return sum + (cost || 0)
  //           }, 0)
  //
  //         const totalCost = fuelCost + maintenanceCost
  //
  //         // Calculate cost per km
  //         const fuelCostPerKm = distance > 0 ? Math.round((fuelCost / distance) * 100) / 100 : 0
  //         const maintenanceCostPerKm = distance > 0 ? Math.round((maintenanceCost / distance) * 100) / 100 : 0
  //         const totalCostPerKm = distance > 0 ? Math.round((totalCost / distance) * 100) / 100 : 0
  //
  //         // Convert to JPY if language is Japanese
  //         const conversionRate = language === 'ja' ? USD_TO_JPY_RATE : 1;
  //         
  //         return {
  //           name: vehicle.name,
  //           fuelCost: fuelCostPerKm * conversionRate,
  //           maintenanceCost: maintenanceCostPerKm * conversionRate,
  //           totalCost: totalCostPerKm * conversionRate,
  //           distance
  //         }
  //       }).filter(v => v.distance > 0) // Ensure distance is positive to avoid division by zero or meaningless data
  //         .sort((a, b) => b.totalCost - a.totalCost) // Sort by total cost descending
  //
  //       setData(costData)
  //     } catch (error) {
  //       console.error('Error fetching cost data:', error)
  //       setData([])
  //     }
  //   }
  //
  //   if (dateRange.from && dateRange.to) {
  //     fetchCostData()
  //   }
  // }, [dateRange, language, supabase])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">{t('reporting.noData')}</p>
      </div>
    )
  }

  // Get the currency symbol and unit based on language
  const currencySymbol = language === 'ja' ? '¥' : '$';
  const distanceUnit = 'km';

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
            tickFormatter={(value) => `${currencySymbol}${value}/${distanceUnit}`}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${currencySymbol}${value}/${distanceUnit}`, t('reporting.sections.vehiclePerformance.costPerKm')]}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="fuelCostPerKm" // Changed from fuelCost
            name={`${t('reporting.sections.vehiclePerformance.fuel')} ${t('reporting.sections.vehiclePerformance.costPerKm')}`}
            fill={COLORS.fuelCost}
            stackId="a"
          />
          <Bar 
            dataKey="maintenanceCostPerKm" // Changed from maintenanceCost
            name={`${t('reporting.sections.vehiclePerformance.maintenance')} ${t('reporting.sections.vehiclePerformance.costPerKm')}`}
            fill={COLORS.maintenanceCost}
            stackId="a"
          />
          {/* <Bar 
            dataKey="totalCostPerKm" // Changed from totalCost. If showing total as separate bar.
            name={`${t('common.total')} ${t('reporting.sections.vehiclePerformance.costPerKm')}`}
            fill={COLORS.totalCost} // Would need COLORS.totalCost defined
          /> */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 