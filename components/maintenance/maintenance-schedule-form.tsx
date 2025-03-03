"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { VehicleSelector } from "@/components/vehicle-selector"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DbVehicle } from "@/types"

const scheduleSchema = z.object({
  title: z.string().min(1, "Required"),
  vehicle_id: z.string().min(1, "Required"),
  description: z.string().optional(),
  due_date: z.date({
    required_error: "Please select a date",
  }),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
})

interface MaintenanceScheduleFormProps {
  vehicles: DbVehicle[]
}

export function MaintenanceScheduleForm({ vehicles }: MaintenanceScheduleFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      priority: "medium",
    }
  })

  async function onSubmit(data: z.infer<typeof scheduleSchema>) {
    try {
      setIsSubmitting(true)

      const { data: task, error } = await supabase
        .from('maintenance_tasks')
        .insert({
          vehicle_id: data.vehicle_id,
          title: data.title,
          description: data.description,
          due_date: data.due_date.toISOString(),
          status: 'scheduled',
          priority: data.priority,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: t('maintenance.messages.createSuccess'),
      })

      // Redirect to the maintenance details page
      router.push(`/maintenance/${task.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('maintenance.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("maintenance.schedule.details")}</CardTitle>
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
                      value={field.value || ''}
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
                              format(field.value, "PPP")
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.saving') : t('maintenance.schedule.button')}
          </Button>
        </div>
      </form>
    </Form>
  )
} 