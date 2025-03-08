"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Pencil, CheckCircle, Calendar, Clock, DollarSign, Wrench, AlertTriangle, Tag, BarChart, Car, Hash, Truck, FileText } from "lucide-react"
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
    <div className="space-y-6 mt-6">
      {/* Header Card */}
      <Card className="rounded-lg border bg-card text-card-foreground shadow-sm print-hide">
        <CardHeader className="space-y-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              asChild
            >
              <Link href="/maintenance">
                <ArrowLeft className="h-4 w-4" />
                {t('common.backToList')}
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              {task.status !== 'completed' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link href={`/maintenance/${task.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    {t("common.edit")}
                  </Link>
                </Button>
              )}
              
              {task.status === 'scheduled' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartTask}
                  disabled={isUpdating}
                  className="gap-2"
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
                  className="gap-2"
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
            
            {/* Vehicle Maintenance History */}
            <div className="p-6 mt-4 border-t">
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

        {/* Task Details Card */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">{t("maintenance.details.taskDetails")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Task Title and Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold">{task.title}</h2>
                <div className="flex gap-2">
                  <Badge variant={getStatusVariant(task.status)}>
                    {t(`maintenance.status.${task.status}`)}
                  </Badge>
                  <Badge variant={getPriorityVariant(task.priority)}>
                    {t(`maintenance.priority.${task.priority}`)}
                  </Badge>
                </div>
              </div>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </div>
            
            {/* Task Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">
                    {t("maintenance.details.scheduledFor")}
                  </h3>
                  <p className="mt-1">{formatDate(task.due_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">
                    {t("maintenance.details.estimatedCompletion")}
                  </h3>
                  <p className="mt-1">{task.estimated_duration ? `${task.estimated_duration} ${t("maintenance.details.hours")}` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">
                    {t("maintenance.details.estimatedCost")}
                  </h3>
                  <p className="mt-1">{formatCost(task.cost)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">
                    {t("maintenance.fields.priority")}
                  </h3>
                  <p className="mt-1 capitalize">{t(`maintenance.priority.${task.priority}`)}</p>
                </div>
              </div>
            </div>
            
            {/* Task Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {t("maintenance.details.taskProgress")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {getProgressDescription(task.status, t)}
                </span>
              </div>
              <Progress value={getProgressValue(task.status)} className="h-2" />
            </div>
            
            {/* Notes */}
            {task.notes && (
              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t("maintenance.fields.notes")}
                </h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                </div>
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