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
import { cn } from "@/lib/utils/styles"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  const { t, language } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

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

  const DatePickerContent = (
    <Calendar
      mode="single"
      selected={form.getValues().due_date}
      onSelect={(date) => date && form.setValue("due_date", date)}
      disabled={(date) =>
        date < new Date() || date < new Date("1900-01-01")
      }
      initialFocus
      locale={language === "ja" ? ja : undefined}
      className={cn(
        "rounded-t-none sm:rounded-t-lg",
        isMobile && "w-full [&_table]:w-full [&_td]:w-[14.28%] [&_td]:p-0 [&_td_button]:w-full [&_td_button]:h-12 [&_td_button]:rounded-none [&_td_button]:text-center"
      )}
      classNames={{
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full justify-between",
        head_cell: cn(
          "text-muted-foreground text-center font-normal text-[0.8rem]",
          isMobile && "w-[14.28%] px-0"
        ),
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
      }}
    />
  )

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
                    {isMobile ? (
                      <Sheet>
                        <SheetTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: language === "ja" ? ja : undefined })
                              ) : (
                                <span>{t('maintenance.fields.dueDatePlaceholder')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </SheetTrigger>
                        <SheetContent 
                          side="bottom" 
                          className="p-0 max-w-none w-full"
                        >
                          {DatePickerContent}
                        </SheetContent>
                      </Sheet>
                    ) : (
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
                                format(field.value, "PPP", { locale: language === "ja" ? ja : undefined })
                              ) : (
                                <span>{t('maintenance.fields.dueDatePlaceholder')}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          {DatePickerContent}
                        </PopoverContent>
                      </Popover>
                    )}
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