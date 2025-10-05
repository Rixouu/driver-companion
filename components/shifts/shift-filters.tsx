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
import { CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, Clock, Eye, EyeOff } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

type ViewType = "day" | "week" | "month";

interface ShiftFiltersProps {
  viewType: ViewType;
  onViewTypeChange: (view: ViewType) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh: () => void;
  showDriverHours?: boolean;
  onToggleDriverHours?: (show: boolean) => void;
}

export function ShiftFilters({
  viewType,
  onViewTypeChange,
  selectedDate,
  onDateChange,
  onRefresh,
  showDriverHours = true,
  onToggleDriverHours,
}: ShiftFiltersProps) {
  const { t, locale } = useI18n();
  
  // Get the appropriate locale for date formatting
  const getDateLocale = () => {
    return locale === 'ja' ? ja : enUS;
  };
  
  
  const handlePrevious = () => {
    switch (viewType) {
      case "day":
        onDateChange(subDays(selectedDate, 1));
        break;
      case "week":
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case "month":
        onDateChange(subMonths(selectedDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewType) {
      case "day":
        onDateChange(addDays(selectedDate, 1));
        break;
      case "week":
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
      <div className="flex flex-col gap-4">
        {/* Date Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  {selectedDate ? format(selectedDate, "PPP", { locale: getDateLocale() }) : <span>Pick a date</span>}
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
          </div>

          {/* Today Button - Full width on mobile, inline on desktop */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="w-full sm:w-auto"
          >
            {t('shifts.filters.today')}
          </Button>
        </div>

        {/* View Type & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto">
            <Select
              value={viewType}
              onValueChange={(value) => onViewTypeChange(value as ViewType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.view')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('shifts.viewModes.today')}</SelectItem>
                <SelectItem value="week">{t('shifts.viewModes.thisWeek')}</SelectItem>
                <SelectItem value="month">{t('shifts.viewModes.thisMonth')}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="w-full sm:w-9 sm:h-9 sm:p-0"
              title={t('shifts.filters.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 sm:hidden">{t('shifts.filters.refresh')}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

