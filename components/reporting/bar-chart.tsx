"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "next-themes"
import { Skeleton } from '@/components/ui/skeleton'

interface Vehicle {
  id: string | number
  name: string
}

interface MileageEntry {
  reading: string | number
  vehicle_id: string
  date: string
}

interface FuelEntry {
  fuel_amount: string | number
  fuel_cost: string | number
  vehicle_id: string
}

interface VehiclePerformance {
  name: string
  mileage: number
  fuelEfficiency: number
  cost: number
}

interface BarChartProps {
  vehicleId: string
  dateFrom?: string
  dateTo?: string
}

export function BarChartComponent({ vehicleId, dateFrom, dateTo }: BarChartProps) {
  const [data, setData] = useState<VehiclePerformance[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    async function fetchPerformanceData() {
      if (!vehicleId) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name')
          .eq('id', vehicleId)

        if (vehiclesError) throw vehiclesError

        // Fetch mileage data
        let mileageQuery = supabase
          .from('mileage_entries')
          .select('reading, vehicle_id, date')
          .eq('vehicle_id', vehicleId)
          .order('date')
        
        if (dateFrom) {
          mileageQuery = mileageQuery.gte('date', dateFrom)
        }
        
        if (dateTo) {
          mileageQuery = mileageQuery.lte('date', dateTo)
        }

        const { data: mileageEntries, error: mileageError } = await mileageQuery

        if (mileageError) throw mileageError

        // Fetch fuel data
        let fuelQuery = supabase
          .from('fuel_entries')
          .select('fuel_amount, fuel_cost, vehicle_id')
          .eq('vehicle_id', vehicleId)
        
        if (dateFrom) {
          fuelQuery = fuelQuery.gte('date', dateFrom)
        }
        
        if (dateTo) {
          fuelQuery = fuelQuery.lte('date', dateTo)
        }

        const { data: fuelEntries, error: fuelError } = await fuelQuery

        if (fuelError) throw fuelError

        // Calculate performance metrics for each vehicle
        const performanceData = vehicles.map((vehicle: Vehicle) => {
          // Get vehicle's mileage entries
          const vehicleMileageEntries = mileageEntries
            .filter(entry => String(entry.vehicle_id) === String(vehicle.id))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as MileageEntry[];
          
          // Calculate total distance
          let totalDistance = 0;
          if (vehicleMileageEntries.length >= 2) {
            const firstReading = Number(vehicleMileageEntries[0].reading);
            const lastReading = Number(vehicleMileageEntries[vehicleMileageEntries.length - 1].reading);
            totalDistance = lastReading - firstReading;
          }

          // Calculate fuel metrics
          const vehicleFuel = fuelEntries
            .filter(entry => String(entry.vehicle_id) === String(vehicle.id))
            .reduce((acc, entry) => {
              const liters = Number(entry.fuel_amount) || 0;
              const cost = Number(entry.fuel_cost) || 0;
              return {
                liters: acc.liters + liters,
                cost: acc.cost + cost
              }
            }, { liters: 0, cost: 0 });

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
        setError('Failed to load vehicle performance data')
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPerformanceData()
  }, [vehicleId, dateFrom, dateTo])

  if (isLoading) {
    return (
      <div className="h-[300px]">
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No performance data available for the selected vehicle</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const BarChart = React.memo(BarChartComponent, (prevProps, nextProps) => {
  // Custom comparison function to determine if the component should update
  return (
    prevProps.vehicleId === nextProps.vehicleId &&
    prevProps.dateFrom === nextProps.dateFrom &&
    prevProps.dateTo === nextProps.dateTo
  )
}) 