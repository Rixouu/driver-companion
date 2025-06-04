"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast";
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
import { useAuth } from "@/lib/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Repeat, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils/styles"
import { createMaintenanceScheduleAction } from "@/app/(dashboard)/maintenance/actions"
import { TaskTemplateSelector } from "./task-template-selector"
import type { MaintenanceTaskTemplate } from "@/lib/services/maintenance-templates"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const validPriorities = ["low", "medium", "high"] as const;

const maintenanceScheduleSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(validPriorities),
  is_recurring: z.boolean().default(false),
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
    (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime()),
    { message: "Invalid date format. Please use YYYY-MM-DD format." }
  ),
  end_date: z.string().optional().refine(
    (date) => {
      if (!date || date.trim() === "") return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
    },
    { message: "Invalid date format. Please use YYYY-MM-DD format." }
  ),
  estimated_duration: z.string().optional(),
  estimated_cost: z.string().optional(),
  notes: z.string().optional(),
  create_immediate_task: z.boolean().default(false),
})
.refine(
  (data) => {
    if (data.is_recurring && data.frequency === "custom") {
      return !!data.interval_days && parseInt(data.interval_days) > 0;
    }
    return true;
  },
  { message: "Interval days is required for custom frequency", path: ["interval_days"] }
)
.refine(
  (data) => {
    if (data.is_recurring && data.end_date && data.end_date.trim() !== "") {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate > startDate;
    }
    return true;
  },
  { message: "End date must be after start date", path: ["end_date"] }
);

type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>

