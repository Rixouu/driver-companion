import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Get date range from query parameters
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    
    // Ensure dates are valid
    const from = fromDate.toISOString()
    const to = toDate.toISOString()

    // Fetch all data in parallel
    const [
      quotationsData,
      bookingsData,
      vehiclesData,
      driversData,
      inspectionsData,
      maintenanceData
    ] = await Promise.all([
      fetchQuotationsData(supabase, from, to),
      fetchBookingsData(supabase, from, to),
      fetchVehiclesData(supabase),
      fetchDriversData(supabase),
      fetchInspectionsData(supabase, from, to),
      fetchMaintenanceData(supabase, from, to)
    ])

    // Calculate comprehensive metrics
    const metrics = {
      // Financial metrics
      totalRevenue: quotationsData.totalRevenue,
      totalQuotations: quotationsData.totalQuotations,
      avgQuoteValue: quotationsData.avgQuoteValue,
      approvalRate: quotationsData.approvalRate,
      conversionRate: quotationsData.conversionRate,
      activeBookings: bookingsData.activeBookings,
      
      // Vehicle metrics
      totalVehicles: vehiclesData.totalVehicles,
      activeVehicles: vehiclesData.activeVehicles,
      vehiclesInMaintenance: vehiclesData.vehiclesInMaintenance,
      
      // Driver metrics
      totalDrivers: driversData.totalDrivers,
      activeDrivers: driversData.activeDrivers,
      driversOnDuty: driversData.driversOnDuty,
      
      // Inspection metrics
      totalInspections: inspectionsData.totalInspections,
      completedInspections: inspectionsData.completedInspections,
      pendingInspections: inspectionsData.pendingInspections,
      failedInspections: inspectionsData.failedInspections,
      
      // Maintenance metrics
      totalMaintenanceTasks: maintenanceData.totalMaintenanceTasks,
      completedTasks: maintenanceData.completedTasks,
      pendingTasks: maintenanceData.pendingTasks,
      overdueTasks: maintenanceData.overdueTasks
    }

    // Generate chart data
    const revenueTrend = generateRevenueTrend(quotationsData.dailyRevenue)
    const quotationStatusDistribution = generateQuotationStatusDistribution(quotationsData.statusCounts)
    const bookingTrends = generateBookingTrends(bookingsData.dailyBookings)
    const inspectionTrends = generateInspectionTrends(inspectionsData.dailyInspections)
    const maintenanceTrends = generateMaintenanceTrends(maintenanceData.dailyMaintenance)
    const vehicleUtilization = generateVehicleUtilization(vehiclesData.utilizationData)
    const driverPerformance = generateDriverPerformance(driversData.performanceData)
    const monthlyComparison = generateMonthlyComparison(quotationsData.monthlyRevenue)

    return NextResponse.json({
      metrics,
      revenueTrend,
      quotationStatusDistribution,
      bookingTrends,
      inspectionTrends,
      maintenanceTrends,
      vehicleUtilization,
      driverPerformance,
      monthlyComparison
    })

  } catch (error) {
    console.error('Error fetching comprehensive reporting data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reporting data' },
      { status: 500 }
    )
  }
}

// Helper functions for data fetching
async function fetchQuotationsData(supabase: any, from: string, to: string) {
  const { data: quotations, error } = await supabase
    .from('quotations')
    .select('total_amount, status, created_at')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) throw error

  const totalRevenue = quotations?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0
  const totalQuotations = quotations?.length || 0
  const avgQuoteValue = totalQuotations > 0 ? totalRevenue / totalQuotations : 0

  // Calculate status counts
  const statusCounts = quotations?.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const approvedQuotes = statusCounts.approved || 0
  const rejectedQuotes = statusCounts.rejected || 0
  const sentQuotes = statusCounts.sent || 0
  const convertedQuotes = statusCounts.converted || 0

  const approvalRate = approvedQuotes + rejectedQuotes > 0 ? 
    Math.round((approvedQuotes / (approvedQuotes + rejectedQuotes)) * 100) : 0
  const conversionRate = sentQuotes + approvedQuotes > 0 ? 
    Math.round((convertedQuotes / (sentQuotes + approvedQuotes)) * 100) : 0

  // Generate daily revenue data
  const dailyRevenue = generateDailyData(quotations, 'created_at', 'total_amount', from, to)
  
  // Generate monthly revenue data
  const monthlyRevenue = generateMonthlyData(quotations, 'created_at', 'total_amount', from, to)

  return {
    totalRevenue,
    totalQuotations,
    avgQuoteValue,
    approvalRate,
    conversionRate,
    statusCounts,
    dailyRevenue,
    monthlyRevenue
  }
}

async function fetchBookingsData(supabase: any, from: string, to: string) {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('status, created_at, date')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) throw error

  const activeBookings = bookings?.filter(b => ['pending', 'confirmed'].includes(b.status)).length || 0
  const dailyBookings = generateDailyData(bookings, 'created_at', null, from, to, 'count')

  return {
    activeBookings,
    dailyBookings
  }
}

async function fetchVehiclesData(supabase: any) {
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, name, status, created_at')

  if (error) throw error

  const totalVehicles = vehicles?.length || 0
  const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0
  const vehiclesInMaintenance = vehicles?.filter(v => v.status === 'maintenance').length || 0

  // Generate utilization data (simplified)
  const utilizationData = vehicles?.map(vehicle => ({
    name: vehicle.name,
    utilization: Math.random() * 100 // This would be calculated from actual usage data
  })) || []

  return {
    totalVehicles,
    activeVehicles,
    vehiclesInMaintenance,
    utilizationData
  }
}

