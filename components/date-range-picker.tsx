"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils/styles"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"

interface DateRangePickerProps {
  defaultDateRange?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  value?: DateRange | undefined
  onChange?: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  defaultDateRange,
  onDateChange,
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value || defaultDateRange)

  React.useEffect(() => {
    if (value !== undefined && value !== date) {
      setDate(value)
    }
  }, [value, date])

  React.useEffect(() => {
    if (onDateChange) {
      onDateChange(date)
    }
    if (onChange) {
      onChange(date)
    }
  }, [date, onDateChange, onChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 