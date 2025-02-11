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
          <CardTitle>{t("vehicles.management.maintenance.schedule")}</CardTitle>
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("vehicles.management.maintenance.addTask")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("vehicles.management.maintenance.addTask")}</DialogTitle>
                <DialogDescription>
                  {t("vehicles.management.maintenance.addTaskDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t("vehicles.management.maintenance.types.title")}</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value) => setNewTask({ ...newTask, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={t("vehicles.management.maintenance.selectType")} 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oil">
                        {t("vehicles.management.maintenance.types.oil")}
                      </SelectItem>
                      <SelectItem value="tire">
                        {t("vehicles.management.maintenance.types.tire")}
                      </SelectItem>
                      <SelectItem value="brake">
                        {t("vehicles.management.maintenance.types.brake")}
                      </SelectItem>
                      <SelectItem value="filter">
                        {t("vehicles.management.maintenance.types.filter")}
                      </SelectItem>
                      <SelectItem value="battery">
                        {t("vehicles.management.maintenance.types.battery")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("vehicles.management.maintenance.intervals.days")}</Label>
                  <Input
                    type="number"
                    value={newTask.intervalDays}
                    onChange={(e) => setNewTask({ 
                      ...newTask, 
                      intervalDays: parseInt(e.target.value) 
                    })}
                  />
                </div>
                <div>
                  <Label>{t("vehicles.management.maintenance.intervals.kilometers")}</Label>
                  <Input
                    type="number"
                    value={newTask.intervalKm}
                    onChange={(e) => setNewTask({ 
                      ...newTask, 
                      intervalKm: parseInt(e.target.value) 
                    })}
                  />
                </div>
                <div>
                  <Label>{t("vehicles.management.maintenance.nextService")}</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border mt-2"
                  />
                </div>
                <div>
                  <Label>{t("vehicles.management.maintenance.notes")}</Label>
                  <Textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAddTask}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vehicles.management.maintenance.types.title")}</TableHead>
                <TableHead>{t("vehicles.management.maintenance.nextService")}</TableHead>
                <TableHead>{t("vehicles.management.maintenance.lastService")}</TableHead>
                <TableHead>{t("vehicles.management.maintenance.intervals.title")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    {t(`vehicles.management.maintenance.types.${task.type}`)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(task.dueDate, "PPP")}</span>
                      <span className={`text-sm ${
                        task.status === 'overdue' 
                          ? 'text-destructive' 
                          : 'text-muted-foreground'
                      }`}>
                        {t(`vehicles.management.maintenance.intervals.${task.status}`)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.lastCompleted 
                      ? format(task.lastCompleted, "PPP")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      <div>{task.intervalDays} {t("vehicles.management.maintenance.intervals.days")}</div>
                      <div>{task.intervalKm} {t("vehicles.management.maintenance.intervals.kilometers")}</div>
                    </div>
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