"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

interface MileageAnalysisProps {
  vehicleId: string
}

export function MileageAnalysis({ vehicleId }: MileageAnalysisProps) {
  const { t } = useLanguage()

  // Static data to match screenshot
  const weeklyData = [
    { week: "Wed", distance: 500 },
    { week: "Wed", distance: 500 }
  ]

  const analysisData = [
    {
      label: t("vehicles.management.mileage.analysis.lastDistance"),
      value: "500",
      unit: "km"
    },
    {
      label: t("vehicles.management.mileage.analysis.totalDistance"),
      value: "26071",
      unit: "km"
    },
    {
      label: t("vehicles.management.mileage.analysis.projectedMonthly"),
      value: "2357",
      unit: "km"
    },
    {
      label: t("vehicles.management.mileage.analysis.averageSpeed"),
      value: "3.0",
      unit: "km/h"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.mileage.analysis.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {analysisData.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-2xl font-bold">
                      {item.value} {item.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-sm font-medium">
              {t("vehicles.management.mileage.analysis.weeklyComparison")}
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [
                      `${value} km`,
                      t("vehicles.management.mileage.distance")
                    ]}
                  />
                  <Bar 
                    dataKey="distance" 
                    fill="#0ea5e9" 
                    name={t("vehicles.management.mileage.distance")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 