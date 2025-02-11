"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, addMonths, isSameMonth, startOfMonth } from "date-fns"
import { MaintenanceForecastService } from "@/lib/services/maintenance-forecast"
import { MaintenanceOptimization } from "./maintenance-optimization"

interface MaintenanceCost {
  id: string
  type: string
  date: Date
  cost: number
  mileage: number
  description?: string
}

interface CostByType {
  type: string
  cost: number
  percentage: number
}

interface CostForecast {
  date: Date
  predicted: number
  actual?: number
}

interface MaintenanceCostAnalysisProps {
  vehicleId: string
  totalMileage: number
}

export function MaintenanceCostAnalysis({ vehicleId, totalMileage }: MaintenanceCostAnalysisProps) {
  const { t } = useLanguage()

  // TODO: Replace with actual API call
  const maintenanceCosts: MaintenanceCost[] = [
    {
      id: "1",
      type: "oil",
      date: new Date(2024, 0, 15),
      cost: 5000,
      mileage: 10000,
    },
    {
      id: "2",
      type: "tire",
      date: new Date(2024, 1, 1),
      cost: 12000,
      mileage: 11000,
    },
    {
      id: "3",
      type: "brake",
      date: new Date(2024, 1, 15),
      cost: 8000,
      mileage: 12000,
    },
  ]

  const calculateTotalCost = () => {
    return maintenanceCosts.reduce((sum, record) => sum + record.cost, 0)
  }

  const calculateCostPerKm = () => {
    const totalCost = calculateTotalCost()
    return totalMileage > 0 ? totalCost / totalMileage : 0
  }

  const calculateCostsByType = (): CostByType[] => {
    const totalCost = calculateTotalCost()
    const costsByType: { [key: string]: number } = {}

    maintenanceCosts.forEach((record) => {
      costsByType[record.type] = (costsByType[record.type] || 0) + record.cost
    })

    return Object.entries(costsByType).map(([type, cost]) => ({
      type,
      cost,
      percentage: (cost / totalCost) * 100,
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  const costsByType = calculateCostsByType()
  const costPerKm = calculateCostPerKm()

  const generateCostForecast = () => {
    const forecastService = new MaintenanceForecastService(maintenanceCosts)
    return forecastService.generateForecast()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.maintenance.costs.analysis")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("vehicles.management.maintenance.costs.total")}
                </p>
                <p className="text-2xl font-bold">
                  ¥{calculateTotalCost().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("vehicles.management.maintenance.costs.perKilometer")}
                </p>
                <p className="text-2xl font-bold">
                  ¥{costPerKm.toFixed(2)}/km
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("vehicles.management.maintenance.costs.monthlyAverage")}
                </p>
                <p className="text-2xl font-bold">
                  ¥{(calculateTotalCost() / 12).toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cost Trend Chart */}
          <div>
            <h4 className="font-medium mb-4">
              {t("vehicles.management.maintenance.costs.trend")}
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintenanceCosts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "PPP")}
                    formatter={(value) => [`¥${value}`, t("vehicles.management.maintenance.costs.amount")]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#0ea5e9"
                    name={t("vehicles.management.maintenance.costs.amount")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Distribution Chart */}
          <div>
            <h4 className="font-medium mb-4">
              {t("vehicles.management.maintenance.costs.distribution")}
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costsByType}
                    dataKey="cost"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, percentage }) => 
                      `${t(`vehicles.management.maintenance.types.${type}`)}: ${percentage.toFixed(1)}%`
                    }
                  >
                    {costsByType.map((entry, index) => (
                      <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`¥${value}`, t("vehicles.management.maintenance.costs.amount")]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <MaintenanceOptimization 
          vehicleId={vehicleId}
          maintenanceCosts={maintenanceCosts}
        />

        <div className="mt-8">
          <h4 className="font-medium mb-4">
            {t("vehicles.management.maintenance.costs.forecast")}
          </h4>
          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.management.maintenance.costs.sixMonthForecast")}</CardTitle>
              <CardDescription>
                {t("vehicles.management.maintenance.costs.forecastDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateCostForecast()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), "MMMM yyyy")}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{format(new Date(label), "MMMM yyyy")}</p>
                              <p className="text-sm text-muted-foreground">
                                {t("vehicles.management.maintenance.costs.confidence")}: 
                                {(data.confidence * 100).toFixed(0)}%
                              </p>
                              <div className="space-y-1 mt-2">
                                <p className="text-sm">
                                  {t("vehicles.management.maintenance.costs.baseline")}: 
                                  ¥{data.components.baseline.toFixed(0)}
                                </p>
                                <p className="text-sm">
                                  {t("vehicles.management.maintenance.costs.seasonal")}: 
                                  ¥{data.components.seasonal.toFixed(0)}
                                </p>
                                <p className="text-sm">
                                  {t("vehicles.management.maintenance.costs.scheduled")}: 
                                  ¥{data.components.scheduled.toFixed(0)}
                                </p>
                                <p className="font-medium mt-2">
                                  {t("vehicles.management.maintenance.costs.total")}: 
                                  ¥{data.predicted.toFixed(0)}
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#0ea5e9"
                      name="actual"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#f59e0b"
                      name="predicted"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.maintenance.costs.predictedNextMonth")}
                      </p>
                      <p className="text-2xl font-bold">
                        ¥{generateCostForecast()[1].predicted.toFixed(0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.maintenance.costs.predictedSixMonths")}
                      </p>
                      <p className="text-2xl font-bold">
                        ¥{generateCostForecast()
                          .reduce((sum, forecast) => sum + forecast.predicted, 0)
                          .toFixed(0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.maintenance.costs.yearlyEstimate")}
                      </p>
                      <p className="text-2xl font-bold">
                        ¥{(generateCostForecast()[0].predicted * 12).toFixed(0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
} 