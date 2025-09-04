"use client"

import { StatusDistributionChart } from '../charts/status-distribution-chart'
import { TrendsChart } from '../charts/trends-chart'

interface VehiclesTabProps {
  data: any
}

export function VehiclesTab({ data }: VehiclesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <StatusDistributionChart
          data={data?.vehicleUtilization || []}
          title="Vehicle Utilization"
          description="Usage efficiency by vehicle"
          height={400}
        />
        <TrendsChart
          data={data?.maintenanceTrends || []}
          title="Maintenance Activity"
          description="Vehicle maintenance patterns"
          height={400}
          color="#f59e0b"
        />
      </div>
    </div>
  )
}
