"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Pencil, CheckCircle, Calendar, Clock, DollarSign, Wrench, AlertTriangle, Tag, BarChart } from "lucide-react"
import { formatDate, formatCurrency, formatCurrencyJP } from "@/lib/utils/formatting"
import { useI18n } from "@/lib/i18n/context"
import type { MaintenanceTask } from "@/types"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface MaintenanceDetailsProps {
  task: MaintenanceTask
}

export function MaintenanceDetails({ task: initialTask }: MaintenanceDetailsProps) {
  const { t, language } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [task, setTask] = useState(initialTask)
  const [isUpdating, setIsUpdating] = useState(false)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceTask[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

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
          
          // Load maintenance history for this vehicle
          const { data: historyData, error: historyError } = await supabase
            .from('maintenance_tasks')
            .select('*')
            .eq('vehicle_id', task.vehicle.id)
            .order('due_date', { ascending: false })
            .limit(5)
            
          if (historyError) throw historyError
          
          setTask({
            ...task,
            vehicle: vehicleData
          })
          
          setMaintenanceHistory(historyData || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingHistory(false)
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
      
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      toast({
        title: t('maintenance.messages.updateSuccess'),
      })

      // Redirect back to the vehicle details page
      router.push(`/vehicles/${task.vehicle_id}`)
      router.refresh()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            asChild
          >
            <Link href="/maintenance" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo", { page: t("maintenance.title").toLowerCase() })}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">
            {t("maintenance.details.scheduledFor", { date: formatDate(task.due_date) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/maintenance/${task.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("maintenance.actions.edit")}
            </Link>
          </Button>
          {task.status === 'scheduled' && (
            <Button
              variant="default"
              onClick={handleStartTask}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Wrench className="mr-2 h-4 w-4" />
              {isUpdating ? t("common.saving") : t("maintenance.actions.startTask")}
            </Button>
          )}
          <Button
            variant="default"
            onClick={handleComplete}
            disabled={task.status === 'completed' || isUpdating}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isUpdating ? t("common.saving") : t("maintenance.actions.markComplete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("maintenance.details.vehicleDetails")}</CardTitle>
                <CardDescription>{task.vehicle?.name}</CardDescription>
              </div>
              <Badge variant={getStatusVariant(task.status)}>
                {t(`maintenance.status.${task.status}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden">
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
                  <p className="text-muted-foreground">{t('inspections.details.vehicleInfo.noImage')}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  {t("vehicles.fields.plateNumber")}
                </h3>
                <p>{task.vehicle?.plate_number}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">
                  {t("vehicles.fields.brand")}
                </h3>
                <p>{task.vehicle?.brand || 'N/A'}</p>
              </div>
            </div>
            
            {/* Vehicle Maintenance History */}
            <div className="pt-4 mt-4 border-t">
              <h3 className="font-medium mb-3">{t("maintenance.details.taskHistory")}</h3>
              {isLoadingHistory ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                </div>
              ) : maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceHistory.slice(0, 3).map((historyItem) => (
                    <div 
                      key={historyItem.id} 
                      className={`p-3 rounded-lg border ${historyItem.id === task.id ? 'bg-muted/50 border-primary' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{historyItem.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(historyItem.due_date)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(historyItem.status)}>
                          {t(`maintenance.status.${historyItem.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("maintenance.details.noHistory")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("maintenance.details.taskDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Task Status Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{t("maintenance.fields.dueDate")}</h3>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">{formatDate(task.due_date)}</p>
                    {dueStatus.days > 0 && (
                      <p className={`text-sm font-medium ${dueStatus.isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                        {dueStatus.isOverdue 
                          ? t("maintenance.details.overdueDays", { days: dueStatus.days.toString() })
                          : t("maintenance.details.daysUntilDue", { days: dueStatus.days.toString() })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{t("maintenance.fields.priority")}</h3>
                  </div>
                  <div className="mt-2">
                    <Badge variant={getPriorityVariant(task.priority)}>
                      {t(`maintenance.priority.${task.priority}`)}
                    </Badge>
                  </div>
                </div>
                
                {task.estimated_duration && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{t("maintenance.fields.estimatedDuration")}</h3>
                    </div>
                    <div className="mt-2">
                      <p className="text-lg font-semibold">
                        {task.estimated_duration} <span className="text-sm font-normal text-muted-foreground">{t("maintenance.details.hours")}</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {task.cost && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{t("maintenance.fields.cost")}</h3>
                    </div>
                    <div className="mt-2">
                      <p className="text-lg font-semibold">{formatCost(task.cost)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Task Progress */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{t("maintenance.details.taskProgress")}</h3>
                  <Badge variant={getStatusVariant(task.status)}>
                    {t(`maintenance.status.${task.status}`)}
                  </Badge>
                </div>
                <Progress value={getProgressValue(task.status)} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {getProgressDescription(task.status, t)}
                </p>
              </div>
              
              {/* Description */}
              {task.description && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">{t("maintenance.fields.description")}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              
              {/* Notes */}
              {task.notes && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">{t("maintenance.fields.notes")}</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Maintenance Recommendations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                {t("maintenance.details.recommendations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium">{t("maintenance.details.recommendationItems.checkRelated")}</p>
                    <p className="text-sm text-muted-foreground">{t("maintenance.details.recommendationItems.checkRelatedDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                    <BarChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{t("maintenance.details.recommendationItems.trackCosts")}</p>
                    <p className="text-sm text-muted-foreground">{t("maintenance.details.recommendationItems.trackCostsDesc")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
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