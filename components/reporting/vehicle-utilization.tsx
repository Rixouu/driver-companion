"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface VehicleUtilizationStats {
  maintenanceCostByVehicle: {
    vehicle_name: string
    total_cost: number
  }[]
  inspectionPassRateByVehicle: {
    vehicle_name: string
    pass_rate: number
  }[]
  vehicleStatusDistribution: {
    status: string
    count: number
  }[]
}

export function VehicleUtilization() {
  const { t } = useI18n()
  const [stats, setStats] = useState<VehicleUtilizationStats>({
    maintenanceCostByVehicle: [],
    inspectionPassRateByVehicle: [],
    vehicleStatusDistribution: []
  })

  useEffect(() => {
    async function fetchStats() {
      // Fetch vehicles with their maintenance tasks
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          name,
          status,
          maintenance_tasks (
            cost
          ),
          inspections (
            inspection_items (
              status
            )
          )
        `)

      if (vehiclesError) {
        console.error('Error fetching vehicle utilization:', vehiclesError)
        return
      }

      // Calculate maintenance cost by vehicle
      const maintenanceCostByVehicle = vehicles.map(vehicle => ({
        vehicle_name: vehicle.name,
        total_cost: vehicle.maintenance_tasks.reduce((sum: number, task: any) => 
          sum + (task.cost || 0), 0)
      })).sort((a, b) => b.total_cost - a.total_cost).slice(0, 5)

      // Calculate inspection pass rate by vehicle
      const inspectionPassRateByVehicle = vehicles.map(vehicle => {
        const allItems = vehicle.inspections.flatMap((inspection: any) => 
          inspection.inspection_items || []
        )
        const totalItems = allItems.length
        const passedItems = allItems.filter((item: any) => item.status === 'pass').length

        return {
          vehicle_name: vehicle.name,
          pass_rate: totalItems > 0 ? (passedItems / totalItems) * 100 : 0
        }
      }).sort((a, b) => b.pass_rate - a.pass_rate).slice(0, 5)

      // Calculate vehicle status distribution
      const statusCounts = vehicles.reduce((acc: { [key: string]: number }, vehicle) => {
        acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
        return acc
      }, {})

      const vehicleStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: t(`vehicles.status.${status}`),
        count
      }))

      setStats({
        maintenanceCostByVehicle,
        inspectionPassRateByVehicle,
        vehicleStatusDistribution
      })
    }

    fetchStats()
  }, [t])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reporting.sections.vehicleUtilization.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">
              {t('reporting.sections.vehicleUtilization.maintenanceCostPerVehicle')}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.maintenanceCostByVehicle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_cost" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">
              {t('reporting.sections.vehicleUtilization.inspectionPassRateByVehicle')}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.inspectionPassRateByVehicle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pass_rate" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] md:col-span-2">
            <h3 className="text-sm font-medium mb-2">
              {t('reporting.sections.vehicleUtilization.vehicleStatus')}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vehicleStatusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6B7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 