export function MaintenanceScheduleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("basic")

  const prefilledTitle = searchParams.get('title') || ""
  const prefilledDescription = searchParams.get('description') || ""
  const prefilledVehicleId = searchParams.get('vehicle_id') || ""
  const createImmediateQueryParam = searchParams.get('create_immediate_task');
  let initialCreateImmediateTask = true; // Default to true
  if (createImmediateQueryParam === 'false') {
    initialCreateImmediateTask = false;
  } else if (createImmediateQueryParam === 'true') {
    // Explicitly true, already covered by default but good for clarity
    initialCreateImmediateTask = true;
  }
  const inspectionId = searchParams.get('inspection_id') || ""

  const getInitialPriority = (): typeof validPriorities[number] => {
    const prefilled = searchParams.get('priority');
    // Explicitly check if prefilled is one of the valid priorities
    if (prefilled === "low" || prefilled === "medium" || prefilled === "high") {
      return prefilled;
    }
    return "medium";
  };

  const form = useForm<MaintenanceScheduleFormData>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: {
      title: prefilledTitle,
      description: prefilledDescription,
      vehicle_id: prefilledVehicleId,
      priority: getInitialPriority() as "low" | "medium" | "high",
      is_recurring: false,
      frequency: "monthly",
      interval_days: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      estimated_duration: "",
      estimated_cost: "",
      notes: "",
      create_immediate_task: initialCreateImmediateTask,
    },
  })

  useEffect(() => {
    const urlTitle = searchParams.get('title');
    const urlDescription = searchParams.get('description');
    const urlVehicleId = searchParams.get('vehicle_id');
    const urlPriority = searchParams.get('priority');
    const urlCreateImmediate = searchParams.get('create_immediate_task');

    if (urlTitle) form.setValue('title', urlTitle);
    if (urlDescription) form.setValue('description', urlDescription);
    if (urlVehicleId) form.setValue('vehicle_id', urlVehicleId);
    
    if (urlPriority) {
        if (validPriorities.includes(urlPriority as any)) {
            form.setValue('priority', urlPriority as typeof validPriorities[number]);
        } else {
            form.setValue('priority', 'medium');
        }
    } 

    if (urlCreateImmediate === 'true') {
      form.setValue('create_immediate_task', true);
    } else if (urlCreateImmediate === 'false') {
      form.setValue('create_immediate_task', false);
    }
    // If urlCreateImmediate is not present, defaultValues handles it.

  }, [searchParams, form]);

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
    if (!user?.id) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a schedule.", variant: "destructive" });
      return;
    }
    const supabaseClient = createClient();

    setIsLoading(true);
    try {
      if (!data.is_recurring) {
        const taskData = {
          vehicle_id: data.vehicle_id,
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          due_date: data.start_date,
          status: 'scheduled' as const,
          estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : null,
          cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
          notes: data.notes || null,
          user_id: user.id,
          inspection_id: inspectionId || null
        };

        const { error: taskError } = await supabaseClient
          .from('maintenance_tasks')
          .insert(taskData);

        if (taskError) {
          console.error('Error creating one-off task:', taskError);
          toast({ title: "Error Creating Task", description: taskError.message, variant: "destructive" });
          setIsLoading(false); // Ensure loading state is reset on error
          return; // Stop execution if one-off task fails
        }

        toast({ title: t('maintenance.messages.createSuccess') });
        router.push("/maintenance");
        router.refresh();
        setIsLoading(false);
        return;
      }

      const { is_recurring, create_immediate_task, ...schedulePayload } = data;
      
      const formattedData: any = {
        ...schedulePayload,
        user_id: user.id,
        estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : null,
        estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : null,
        interval_days: data.interval_days ? parseInt(data.interval_days) : null,
        end_date: data.end_date && data.end_date.trim() !== "" ? data.end_date : null,
        is_active: true,
      };

      const result = await createMaintenanceScheduleAction(formattedData);
      
      if (result.error || !result.schedule) { // Check for error or if schedule is null/undefined
        const errorMsg = result.error || "Failed to create schedule.";
        console.error('Error creating recurring schedule:', errorMsg);
        toast({ title: "Error Creating Schedule", description: errorMsg, variant: "destructive" });
        setIsLoading(false); // Ensure loading state is reset
        return; // Stop execution if schedule creation fails
      }
      
      // Safely access result.schedule as it's checked above
      const currentSchedule = result.schedule;

      if (create_immediate_task) {
        const schedulePriority = currentSchedule.priority;
        const validatedPriority = validPriorities.includes(schedulePriority as any) 
          ? schedulePriority as typeof validPriorities[number] 
          : 'medium'; // Default to medium if priority from schedule is not valid

        const immediateTaskData = {
          vehicle_id: currentSchedule.vehicle_id,
          title: currentSchedule.title,
          description: currentSchedule.description,
          priority: validatedPriority,
          due_date: currentSchedule.start_date,
          status: 'scheduled' as const,
          estimated_duration: currentSchedule.estimated_duration,
          cost: currentSchedule.estimated_cost,
          notes: currentSchedule.notes,
          user_id: user.id,
          schedule_id: currentSchedule.id,
          inspection_id: inspectionId || null,
        };
        const { error: immediateTaskError } = await supabaseClient
          .from('maintenance_tasks')
          .insert(immediateTaskData);

        if (immediateTaskError) {
          console.warn('Failed to create immediate task for recurring schedule:', immediateTaskError);
          toast({ title: "Warning", description: `Schedule created, but failed to create immediate task: ${immediateTaskError.message}`, variant: "default" });
        } else {
          toast({ title: t('maintenance.messages.createSuccess'), description: "Recurring schedule and initial task created." });
        }
      } else {
        toast({ title: t('maintenance.messages.createSuccess'), description: "Recurring schedule created." });
      }

      router.push("/maintenance");
      router.refresh();

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({ title: "Submission Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">{t('maintenance.form.basicInfo')}</TabsTrigger>
            <TabsTrigger value="schedule">{t('maintenance.form.scheduleInfo')}</TabsTrigger>
            <TabsTrigger value="details">{t('maintenance.form.additionalDetails')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" forceMount className={activeTab === "basic" ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.form.stepOneTitle')}</CardTitle>
                <CardDescription>{t('maintenance.form.stepOneDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TaskTemplateSelector onSelect={handleTemplateSelect} />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.title')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('maintenance.fields.titlePlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>{t('maintenance.fields.titleDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.vehicle')}</FormLabel>
                      <VehicleSelector 
                        value={field.value}
                        onValueChange={(vehicleId: string) => form.setValue('vehicle_id', vehicleId)} 
                      />
                      <FormDescription>{t('maintenance.fields.vehicleDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.description')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('maintenance.fields.descriptionPlaceholder')} {...field} value={field.value || ""} />
                      </FormControl>
                       <FormDescription>{t('maintenance.fields.descriptionDescription')}</FormDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('maintenance.priority.title')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{t('maintenance.priority.low')}</SelectItem>
                          <SelectItem value="medium">{t('maintenance.priority.medium')}</SelectItem>
                          <SelectItem value="high">{t('maintenance.priority.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>{t('maintenance.fields.priorityDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => setActiveTab("schedule")}>{t('common.next')}</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" forceMount className={activeTab === "schedule" ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.form.stepTwoTitle')}</CardTitle>
                <CardDescription>{t('maintenance.form.stepTwoDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="start_date"
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
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>{t('maintenance.fields.dueDateDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{t('maintenance.isRecurring')}</FormLabel>
                                <FormDescription>
                                    {t('maintenance.isRecurringDescription')}
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                {form.watch('is_recurring') && (
                  <>
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('schedules.fields.frequency')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('schedules.placeholders.selectFrequency')} />
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
                          <FormDescription>{t('schedules.fields.frequencyDescription')}</FormDescription>
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
                            <FormLabel>{t('schedules.fields.intervalDays')}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t('schedules.placeholders.intervalDays')} {...field} value={field.value || ""}/>
                            </FormControl>
                            <FormDescription>{t('schedules.fields.intervalDaysDescription')}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('schedules.fields.endDate')}</FormLabel>
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
                                    <span>{t('schedules.placeholders.endDate')}</span>
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
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>{t('schedules.fields.endDateDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("basic")}>{t('common.previous')}</Button>
                <Button onClick={() => setActiveTab("details")}>{t('common.next')}</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" forceMount className={activeTab === "details" ? "" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.form.stepThreeTitle')}</CardTitle>
                <CardDescription>{t('maintenance.form.stepThreeDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="estimated_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.estimatedDuration')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('maintenance.fields.estimatedDurationPlaceholder')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t('maintenance.fields.estimatedDurationDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimated_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.estimatedCost')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('maintenance.fields.estimatedCostPlaceholder')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t('maintenance.fields.estimatedCostDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('maintenance.fields.notes')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('maintenance.fields.notesPlaceholder')} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>{t('maintenance.fields.notesDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="create_immediate_task"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>{t('maintenance.createImmediateTask')}</FormLabel>
                        <FormDescription>
                          {t('maintenance.createImmediateTaskDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t('schedules.tooltips.immediateTaskTitle')}</AlertTitle>
                  <AlertDescription>
                    {t('schedules.tooltips.immediateTaskDescription')}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("schedule")}>{t('common.previous')}</Button>
                <Button type="submit" disabled={isLoading || !form.formState.isDirty && !form.formState.isValid}>
                  {isLoading ? t('common.saving') : t('maintenance.schedule.button')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
} 