import { addMonths, isSameMonth, startOfMonth, getMonth } from "date-fns"

interface MaintenanceCost {
  id: string
  type: string
  date: Date
  cost: number
  mileage: number
  description?: string
}

interface MaintenanceOptimization {
  type: string
  suggestion: string
  potentialSavings: number
  priority: 'high' | 'medium' | 'low'
  implementationCost?: number
  roi?: number
}

interface MaintenanceSchedule {
  type: string
  intervalMonths: number
  estimatedCost: number
  lastServiceDate: Date
  seasonalFactors?: number[]
  mileageInterval?: number
  preventiveCost?: number
  reactiveCost?: number
  dependencies?: string[]
}

interface CostForecast {
  date: Date
  predicted: number
  actual?: number
  confidence: number
  components: {
    baseline: number
    seasonal: number
    scheduled: number
  }
}

export class MaintenanceForecastService {
  private readonly SEASONAL_FACTORS = [
    1.2,  // January (winter)
    1.2,  // February (winter)
    1.0,  // March
    0.9,  // April
    0.8,  // May
    1.0,  // June
    1.1,  // July (summer)
    1.1,  // August (summer)
    0.9,  // September
    0.8,  // October
    1.0,  // November
    1.2,  // December (winter)
  ]

  private readonly MAINTENANCE_SCHEDULE: MaintenanceSchedule[] = [
    {
      type: "oil",
      intervalMonths: 3,
      mileageInterval: 5000,
      estimatedCost: 5000,
      preventiveCost: 5000,
      reactiveCost: 15000,
      lastServiceDate: new Date(2024, 0, 15),
    },
    {
      type: "tire",
      intervalMonths: 6,
      mileageInterval: 20000,
      estimatedCost: 12000,
      preventiveCost: 12000,
      reactiveCost: 24000,
      lastServiceDate: new Date(2024, 1, 1),
      seasonalFactors: [1.2, 1.2, 1.0, 0.8, 0.8, 1.0, 1.0, 1.0, 0.8, 0.8, 1.0, 1.2],
    },
    {
      type: "brake",
      intervalMonths: 12,
      mileageInterval: 25000,
      estimatedCost: 8000,
      preventiveCost: 8000,
      reactiveCost: 20000,
      lastServiceDate: new Date(2024, 1, 15),
    },
    {
      type: "transmission",
      intervalMonths: 24,
      mileageInterval: 40000,
      estimatedCost: 25000,
      preventiveCost: 25000,
      reactiveCost: 75000,
      lastServiceDate: new Date(2023, 6, 1),
    },
    {
      type: "battery",
      intervalMonths: 36,
      estimatedCost: 15000,
      preventiveCost: 15000,
      reactiveCost: 20000,
      lastServiceDate: new Date(2023, 1, 1),
      seasonalFactors: [1.3, 1.3, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3],
    },
    {
      type: "aircon",
      intervalMonths: 12,
      estimatedCost: 10000,
      preventiveCost: 10000,
      reactiveCost: 30000,
      lastServiceDate: new Date(2023, 5, 1),
      seasonalFactors: [0.8, 0.8, 1.0, 1.2, 1.4, 1.4, 1.4, 1.4, 1.2, 1.0, 0.8, 0.8],
      dependencies: ["filter"],
    },
    {
      type: "filter",
      intervalMonths: 6,
      estimatedCost: 3000,
      preventiveCost: 3000,
      reactiveCost: 5000,
      lastServiceDate: new Date(2024, 0, 1),
    },
    {
      type: "suspension",
      intervalMonths: 24,
      mileageInterval: 50000,
      estimatedCost: 20000,
      preventiveCost: 20000,
      reactiveCost: 45000,
      lastServiceDate: new Date(2023, 3, 1),
      dependencies: ["tire"],
    },
  ]

  constructor(private historicalCosts: MaintenanceCost[]) {}

