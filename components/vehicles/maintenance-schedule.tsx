"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
interface MaintenanceTask {
  id: string
  type: string
  status: "scheduled" | "completed" | "overdue"
  dueDate: string
  completedDate?: string
  notes?: string
}

interface MaintenanceScheduleProps {
  vehicleId: string
  tasks?: MaintenanceTask[]
  onAddTask?: (task: Omit<MaintenanceTask, "id">) => Promise<void>
  onUpdateTask?: (id: string, status: "completed") => Promise<void>
}

export function MaintenanceSchedule({
  vehicleId,
  tasks = [],
  onAddTask,
  onUpdateTask,
}: MaintenanceScheduleProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDate) return
    
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await onAddTask?.({
        type: formData.get("type") as string,
        status: "scheduled",
        dueDate: selectedDate.toISOString(),
        notes: formData.get("notes") as string,
      })

      toast({
        title: "vehicles.maintenance.success",
        description: "vehicles.maintenance.successDescription",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "vehicles.maintenance.error",
        description: "vehicles.maintenance.errorDescription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    try {
      await onUpdateTask?.(taskId, "completed")
      toast({
        title: "vehicles.maintenance.taskCompleted",
        description: "vehicles.maintenance.taskCompletedDescription",
      })
    } catch (error) {
      toast({
        title: "vehicles.maintenance.error",
        description: "vehicles.maintenance.errorDescription",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{"vehicles.maintenance.schedule"}</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              {"vehicles.maintenance.addTask"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{"vehicles.maintenance.addTask"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{"vehicles.maintenance.type"}</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder={"vehicles.maintenance.selectType"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oil_change">
                      {"vehicles.maintenance.types.oil_change"}
                    </SelectItem>
                    <SelectItem value="tire_rotation">
                      {"vehicles.maintenance.types.tire_rotation"}
                    </SelectItem>
                    <SelectItem value="brake_service">
                      {"vehicles.maintenance.types.brake_service"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{"vehicles.maintenance.dueDate"}</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{"vehicles.maintenance.notes"}</Label>
                <Input
                  id="notes"
                  name="notes"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "common.saving" : "common.save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {task.type}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(task.dueDate), "PPP")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    task.status === "completed"
                      ? "default"
                      : task.status === "overdue"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {task.status}
                </Badge>
                {task.status !== "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleComplete(task.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {"vehicles.maintenance.noTasks"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 