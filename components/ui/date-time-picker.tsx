"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ClockPicker } from "@/components/ui/clock-picker";

interface DateTimePickerProps {
  date?: Date;
  time?: string;
  onDateChange?: (date: Date | undefined) => void;
  onTimeChange?: (time: string) => void;
  onDateTimeChange?: (date: Date | undefined, time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  onDateTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  datePlaceholder = "Pick a date",
  timePlaceholder = "Select time",
  className,
  disabled = false,
  required = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [selectedTime, setSelectedTime] = React.useState<string>(time || "");
  const [triggerWidth, setTriggerWidth] = React.useState<number>(280);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Update internal state when props change
  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  React.useEffect(() => {
    setSelectedTime(time || "");
  }, [time]);

  // Measure trigger width for calendar sizing
  React.useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
    onDateTimeChange?.(newDate, selectedTime);
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    onTimeChange?.(newTime);
    onDateTimeChange?.(selectedDate, newTime);
  };


  return (
    <div className={cn("grid gap-3 grid-cols-1 sm:grid-cols-2", className)}>
      {/* Date Picker */}
      <div className="flex flex-col">
        <Label className="text-sm font-medium mb-2">
          {dateLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-10",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : datePlaceholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0" 
            align="start"
            style={{ width: `${Math.max(triggerWidth, 280)}px` }}
          >
            <div className="w-full p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
                className="w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md font-normal text-xs flex-1 text-center",
                  row: "flex w-full mt-2",
                  cell: "flex-1 text-center text-sm relative h-8 flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker */}
      <div className="flex flex-col">
        <Label className="text-sm font-medium mb-2">
          {timeLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <ClockPicker
          value={selectedTime}
          onChange={handleTimeChange}
          placeholder={timePlaceholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