async function fetchDriversData(supabase: any) {
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, created_at')

  if (error) throw error

  const totalDrivers = drivers?.length || 0
  // Since there's no status column, we'll assume all drivers are active
  const activeDrivers = totalDrivers
  const driversOnDuty = Math.floor(totalDrivers * 0.7) // Simulate 70% on duty

  // Generate performance data (simplified)
  const performanceData = drivers?.map(driver => ({
    name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Unknown Driver',
    performance: Math.random() * 100 // This would be calculated from actual performance metrics
  })) || []

  return {
    totalDrivers,
    activeDrivers,
    driversOnDuty,
    performanceData
  }
}

async function fetchInspectionsData(supabase: any, from: string, to: string) {
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select('status, created_at, date')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) throw error

  const totalInspections = inspections?.length || 0
  const completedInspections = inspections?.filter(i => i.status === 'completed').length || 0
  const pendingInspections = inspections?.filter(i => i.status === 'pending').length || 0
  const failedInspections = inspections?.filter(i => i.status === 'failed').length || 0

  const dailyInspections = generateDailyData(inspections, 'created_at', null, from, to, 'count')

  return {
    totalInspections,
    completedInspections,
    pendingInspections,
    failedInspections,
    dailyInspections
  }
}

async function fetchMaintenanceData(supabase: any, from: string, to: string) {
  const { data: maintenance, error } = await supabase
    .from('maintenance_tasks')
    .select('status, created_at, due_date, completed_date')
    .gte('created_at', from)
    .lte('created_at', to)

  if (error) throw error

  const totalMaintenanceTasks = maintenance?.length || 0
  const completedTasks = maintenance?.filter(m => m.status === 'completed').length || 0
  const pendingTasks = maintenance?.filter(m => m.status === 'pending').length || 0
  
  // Calculate overdue tasks
  const now = new Date()
  const overdueTasks = maintenance?.filter(m => 
    m.status === 'pending' && 
    m.due_date && 
    new Date(m.due_date) < now
  ).length || 0

  const dailyMaintenance = generateDailyData(maintenance, 'created_at', null, from, to, 'count')

  return {
    totalMaintenanceTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    dailyMaintenance
  }
}

// Helper functions for data generation
function generateDailyData(data: any[], dateField: string, valueField: string | null, from: string, to: string, type: 'sum' | 'count' = 'sum') {
  if (!data) return []
  
  const dailyMap = new Map()
  const startDate = new Date(from)
  const endDate = new Date(to)
  
  // Initialize all days in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    dailyMap.set(dateKey, 0)
  }
  
  // Aggregate data by day
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0]
    const currentValue = dailyMap.get(date) || 0
    
    if (type === 'count') {
      dailyMap.set(date, currentValue + 1)
    } else if (valueField && item[valueField]) {
      dailyMap.set(date, currentValue + (item[valueField] || 0))
    }
  })
  
  return Array.from(dailyMap.entries()).map(([date, value]) => ({
    date,
    value
  }))
}

function generateMonthlyData(data: any[], dateField: string, valueField: string, from: string, to: string) {
  if (!data) return []
  
  const monthlyMap = new Map()
  
  data.forEach(item => {
    const date = new Date(item[dateField])
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const currentValue = monthlyMap.get(monthKey) || 0
    monthlyMap.set(monthKey, currentValue + (item[valueField] || 0))
  })
  
  return Array.from(monthlyMap.entries()).map(([month, value]) => ({
    month,
    value
  }))
}

// Chart data generation functions
function generateRevenueTrend(dailyRevenue: any[]) {
  return dailyRevenue.map(item => ({
    date: item.date,
    value: item.value,
    label: `¥${(item.value / 1000).toFixed(0)}k`
  }))
}

function generateQuotationStatusDistribution(statusCounts: Record<string, number>) {
  const colors = {
    approved: '#10b981',
    pending: '#f59e0b',
    rejected: '#ef4444',
    draft: '#6b7280',
    converted: '#8b5cf6',
    sent: '#3b82f6'
  }
  
  return Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280'
    }))
}

function generateBookingTrends(dailyBookings: any[]) {
  return dailyBookings.map(item => ({
    date: item.date,
    value: item.value,
    label: `${item.value} bookings`
  }))
}

function generateInspectionTrends(dailyInspections: any[]) {
  return dailyInspections.map(item => ({
    date: item.date,
    value: item.value,
    label: `${item.value} inspections`
  }))
}

function generateMaintenanceTrends(dailyMaintenance: any[]) {
  return dailyMaintenance.map(item => ({
    date: item.date,
    value: item.value,
    label: `${item.value} tasks`
  }))
}

function generateVehicleUtilization(utilizationData: any[]) {
  return utilizationData.map(item => ({
    name: item.name,
    value: item.utilization,
    label: `${item.utilization.toFixed(1)}%`
  }))
}

function generateDriverPerformance(performanceData: any[]) {
  return performanceData.map(item => ({
    name: item.name,
    value: item.performance,
    label: `${item.performance.toFixed(1)}%`
  }))
}

function generateMonthlyComparison(monthlyRevenue: any[]) {
  return monthlyRevenue.map(item => ({
    month: item.month,
    value: item.value,
    label: `¥${(item.value / 1000).toFixed(0)}k`
  }))
}
