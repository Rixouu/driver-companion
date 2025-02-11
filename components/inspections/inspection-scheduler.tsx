"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { addDays, format, isBefore, isToday, startOfToday } from "date-fns"
import { CalendarClock, Clock } from "lucide-react"

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

interface InspectionSchedulerProps {
  vehicleId: string
  onScheduled?: () => void
}

export function InspectionScheduler({ vehicleId, onScheduled }: InspectionSchedulerProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO: Replace with actual API call
  const timeSlots: TimeSlot[] = [
    { id: "1", time: "09:00", available: true },
    { id: "2", time: "10:00", available: true },
    { id: "3", time: "11:00", available: false },
    { id: "4", time: "13:00", available: true },
    { id: "5", time: "14:00", available: true },
    { id: "6", time: "15:00", available: true },
    { id: "7", time: "16:00", available: false },
    { id: "8", time: "17:00", available: true },
  ]

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: t("errors.error"),
        description: t("inspections.schedule.selectDateTime"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: t("common.success"),
        description: t("inspections.schedule.success"),
      })

      onScheduled?.()
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.schedule.error"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfToday()) && !isToday(date)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          {t("inspections.schedule.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            initialFocus
          />

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("inspections.schedule.selectTime")}
              </span>
            </div>
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
              disabled={!selectedDate}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("inspections.schedule.selectTimeSlot")} />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem
                    key={slot.id}
                    value={slot.time}
                    disabled={!slot.available}
                  >
                    {slot.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDate && selectedTime && (
            <div className="text-center text-sm text-muted-foreground">
              {t("inspections.schedule.scheduled", {
                date: format(selectedDate, "PPP"),
                time: selectedTime,
              })}
            </div>
          )}

          <Button
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="w-full max-w-sm"
          >
            {isSubmitting ? (
              t("common.loading")
            ) : (
              t("inspections.schedule.submit")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 