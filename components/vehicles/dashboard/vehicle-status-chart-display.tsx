"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { VehicleStatusData } from "@/types/vehicles"

interface VehicleStatusChartDisplayProps {
  data: VehicleStatusData[]
}

export function VehicleStatusChartDisplay({ data }: VehicleStatusChartDisplayProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"vehicles.status.chart.title"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="active" fill="#10b981" stackId="status" />
              <Bar dataKey="maintenance" fill="#f59e0b" stackId="status" />
              <Bar dataKey="inspection" fill="#ef4444" stackId="status" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 