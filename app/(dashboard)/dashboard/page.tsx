import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Gauge, Car, Wrench, ClipboardCheck } from "lucide-react"

// Add these interfaces
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

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Vehicle fleet management dashboard",
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch stats
  const { data: stats } = await supabase
    .from('vehicles')
    .select('status', { count: 'exact' })

  const { count: totalVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })

  const { count: totalInspections } = await supabase
    .from('inspections')
    .select('*', { count: 'exact' })

  const { count: totalMaintenance } = await supabase
    .from('maintenance_tasks')
    .select('*', { count: 'exact' })

  // Fetch scheduled maintenance (pending status)
  const { data: scheduledMaintenance } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (name, plate_number)
    `)
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(2)

  // Fetch scheduled inspections
  const { data: scheduledInspections } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (name, plate_number)
    `)
    .eq('status', 'scheduled')
    .order('due_date', { ascending: true })
    .limit(2)

  // Fetch recently completed maintenance
  const { data: completedMaintenance } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (name, plate_number)
    `)
    .eq('status', 'completed')
    .order('completed_date', { ascending: false })
    .limit(2)

  // Fetch recently completed inspections
  const { data: completedInspections } = await supabase
    .from('inspections')
    .select<any, Inspection>(`
      id,
      vehicle_id,
      inspector_id,
      status,
      date,
      schedule_type,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(2)

  return (
    <div className="space-y-6">
      {/* Make stats cards clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/vehicles">
          <Card className="hover:bg-accent transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Car className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalVehicles || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
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
                  <p className="text-sm text-muted-foreground">Maintenance Tasks</p>
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
                  <p className="text-sm text-muted-foreground">Inspections</p>
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
                  <p className="text-sm text-muted-foreground">Active Vehicles</p>
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
            <CardTitle>Maintenance Schedule</CardTitle>
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
                        {task.vehicle.name} • Due {formatDate(task.due_date)}
                      </p>
                    </div>
                    <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(!scheduledMaintenance || scheduledMaintenance.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending maintenance tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspection Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Schedule</CardTitle>
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
                        {inspection.schedule_type} • Due {formatDate(inspection.due_date)}
                      </p>
                    </div>
                    <Badge>Scheduled</Badge>
                  </div>
                </Link>
              ))}
              {(!scheduledInspections || scheduledInspections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No scheduled inspections
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
            <CardTitle>Recent Maintenance</CardTitle>
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
                        {task.vehicle.name} • Completed {formatDate(task.completed_date)}
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </Link>
              ))}
              {(!completedMaintenance || completedMaintenance.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed maintenance tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
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
                        {inspection.schedule_type} • Completed {formatDate(inspection.date)}
                      </p>
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </Link>
              ))}
              {(!completedInspections || completedInspections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed inspections
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 