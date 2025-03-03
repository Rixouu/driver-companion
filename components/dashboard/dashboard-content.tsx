"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils"
import {
  Car,
  Wrench,
  ClipboardCheck,
  Gauge,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  History,
  Play,
  ArrowRight,
  BarChart3
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"

interface DashboardContentProps {
  stats: {
    totalVehicles: number
    activeVehicles: number
    maintenanceTasks: number
    inspections: number
    vehiclesInMaintenance: number
    scheduledInspections: number
    inProgressInspections: number
    completedInspections: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
  }
  recentInspections: DbInspection[]
  upcomingInspections: DbInspection[]
  recentMaintenance: DbMaintenanceTask[]
  upcomingMaintenance: DbMaintenanceTask[]
  inProgressItems: {
    inspections: DbInspection[]
    maintenance: DbMaintenanceTask[]
  }
  vehicles: DbVehicle[]
}

export function DashboardContent({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles
}: DashboardContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>

      {/* Quick Actions - Moved to Top */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
          <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/vehicles/new" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Car className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.addVehicle")}</span>
              </Button>
            </Link>
            <Link href="/maintenance/new" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Wrench className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleMaintenance")}</span>
              </Button>
            </Link>
            <Link href="/inspections/new" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleInspection")}</span>
              </Button>
            </Link>
            <Link href="/vehicles" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.viewReports")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Combined Maintenance and Inspection Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.maintenance.title")}</CardTitle>
            <CardDescription>{t("dashboard.maintenance.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in_progress" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="in_progress">
                  <Play className="mr-2 h-4 w-4" />
                  {t("common.status.inProgress")}
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("common.status.upcoming")}
                </TabsTrigger>
                <TabsTrigger value="recent">
                  <History className="mr-2 h-4 w-4" />
                  {t("common.status.recent")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in_progress" className="space-y-4">
                {inProgressItems.maintenance.length === 0 ? (
                  <EmptyState icon={Play} message={t("vehicles.tabs.scheduleEmpty")} />
                ) : (
                  inProgressItems.maintenance.map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingMaintenance.length === 0 ? (
                  <EmptyState icon={Calendar} message={t("vehicles.tabs.scheduleEmpty")} />
                ) : (
                  upcomingMaintenance.map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {recentMaintenance.length === 0 ? (
                  <EmptyState icon={History} message={t("dashboard.sections.recentMaintenance.noCompleted")} />
                ) : (
                  recentMaintenance.map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Inspections Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.inspections.title")}</CardTitle>
            <CardDescription>{t("dashboard.inspections.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in_progress" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="in_progress">
                  <Play className="mr-2 h-4 w-4" />
                  {t("common.status.inProgress")}
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("common.status.upcoming")}
                </TabsTrigger>
                <TabsTrigger value="recent">
                  <History className="mr-2 h-4 w-4" />
                  {t("common.status.recent")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in_progress" className="space-y-4">
                {inProgressItems.inspections.length === 0 ? (
                  <EmptyState icon={Play} message={t("vehicles.tabs.scheduleEmpty")} />
                ) : (
                  inProgressItems.inspections.map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingInspections.length === 0 ? (
                  <EmptyState icon={Calendar} message={t("vehicles.tabs.scheduleEmpty")} />
                ) : (
                  upcomingInspections.map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {recentInspections.length === 0 ? (
                  <EmptyState icon={History} message={t("dashboard.sections.recentInspections.noCompleted")} />
                ) : (
                  recentInspections.map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper Components
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function MaintenanceTaskCard({ task }: { task: DbMaintenanceTask }) {
  const { t } = useI18n()
  return (
    <Link href={`/maintenance/${task.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            {task.vehicle?.name} • {task.status === 'completed' ? 'Completed' : 'Due'} {formatDate(task.completed_date || task.due_date)}
          </p>
        </div>
        <Badge variant={
          task.status === 'completed' ? 'success' :
          task.priority === 'high' ? 'destructive' : 'secondary'
        }>
          {task.status === 'completed' ? 'Completed' : t(`maintenance.priority.${task.priority}`)}
        </Badge>
      </div>
    </Link>
  )
}

function InspectionCard({ inspection }: { inspection: DbInspection }) {
  const { t } = useI18n()
  return (
    <Link href={`/inspections/${inspection.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <p className="font-medium">{inspection.vehicle?.name}</p>
          <p className="text-sm text-muted-foreground">
            {t(`inspections.type.${inspection.type}`)} • {formatDate(inspection.date)}
          </p>
        </div>
        <Badge variant={
          inspection.status === 'completed' ? 'success' :
          inspection.status === 'in_progress' ? 'warning' : 'secondary'
        }>
          {inspection.status === 'completed' ? 'Completed' :
           inspection.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
        </Badge>
      </div>
    </Link>
  )
} 