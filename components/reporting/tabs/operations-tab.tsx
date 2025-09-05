"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  ClipboardCheck, 
  Calendar, 
  User,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react'
import { TrendsChart } from '../charts/trends-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'

interface OperationsTabProps {
  data: any
}

export function OperationsTab({ data }: OperationsTabProps) {
  const metrics = data?.metrics || {}
  const bookingTrends = data?.bookingTrends || []
  const inspectionTrends = data?.inspectionTrends || []
  const driverPerformance = data?.driverPerformance || []
  const maintenanceTrends = data?.maintenanceTrends || []

  // Calculate operational metrics
  const totalInspections = metrics.totalInspections || 0
  const completedInspections = metrics.completedInspections || 0
  const pendingInspections = metrics.pendingInspections || 0
  const failedInspections = metrics.failedInspections || 0
  const totalDrivers = metrics.totalDrivers || 0
  const activeDrivers = metrics.activeDrivers || 0
  const driversOnDuty = metrics.driversOnDuty || 0

  const inspectionSuccessRate = totalInspections > 0 ? Math.round((completedInspections / totalInspections) * 100) : 0
  const driverUtilization = totalDrivers > 0 ? Math.round((driversOnDuty / totalDrivers) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Operations Overview Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations Management</h2>
          <p className="text-muted-foreground">
            Monitor daily operations, team performance, and service delivery metrics
          </p>
        </div>
        
        {/* Key Operational Metrics */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inspections</p>
                  <p className="text-2xl font-bold">{totalInspections}</p>
                  <p className="text-xs text-muted-foreground">This period</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{inspectionSuccessRate}%</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
                  <p className="text-2xl font-bold text-purple-600">{activeDrivers}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On Duty</p>
                  <p className="text-2xl font-bold text-orange-600">{driversOnDuty}</p>
                  <p className="text-xs text-muted-foreground">Currently working</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Operations Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Service Operations
          </h3>
          <p className="text-sm text-muted-foreground">
            Track daily service activities and operational performance
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <TrendsChart
            data={bookingTrends}
            title="Booking Activity"
            description="Daily booking volume and customer demand patterns"
            height={350}
            color="#8b5cf6"
            yAxisFormatter={(value) => `${Math.round(value)}`}
          />
          <TrendsChart
            data={inspectionTrends}
            title="Inspection Volume"
            description="Daily inspection completion and service delivery"
            height={350}
            color="#10b981"
            yAxisFormatter={(value) => `${Math.round(value)}`}
          />
        </div>
      </div>

      {/* Team Performance Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Team Performance
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor driver performance and team utilization metrics
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <StatusDistributionChart
            data={driverPerformance}
            title="Driver Performance Distribution"
            description="Performance metrics and status breakdown by driver"
            height={300}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Utilization</CardTitle>
              <CardDescription>Current driver availability and workload distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600 font-medium">Drivers On Duty</span>
                    <span className="font-bold">{driversOnDuty}</span>
                  </div>
                  <Progress 
                    value={driverUtilization} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Team: {totalDrivers}</span>
                    <span>{driverUtilization}% Utilization</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="font-medium text-green-600">{activeDrivers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On Duty:</span>
                    <span className="font-medium text-purple-600">{driversOnDuty}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Assurance Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quality Assurance
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor service quality, inspection results, and operational standards
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspection Results</CardTitle>
              <CardDescription>Current inspection status breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Completed</span>
                  <span className="font-bold">{completedInspections}</span>
                </div>
                <Progress 
                  value={inspectionSuccessRate} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total: {totalInspections}</span>
                  <span>{inspectionSuccessRate}% Success</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="text-yellow-600">{pendingInspections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="text-red-600">{failedInspections}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maintenance Activity</CardTitle>
              <CardDescription>Ongoing maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendsChart
                data={maintenanceTrends}
                title=""
                description=""
                height={200}
                color="#f59e0b"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                showTitle={false}
                showChartTypeToggle={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operational Health</CardTitle>
              <CardDescription>Overall operational performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Quality</span>
                  <Badge variant="outline" className="text-green-600">
                    {inspectionSuccessRate >= 90 ? 'Excellent' : inspectionSuccessRate >= 70 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Team Efficiency</span>
                  <Badge variant="outline" className="text-blue-600">
                    {driverUtilization >= 80 ? 'High' : driverUtilization >= 60 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Operational Status</span>
                  <Badge variant="outline" className="text-purple-600">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
