"use client"

import { MetricsGrid } from '../metrics/metrics-grid'
import { RevenueChart } from '../charts/revenue-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface OverviewTabProps {
  data: any
}

export function OverviewTab({ data }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <MetricsGrid data={data?.metrics || {}} />
      
      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <RevenueChart 
          data={data?.revenueTrend || []}
          title="Revenue Trend"
          description="Daily revenue over the selected period"
        />
        <StatusDistributionChart
          data={data?.quotationStatusDistribution || []}
          title="Quotation Status Distribution"
          description="Breakdown of quotation statuses"
        />
      </div>

      {/* Additional Trends */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <TrendsChart
          data={data?.bookingTrends || []}
          title="Booking Trends"
          description="Daily booking activity"
          color="#8b5cf6"
          yAxisFormatter={(value) => `${value} bookings`}
        />
        <TrendsChart
          data={data?.inspectionTrends || []}
          title="Inspection Trends"
          description="Daily inspection activity"
          color="#10b981"
          yAxisFormatter={(value) => `${value} inspections`}
        />
        <TrendsChart
          data={data?.maintenanceTrends || []}
          title="Maintenance Trends"
          description="Daily maintenance activity"
          color="#f59e0b"
          yAxisFormatter={(value) => `${value} tasks`}
        />
      </div>
    </div>
  )
}
