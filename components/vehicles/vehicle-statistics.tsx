"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"

interface VehicleStats {
  fuelEfficiency: Array<{
    date: string
    kmPerLiter: number
  }>
  maintenanceCosts: Array<{
    month: string
    cost: number
  }>
  utilizationRate: Array<{
    month: string
    rate: number
  }>
}

interface VehicleStatisticsProps {
  vehicleId: string
  stats: VehicleStats
}

export function VehicleStatistics({ vehicleId, stats }: VehicleStatisticsProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"vehicles.statistics.title"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="efficiency" className="space-y-4">
          <TabsList>
            <TabsTrigger value="efficiency">
              {"vehicles.statistics.fuelEfficiency"}
            </TabsTrigger>
            <TabsTrigger value="costs">
              {"vehicles.statistics.maintenanceCosts"}
            </TabsTrigger>
            <TabsTrigger value="utilization">
              {"vehicles.statistics.utilizationRate"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="efficiency">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.fuelEfficiency}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "PPP")}
                    formatter={(value: number) => [
                      `${value.toFixed(2)} km/L`,
                      "vehicles.statistics.efficiency",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="kmPerLiter"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="costs">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.maintenanceCosts}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      "vehicles.statistics.costs",
                    ]}
                  />
                  <Bar dataKey="cost" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="utilization">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.utilizationRate}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `${(value * 100).toFixed(1)}%`,
                      "vehicles.statistics.utilization",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 