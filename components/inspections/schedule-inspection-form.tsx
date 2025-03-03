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
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useI18n } from "@/lib/i18n/context"
import { InspectionType } from "@/lib/types/inspections"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

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
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          status: 'scheduled'
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
      <div>
        <h1 className="text-2xl font-bold">{t("inspections.title")}</h1>
        <p className="text-muted-foreground">
          {t("inspections.description")}
        </p>
      </div>

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
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t("inspections.schedule.datePlaceholder")}</span>
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
              {t("inspections.schedule.cancel")}
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
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