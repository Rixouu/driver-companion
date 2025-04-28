"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Pencil, CheckCircle, Calendar, Clock, DollarSign, Wrench, AlertTriangle, Tag, BarChart, Car, Hash, Truck, FileText, Repeat, AlertCircle } from "lucide-react"
import { formatDate, formatCurrency, formatCurrencyJP } from "@/lib/utils/formatting"
import { useI18n } from "@/lib/i18n/context"
import type { MaintenanceTask } from "@/types"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MaintenanceDetailsProps {
  task: MaintenanceTask
}

// Define ExtendedVehicle interface to include model property
interface ExtendedVehicle {
  id: string;
  name: string;
  plate_number: string;
  image_url?: string;
  brand?: string;
  model?: string;
}

export function MaintenanceDetails({ task: initialTask }: MaintenanceDetailsProps) {
  const { t, language } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [task, setTask] = useState({
    ...initialTask,
    vehicle: initialTask.vehicle as unknown as ExtendedVehicle
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function loadVehicleData() {
      try {
        if (task.vehicle?.id) {
          // Load vehicle data
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', task.vehicle.id)
            .single()

          if (vehicleError) throw vehicleError
          
          setTask({
            ...task,
            vehicle: vehicleData
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadVehicleData()
  }, [task.vehicle?.id])

  const formatCost = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return language === 'ja' ? '¥0' : '$0';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If Japanese, convert USD to JPY (approximate conversion)
    if (language === 'ja') {
      // Approximate conversion rate: 1 USD = 150 JPY
      const jpyValue = numValue * 150;
      return formatCurrencyJP(jpyValue);
    } else {
      return formatCurrency(numValue);
    }
  }

  async function handleComplete() {
    try {
      setIsUpdating(true)
      
      // Update the task status to completed
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString()
        })
        .eq('id', task.id)
        
      if (error) throw error
      
      // If this is a recurring task, generate the next task
      const recurringInfo = getRecurringInfo();
      if (recurringInfo && recurringInfo.scheduleId) {
        // Calculate the next due date based on frequency
        const nextDueDate = calculateNextDueDate(
          task.due_date,
          recurringInfo.frequency || '',
          recurringInfo.startDate || ''
        );
        
        // Check if we've reached the end date
        const hasReachedEndDate = recurringInfo.endDate && 
          new Date(nextDueDate) > new Date(recurringInfo.endDate);
          
        if (!hasReachedEndDate) {
          // Format recurring information for the notes
          const recurringInfoText = `
[${t('maintenance.recurringTask')} - ${recurringInfo.frequency}]
${t('schedules.startDate')}: ${recurringInfo.startDate}
${recurringInfo.endDate ? `${t('schedules.endDate')}: ${recurringInfo.endDate}` : ''}
${t('maintenance.schedule.id')}: ${recurringInfo.scheduleId}
`;

          // Get user notes part (if any)
          const userNotes = task.notes?.split('\n\n')[0] || '';
          
          // Combine user notes with recurring info
          const combinedNotes = userNotes 
            ? `${userNotes}\n\n${recurringInfoText}`
            : recurringInfoText;
            
          // Create the next task
          const nextTask = {
            vehicle_id: task.vehicle_id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: nextDueDate.toISOString().split('T')[0],
            status: 'scheduled',
            estimated_duration: task.estimated_duration,
            cost: task.cost,
            notes: combinedNotes,
            user_id: task.user_id
          };
          
          const { data: newTask, error: createError } = await supabase
            .from('maintenance_tasks')
            .insert(nextTask)
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating next task:', createError);
          } else {
            // Show a notification about the next task
            toast({
              title: t('maintenance.messages.nextTaskCreated'),
              description: t('maintenance.messages.nextTaskScheduled', {
                date: formatDate(nextDueDate.toISOString().split('T')[0])
              }),
            });
          }
        }
      }
      
      // Update the local state
      setTask({
        ...task,
        status: 'completed',
        completed_date: new Date().toISOString()
      })
      
      toast({
        title: t('maintenance.messages.updateSuccess'),
      })
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: t('maintenance.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Helper function to calculate the next due date based on frequency
  function calculateNextDueDate(
    currentDueDate: string,
    frequency: string,
    startDate: string
  ): Date {
    const date = new Date(currentDueDate);
    
    switch (frequency.toLowerCase()) {
      case t('schedules.frequencies.daily').toLowerCase():
        date.setDate(date.getDate() + 1);
        break;
      case t('schedules.frequencies.weekly').toLowerCase():
        date.setDate(date.getDate() + 7);
        break;
      case t('schedules.frequencies.biweekly').toLowerCase():
        date.setDate(date.getDate() + 14);
        break;
      case t('schedules.frequencies.monthly').toLowerCase():
        date.setMonth(date.getMonth() + 1);
        break;
      case t('schedules.frequencies.quarterly').toLowerCase():
        date.setMonth(date.getMonth() + 3);
        break;
      case t('schedules.frequencies.biannually').toLowerCase():
        date.setMonth(date.getMonth() + 6);
        break;
      case t('schedules.frequencies.annually').toLowerCase():
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        // Default to monthly if frequency is not recognized
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  async function handleStartTask() {
    try {
      setIsUpdating(true)
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()

      if (error) throw error

      // Update the local state with the updated task data
      if (data && data[0]) {
        setTask({
          ...task,
          status: 'in_progress',
          started_at: new Date().toISOString()
        });
      }

      toast({
        title: t('maintenance.messages.taskStarted'),
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('maintenance.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Calculate days until due or days overdue
  const getDueStatus = () => {
    if (!task.due_date) return { days: 0, isOverdue: false };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: Math.abs(diffDays),
      isOverdue: diffDays < 0
    };
  }
  
  const dueStatus = getDueStatus();

  // Extract recurring task information from notes
  const getRecurringInfo = () => {
    if (!task.notes) return null;
    
    // Check if notes contain recurring task information
    if (!task.notes.includes(`[${t('maintenance.recurringTask')}`)) return null;
    
    try {
      // Extract frequency from the notes
      const frequencyMatch = task.notes.match(/\[.*? - (.*?)\]/);
      const frequency = frequencyMatch ? frequencyMatch[1] : null;
      
      // Extract start date
      const startDateMatch = task.notes.match(new RegExp(`${t('schedules.startDate')}:\\s*(\\d{4}-\\d{2}-\\d{2})`));
      const startDate = startDateMatch ? startDateMatch[1] : null;
      
      // Extract end date if present
      const endDateMatch = task.notes.match(new RegExp(`${t('schedules.endDate')}:\\s*(\\d{4}-\\d{2}-\\d{2})`));
      const endDate = endDateMatch ? endDateMatch[1] : null;
      
      // Extract schedule ID
      const scheduleIdMatch = task.notes.match(new RegExp(`${t('maintenance.schedule.id')}:\\s*([\\w-]+)`));
      const scheduleId = scheduleIdMatch ? scheduleIdMatch[1] : null;
      
      if (frequency || startDate || endDate || scheduleId) {
        return { frequency, startDate, endDate, scheduleId };
      }
    } catch (error) {
      console.error('Error parsing recurring info:', error);
    }
    
    return null;
  };
  
  const recurringInfo = getRecurringInfo();

  return (
    <div className="space-y-6 mt-6">
      {/* Header Card */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm print-hide">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
              <Link href="/maintenance">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('common.backToList')}
                </Button>
              </Link>
              
              {task.status !== 'completed' && (
                <Link href={`/maintenance/${task.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2 sm:hidden">
                    <Pencil className="h-4 w-4" />
                    {t("common.edit")}
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {task.status !== 'completed' && (
                <Link href={`/maintenance/${task.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:inline-flex">
                    <Pencil className="h-4 w-4" />
                    {t("common.edit")}
                  </Button>
                </Link>
              )}
              
              {task.status === 'scheduled' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartTask}
                  disabled={isUpdating}
                  className="gap-2 flex-1 sm:flex-none justify-center"
                >
                  <Wrench className="h-4 w-4" />
                  {isUpdating ? t("common.saving") : t("maintenance.actions.startTask")}
                </Button>
              )}
              
              {task.status !== 'completed' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleComplete}
                  disabled={isUpdating}
                  className="gap-2 flex-1 sm:flex-none justify-center"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isUpdating ? t("common.saving") : t("maintenance.actions.markComplete")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Information Card */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{t('vehicles.vehicleInformation')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video w-full">
              {task.vehicle?.image_url ? (
                <Image
                  src={task.vehicle.image_url}
                  alt={task.vehicle?.name || ""}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">{t('maintenance.details.vehicleInfo.noImage')}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.name')}
                  </h3>
                </div>
                <p className="font-medium">{task.vehicle?.name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.plateNumber')}
                  </h3>
                </div>
                <p className="font-medium">{task.vehicle?.plate_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.brand')}
                  </h3>
                </div>
                <p>{task.vehicle?.brand || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.model')}
                  </h3>
                </div>
                <p>{task.vehicle?.model || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Details Card */}
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{t('maintenance.details.taskDetails')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Recurring Task Alert */}
            {recurringInfo && (
              <Alert className="bg-primary/10 border-primary/20">
                <Repeat className="h-4 w-4 text-primary" />
                <AlertTitle>{recurringInfo.frequency} {t('maintenance.recurringTask')}</AlertTitle>
                <AlertDescription className="space-y-2">
                  {recurringInfo.startDate && (
                    <div className="text-sm">
                      <span className="font-medium">{t('schedules.startDate')}:</span> {formatDate(recurringInfo.startDate)}
                    </div>
                  )}
                  {recurringInfo.endDate && (
                    <div className="text-sm">
                      <span className="font-medium">{t('schedules.endDate')}:</span> {formatDate(recurringInfo.endDate)}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.fields.title')}
                  </h3>
                </div>
                <p className="font-medium">{task.title}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.details.scheduledFor')}
                  </h3>
                </div>
                <p className="font-medium">{formatDate(task.due_date)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.fields.priority')}
                  </h3>
                </div>
                <div>
                  <Badge variant="outline">
                    {t(`maintenance.priority.${task.priority}`)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.details.estimatedCompletion')}
                  </h3>
                </div>
                <p className="font-medium">
                  {task.estimated_duration 
                    ? `${task.estimated_duration} ${t('maintenance.details.hours')}`
                    : '-'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.details.estimatedCost')}
                  </h3>
                </div>
                <p className="font-medium">
                  {task.cost ? formatCost(task.cost) : '-'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.fields.status')}
                  </h3>
                </div>
                <div>
                  <Badge variant={getStatusVariant(task.status)}>
                    {t(`maintenance.status.${task.status}`)}
                  </Badge>
                </div>
              </div>
            </div>

            {task.description && (
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.fields.description')}
                  </h3>
                </div>
                <p className="text-sm">{task.description}</p>
              </div>
            )}

            {/* Display notes without the recurring info */}
            {task.notes && (
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('maintenance.fields.notes')}
                  </h3>
                </div>
                <p className="text-sm whitespace-pre-line">
                  {recurringInfo 
                    ? task.notes.split('\n\n')[0] // Display only the user notes part
                    : task.notes
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Recommendations Card */}
        <Card className="shadow-sm overflow-hidden md:col-span-2">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">{t("maintenance.details.recommendations")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted/20 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {t("maintenance.details.recommendationItems.checkRelated")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("maintenance.details.recommendationItems.checkRelatedDesc")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/20 p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {t("maintenance.details.recommendationItems.trackCosts")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("maintenance.details.recommendationItems.trackCostsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success"
    case "in_progress":
      return "warning"
    case "scheduled":
    case "pending":
      return "secondary"
    case "overdue":
      return "destructive"
    default:
      return "default"
  }
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "warning"
    case "low":
      return "secondary"
    default:
      return "default"
  }
}

function getProgressValue(status: string): number {
  switch (status) {
    case "completed":
      return 100
    case "in_progress":
      return 50
    case "scheduled":
    case "pending":
      return 25
    case "overdue":
      return 25
    default:
      return 0
  }
}

function getProgressDescription(status: string, t: any): string {
  switch (status) {
    case "completed":
      return t("maintenance.details.progressStatus.completed")
    case "in_progress":
      return t("maintenance.details.progressStatus.inProgress")
    case "scheduled":
    case "pending":
      return t("maintenance.details.progressStatus.scheduled")
    case "overdue":
      return t("maintenance.details.progressStatus.overdue")
    default:
      return ""
  }
} 