'use server'

import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"

export async function getDashboardData() {
  try {
    // Create supabase client with proper handling of cookies
    const supabase = await getSupabaseServerClient()
    
    // Fetch vehicles data
    const { data: vehiclesData } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Fetch inspections with vehicle data
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
    
    // Fetch maintenance tasks
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
    
    // Cast data to the expected types using intermediate unknown cast
    const vehicles = ((vehiclesData || []) as unknown) as DbVehicle[]
    const inspections = ((inspectionsData || []) as unknown) as DbInspection[]
    const maintenanceTasks = ((maintenanceTasksData || []) as unknown) as DbMaintenanceTask[]
    
    // Calculate statistics
    const stats = {
      totalVehicles: vehicles.length || 0,
      activeVehicles: vehicles.filter(v => v.status === 'active').length || 0,
      maintenanceTasks: maintenanceTasks.length || 0,
      inspections: inspections.length || 0,
      vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length || 0,
      scheduledInspections: inspections.filter(i => i.status === 'scheduled').length || 0,
      inProgressInspections: inspections.filter(i => i.status === 'in_progress').length || 0,
      completedInspections: inspections.filter(i => i.status === 'completed').length || 0,
      pendingTasks: maintenanceTasks.filter(t => t.status === 'scheduled').length || 0,
      inProgressTasks: maintenanceTasks.filter(t => t.status === 'in_progress').length || 0,
      completedTasks: maintenanceTasks.filter(t => t.status === 'completed').length || 0,
    }

    // Get recent and upcoming items
    const recentInspections = inspections
      .filter(i => i.status === 'completed')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5)

    const upcomingInspections = inspections
      .filter(i => i.status === 'scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const recentMaintenance = maintenanceTasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5)

    const upcomingMaintenance = maintenanceTasks
      .filter(t => t.status === 'scheduled')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5)

    const inProgressItems = {
      inspections: inspections.filter(i => i.status === 'in_progress'),
      maintenance: maintenanceTasks.filter(t => t.status === 'in_progress')
    }

    return {
      stats,
      recentInspections,
      upcomingInspections,
      recentMaintenance,
      upcomingMaintenance,
      inProgressItems,
      vehicles
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return empty data with the correct types
    return {
      stats: {
        totalVehicles: 0,
        activeVehicles: 0,
        maintenanceTasks: 0,
        inspections: 0,
        vehiclesInMaintenance: 0,
        scheduledInspections: 0,
        inProgressInspections: 0,
        completedInspections: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      },
      recentInspections: [] as DbInspection[],
      upcomingInspections: [] as DbInspection[],
      recentMaintenance: [] as DbMaintenanceTask[],
      upcomingMaintenance: [] as DbMaintenanceTask[],
      inProgressItems: {
        inspections: [] as DbInspection[],
        maintenance: [] as DbMaintenanceTask[]
      },
      vehicles: [] as DbVehicle[]
    }
  }
} 