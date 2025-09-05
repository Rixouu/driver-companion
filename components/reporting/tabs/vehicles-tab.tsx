"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Car, 
  Wrench, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  BarChart3,
  Gauge,
  Clock
} from 'lucide-react'
import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface VehiclesTabProps {
  data: any
}

export function VehiclesTab({ data }: VehiclesTabProps) {
  const metrics = data?.metrics || {}
  const vehicleUtilization = data?.vehicleUtilization || []
  const maintenanceTrends = data?.maintenanceTrends || []

  // Calculate vehicle metrics
  const totalVehicles = metrics.totalVehicles || 0
  const activeVehicles = metrics.activeVehicles || 0
  const vehiclesInMaintenance = metrics.vehiclesInMaintenance || 0
  const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Fleet Overview Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Management</h2>
          <p className="text-muted-foreground">
            Comprehensive fleet analysis, utilization metrics, and maintenance insights
          </p>
        </div>
        
        {/* Key Fleet Metrics */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fleet</p>
                  <p className="text-2xl font-bold">{totalVehicles}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                  <p className="text-2xl font-bold text-green-600">{activeVehicles}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600">{vehiclesInMaintenance}</p>
                  <p className="text-xs text-muted-foreground">Servicing</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{utilizationRate}%</p>
                  <p className="text-xs text-muted-foreground">Fleet efficiency</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Gauge className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fleet Utilization Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Fleet Utilization
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor vehicle usage patterns and operational efficiency
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <StatusDistributionChart
            data={vehicleUtilization}
            title="Vehicle Status Distribution"
            description="Breakdown of vehicle availability and status"
            height={350}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fleet Health Overview</CardTitle>
              <CardDescription>Current fleet status and utilization metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Active Vehicles</span>
                    <span className="font-bold">{activeVehicles}</span>
                  </div>
                  <Progress 
                    value={utilizationRate} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Fleet: {totalVehicles}</span>
                    <span>{utilizationRate}% Utilization</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>In Service:</span>
                    <span className="font-medium">{activeVehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance:</span>
                    <span className="font-medium text-orange-600">{vehiclesInMaintenance}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Maintenance Operations Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Maintenance Operations
          </h3>
          <p className="text-sm text-muted-foreground">
            Track maintenance activities, schedules, and vehicle health trends
          </p>
        </div>
        
        <TrendsChart
          data={maintenanceTrends}
          title="Maintenance Activity Trends"
          description="Daily maintenance activities and service patterns"
          height={300}
          color="#f59e0b"
          yAxisFormatter={(value) => `${Math.round(value)}`}
        />
      </div>
    </div>
  )
}
