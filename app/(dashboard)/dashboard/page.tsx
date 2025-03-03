"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Gauge, Car, Wrench, ClipboardCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { useEffect, useState } from "react"

interface Vehicle {
  id: string
  name: string
  plate_number: string
}

interface Inspection {
  id: string
  vehicle_id: string
  inspector_id: string
  status: string
  date: string
  due_date: string
  schedule_type: string
  vehicle: Vehicle
}

interface MaintenanceTask {
  id: string
  title: string
  status: string
  priority: string
  due_date: string
  completed_date: string
  vehicle: Vehicle
}

export default function DashboardPage() {
  const supabase = createClientComponentClient()
  const { t } = useI18n()
  const [stats, setStats] = useState<any[]>([])
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [totalInspections, setTotalInspections] = useState(0)
  const [totalMaintenance, setTotalMaintenance] = useState(0)
  const [scheduledMaintenance, setScheduledMaintenance] = useState<MaintenanceTask[]>([])
  const [scheduledInspections, setScheduledInspections] = useState<Inspection[]>([])
  const [completedMaintenance, setCompletedMaintenance] = useState<MaintenanceTask[]>([])
  const [completedInspections, setCompletedInspections] = useState<Inspection[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch stats
        const { data: statsData } = await supabase
          .from('vehicles')
          .select('status', { count: 'exact' })
        setStats(statsData || [])

        const { count: vehiclesCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact' })
        setTotalVehicles(vehiclesCount || 0)

        const { count: inspectionsCount } = await supabase
          .from('inspections')
          .select('*', { count: 'exact' })
        setTotalInspections(inspectionsCount || 0)

        const { count: maintenanceCount } = await supabase
          .from('maintenance_tasks')
          .select('*', { count: 'exact' })
        setTotalMaintenance(maintenanceCount || 0)

        // Fetch scheduled maintenance
        const { data: scheduledMaintenanceData } = await supabase
          .from('maintenance_tasks')
          .select(`
            *,
            vehicle:vehicles (id, name, plate_number)
          `)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
          .limit(2)
        setScheduledMaintenance(scheduledMaintenanceData as MaintenanceTask[] || [])

        // Fetch scheduled inspections
        const { data: scheduledInspectionsData } = await supabase
          .from('inspections')
          .select(`
            id,
            vehicle_id,
            inspector_id,
            status,
            date,
            due_date,
            schedule_type,
            vehicle:vehicles (id, name, plate_number)
          `)
          .eq('status', 'scheduled')
          .order('due_date', { ascending: true })
          .limit(2)
        setScheduledInspections(scheduledInspectionsData as unknown as Inspection[] || [])

        // Fetch completed maintenance
        const { data: completedMaintenanceData } = await supabase
          .from('maintenance_tasks')
          .select(`
            *,
            vehicle:vehicles (id, name, plate_number)
          `)
          .eq('status', 'completed')
          .order('completed_date', { ascending: false })
          .limit(2)
        setCompletedMaintenance(completedMaintenanceData as MaintenanceTask[] || [])

        // Fetch completed inspections
        const { data: completedInspectionsData } = await supabase
          .from('inspections')
          .select(`
            id,
            vehicle_id,
            inspector_id,
            status,
            date,
            due_date,
            schedule_type,
            vehicle:vehicles (id, name, plate_number)
          `)
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(2)
        setCompletedInspections(completedInspectionsData as unknown as Inspection[] || [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadDashboardData()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/vehicles">
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Car className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalVehicles || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.stats.totalVehicles")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/maintenance">
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Wrench className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalMaintenance || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.stats.maintenanceTasks")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inspections">
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalInspections || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.stats.inspections")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link 
          href="/vehicles?status=active"
          className="block"
        >
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Gauge className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.filter(v => v.status === 'active').length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.stats.activeVehicles")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Scheduled Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Maintenance Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.sections.maintenanceSchedule.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledMaintenance?.map((task) => (
                <Link 
                  key={task.id} 
                  href={`/maintenance/${task.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.vehicle.name} • {t("dashboard.labels.due", { date: formatDate(task.due_date) })}
                      </p>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                      {t(`dashboard.labels.priority.${task.priority}`)}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(!scheduledMaintenance || scheduledMaintenance.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("dashboard.sections.maintenanceSchedule.noPending")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.sections.inspectionSchedule.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledInspections?.map((inspection) => (
                <Link 
                  key={inspection.id} 
                  href={`/inspections/${inspection.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <div className="space-y-1">
                      <p className="font-medium">{inspection.vehicle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspection.schedule_type} • {t("dashboard.labels.due", { date: formatDate(inspection.due_date) })}
                      </p>
                    </div>
                    <Badge>{t("dashboard.labels.status.scheduled")}</Badge>
                  </div>
                </Link>
              ))}
              {(!scheduledInspections || scheduledInspections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("dashboard.sections.inspectionSchedule.noScheduled")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Completed Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.sections.recentMaintenance.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedMaintenance?.map((task) => (
                <Link 
                  key={task.id} 
                  href={`/maintenance/${task.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.vehicle.name} • {t("dashboard.sections.recentMaintenance.completedOn", { date: formatDate(task.completed_date) })}
                      </p>
                    </div>
                    <Badge variant="success">{t("maintenance.status.completed")}</Badge>
                  </div>
                </Link>
              ))}
              {(!completedMaintenance || completedMaintenance.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("dashboard.sections.recentMaintenance.noCompleted")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.sections.recentInspections.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedInspections?.map((inspection) => (
                <Link 
                  key={inspection.id} 
                  href={`/inspections/${inspection.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <div className="space-y-1">
                      <p className="font-medium">{inspection.vehicle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspection.schedule_type} • {t("dashboard.sections.recentInspections.completedOn", { date: formatDate(inspection.date) })}
                      </p>
                    </div>
                    <Badge variant="success">{t("inspections.status.completed")}</Badge>
                  </div>
                </Link>
              ))}
              {(!completedInspections || completedInspections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("dashboard.sections.recentInspections.noCompleted")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 