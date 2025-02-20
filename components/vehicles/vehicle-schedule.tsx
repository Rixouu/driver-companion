"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface VehicleScheduleProps {
  vehicle: DbVehicle
}

export function VehicleSchedule({ vehicle }: VehicleScheduleProps) {
  const router = useRouter()

  // Filter maintenance tasks to show only scheduled ones
  const scheduledMaintenance = vehicle.maintenance_tasks?.filter(
    task => task.status === 'scheduled' || task.status === 'pending'
  ) || []

  // Filter inspections to show scheduled and in progress
  const activeInspections = vehicle.inspections?.filter(
    inspection => ['scheduled', 'in_progress'].includes(inspection.status)
  ) || []

  return (
    <div className="grid gap-6">
      {/* Maintenance Tasks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Maintenance Tasks</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Scheduled maintenance tasks
              </p>
            </div>
            <Button 
              asChild 
              size="sm" 
              className="w-full sm:w-auto"
            >
              <Link href={`/vehicles/${vehicle.id}/maintenance/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduledMaintenance.map((task) => (
              <Link 
                key={task.id} 
                href={`/maintenance/${task.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(task.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>
                      {task.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            {scheduledMaintenance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scheduled maintenance tasks.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inspections */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Inspections</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Scheduled and ongoing inspections
              </p>
            </div>
            <Button 
              asChild 
              size="sm" 
              className="w-full sm:w-auto"
            >
              <Link href={`/vehicles/${vehicle.id}/inspections/schedule`}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Inspection
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeInspections.map((inspection) => (
              <Link 
                key={inspection.id} 
                href={`/inspections/${inspection.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                  <div className="space-y-1">
                    <p className="font-medium">{inspection.schedule_type} Inspection</p>
                    <p className="text-sm text-muted-foreground">
                      Due {formatDate(inspection.due_date)}
                    </p>
                  </div>
                  <Badge variant={inspection.status === 'in_progress' ? 'warning' : 'secondary'}>
                    {inspection.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                  </Badge>
                </div>
              </Link>
            ))}
            {activeInspections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active inspections.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}