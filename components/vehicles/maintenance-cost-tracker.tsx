"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

interface CostData {
  month: string
  amount: number
  type: string
}

interface MaintenanceCostTrackerProps {
  vehicleId: string
}

export function MaintenanceCostTracker({ vehicleId }: MaintenanceCostTrackerProps) {
  const { t } = useLanguage()

  // TODO: Replace with actual API call
  const costData: CostData[] = [
    { month: "Jan", amount: 150, type: "oil" },
    { month: "Feb", amount: 300, type: "tire" },
    { month: "Mar", amount: 200, type: "brake" },
    // Add more data...
  ]

  const totalCost = costData.reduce((sum, item) => sum + item.amount, 0)
  const averageCost = totalCost / costData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.maintenance.costs.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("vehicles.management.maintenance.costs.total")}
            </p>
            <p className="text-2xl font-bold">
              ${totalCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("vehicles.management.maintenance.costs.average")}
            </p>
            <p className="text-2xl font-bold">
              ${averageCost.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 