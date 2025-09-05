"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Target,
  BarChart3
} from 'lucide-react'
import { RevenueChart } from '../charts/revenue-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface FinancialTabProps {
  data: any
}

export function FinancialTab({ data }: FinancialTabProps) {
  const metrics = data?.metrics || {}
  const revenueData = data?.revenueTrend || []
  const quotationData = data?.quotationStatusDistribution || []
  const monthlyData = data?.monthlyComparison || []

  // Calculate financial metrics
  const totalRevenue = metrics.totalRevenue || 0
  const totalQuotations = metrics.totalQuotations || 0
  const avgQuoteValue = metrics.avgQuoteValue || 0
  const conversionRate = metrics.conversionRate || 0
  const approvalRate = metrics.approvalRate || 0

  return (
    <div className="space-y-8">
      {/* Financial Overview Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Performance</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of revenue, quotations, and financial health metrics
          </p>
        </div>
        
        {/* Key Financial Metrics */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{((totalRevenue) / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground">This period</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quotations</p>
                  <p className="text-2xl font-bold">{totalQuotations}</p>
                  <p className="text-xs text-muted-foreground">Generated</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Quote Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ¥{((avgQuoteValue) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-muted-foreground">Per quotation</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Quotes to bookings</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Analysis Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Revenue Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Track revenue trends, patterns, and performance over time
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <RevenueChart 
            data={revenueData}
            title="Revenue Trends"
            description="Daily revenue performance and growth patterns"
            height={350}
          />
          <StatusDistributionChart
            data={quotationData}
            title="Quotation Status Distribution"
            description="Breakdown of quotation statuses and success rates"
            height={350}
          />
        </div>
      </div>

      {/* Performance Metrics Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Performance Metrics
          </h3>
          <p className="text-sm text-muted-foreground">
            Key performance indicators and comparative analysis
          </p>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval Rate</CardTitle>
              <CardDescription>Percentage of quotations approved by customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{approvalRate}%</div>
                <div className="flex items-center gap-1">
                  {approvalRate >= 70 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {approvalRate >= 70 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Growth</CardTitle>
              <CardDescription>Month-over-month revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendsChart
                data={monthlyData}
                title=""
                description=""
                height={200}
                color="#3b82f6"
                yAxisFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                showTitle={false}
                showChartTypeToggle={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