  private calculateBaselineTrend(): { slope: number; intercept: number } {
    const n = this.historicalCosts.length
    if (n < 2) return { slope: 0, intercept: 0 }

    const x = Array.from({ length: n }, (_, i) => i)
    const y = this.historicalCosts.map(cost => cost.cost)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private calculateSeasonalIndex(month: number): number {
    return this.SEASONAL_FACTORS[month]
  }

  private getScheduledMaintenance(date: Date): number {
    return this.MAINTENANCE_SCHEDULE.reduce((total, schedule) => {
      const monthsSinceLastService = 
        (date.getTime() - schedule.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      
      if (monthsSinceLastService >= schedule.intervalMonths) {
        const seasonalFactor = schedule.seasonalFactors?.[getMonth(date)] ?? 1
        return total + (schedule.estimatedCost * seasonalFactor)
      }
      return total
    }, 0)
  }

  private calculateConfidence(forecastDate: Date): number {
    const monthsAhead = 
      (forecastDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    return Math.max(0.5, 1 - (monthsAhead * 0.1)) // Confidence decreases with time
  }

  public generateForecast(months: number = 6): CostForecast[] {
    const trend = this.calculateBaselineTrend()
    const forecast: CostForecast[] = []
    const today = new Date()

    for (let i = 0; i < months; i++) {
      const forecastDate = addMonths(today, i)
      const month = getMonth(forecastDate)
      
      // Calculate baseline from trend
      const baseline = trend.intercept + (trend.slope * (this.historicalCosts.length + i))
      
      // Apply seasonal adjustment
      const seasonal = baseline * (this.calculateSeasonalIndex(month) - 1)
      
      // Add scheduled maintenance costs
      const scheduled = this.getScheduledMaintenance(forecastDate)
      
      // Get actual cost if available
      const actual = this.historicalCosts
        .filter(cost => isSameMonth(cost.date, forecastDate))
        .reduce((sum, cost) => sum + cost.cost, 0)

      forecast.push({
        date: startOfMonth(forecastDate),
        predicted: baseline + seasonal + scheduled,
        actual: actual || undefined,
        confidence: this.calculateConfidence(forecastDate),
        components: {
          baseline,
          seasonal,
          scheduled,
        }
      })
    }

    return forecast
  }

  public generateOptimizations(): MaintenanceOptimization[] {
    const optimizations: MaintenanceOptimization[] = []
    const today = new Date()

    this.MAINTENANCE_SCHEDULE.forEach(schedule => {
      const monthsSinceService = 
        (today.getTime() - schedule.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      
      // Check for preventive maintenance opportunities
      if (monthsSinceService >= schedule.intervalMonths * 0.8) {
        const potentialSavings = schedule.reactiveCost! - schedule.preventiveCost!
        optimizations.push({
          type: schedule.type,
          suggestion: `Schedule preventive maintenance for ${schedule.type} soon`,
          potentialSavings,
          priority: potentialSavings > 20000 ? 'high' : potentialSavings > 10000 ? 'medium' : 'low',
          implementationCost: schedule.preventiveCost,
          roi: (potentialSavings / schedule.preventiveCost!) * 100,
        })
      }

      // Check for bundling opportunities
      const dependencies = schedule.dependencies || []
      if (dependencies.length > 0) {
        const relatedServices = this.MAINTENANCE_SCHEDULE
          .filter(s => dependencies.includes(s.type))
          .filter(s => {
            const monthsSinceRelated = 
              (today.getTime() - s.lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
            return monthsSinceRelated >= s.intervalMonths * 0.7
          })

        if (relatedServices.length > 0) {
          const bundleSavings = relatedServices.reduce((sum, service) => 
            sum + (service.estimatedCost * 0.15), 0)
          
          optimizations.push({
            type: `${schedule.type}_bundle`,
            suggestion: `Bundle ${schedule.type} maintenance with ${relatedServices.map(s => s.type).join(', ')}`,
            potentialSavings: bundleSavings,
            priority: bundleSavings > 15000 ? 'high' : bundleSavings > 7000 ? 'medium' : 'low',
            implementationCost: relatedServices.reduce((sum, service) => 
              sum + service.estimatedCost, 0),
            roi: (bundleSavings / relatedServices.reduce((sum, service) => 
              sum + service.estimatedCost, 0)) * 100,
          })
        }
      }
    })

    return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings)
  }
} 