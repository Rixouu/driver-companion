"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { startOfMonth, endOfMonth } from "date-fns"
import { DateRange } from "react-day-picker"
import { useI18n } from "@/lib/i18n/context"

// Exchange rate: 1 USD = approximately 150 JPY (as of 2023)
const USD_TO_JPY_RATE = 150;

interface OverviewStats {
  totalDistance: number
  totalFuel: number
  fuelEfficiency: number
  distanceChange: number
  fuelChange: number
  efficiencyChange: number
}

interface OverviewProps {
  dateRange: DateRange
}

export function Overview({ dateRange }: OverviewProps) {
  const { t, language } = useI18n()
  const [stats, setStats] = useState<OverviewStats>({
    totalDistance: 0,
    totalFuel: 0,
    fuelEfficiency: 0,
    distanceChange: 0,
    fuelChange: 0,
    efficiencyChange: 0
  })

  useEffect(() => {
    async function fetchOverviewStats() {
      const currentStart = startOfMonth(dateRange.to || new Date()).toISOString()
      const currentEnd = endOfMonth(dateRange.to || new Date()).toISOString()
      const prevStart = startOfMonth(new Date(dateRange.from || new Date())).toISOString()
      const prevEnd = endOfMonth(dateRange.from || new Date()).toISOString()

      try {
        // Fetch current month data
        const [currentMileage, currentFuel] = await Promise.all([
          supabase
            .from('mileage_entries')
            .select('reading, vehicle_id, date')
            .gte('date', currentStart)
            .lte('date', currentEnd)
            .order('date'),
          supabase
            .from('fuel_entries')
            .select('fuel_amount, date')
            .gte('date', currentStart)
            .lte('date', currentEnd)
        ])

        // Fetch previous month data
        const [prevMileage, prevFuel] = await Promise.all([
          supabase
            .from('mileage_entries')
            .select('reading, vehicle_id, date')
            .gte('date', prevStart)
            .lte('date', prevEnd)
            .order('date'),
          supabase
            .from('fuel_entries')
            .select('fuel_amount, date')
            .gte('date', prevStart)
            .lte('date', prevEnd)
        ])

        if (currentMileage.error) throw currentMileage.error
        if (currentFuel.error) throw currentFuel.error
        if (prevMileage.error) throw prevMileage.error
        if (prevFuel.error) throw prevFuel.error

        // Calculate current month metrics
        const currentDistance = calculateTotalDistance(currentMileage.data || [])
        const currentFuelTotal = calculateTotalFuel(currentFuel.data || [])
        const currentEfficiency = currentFuelTotal > 0 ? currentDistance / currentFuelTotal : 0

        // Calculate previous month metrics
        const prevDistance = calculateTotalDistance(prevMileage.data || [])
        const prevFuelTotal = calculateTotalFuel(prevFuel.data || [])
        const prevEfficiency = prevFuelTotal > 0 ? prevDistance / prevFuelTotal : 0

        // Calculate changes
        const distanceChange = prevDistance > 0 ? ((currentDistance - prevDistance) / prevDistance) * 100 : 0
        const fuelChange = prevFuelTotal > 0 ? ((currentFuelTotal - prevFuelTotal) / prevFuelTotal) * 100 : 0
        const efficiencyChange = prevEfficiency > 0 ? ((currentEfficiency - prevEfficiency) / prevEfficiency) * 100 : 0

        setStats({
          totalDistance: currentDistance,
          totalFuel: currentFuelTotal,
          fuelEfficiency: currentEfficiency,
          distanceChange,
          fuelChange,
          efficiencyChange
        })
      } catch (error) {
        console.error('Error fetching overview stats:', error)
      }
    }

    fetchOverviewStats()
  }, [dateRange])

  // Get the currency symbol based on language
  const currencySymbol = language === 'ja' ? '¥' : '$';

  return (
    <>
      <Card className="h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{t('reporting.sections.vehiclePerformance.distance')}</p>
            <p className="text-xl sm:text-2xl font-bold">{Math.round(stats.totalDistance).toLocaleString()} km</p>
            <p className={`text-xs sm:text-sm ${stats.distanceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.distanceChange >= 0 ? '↑' : '↓'} {Math.abs(stats.distanceChange).toFixed(1)}% {t('reporting.fromPreviousPeriod')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{t('reporting.sections.fuelConsumption.title')}</p>
            <p className="text-xl sm:text-2xl font-bold">{Math.round(stats.totalFuel).toLocaleString()} L</p>
            <p className={`text-xs sm:text-sm ${stats.fuelChange <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.fuelChange <= 0 ? '↓' : '↑'} {Math.abs(stats.fuelChange).toFixed(1)}% {t('reporting.fromPreviousPeriod')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{t('reporting.sections.vehiclePerformance.efficiency')}</p>
            <p className="text-xl sm:text-2xl font-bold">{stats.fuelEfficiency.toFixed(1)} km/L</p>
            <p className={`text-xs sm:text-sm ${stats.efficiencyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.efficiencyChange >= 0 ? '↑' : '↓'} {Math.abs(stats.efficiencyChange).toFixed(1)}% {t('reporting.fromPreviousPeriod')}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function calculateTotalDistance(mileageLogs: any[]) {
  const vehicleReadings = mileageLogs.reduce((acc: { [key: string]: { min: number, max: number } }, log) => {
    const reading = typeof log.reading === 'string' ? parseFloat(log.reading) : log.reading
    if (!acc[log.vehicle_id]) {
      acc[log.vehicle_id] = { min: reading, max: reading }
    } else {
      acc[log.vehicle_id].min = Math.min(acc[log.vehicle_id].min, reading)
      acc[log.vehicle_id].max = Math.max(acc[log.vehicle_id].max, reading)
    }
    return acc
  }, {})

  return Object.values(vehicleReadings).reduce((total, { min, max }) => total + (max - min), 0)
}

function calculateTotalFuel(fuelLogs: any[]) {
  return fuelLogs.reduce((total, log) => {
    const liters = typeof log.fuel_amount === 'string' ? parseFloat(log.fuel_amount) : log.fuel_amount
    return total + (liters || 0)
  }, 0)
} 