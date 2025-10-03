"use client"

import { useState, useMemo } from "react"
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
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useI18n } from "@/lib/i18n/context"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { InspectionType } from "@/types/inspections"
import { cn } from "@/lib/utils/styles"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const scheduleSchema = z.object({
  type: z.enum(['routine', 'safety', 'maintenance']),
  date: z.date({
    required_error: "Please select a date",
  }),
})

interface ScheduleInspectionFormProps {
  vehicleId: string
}

export function ScheduleInspectionForm({ vehicleId }: ScheduleInspectionFormProps) {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get Supabase client instance
  const supabase = createClient()

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
  })

  async function onSubmit(data: z.infer<typeof scheduleSchema>) {
    try {
      setIsSubmitting(true)

      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: vehicleId,
          type: data.type,
          date: data.date.toISOString(),
          status: 'scheduled',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: t('inspections.messages.createSuccess'),
      })

      // Redirect to the inspection details page
      router.push(`/inspections/${inspection.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.type.select")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-4 md:grid-cols-3"
                    >
                      {(['routine', 'safety', 'maintenance'] as const).map((type) => (
                        <div key={type}>
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={type}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <h3 className="font-semibold">
                              {t(`inspections.type.${type}`)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t(`inspections.type.description.${type}`)}
                            </p>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.schedule.selectDate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal min-h-[44px]",
                              !field.value && "text-muted-foreground",
                              isMobile && "text-sm"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("inspections.schedule.datePlaceholder")}</span>
                              )}
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent 
                        className={cn(
                          "w-auto p-0",
                          isMobile && "w-[calc(100vw-2rem)] max-w-sm mx-auto"
                        )} 
                        align={isMobile ? "center" : "start"}
                        side={isMobile ? "bottom" : "bottom"}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className={cn(
                            isMobile && "w-full [&_table]:w-full [&_td]:w-[14.28%] [&_td]:p-0 [&_td_button]:w-full [&_td_button]:h-10 [&_td_button]:rounded-none [&_td_button]:text-center [&_td_button]:text-sm"
                          )}
                          classNames={isMobile ? {
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_hidden: "invisible",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex w-full justify-between",
                            head_cell: "text-muted-foreground text-center font-normal text-xs w-[14.28%] px-0",
                            row: "flex w-full mt-2",
                            cell: "text-center text-sm p-0 relative w-[14.28%] [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          } : undefined}
                        />
                      </PopoverContent>
                    </Popover>
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
              className={cn(
                "w-full sm:w-auto min-h-[44px] sm:min-h-0",
                isMobile && "text-sm"
              )}
              disabled={isSubmitting}
            >
              {t("inspections.schedule.cancel")}
            </Button>
            <Button 
              type="submit"
              className={cn(
                "w-full sm:w-auto min-h-[44px] sm:min-h-0",
                isMobile && "text-sm"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.saving") : t("inspections.schedule.button")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 