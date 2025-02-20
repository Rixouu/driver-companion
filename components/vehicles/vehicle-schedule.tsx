"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"
import { Plus, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface VehicleScheduleProps {
  vehicle: DbVehicle & {
    maintenance_tasks?: Array<{
      id: string
      title: string
      status: string
      due_date: string
    }>,
    inspections?: Array<{
      id: string
      status: string
      date: string
      schedule_type: string
      due_date: string
      notes?: string
    }>
  }
}

export function VehicleSchedule({ vehicle }: VehicleScheduleProps) {
  const router = useRouter()

  const formatScheduleType = (type?: string) => {
    if (!type) return 'Unknown'
    return type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1)
  }

  const formatInspectionDate = (date?: string) => {
    if (!date) return 'Not set'
    return formatDate(date)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            Maintenance Schedule
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/vehicles/${vehicle.id}/maintenance/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </Button>
        </CardHeader>
        <CardContent>
          {vehicle.maintenance_tasks && vehicle.maintenance_tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.maintenance_tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{formatDate(task.due_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.status === "completed"
                            ? "success"
                            : task.status === "in_progress"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No scheduled maintenance tasks</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">
            Upcoming Inspections
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/vehicles/${vehicle.id}/inspections/schedule`)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Inspection
          </Button>
        </CardHeader>
        <CardContent>
          {vehicle.inspections && vehicle.inspections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="capitalize">
                      {formatScheduleType(inspection.schedule_type)}
                    </TableCell>
                    <TableCell>{formatInspectionDate(inspection.due_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inspection.status === "completed"
                            ? "success"
                            : inspection.status === "in_progress"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {inspection.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming inspections</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}