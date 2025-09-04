"use client"

import { RevenueChart } from '../charts/revenue-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface FinancialTabProps {
  data: any
}

export function FinancialTab({ data }: FinancialTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <RevenueChart 
          data={data?.revenueTrend || []}
          title="Revenue Analysis"
          description="Detailed revenue trends and patterns"
          height={400}
        />
        <StatusDistributionChart
          data={data?.quotationStatusDistribution || []}
          title="Quotation Performance"
          description="Success rates and status breakdown"
          height={400}
        />
      </div>
      
      <TrendsChart
        data={data?.monthlyComparison || []}
        title="Monthly Revenue Comparison"
        description="Month-over-month revenue analysis"
        height={300}
        color="#3b82f6"
        yAxisFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
      />
    </div>
  )
}
