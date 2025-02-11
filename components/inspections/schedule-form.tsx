"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { addDays, format } from "date-fns"

interface ScheduleFormProps {
  vehicleId: string
  vehicleName: string
  rescheduleId?: string
}

export function ScheduleForm({ vehicleId, vehicleName, rescheduleId }: ScheduleFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>()
  const [timeSlot, setTimeSlot] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00"
  ]

  useEffect(() => {
    if (rescheduleId) {
      // TODO: Fetch existing inspection details
      // For now, just show a message
      toast({
        title: t("inspections.schedule.reschedule"),
        description: t("inspections.schedule.rescheduleDescription"),
      })
    }
  }, [rescheduleId, toast, t])

  const handleSubmit = async () => {
    if (!date || !timeSlot) {
      toast({
        title: t("errors.error"),
        description: t("inspections.schedule.selectDateTime"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: t("inspections.schedule.success"),
        description: t("inspections.schedule.scheduled", {
          date: format(date, "PPP"),
          time: timeSlot,
        }),
      })
      
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.schedule.error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.schedule.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("inspections.schedule.selectDate")}
          </h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
            className="rounded-md border"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("inspections.schedule.selectTime")}
          </h3>
          <Select onValueChange={setTimeSlot}>
            <SelectTrigger>
              <SelectValue placeholder={t("inspections.schedule.selectTimeSlot")} />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !date || !timeSlot}
          className="w-full"
        >
          {isLoading 
            ? t("common.loading") 
            : t("inspections.schedule.submit")}
        </Button>
      </CardContent>
    </Card>
  )
}