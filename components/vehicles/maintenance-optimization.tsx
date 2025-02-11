"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { AlertCircle, TrendingDown, ArrowUpRight } from "lucide-react"
import { MaintenanceForecastService } from "@/lib/services/maintenance-forecast"

interface MaintenanceCost {
  id: string
  type: string
  date: Date
  cost: number
  mileage: number
  description?: string
}

interface MaintenanceOptimizationProps {
  vehicleId: string
  maintenanceCosts: MaintenanceCost[]
}

export function MaintenanceOptimization({ vehicleId, maintenanceCosts }: MaintenanceOptimizationProps) {
  const { t } = useLanguage()
  const forecastService = new MaintenanceForecastService(maintenanceCosts)
  const optimizations = forecastService.generateOptimizations()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          {t("vehicles.management.maintenance.optimization.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {optimizations.map((opt) => (
          <Alert key={opt.type}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {t(`vehicles.management.maintenance.types.${opt.type.split('_')[0]}`)}
              <Badge className={getPriorityColor(opt.priority)}>
                {t(`vehicles.management.maintenance.optimization.priority.${opt.priority}`)}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{opt.suggestion}</p>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">
                  {t("vehicles.management.maintenance.optimization.potentialSavings")}:
                  <span className="text-green-500 ml-1">¥{opt.potentialSavings.toLocaleString()}</span>
                </span>
                {opt.roi && (
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ROI: {opt.roi.toFixed(1)}%
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
} 