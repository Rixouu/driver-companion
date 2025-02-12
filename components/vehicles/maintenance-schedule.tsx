"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/components/ui/use-toast"
import { format, addDays } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { MaintenanceCostTracker } from "./maintenance-cost-tracker"
import { MaintenanceHistory } from "./maintenance-history"
import { MaintenanceReminders } from "./maintenance-reminders"
import { Badge } from "@/components/ui/badge"

interface MaintenanceTask {
  id: string
  type: string
  dueDate: Date
  status: 'upcoming' | 'overdue' | 'completed'
  notes?: string
  lastCompleted?: Date
  intervalDays: number
  intervalKm?: number
}

interface MaintenanceScheduleProps {
  vehicleId: string
}

export function MaintenanceSchedule({ vehicleId }: MaintenanceScheduleProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [newTask, setNewTask] = useState({
    type: '',
    intervalDays: 30,
    intervalKm: 5000,
    notes: '',
  })

  // TODO: Replace with actual API call
  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: '1',
      type: 'oil',
      dueDate: addDays(new Date(), 7),
      status: 'upcoming',
      intervalDays: 90,
      intervalKm: 5000,
      lastCompleted: new Date(Date.now() - 83 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'tire',
      dueDate: addDays(new Date(), -2),
      status: 'overdue',
      intervalDays: 180,
      intervalKm: 10000,
      lastCompleted: new Date(Date.now() - 182 * 24 * 60 * 60 * 1000),
    },
  ]

  const handleAddTask = async () => {
    if (!selectedDate || !newTask.type) {
      toast({
        title: t("errors.error"),
        description: t("vehicles.management.maintenance.errors.missingFields"),
        variant: "destructive",
      })
      return
    }

    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.maintenance.taskAdded"),
    })

    setIsAddingTask(false)
    setNewTask({
      type: '',
      intervalDays: 30,
      intervalKm: 5000,
      notes: '',
    })
    setSelectedDate(undefined)
  }

  const handleCompleteTask = async (taskId: string) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.maintenance.taskCompleted"),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("vehicles.details.maintenance.schedule.title")}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAddingTask(true)}>
            {t("vehicles.details.maintenance.schedule.addTask")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vehicles.details.maintenance.types.title")}</TableHead>
                <TableHead>{t("vehicles.details.maintenance.schedule.nextService")}</TableHead>
                <TableHead>{t("vehicles.details.maintenance.schedule.lastService")}</TableHead>
                <TableHead>{t("vehicles.details.maintenance.schedule.days")}</TableHead>
                <TableHead>{t("vehicles.details.maintenance.schedule.kilometers")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    {t(`vehicles.details.maintenance.types.${task.type}`)}
                  </TableCell>
                  <TableCell>
                    {format(task.dueDate, "PPP")}
                    <span className={`text-sm ${
                      task.status === 'overdue' 
                        ? 'text-destructive' 
                        : 'text-muted-foreground'
                    }`}>
                      {t(`inspections.maintenanceSchedule.maintenanceStatus.${task.status}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {task.lastCompleted 
                      ? format(task.lastCompleted, "PPP")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {task.intervalDays} {t("vehicles.management.mileage.metrics.days")}
                  </TableCell>
                  <TableCell>
                    {task.intervalKm} {t("vehicles.management.mileage.metrics.kilometers")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      {t("status.completed")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <MaintenanceCostTracker vehicleId={vehicleId} />
      <MaintenanceHistory vehicleId={vehicleId} />
      <MaintenanceReminders vehicleId={vehicleId} />
    </div>
  )
} 