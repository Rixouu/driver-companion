"use client"

import { TrendsChart } from '../charts/trends-chart'
import { StatusDistributionChart } from '../charts/status-distribution-chart'

interface OperationsTabProps {
  data: any
}

export function OperationsTab({ data }: OperationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <TrendsChart
          data={data?.bookingTrends || []}
          title="Booking Operations"
          description="Daily booking volume and trends"
          height={400}
          color="#8b5cf6"
        />
        <TrendsChart
          data={data?.inspectionTrends || []}
          title="Inspection Operations"
          description="Inspection completion rates"
          height={400}
          color="#10b981"
        />
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <StatusDistributionChart
          data={data?.driverPerformance || []}
          title="Driver Performance"
          description="Performance metrics by driver"
          height={300}
        />
        <TrendsChart
          data={data?.maintenanceTrends || []}
          title="Maintenance Operations"
          description="Maintenance task completion"
          height={300}
          color="#f59e0b"
        />
      </div>
    </div>
  )
}
