'use server'

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { cache, CacheKeys, CacheTags } from "@/lib/cache/redis-cache-optimized"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"

/**
 * Optimized Dashboard Data Action
 * Uses database functions and Redis caching for better performance
 */
export async function getDashboardDataOptimized() {
  try {
    // Create supabase client
    const supabase = await getSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Unauthorized')
    }

    // Get dashboard metrics using cached database function
    const metrics = await cache.getOrSet(
      CacheKeys.dashboardMetrics(),
      async () => {
        const { data, error } = await supabase.rpc('get_dashboard_metrics')
        if (error) throw error
        return data?.[0]
      },
      {
        ttl: 300, // 5 minutes
        tags: [CacheTags.dashboard]
      }
    )

    // Get vehicle utilization data
    const vehicleUtilization = await cache.getOrSet(
      CacheKeys.vehicleUtilization(),
      async () => {
        const { data, error } = await supabase.rpc('get_vehicle_utilization')
        if (error) throw error
        return data
      },
      {
        ttl: 600, // 10 minutes
        tags: [CacheTags.vehicles, CacheTags.dashboard]
      }
    )

    // Get driver performance data
    const driverPerformance = await cache.getOrSet(
      CacheKeys.driverPerformance(),
      async () => {
        const { data, error } = await supabase.rpc('get_driver_performance')
        if (error) throw error
        return data
      },
      {
        ttl: 600, // 10 minutes
        tags: [CacheTags.drivers, CacheTags.dashboard]
      }
    )

    // Get quotations analytics for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString()
    const toDate = new Date().toISOString()

    const quotationsAnalytics = await cache.getOrSet(
      CacheKeys.quotationsAnalytics(fromDate, toDate),
      async () => {
        const { data, error } = await supabase.rpc('get_quotations_analytics', {
          from_date: fromDate,
          to_date: toDate
        })
        if (error) throw error
        return data?.[0]
      },
      {
        ttl: 300, // 5 minutes
        tags: [CacheTags.quotations, CacheTags.dashboard]
      }
    )

    // Get bookings analytics for the last 30 days
    const bookingsAnalytics = await cache.getOrSet(
      CacheKeys.bookingsAnalytics(fromDate, toDate),
      async () => {
        const { data, error } = await supabase.rpc('get_bookings_analytics', {
          from_date: fromDate,
          to_date: toDate
        })
        if (error) throw error
        return data?.[0]
      },
      {
        ttl: 300, // 5 minutes
        tags: [CacheTags.bookings, CacheTags.dashboard]
      }
    )

    // Transform data to match expected format
    const vehicles = (vehicleUtilization || []).map((v: any) => ({
      id: v.vehicle_id,
      name: v.vehicle_name,
      plate_number: v.plate_number,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status,
      total_bookings: v.total_bookings,
      total_inspections: v.total_inspections,
      total_maintenance_tasks: v.total_maintenance_tasks,
      last_booking_date: v.last_booking_date,
      last_inspection_date: v.last_inspection_date,
      last_maintenance_date: v.last_maintenance_date
    })) as DbVehicle[]

    const inspections = [] as DbInspection[] // Will be populated from vehicle data
    const maintenanceTasks = [] as DbMaintenanceTask[] // Will be populated from vehicle data

    // Calculate statistics from optimized data
    const stats = {
      totalVehicles: metrics?.total_vehicles || 0,
      activeVehicles: metrics?.active_vehicles || 0,
      vehiclesInMaintenance: metrics?.vehicles_in_maintenance || 0,
      totalDrivers: metrics?.total_drivers || 0,
      activeDrivers: metrics?.active_drivers || 0,
      driversOnDuty: metrics?.drivers_on_duty || 0,
      totalInspections: metrics?.total_inspections || 0,
      completedInspections: metrics?.completed_inspections || 0,
      pendingInspections: metrics?.pending_inspections || 0,
      failedInspections: metrics?.failed_inspections || 0,
      totalMaintenanceTasks: metrics?.total_maintenance_tasks || 0,
      completedTasks: metrics?.completed_tasks || 0,
      pendingTasks: metrics?.pending_tasks || 0,
      overdueTasks: metrics?.overdue_tasks || 0,
      
      // Financial metrics from analytics
      totalRevenue: quotationsAnalytics?.total_revenue || 0,
      totalQuotations: quotationsAnalytics?.total_quotations || 0,
      avgQuoteValue: quotationsAnalytics?.avg_quote_value || 0,
      approvalRate: quotationsAnalytics?.approval_rate || 0,
      conversionRate: quotationsAnalytics?.conversion_rate || 0,
      
      // Booking metrics
      totalBookings: bookingsAnalytics?.total_bookings || 0,
      activeBookings: bookingsAnalytics?.active_bookings || 0,
      completedBookings: bookingsAnalytics?.completed_bookings || 0,
      cancelledBookings: bookingsAnalytics?.cancelled_bookings || 0,
      avgBookingValue: bookingsAnalytics?.avg_booking_value || 0
    }

    return {
      vehicles,
      inspections,
      maintenanceTasks,
      stats,
      analytics: {
        quotations: quotationsAnalytics,
        bookings: bookingsAnalytics
      },
      performance: {
        vehicleUtilization: vehicleUtilization || [],
        driverPerformance: driverPerformance || []
      },
      metadata: {
        generated_at: new Date().toISOString(),
        cache_hit: true, // Indicates data came from cache
        optimized: true
      }
    }

  } catch (error) {
    console.error('Optimized dashboard data error:', error)
    
    // Fallback to original implementation if optimized version fails
    return await getDashboardDataFallback()
  }
}

