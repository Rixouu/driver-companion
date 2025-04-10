import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getVehicles } from "@/lib/services/vehicles"
import { getInspections } from "@/lib/services/inspections"
import { getMaintenanceTasks } from "@/lib/services/maintenance"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Vehicle fleet management dashboard",
}

export default async function DashboardPage() {
  // Get translations
  const { t } = await getDictionary()
  
  // Fetch all necessary data for the dashboard
  const { vehicles } = await getVehicles()
  const { inspections } = await getInspections()
  const { tasks: maintenanceTasks } = await getMaintenanceTasks()
  
  // Calculate statistics
  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    maintenanceTasks: maintenanceTasks.length,
    inspections: inspections.length,
    vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
    scheduledInspections: inspections.filter(i => i.status === 'scheduled').length,
    inProgressInspections: inspections.filter(i => i.status === 'in_progress').length,
    completedInspections: inspections.filter(i => i.status === 'completed').length,
    pendingTasks: maintenanceTasks.filter(t => t.status === 'scheduled').length,
    inProgressTasks: maintenanceTasks.filter(t => t.status === 'in_progress').length,
    completedTasks: maintenanceTasks.filter(t => t.status === 'completed').length,
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

  return (
    <DashboardContent
      stats={stats}
      recentInspections={recentInspections}
      upcomingInspections={upcomingInspections}
      recentMaintenance={recentMaintenance}
      upcomingMaintenance={upcomingMaintenance}
      inProgressItems={inProgressItems}
      vehicles={vehicles}
    />
  )
} 