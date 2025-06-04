"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { VehicleSelector } from "@/components/vehicle-selector"
import { useI18n } from "@/lib/i18n/context"
import { maintenanceSchema } from "@/lib/validations/maintenance"
import type { MaintenanceFormData } from "@/lib/validations/maintenance"
import { Wrench, Sparkles, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { createMaintenanceTask, updateMaintenanceTask } from "@/lib/services/maintenance"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils/styles"
import { TaskTemplateSelector } from "./task-template-selector"
import type { MaintenanceTaskTemplate } from "@/lib/services/maintenance-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MaintenanceFormProps {
  initialData?: MaintenanceFormData & { id?: string }
  mode?: 'create' | 'edit'
}

export function MaintenanceForm({ initialData, mode = 'create' }: MaintenanceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("template")

  // DEBUG: Log raw searchParams
  console.log("[MaintenanceForm] Raw searchParams:", searchParams.toString());

  // Get prefilled data from URL
  const inspectionId = searchParams.get('inspection_id') || ""

  let prefilledTitle = initialData?.title || ""
  let prefilledDescription = initialData?.description || ""
  const prefilledVehicleId = searchParams.get('vehicleId') || initialData?.vehicle_id || ""
  // DEBUG: Log prefilledVehicleId at definition
  console.log("[MaintenanceForm] Top-level prefilledVehicleId:", prefilledVehicleId, "from searchParams:", searchParams.get('vehicleId'), "from initialData:", initialData?.vehicle_id);

  const prefilledPriority = searchParams.get('priority') || initialData?.priority || "medium"
  const prefilledStatus = searchParams.get('status') || initialData?.status || "scheduled"

  if (inspectionId) {
    // If coming from an inspection, set generic title and description
    // Vehicle ID will still be prefilled from the URL if available
    prefilledTitle = t('maintenance.newTask'); // Or a more specific title like "Post-Inspection Repair"
    prefilledDescription = t('inspections.messages.defaultRepairDescription'); // Or leave empty
  } else {
    // If not from inspection, use title/description from URL params if they exist
    prefilledTitle = searchParams.get('title') || prefilledTitle;
    prefilledDescription = searchParams.get('description') || prefilledDescription;
  }
  
  // Set a default due date for 7 days from now if creating a new task
  const defaultDueDate = mode === 'create' 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : initialData?.due_date || ""

  // DEBUG: Log defaultValues before passing to useForm
  const defaultVals = {
    title: prefilledTitle,
    description: prefilledDescription,
    vehicle_id: prefilledVehicleId,
    due_date: defaultDueDate,
    priority: prefilledPriority as "low" | "medium" | "high",
    status: prefilledStatus as "scheduled" | "in_progress" | "completed",
    estimated_duration: initialData?.estimated_duration?.toString() || "",
    cost: initialData?.cost?.toString() || "",
    notes: initialData?.notes || "",
  };
  console.log("[MaintenanceForm] DefaultValues for useForm:", defaultVals);

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: defaultVals,
  })

  // Update form values if URL parameters change
  useEffect(() => {
    console.log("[MaintenanceForm] useEffect triggered. searchParams:", searchParams.toString());
    const currentInspectionId = searchParams.get('inspection_id');
    const urlVehicleId = searchParams.get('vehicleId');
    // DEBUG: Log urlVehicleId from inside useEffect
    console.log("[MaintenanceForm useEffect] urlVehicleId from searchParams:", urlVehicleId);

    const urlTitle = searchParams.get('title');
    const urlDescription = searchParams.get('description');
    const urlPriorityParam = searchParams.get('priority');
    const urlStatusParam = searchParams.get('status');

    if (currentInspectionId) {
      form.setValue('title', t('maintenance.newTask'));
      form.setValue('description', t('inspections.messages.defaultRepairDescription'));
      if (urlVehicleId) {
        console.log("[MaintenanceForm useEffect] In currentInspectionId block, setting vehicle_id to:", urlVehicleId);
        form.setValue('vehicle_id', urlVehicleId);
      }
    } else {
      if (urlTitle) {
        form.setValue('title', urlTitle);
      }
      if (urlDescription) {
        form.setValue('description', urlDescription);
      }
      if (urlVehicleId && !initialData?.vehicle_id) {
         console.log("[MaintenanceForm useEffect] In ELSE block, setting vehicle_id to:", urlVehicleId, "because initialData.vehicle_id is:", initialData?.vehicle_id);
         form.setValue('vehicle_id', urlVehicleId);
      }
    }

    const validPriorities = ["low", "medium", "high"] as const;
    type PriorityType = typeof validPriorities[number];
    if (urlPriorityParam && validPriorities.includes(urlPriorityParam as PriorityType)) {
      const validatedPriority = urlPriorityParam as PriorityType;
      form.setValue('priority', validatedPriority);
    } else if (!form.getValues('priority')) { 
      form.setValue('priority', 'medium');
    }

    const validStatuses = ["scheduled", "in_progress", "completed"] as const;
    type StatusType = typeof validStatuses[number];
    if (urlStatusParam && validStatuses.includes(urlStatusParam as StatusType)) {
      const validatedStatus = urlStatusParam as StatusType;
      form.setValue('status', validatedStatus);
    } else if (!form.getValues('status')) { 
      form.setValue('status', 'scheduled');
    }

    if (initialData?.vehicle_id && !urlVehicleId) {
      console.log("[MaintenanceForm useEffect] Setting vehicle_id from initialData:", initialData.vehicle_id, "because urlVehicleId is null/empty.");
      form.setValue('vehicle_id', initialData.vehicle_id);
    }

    // DEBUG: Log form's vehicle_id at the end of useEffect
    console.log("[MaintenanceForm useEffect] Form vehicle_id at end of useEffect:", form.getValues('vehicle_id'));

  }, [searchParams, form, t, initialData?.vehicle_id]);

  // Handle template selection
  const handleTemplateSelect = (template: MaintenanceTaskTemplate) => {
    form.setValue('title', template.title)
    form.setValue('description', template.description)
    form.setValue('priority', template.priority as "low" | "medium" | "high")
    form.setValue('estimated_duration', template.estimated_duration.toString())
    form.setValue('cost', template.estimated_cost.toString())
    
    // Switch to the manual tab after selecting a template
    setActiveTab("manual")
    
    toast({
      title: t('maintenance.templates.templateApplied'),
      description: t('maintenance.templates.templateAppliedDescription'),
    })
  }

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
          // Consider adding description: t('maintenance.messages.updateSuccessDescription')
        })
      } else {
        const { data: createdData, error: createError } = await createMaintenanceTask(formattedData) // Renamed to avoid conflict with error variable from outer scope
        if (createError) {
          console.error('Error:', createError)
          toast({
            title: t('maintenance.messages.error'), // Generic error
            description: createError.message || t('maintenance.messages.createErrorDescription'), // More specific if available
            variant: "destructive",
          })
          return
        }
        
        toast({
          title: t('maintenance.messages.createSuccess'),
          // Consider adding description: t('maintenance.messages.createSuccessDescription')
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
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              {t(mode === 'create' ? 'maintenance.newTask' : 'maintenance.editTask')}
            </CardTitle>
            {mode === 'create' && (
              <CardDescription>
                {t('maintenance.form.description')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === 'create' && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('maintenance.templates.useTemplate')}
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    {t('maintenance.templates.manualEntry')}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="template" className="space-y-4 mt-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('maintenance.templates.templateInfo')}</AlertTitle>
                    <AlertDescription>
                      {t('maintenance.templates.templateInfoDescription')}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <TaskTemplateSelector onSelect={handleTemplateSelect} />
                    
                    <FormField
                      control={form.control}
                      name="vehicle_id"
                      render={({ field }) => {
                        // DEBUG: Log props passed to VehicleSelector
                        console.log("[MaintenanceForm] VehicleSelector render props (field):", field);
                        return (
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
                        );
                      }}
                    />
                    
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
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-6 mt-4">
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
                      render={({ field }) => {
                        // DEBUG: Log props passed to VehicleSelector (manual tab)
                        console.log("[MaintenanceForm] VehicleSelector (manual tab) render props (field):", field);
                        return (
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
                        );
                      }}
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
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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

                    <FormField
                      control={form.control}
                      name="cost"
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
                </TabsContent>
              </Tabs>
            )}
            
            {mode === 'edit' && (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => {
                      // DEBUG: Log props passed to Input
                      console.log("[MaintenanceForm] Input render props (field):", field);
                      return (
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
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_id"
                    render={({ field }) => {
                      // DEBUG: Log props passed to VehicleSelector (edit mode)
                      console.log("[MaintenanceForm] VehicleSelector (edit mode) render props (field):", field);
                      return (
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
                      );
                    }}
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
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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

                  <FormField
                    control={form.control}
                    name="cost"
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/maintenance')}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : t(mode === 'create' ? 'common.create' : 'common.save')}
          </Button>
        </div>
      </form>
    </Form>
  )
} 