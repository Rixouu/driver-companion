"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { VehicleSelector } from "@/components/vehicle-selector"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/hooks/use-auth"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Repeat, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils/styles"
import { createMaintenanceSchedule } from "@/lib/services/schedules"
import { TaskTemplateSelector } from "./task-template-selector"
import type { MaintenanceTaskTemplate } from "@/lib/services/maintenance-templates"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the form schema
const maintenanceScheduleSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  frequency: z.enum([
    "daily", 
    "weekly", 
    "biweekly", 
    "monthly", 
    "quarterly", 
    "biannually", 
    "annually", 
    "custom"
  ]),
  interval_days: z.string().optional(),
  start_date: z.string().min(1, "Required").refine(
    (date) => {
      // Check if it's a valid date string (YYYY-MM-DD)
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
    },
    {
      message: "Invalid date format. Please use YYYY-MM-DD format.",
    }
  ),
  end_date: z.string().optional().refine(
    (date) => {
      // If empty, it's valid
      if (!date || date.trim() === "") return true;
      // Otherwise, check if it's a valid date string (YYYY-MM-DD)
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
    },
    {
      message: "Invalid date format. Please use YYYY-MM-DD format.",
    }
  ),
  estimated_duration: z.string().optional(),
  estimated_cost: z.string().optional(),
  notes: z.string().optional(),
  create_immediate_task: z.boolean().default(false),
})
.refine(
  (data) => {
    if (data.frequency === "custom") {
      return !!data.interval_days && parseInt(data.interval_days) > 0;
    }
    return true;
  },
  {
    message: "Interval days is required for custom frequency",
    path: ["interval_days"],
  }
)
.refine(
  (data) => {
    // If end_date is provided, make sure it's after start_date
    if (data.end_date && data.end_date.trim() !== "") {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
);

type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>

export function MaintenanceScheduleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useI18n()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("basic")

  // Get prefilled data from URL if coming from an inspection
  const prefilledTitle = searchParams.get('title') || ""
  const prefilledDescription = searchParams.get('description') || ""
  const prefilledVehicleId = searchParams.get('vehicle_id') || ""
  const prefilledPriority = searchParams.get('priority') || "medium"
  const prefilledCreateImmediateTask = searchParams.get('create_immediate_task') === 'true'
  const inspectionId = searchParams.get('inspection_id') || ""

  const form = useForm<MaintenanceScheduleFormData>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: {
      title: prefilledTitle,
      description: prefilledDescription,
      vehicle_id: prefilledVehicleId,
      priority: prefilledPriority as "low" | "medium" | "high",
      frequency: "monthly",
      interval_days: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      estimated_duration: "",
      estimated_cost: "",
      notes: "",
      create_immediate_task: prefilledCreateImmediateTask || true,
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
    if (searchParams.get('create_immediate_task') === 'true') {
      form.setValue('create_immediate_task', true)
    }
  }, [searchParams, form])

  // Handle template selection
  const handleTemplateSelect = (template: MaintenanceTaskTemplate) => {
    form.setValue('title', template.title)
    form.setValue('description', template.description)
    form.setValue('priority', template.priority)
    form.setValue('estimated_duration', template.estimated_duration.toString())
    form.setValue('estimated_cost', template.estimated_cost.toString())
    
    toast({
      title: t('maintenance.templates.templateApplied'),
      description: t('maintenance.templates.templateAppliedDescription'),
    })
  }

  async function onSubmit(data: MaintenanceScheduleFormData) {
    if (!user?.id) return

    try {
      setIsLoading(true)

      const formattedData = {
        ...data,
        user_id: user.id,
        estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : undefined,
        estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : undefined,
        interval_days: data.interval_days ? parseInt(data.interval_days) : undefined,
        end_date: data.end_date && data.end_date.trim() !== "" ? data.end_date : undefined,
        is_active: true,
      }

      // Remove the create_immediate_task field from the schedule data
      const { create_immediate_task, ...scheduleData } = formattedData;

      const { schedule, error } = await createMaintenanceSchedule(scheduleData)
      
      if (error) {
        throw error
      }

      // If create_immediate_task is true, create a one-time task immediately
      if (create_immediate_task) {
        // Format recurring information for the notes
        const recurringInfo = `
[${t('maintenance.recurringTask')} - ${t(`schedules.frequencies.${data.frequency}`)}]
${t('schedules.startDate')}: ${data.start_date}
${data.end_date && data.end_date.trim() !== "" ? `${t('schedules.endDate')}: ${data.end_date}` : ''}
${t('maintenance.schedule.id')}: ${schedule.id}
`;

        // Combine user notes with recurring info
        const combinedNotes = data.notes 
          ? `${data.notes}\n\n${recurringInfo}`
          : recurringInfo;

        const taskData = {
          vehicle_id: data.vehicle_id,
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          due_date: data.start_date,
          status: 'scheduled',
          estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : undefined,
          cost: data.estimated_cost ? parseFloat(data.estimated_cost) : undefined,
          notes: combinedNotes,
          user_id: user.id,
          inspection_id: inspectionId || undefined // Include inspection_id if it exists
        };

        const { data: taskResult, error: taskError } = await supabase
          .from('maintenance_tasks')
          .insert(taskData)
          .select()
          .single();

        if (taskError) {
          console.error('Error creating immediate task:', taskError);
          toast({
            title: t('maintenance.messages.error'),
            description: t('maintenance.messages.immediateTaskError'),
            variant: "destructive",
          });
        }
      }

      toast({
        title: t('schedules.maintenance.createSuccess'),
      })

      router.push("/maintenance")
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('schedules.maintenance.createError'),
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
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              {t('schedules.maintenance.title')}
            </CardTitle>
            <CardDescription>
              {t('schedules.maintenance.description')}
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardContent>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="basic">1. {t('maintenance.form.basicInfo')}</TabsTrigger>
                <TabsTrigger value="schedule">2. {t('maintenance.form.scheduleInfo')}</TabsTrigger>
                <TabsTrigger value="details">3. {t('maintenance.form.additionalDetails')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-0">
                <Alert className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t('maintenance.form.stepOneTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('maintenance.form.stepOneDescription')}
                  </AlertDescription>
                </Alert>
                
                <TaskTemplateSelector onSelect={handleTemplateSelect} />
                
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
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("schedule")}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4 mt-0">
                <Alert className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t('maintenance.form.stepTwoTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('maintenance.form.stepTwoDescription')}
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('schedules.frequency')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('schedules.selectFrequency')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">{t('schedules.frequencies.daily')}</SelectItem>
                            <SelectItem value="weekly">{t('schedules.frequencies.weekly')}</SelectItem>
                            <SelectItem value="biweekly">{t('schedules.frequencies.biweekly')}</SelectItem>
                            <SelectItem value="monthly">{t('schedules.frequencies.monthly')}</SelectItem>
                            <SelectItem value="quarterly">{t('schedules.frequencies.quarterly')}</SelectItem>
                            <SelectItem value="biannually">{t('schedules.frequencies.biannually')}</SelectItem>
                            <SelectItem value="annually">{t('schedules.frequencies.annually')}</SelectItem>
                            <SelectItem value="custom">{t('schedules.frequencies.custom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('schedules.frequencyDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('frequency') === 'custom' && (
                    <FormField
                      control={form.control}
                      name="interval_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('schedules.intervalDays')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder={t('schedules.intervalDaysPlaceholder')} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {t('schedules.intervalDaysDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('schedules.startDate')}</FormLabel>
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
                                  <span>{t('schedules.selectDate')}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          {t('schedules.startDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('schedules.endDate')}</FormLabel>
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
                                  <span>{t('schedules.endDatePlaceholder')}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          {t('schedules.endDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="create_immediate_task"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t('maintenance.createImmediateTask')}
                        </FormLabel>
                        <FormDescription>
                          {t('maintenance.createImmediateTaskDescription')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                  >
                    {t('common.back')}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("details")}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 mt-0">
                <Alert className="bg-muted">
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t('maintenance.form.stepThreeTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('maintenance.form.stepThreeDescription')}
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.fields.priority')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('maintenance.fields.priority')} />
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

                  <FormField
                    control={form.control}
                    name="estimated_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.fields.estimatedDuration')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.5" 
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
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="estimated_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('maintenance.fields.estimatedCost')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
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
                          className="min-h-[120px]" 
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
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("schedule")}
                  >
                    {t('common.back')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </form>
    </Form>
  )
} 