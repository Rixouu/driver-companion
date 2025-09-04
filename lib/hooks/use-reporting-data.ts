import { useState, useEffect, useCallback } from 'react'
import { DateRange } from 'react-day-picker'

export interface ReportingMetrics {
  // Financial metrics
  totalRevenue: number
  totalQuotations: number
  avgQuoteValue: number
  approvalRate: number
  conversionRate: number
  activeBookings: number
  
  // Vehicle metrics
  totalVehicles: number
  activeVehicles: number
  vehiclesInMaintenance: number
  
  // Driver metrics
  totalDrivers: number
  activeDrivers: number
  driversOnDuty: number
  
  // Inspection metrics
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  failedInspections: number
  
  // Maintenance metrics
  totalMaintenanceTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface StatusDistribution {
  name: string
  value: number
  color: string
}

export interface ReportingData {
  metrics: ReportingMetrics
  revenueTrend: ChartDataPoint[]
  quotationStatusDistribution: StatusDistribution[]
  bookingTrends: ChartDataPoint[]
  inspectionTrends: ChartDataPoint[]
  maintenanceTrends: ChartDataPoint[]
  vehicleUtilization: ChartDataPoint[]
  driverPerformance: ChartDataPoint[]
  monthlyComparison: ChartDataPoint[]
}

export interface UseReportingDataOptions {
  dateRange?: DateRange
  refreshInterval?: number
  enabled?: boolean
}

export function useReportingData(options: UseReportingDataOptions = {}) {
  const { dateRange, refreshInterval, enabled = true } = options
  
  const [data, setData] = useState<ReportingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (dateRange?.from) {
        params.set('from', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.set('to', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/reporting/comprehensive?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reporting data: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reporting data'
      setError(errorMessage)
      console.error('Error fetching reporting data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (refreshInterval && enabled) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval, enabled])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch
  }
}

// Specialized hooks for specific data types
export function useFinancialMetrics(dateRange?: DateRange) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (dateRange?.from) {
          params.set('from', dateRange.from.toISOString())
        }
        if (dateRange?.to) {
          params.set('to', dateRange.to.toISOString())
        }

        const response = await fetch(`/api/dashboard/financial-metrics?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch financial metrics: ${response.statusText}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch financial metrics'
        setError(errorMessage)
        console.error('Error fetching financial metrics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return { data, isLoading, error }
}

export function useVehicleMetrics(dateRange?: DateRange) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (dateRange?.from) {
          params.set('from', dateRange.from.toISOString())
        }
        if (dateRange?.to) {
          params.set('to', dateRange.to.toISOString())
        }

        const response = await fetch(`/api/reporting/vehicle-metrics?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicle metrics: ${response.statusText}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicle metrics'
        setError(errorMessage)
        console.error('Error fetching vehicle metrics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return { data, isLoading, error }
}

export function useDriverMetrics(dateRange?: DateRange) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (dateRange?.from) {
          params.set('from', dateRange.from.toISOString())
        }
        if (dateRange?.to) {
          params.set('to', dateRange.to.toISOString())
        }

        const response = await fetch(`/api/reporting/driver-metrics?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch driver metrics: ${response.statusText}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch driver metrics'
        setError(errorMessage)
        console.error('Error fetching driver metrics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return { data, isLoading, error }
}

export function useInspectionMetrics(dateRange?: DateRange) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (dateRange?.from) {
          params.set('from', dateRange.from.toISOString())
        }
        if (dateRange?.to) {
          params.set('to', dateRange.to.toISOString())
        }

        const response = await fetch(`/api/reporting/inspection-metrics?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch inspection metrics: ${response.statusText}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inspection metrics'
        setError(errorMessage)
        console.error('Error fetching inspection metrics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return { data, isLoading, error }
}