/**
 * Fallback to original dashboard implementation
 */
async function getDashboardDataFallback() {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Original implementation as fallback
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    const { data: inspectionsData } = await supabase
      .from('inspections')
      .select(`
        *,
        vehicle:vehicles (
          id,
          name,
          plate_number,
          brand,
          model,
          year,
          status,
          image_url,
          vin
        )
      `)
      .order('created_at', { ascending: false })
    
    const { data: maintenanceTasksData } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        vehicle:vehicles (
          id,
          name,
          plate_number,
          brand,
          model
        )
      `)
      .order('created_at', { ascending: false })
    
    const vehicles = ((vehiclesData || []) as unknown) as DbVehicle[]
    const inspections = ((inspectionsData || []) as unknown) as DbInspection[]
    const maintenanceTasks = ((maintenanceTasksData || []) as unknown) as DbMaintenanceTask[]
    
    const stats = {
      totalVehicles: vehicles.length || 0,
      activeVehicles: vehicles.filter(v => v.status === 'active').length || 0,
      vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length || 0,
      totalInspections: inspections.length || 0,
      completedInspections: inspections.filter(i => i.status === 'completed').length || 0,
      pendingInspections: inspections.filter(i => i.status === 'pending').length || 0,
      failedInspections: inspections.filter(i => i.status === 'failed').length || 0,
      totalMaintenanceTasks: maintenanceTasks.length || 0,
      completedTasks: maintenanceTasks.filter(t => t.status === 'completed').length || 0,
      pendingTasks: maintenanceTasks.filter(t => t.status === 'pending').length || 0,
      overdueTasks: maintenanceTasks.filter(t => t.status === 'overdue').length || 0
    }

    return {
      vehicles,
      inspections,
      maintenanceTasks,
      stats,
      metadata: {
        generated_at: new Date().toISOString(),
        cache_hit: false,
        optimized: false,
        fallback: true
      }
    }
  } catch (error) {
    console.error('Fallback dashboard data error:', error)
    throw error
  }
}

/**
 * Invalidate dashboard cache
 */
export async function invalidateDashboardCache() {
  try {
    await cache.invalidateByTags([CacheTags.dashboard])
    return { success: true }
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const stats = await cache.getStats()
    return {
      ...stats,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Cache stats error:', error)
    return {
      memory_usage: 'Unknown',
      connected_clients: 0,
      total_commands_processed: 0,
      error: error.message
    }
  }
}
