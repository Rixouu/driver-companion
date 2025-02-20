"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle, MaintenanceTask, Inspection } from "@/types"
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
import Link from "next/link"

interface VehicleScheduleProps {
  vehicle: DbVehicle
}

export function VehicleSchedule({ vehicle }: VehicleScheduleProps) {
  const router = useRouter()

  return (
    <div className="grid gap-6">
      {/* Maintenance Tasks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Maintenance Tasks</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage vehicle maintenance tasks
              </p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href={`/vehicles/${vehicle.id}/maintenance/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.maintenance_tasks?.map((task) => (
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/maintenance/${task.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!vehicle.maintenance_tasks || vehicle.maintenance_tasks.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No maintenance tasks scheduled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {vehicle.maintenance_tasks?.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{task.title}</h3>
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
                </div>
                <div className="text-sm text-muted-foreground">
                  Due: {formatDate(task.due_date)}
                </div>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href={`/maintenance/${task.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ))}
            {(!vehicle.maintenance_tasks || vehicle.maintenance_tasks.length === 0) && (
              <div className="text-center text-muted-foreground py-4">
                No maintenance tasks scheduled.
              </div>
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
                Schedule and track inspections
              </p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href={`/vehicles/${vehicle.id}/inspections/schedule`}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.inspections?.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="capitalize">
                      {inspection.schedule_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>{formatDate(inspection.due_date)}</TableCell>
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inspections/${inspection.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!vehicle.inspections || vehicle.inspections.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No inspections scheduled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {vehicle.inspections?.map((inspection) => (
              <div
                key={inspection.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize">
                    {inspection.schedule_type?.replace('_', ' ')}
                  </h3>
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
                </div>
                <div className="text-sm text-muted-foreground">
                  Due: {formatDate(inspection.due_date)}
                </div>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href={`/inspections/${inspection.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ))}
            {(!vehicle.inspections || vehicle.inspections.length === 0) && (
              <div className="text-center text-muted-foreground py-4">
                No inspections scheduled.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}