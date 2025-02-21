"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { MaintenanceTaskWithVehicle } from "@/types/maintenance"
import { cn, formatDate } from "@/lib/utils"
import { 
  Car, 
  Calendar, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  Wrench,
  AlertTriangle,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

interface MaintenanceDetailsProps {
  task: MaintenanceTaskWithVehicle
}

export function MaintenanceDetails({ task }: MaintenanceDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: MaintenanceTaskWithVehicle['status']) => {
    try {
      setIsUpdating(true)
      
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({ 
          status: newStatus,
          completed_date: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: "Task status has been updated successfully",
      })

      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/maintenance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to maintenance</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            <p className="text-muted-foreground">
              View maintenance task details
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {task.status !== 'completed' && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Task
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/maintenance/${task.id}/edit`)}
            className="w-full sm:w-auto"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Vehicle</span>
                </div>
                <span>{task.vehicle.name} ({task.vehicle.plate_number})</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Due Date</span>
                </div>
                <span>{formatDate(task.due_date)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Priority</span>
                </div>
                <Badge variant={
                  task.priority === "High" 
                    ? "destructive" 
                    : task.priority === "Medium" 
                    ? "warning" 
                    : "secondary"
                }>
                  {task.priority}
                </Badge>
              </div>

              {task.estimated_duration && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <span>{task.estimated_duration} hours</span>
                </div>
              )}

              {task.cost && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cost</span>
                  </div>
                  <span>${task.cost.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <Badge 
                className={cn(
                  task.status === 'completed' && "bg-green-500",
                  task.status === 'overdue' && "bg-red-500",
                  task.status === 'in_progress' && "bg-blue-500",
                  task.status === 'pending' && "bg-yellow-500"
                )}
              >
                {task.status === 'in_progress' ? 'In Progress' : 
                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Description & Notes */}
        <div className="space-y-6">
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {task.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {task.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 