"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

type ViewType = "week" | "2weeks" | "month";

interface ShiftFiltersProps {
  viewType: ViewType;
  onViewTypeChange: (view: ViewType) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedDriverIds: string[];
  onDriverIdsChange: (ids: string[]) => void;
  onRefresh: () => void;
}

export function ShiftFilters({
  viewType,
  onViewTypeChange,
  selectedDate,
  onDateChange,
  onRefresh,
}: ShiftFiltersProps) {
  const handlePrevious = () => {
    switch (viewType) {
      case "week":
      case "2weeks":
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case "month":
        onDateChange(subMonths(selectedDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewType) {
      case "week":
      case "2weeks":
        onDateChange(addWeeks(selectedDate, 1));
        break;
      case "month":
        onDateChange(addMonths(selectedDate, 1));
        break;
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
        </div>

        {/* View Type & Actions */}
        <div className="flex items-center gap-2">
          <Select
            value={viewType}
            onValueChange={(value) => onViewTypeChange(value as ViewType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="2weeks">2 Weeks</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

