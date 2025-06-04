"use client"

import { useState, useEffect, useMemo, FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { formatDate } from "@/lib/utils/date-utils"
import { CheckCircle, Clock, Plus, AlertTriangle, CalendarDays, SettingsIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

interface MaintenanceScheduleItem {
  id: string
  vehicle_id: string
  service_type: string // e.g., 'oil_change', 'tire_rotation'
  status: "scheduled" | "completed" | "overdue" | "cancelled"
  due_date: string
  completed_date?: string | null
  notes?: string | null
  created_at: string
}

interface MaintenanceScheduleProps {
  vehicleId: string
}

// Placeholder: Replace with actual Supabase queries
async function fetchMaintenanceScheduleItems(supabase: any, vehicleId: string): Promise<MaintenanceScheduleItem[]> {
  // const { data, error } = await supabase
  //   .from('vehicle_maintenance_schedule')
  //   .select('*')
  //   .eq('vehicle_id', vehicleId)
  //   .order('due_date', { ascending: true });
  // if (error) throw error;
  // return data || [];
  await new Promise(resolve => setTimeout(resolve, 1000));
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  return [
    { id: 'task1', vehicle_id: vehicleId, service_type: 'oil_change', due_date: tomorrow.toISOString(), status: 'scheduled', created_at: today.toISOString() },
    { id: 'task2', vehicle_id: vehicleId, service_type: 'tire_rotation', due_date: nextWeek.toISOString(), status: 'scheduled', notes: 'Check tread depth', created_at: today.toISOString() },
    { id: 'task3', vehicle_id: vehicleId, service_type: 'brake_inspection', due_date: lastWeek.toISOString(), status: 'overdue', created_at: today.toISOString() },
    { id: 'task4', vehicle_id: vehicleId, service_type: 'annual_service', due_date: new Date(today.getFullYear(), today.getMonth()-1, 1).toISOString(), status: 'completed', completed_date: new Date(today.getFullYear(), today.getMonth()-1, 1).toISOString(), created_at: today.toISOString() },
  ].filter(task => task.status !== 'completed') as MaintenanceScheduleItem[]; // Added type assertion
}

async function addMaintenanceScheduleItem(supabase: any, vehicleId: string, item: Omit<MaintenanceScheduleItem, "id" | "vehicle_id" | "created_at" | "status">): Promise<MaintenanceScheduleItem> {
  const newItem: MaintenanceScheduleItem = {
    id: `new-${Date.now().toString()}`,
    vehicle_id: vehicleId,
    ...item,
    status: "scheduled", 
    created_at: new Date().toISOString(),
  };
  // const { data, error } = await supabase
  //   .from('vehicle_maintenance_schedule')
  //   .insert({ ...newItem, vehicle_id: vehicleId })
  //   .select()
  //   .single();
  // if (error) throw error;
  // return data;
  await new Promise(resolve => setTimeout(resolve, 700));
  return newItem;
}

async function updateMaintenanceScheduleItemStatus(supabase: any, itemId: string, status: "completed" | "cancelled", completed_date?: string): Promise<MaintenanceScheduleItem> {
  // const { data, error } = await supabase
  //   .from('vehicle_maintenance_schedule')
  //   .update({ status, completed_date: status === 'completed' ? (completed_date || new Date().toISOString()) : null })
  //   .eq('id', itemId)
  //   .select()
  //   .single();
  // if (error) throw error;
  // return data;
  await new Promise(resolve => setTimeout(resolve, 500));
  // This is a mock, so we'd need to fetch the item or have it passed to update it correctly.
  // For now, just returning a pseudo-updated item structure.
  return { id: itemId, status, completed_date: status === 'completed' ? new Date().toISOString() : undefined } as MaintenanceScheduleItem;
}

export function MaintenanceSchedule({ vehicleId }: MaintenanceScheduleProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [scheduledItems, setScheduledItems] = useState<MaintenanceScheduleItem[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDateOnForm, setSelectedDateOnForm] = useState<Date | undefined>(new Date())
  const [taskTypeOnForm, setTaskTypeOnForm] = useState<string>("")
  const [notesOnForm, setNotesOnForm] = useState<string>("")

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicleId) {
      setIsDataLoading(false)
      setError(t('vehicles.maintenance.schedule.errors.missingVehicleId'))
      return
    }
    async function loadTasks() {
      setIsDataLoading(true)
      setError(null)
      try {
        const data = await fetchMaintenanceScheduleItems(supabase, vehicleId)
        setScheduledItems(data)
      } catch (err) {
        console.error(err)
        setError(t('vehicles.maintenance.schedule.errors.loadFailed'))
        toast({ title: t('common.error'), description: t('vehicles.maintenance.schedule.errors.loadFailed'), variant: "destructive" })
      }
      setIsDataLoading(false)
    }
    loadTasks()
  }, [vehicleId, supabase, t, toast])

  const handleSubmitAddTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDateOnForm || !taskTypeOnForm) {
      toast({ title: t('common.error'), description: t('vehicles.maintenance.schedule.errors.missingFields'), variant: "destructive" })
      return
    }
    setIsSubmittingTask(true)
    try {
      const newItem = await addMaintenanceScheduleItem(supabase, vehicleId, {
        service_type: taskTypeOnForm,
        due_date: selectedDateOnForm.toISOString(),
        notes: notesOnForm,
      })
      setScheduledItems(prev => [...prev, newItem].sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()))
      toast({ title: t('common.success'), description: t('vehicles.maintenance.schedule.addedSuccessfully') })
      setIsFormOpen(false)
      setSelectedDateOnForm(new Date())
      setTaskTypeOnForm("")
      setNotesOnForm("")
    } catch (err) {
      console.error(err)
      toast({ title: t('common.error'), description: t('vehicles.maintenance.schedule.errors.addFailed'), variant: "destructive" })
    }
    setIsSubmittingTask(false)
  }

  const handleCompleteTask = async (itemId: string) => {
    // Add a submitting state per item if needed, for now global isSubmittingTask for simplicity or disable button
    try {
      await updateMaintenanceScheduleItemStatus(supabase, itemId, "completed")
      setScheduledItems(prev => prev.filter(task => task.id !== itemId)) // Optimistically remove completed task
      toast({ title: t('common.success'), description: t('vehicles.maintenance.schedule.completedSuccessfully') })
    } catch (err) {
      console.error(err)
      toast({ title: t('common.error'), description: t('vehicles.maintenance.schedule.errors.completeFailed'), variant: "destructive" })
    }
  }
  
  const getStatusBadgeInfo = (status: MaintenanceScheduleItem['status']) => {
    switch (status) {
      case 'completed': return { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, textClass: 'text-green-600' };
      case 'scheduled': return { variant: 'secondary', icon: <CalendarDays className="h-3 w-3" />, textClass: 'text-blue-600' };
      case 'overdue': return { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" />, textClass: 'text-red-600' };
      case 'cancelled': return { variant: 'outline', icon: <Clock className="h-3 w-3" />, textClass: 'text-gray-500' };
      default: return { variant: 'outline', icon: <SettingsIcon className="h-3 w-3" />, textClass: 'text-gray-700' };
    }
  }

  if (isDataLoading) {
    return <MaintenanceScheduleSkeleton />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.maintenance.schedule.title")}</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("vehicles.maintenance.schedule.addTaskButton")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{t("vehicles.maintenance.schedule.addTaskDialogTitle")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAddTask} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-type">{t("vehicles.maintenance.schedule.form.typeLabel")}</Label>
                <Select name="type" required value={taskTypeOnForm} onValueChange={setTaskTypeOnForm}>
                  <SelectTrigger id="task-type">
                    <SelectValue placeholder={t("vehicles.maintenance.schedule.form.typePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oil_change">{t("vehicles.maintenance.schedule.serviceTypes.oil_change")}</SelectItem>
                    <SelectItem value="tire_rotation">{t("vehicles.maintenance.schedule.serviceTypes.tire_rotation")}</SelectItem>
                    <SelectItem value="brake_service">{t("vehicles.maintenance.schedule.serviceTypes.brake_service")}</SelectItem>
                    <SelectItem value="annual_service">{t("vehicles.maintenance.schedule.serviceTypes.annual_service")}</SelectItem>
                    <SelectItem value="other">{t("vehicles.maintenance.schedule.serviceTypes.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-date">{t("vehicles.maintenance.schedule.form.dueDateLabel")}</Label>
                <Calendar
                  id="due-date"
                  mode="single"
                  selected={selectedDateOnForm}
                  onSelect={setSelectedDateOnForm}
                  className="rounded-md border w-full"
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("vehicles.maintenance.schedule.form.notesLabel")}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={notesOnForm}
                  onChange={(e) => setNotesOnForm(e.target.value)}
                  placeholder={t("vehicles.maintenance.schedule.form.notesPlaceholder")}
                />
              </div>
              <DialogFooter className="pt-2">
                <DialogClose asChild>
                   <Button type="button" variant="outline" disabled={isSubmittingTask}>{t("common.cancel")}</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingTask} className="min-w-[100px]">
                  {isSubmittingTask ? t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
        {!error && !isDataLoading && scheduledItems.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("vehicles.maintenance.schedule.noTasks")}
          </p>
        )}
        {!error && scheduledItems.length > 0 && (
          <div className="space-y-3 pt-2">
            {scheduledItems.map((task) => {
              const statusInfo = getStatusBadgeInfo(task.status)
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium capitalize">
                      {task.service_type.split('_').join(' ')}
                    </p>
                    <div className={`flex items-center gap-1.5 text-xs ${statusInfo.textClass}`}>
                      {statusInfo.icon}
                      <span>{t(`vehicles.maintenance.schedule.status.${task.status}`)}: {formatDate(task.due_date)}</span>
                    </div>
                    {task.notes && <p className="text-xs text-muted-foreground pt-0.5">{task.notes}</p>}
                  </div>
                  {task.status !== "completed" && task.status !== "cancelled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCompleteTask(task.id)}
                      className="text-green-600 hover:text-green-700 h-8 w-8"
                      title={t("vehicles.maintenance.schedule.markCompleteTooltip")}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MaintenanceScheduleSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
            <div className="space-y-1 w-3/4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 