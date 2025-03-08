"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleSelector } from "@/components/vehicle-selector"
import { useI18n } from "@/lib/i18n/context"
import { maintenanceSchema } from "@/lib/validations/maintenance"
import type { MaintenanceFormData } from "@/lib/validations/maintenance"
import { Wrench } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createMaintenanceTask, updateMaintenanceTask } from "@/lib/services/maintenance"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils/styles"

interface MaintenanceFormProps {
  initialData?: MaintenanceFormData & { id?: string }
  mode?: 'create' | 'edit'
}

export function MaintenanceForm({ initialData, mode = 'create' }: MaintenanceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // Get prefilled data from URL if coming from an inspection
  const prefilledTitle = searchParams.get('title') || initialData?.title || ""
  const prefilledDescription = searchParams.get('description') || initialData?.description || ""
  const prefilledVehicleId = searchParams.get('vehicle_id') || initialData?.vehicle_id || ""
  const prefilledPriority = searchParams.get('priority') || initialData?.priority || "medium"
  const prefilledStatus = searchParams.get('status') || initialData?.status || "scheduled"
  const inspectionId = searchParams.get('inspection_id') || ""
  
  // Set a default due date for 7 days from now if creating a new task
  const defaultDueDate = mode === 'create' 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : initialData?.due_date || ""

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: prefilledTitle,
      description: prefilledDescription,
      vehicle_id: prefilledVehicleId,
      due_date: defaultDueDate,
      priority: prefilledPriority as "low" | "medium" | "high",
      status: prefilledStatus as "scheduled" | "in_progress" | "completed",
      estimated_duration: initialData?.estimated_duration?.toString() || "",
      cost: initialData?.cost?.toString() || "",
      notes: initialData?.notes || "",
    },
  })

  // Update form values if URL parameters change
  useEffect(() => {
    if (searchParams.get('title')) {
      form.setValue('title', searchParams.get('title') || "")
    }
    if (searchParams.get('description')) {
      form.setValue('description', searchParams.get('description') || "")
    }
    if (searchParams.get('vehicle_id')) {
      form.setValue('vehicle_id', searchParams.get('vehicle_id') || "")
    }
    if (searchParams.get('priority')) {
      form.setValue('priority', (searchParams.get('priority') as "low" | "medium" | "high") || "medium")
    }
    if (searchParams.get('status')) {
      form.setValue('status', (searchParams.get('status') as "scheduled" | "in_progress" | "completed") || "scheduled")
    }
  }, [searchParams, form])

  async function onSubmit(data: MaintenanceFormData) {
    if (!user?.id) return

    try {
      setIsLoading(true)

      const formattedData = {
        ...data,
        user_id: user.id,
        estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        status: data.status as 'scheduled' | 'in_progress' | 'completed',
        inspection_id: inspectionId || undefined
      }

      if (mode === 'edit' && initialData?.id) {
        await updateMaintenanceTask(initialData.id, formattedData)
        toast({
          title: t('maintenance.messages.updateSuccess'),
        })
      } else {
        const { data, error } = await createMaintenanceTask(formattedData)
        if (error) {
          console.error('Error:', error)
          toast({
            title: t('maintenance.messages.error'),
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: t('maintenance.messages.createSuccess'),
        })
      }

      router.push("/maintenance")
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('maintenance.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t(mode === 'create' ? 'maintenance.newTask' : 'maintenance.editTask')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('maintenance.fields.title')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('maintenance.fields.titlePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('maintenance.fields.titleDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('maintenance.fields.selectVehicle')}</FormLabel>
                    <FormControl>
                      <VehicleSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t('maintenance.fields.selectVehiclePlaceholder')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('maintenance.fields.vehicleDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('maintenance.fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('maintenance.fields.descriptionPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {t('maintenance.fields.descriptionDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('maintenance.fields.dueDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>{t('maintenance.fields.dueDatePlaceholder')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t('maintenance.fields.dueDateDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('maintenance.fields.priority')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('maintenance.priority.low')}</SelectItem>
                        <SelectItem value="medium">{t('maintenance.priority.medium')}</SelectItem>
                        <SelectItem value="high">{t('maintenance.priority.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('maintenance.fields.priorityDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="estimated_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('maintenance.fields.estimatedDuration')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('maintenance.fields.estimatedDurationPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('maintenance.fields.estimatedDurationDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('maintenance.fields.estimatedCost')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('maintenance.fields.estimatedCostPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('maintenance.fields.estimatedCostDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('maintenance.fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('maintenance.fields.notesPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('maintenance.fields.notesDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Wrench className="mr-2 h-4 w-4" />
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
} 