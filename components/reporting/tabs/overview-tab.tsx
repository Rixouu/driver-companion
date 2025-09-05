"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  FileText, 
  Car, 
  User, 
  ClipboardCheck, 
  Wrench,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react'
import { RevenueChart } from '../charts/revenue-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface OverviewTabProps {
  data: any
}

export function OverviewTab({ data }: OverviewTabProps) {
  const metrics = data?.metrics || {}
  const revenueData = data?.revenueTrend || []
  const quotationData = data?.quotationStatusDistribution || []
  const bookingTrends = data?.bookingTrends || []
  const inspectionTrends = data?.inspectionTrends || []

  // Calculate trend percentages
  const revenueTrend = revenueData.length > 1 ? 
    ((revenueData[revenueData.length - 1]?.value || 0) - (revenueData[0]?.value || 0)) / (revenueData[0]?.value || 1) * 100 : 0
  
  const bookingTrend = bookingTrends.length > 1 ? 
    ((bookingTrends[bookingTrends.length - 1]?.value || 0) - (bookingTrends[0]?.value || 0)) / (bookingTrends[0]?.value || 1) * 100 : 0
  
  const inspectionTrend = inspectionTrends.length > 1 ? 
    ((inspectionTrends[inspectionTrends.length - 1]?.value || 0) - (inspectionTrends[0]?.value || 0)) / (inspectionTrends[0]?.value || 1) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Business Performance Overview */}
      <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Business Performance Dashboard</h2>
            <p className="text-muted-foreground">Comprehensive view of your vehicle inspection business performance</p>
        </div>
      
        {/* Key Metrics Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    ¥{((metrics.totalRevenue || 0) / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generated from {metrics.totalQuotations || 0} quotations
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {revenueTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(revenueTrend).toFixed(1)}% Rate
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quote Success */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quote Success</p>
                  <p className="text-3xl font-bold">
                    ¥{((metrics.avgQuoteValue || 0) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average quote value
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fleet Utilization */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Fleet Utilization</p>
                    <Badge variant="outline" className="text-xs">100%</Badge>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {metrics.activeVehicles || 0}/{metrics.totalVehicles || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vehicles active
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Team Status</p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(((metrics.driversOnDuty || 0) / (metrics.totalDrivers || 1)) * 100)}%
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics.driversOnDuty || 0}/{metrics.totalDrivers || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drivers on duty
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Health & Quotation Analysis */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Financial Health */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Financial Health</h3>
          
          {/* Revenue Trend */}
          <RevenueChart 
            data={revenueData}
            title="Revenue Trend"
            description="Daily revenue over the selected period"
            height={250}
          />
          
          {/* Financial Metrics */}
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{metrics.totalQuotations || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Quotations</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics.conversionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quotation Analysis */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Quotation Analysis</h3>
          
          <StatusDistributionChart
            data={quotationData}
            title="Quotation Status Distribution"
            description="Breakdown of quotation statuses"
          />
        </div>
      </div>

      {/* Service Quality & Operations */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Service Quality & Operations</h3>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Inspections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Inspections</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Completed</span>
                  <span className="font-bold">{metrics.completedInspections || 0}</span>
                </div>
                <Progress 
                  value={((metrics.completedInspections || 0) / (metrics.totalInspections || 1)) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total: {metrics.totalInspections || 0}</span>
                  <span>{Math.round(((metrics.completedInspections || 0) / (metrics.totalInspections || 1)) * 100)}% Success Rate</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span>{metrics.pendingInspections || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span>{metrics.failedInspections || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Management */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-base">Task Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600 font-medium">All Tasks</span>
                  <span className="font-bold">{metrics.totalMaintenanceTasks || 0}</span>
                </div>
                <Progress 
                  value={0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-center">No active tasks this period</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>{metrics.completedTasks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue:</span>
                  <span>{metrics.overdueTasks || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fleet Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Fleet Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 font-medium">Active Vehicles</span>
                  <span className="font-bold">{metrics.activeVehicles || 0}</span>
                </div>
                <Progress 
                  value={((metrics.activeVehicles || 0) / (metrics.totalVehicles || 1)) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total Fleet: {metrics.totalVehicles || 0}</span>
                  <span>100% Availability</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>In Service:</span>
                  <span>{metrics.activeVehicles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span>{metrics.vehiclesInMaintenance || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Trends */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Activity Trends</h3>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {/* Booking Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Booking Activity</CardTitle>
                  <CardDescription className="text-xs">Daily booking patterns</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {bookingTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={bookingTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(bookingTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrendsChart
                data={bookingTrends}
                title=""
                description=""
                color="#3b82f6"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                height={200}
                showTitle={false}
                chartType="bar"
                showChartTypeToggle={false}
              />
            </CardContent>
          </Card>

          {/* Inspection Volume */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Inspection Volume</CardTitle>
                  <CardDescription className="text-xs">Daily inspection completion</CardDescription>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {inspectionTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={inspectionTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(inspectionTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrendsChart
                data={inspectionTrends}
                title=""
                description=""
                color="#10b981"
                yAxisFormatter={(value) => `${Math.round(value)}`}
                height={200}
                showTitle={false}
                chartType="bar"
                showChartTypeToggle={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
