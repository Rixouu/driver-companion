"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils/styles"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"

import { DriverAvailabilityForm } from "./driver-availability-form"
import { getDriverAvailability } from "@/lib/services/driver-availability"
import type { DriverAvailability, Driver } from "@/types/drivers"

// Helper to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "unavailable":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "leave":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "training":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

interface DriverAvailabilityCalendarProps {
  driver: Driver
}

export function DriverAvailabilityCalendar({ driver }: DriverAvailabilityCalendarProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Get days in current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Fetch availability data
  const fetchAvailability = async () => {
    try {
      setIsLoading(true)
      const data = await getDriverAvailability(driver.id)
      setAvailabilityRecords(data)
    } catch (error) {
      console.error("Error fetching driver availability:", error)
      toast({
        title: "Error",
        description: "Failed to load driver availability",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAvailability()
  }, [driver.id])
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  // Check if a date has availability
  const getAvailabilityForDate = (date: Date) => {
    return availabilityRecords.find(record => {
      const startDate = new Date(record.start_date)
      const endDate = new Date(record.end_date)
      return date >= startDate && date <= endDate
    })
  }
  
  // Handle adding new availability
  const handleAddAvailability = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedDate(null)
  }
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    fetchAvailability()
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <CardTitle className="text-lg sm:text-xl">{t("drivers.availability.calendar")}</CardTitle>
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 sm:h-9 sm:w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-sm sm:text-base whitespace-nowrap">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 sm:h-9 sm:w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">{t("drivers.availability.loading")}</div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, i) => {
                const availability = getAvailabilityForDate(day)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[60px] sm:min-h-[80px] p-1 border rounded-md transition-colors relative flex flex-col",
                      !isSameMonth(day, currentMonth) && "opacity-50 bg-muted/30",
                      isToday && "border-primary",
                      "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div
                        className={cn(
                          "text-[10px] sm:text-xs font-medium flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full",
                          isToday && "bg-primary text-primary-foreground",
                          !isSameMonth(day, currentMonth) && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={() => handleAddAvailability(day)}
                          >
                            <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                    {availability && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          "mt-auto text-[9px] sm:text-[10px] px-1 py-0.5 h-auto leading-tight justify-center truncate", 
                          getStatusColor(availability.status)
                        )}
                      >
                        {t(`drivers.availability.statuses.${availability.status}`)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-4">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("available"))}>{t("drivers.availability.statuses.available")}</Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("unavailable"))}>{t("drivers.availability.statuses.unavailable")}</Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("leave"))}>{t("drivers.availability.statuses.leave")}</Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("training"))}>{t("drivers.availability.statuses.training")}</Badge>
            </div>
          </>
        )}
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? (
                t("drivers.availability.setAvailabilityFor", { date: format(selectedDate, "PP") })
              ) : (
                t("drivers.availability.setAvailability")
              )}
            </DialogTitle>
          </DialogHeader>
          <DriverAvailabilityForm
            driverId={driver.id}
            initialData={
              selectedDate
                ? undefined
                : undefined
            }
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
} 