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
  BarChart,
  Bar,
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

  const costData = [
    { month: "Jan", cost: 150 },
    { month: "Feb", cost: 300 },
    { month: "Mar", cost: 200 }
  ]

  const totalCost = costData.reduce((sum, item) => sum + item.cost, 0)
  const averageCost = totalCost / costData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.details.maintenance.costs.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.details.maintenance.costs.total")}
              </p>
              <p className="text-2xl font-bold">${totalCost}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.details.maintenance.costs.average")}
              </p>
              <p className="text-2xl font-bold">${averageCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, t("vehicles.details.maintenance.costs.amount")]}
                />
                <Bar 
                  dataKey="cost" 
                  fill="#0ea5e9" 
                  name={t("vehicles.details.maintenance.costs.amount")}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 