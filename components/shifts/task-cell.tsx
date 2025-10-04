"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, MapPin, User, Calendar, Plus, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// Task Type Definition
export interface CrewTask {
  id: string;
  task_number: number;
  task_type: 'charter' | 'regular' | 'training' | 'day_off' | 'maintenance' | 'meeting' | 'standby' | 'special';
  task_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  total_days: number;
  current_day: number; // Which day of the multi-day task (1, 2, 3...)
  hours_per_day?: number;
  total_hours?: number;
  title?: string;
  description?: string;
  location?: string;
  customer_name?: string;
  customer_phone?: string;
  color_override?: string;
  priority?: number;
  notes?: string;
  booking_id?: string;
  booking_wp_id?: string;
  booking_service_name?: string;
  booking_price?: string;
  is_multi_day: boolean;
  is_first_day: boolean;
  is_last_day: boolean;
}

export interface DayTaskData {
  tasks: CrewTask[];
  task_count: number;
}

interface TaskCellProps {
  driverId: string;
  date: string;
  data?: DayTaskData;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
}

// =====================================================
// IMPROVED COLOR SCHEME - High Contrast for Light/Dark
// =====================================================

const getTaskTypeColor = (taskType: string, colorOverride?: string) => {
  if (colorOverride) return colorOverride;
  
  const colors: Record<string, {
    bg: string;
    text: string;
    border: string;
    badge: string;
  }> = {
    charter: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-900 dark:text-blue-100',
      border: 'border-l-blue-600 dark:border-l-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
    },
    regular: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-900 dark:text-emerald-100',
      border: 'border-l-emerald-600 dark:border-l-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
    },
    training: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-900 dark:text-purple-100',
      border: 'border-l-purple-600 dark:border-l-purple-400',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
    },
    day_off: {
      bg: 'bg-gray-50 dark:bg-gray-900/60',
      text: 'text-gray-900 dark:text-gray-100',
      border: 'border-l-gray-500 dark:border-l-gray-400',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    },
    maintenance: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-900 dark:text-orange-100',
      border: 'border-l-orange-600 dark:border-l-orange-400',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
    },
    meeting: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-900 dark:text-indigo-100',
      border: 'border-l-indigo-600 dark:border-l-indigo-400',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
    },
    standby: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-900 dark:text-amber-100',
      border: 'border-l-amber-600 dark:border-l-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
    },
    special: {
      bg: 'bg-pink-50 dark:bg-pink-950/40',
      text: 'text-pink-900 dark:text-pink-100',
      border: 'border-l-pink-600 dark:border-l-pink-400',
      badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200'
    }
  };
  
  return colors[taskType.toLowerCase()] || colors.regular;
};

const getTaskStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    scheduled: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
  };
  return badges[status.toLowerCase()] || badges.scheduled;
};

// =====================================================
// COMPONENTS
// =====================================================

export function TaskCell({
  driverId,
  date,
  data,
  onTaskClick,
  onCellClick,
}: TaskCellProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Empty cell - show "+" button
  if (!data || !data.tasks || data.tasks.length === 0) {
    return (
      <div 
        className="h-full min-h-[80px] p-2 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border border-border/50"
        onClick={() => onCellClick?.(driverId, date)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  const { tasks } = data;

  // Single task - show inline with task number prominent
  if (tasks.length === 1) {
    const task = tasks[0];
    const colors = getTaskTypeColor(task.task_type, task.color_override);
    
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div 
            className={cn(
              "h-full min-h-[80px] p-2 cursor-pointer hover:shadow-md transition-all border-l-4",
              colors.bg,
              colors.border
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="space-y-1">
              {/* Task Number - Large and Prominent */}
              <div className="flex items-start justify-between gap-2">
                <div className={cn(
                  "text-2xl font-bold leading-none",
                  colors.text
                )}>
                  {task.task_number}
                </div>
                {task.is_multi_day && (
                  <Badge variant="outline" className={cn("text-[10px] px-1 py-0", colors.badge)}>
                    {task.current_day}/{task.total_days}
                  </Badge>
                )}
              </div>
              
              {/* Title / Service Name */}
              <div className={cn(
                "text-xs font-semibold truncate leading-tight",
                colors.text
              )}>
                {task.title || task.booking_service_name || t(`shifts.shiftType.${task.task_type}`)}
              </div>
              
              {/* Time & Hours */}
              {(task.start_time || task.hours_per_day) && (
                <div className={cn(
                  "text-[10px] font-medium truncate",
                  colors.text,
                  "opacity-90"
                )}>
                  {task.start_time && `${task.start_time}`}
                  {task.hours_per_day && ` • ${task.hours_per_day}h`}
                  {task.is_multi_day && `/day`}
                </div>
              )}
              
              {/* Customer Name (if charter/regular with customer) */}
              {task.customer_name && (
                <div className={cn(
                  "text-[10px] truncate",
                  colors.text,
                  "opacity-80"
                )}>
                  {task.customer_name}
                </div>
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <TaskDetails 
            task={task} 
            onViewClick={() => {
              setIsOpen(false);
              onTaskClick?.(task);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Multiple tasks - show compact list with task numbers
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="h-full min-h-[80px] p-2 cursor-pointer hover:bg-muted/50 transition-colors border border-border/50"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <div className="space-y-1">
            {/* Task Numbers */}
            <div className="flex items-center gap-1 flex-wrap">
              {tasks.slice(0, 5).map((task) => {
                const colors = getTaskTypeColor(task.task_type, task.color_override);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-sm font-bold border-2",
                      colors.bg,
                      colors.text,
                      colors.border
                    )}
                  >
                    {task.task_number}
                  </div>
                );
              })}
              {tasks.length > 5 && (
                <span className="text-xs font-semibold text-foreground dark:text-foreground">
                  +{tasks.length - 5}
                </span>
              )}
            </div>
            
            {/* Summary */}
            <div className="text-xs font-semibold text-foreground dark:text-foreground">
              {tasks.length} {t('shifts.booking.bookings')}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-foreground">{t('shifts.booking.bookings')} ({tasks.length})</h4>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {tasks.map((task) => (
              <TaskDetails 
                key={task.id}
                task={task} 
                compact
                onViewClick={() => {
                  setIsOpen(false);
                  onTaskClick?.(task);
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =====================================================
// TASK DETAILS COMPONENT
// =====================================================

interface TaskDetailsProps {
  task: CrewTask;
  compact?: boolean;
  onViewClick?: () => void;
}

function TaskDetails({ task, compact = false, onViewClick }: TaskDetailsProps) {
  const { t } = useI18n();
  const colors = getTaskTypeColor(task.task_type, task.color_override);
  
  if (compact) {
    return (
      <div 
        className={cn(
          "p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-all",
          colors.bg,
          colors.border
        )}
        onClick={onViewClick}
      >
        <div className="flex items-start gap-2">
          <div className={cn("text-lg font-bold", colors.text)}>
            {task.task_number}
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-sm font-semibold truncate", colors.text)}>
              {task.title || task.booking_service_name}
            </div>
            <div className={cn("text-xs", colors.text, "opacity-80")}>
              {task.start_time} {task.hours_per_day && `• ${task.hours_per_day}h`}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className={cn("text-3xl font-bold", colors.text)}>
              {task.task_number}
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {task.title || task.booking_service_name}
              </div>
              <Badge className={cn("text-xs mt-1", colors.badge)}>
                {t(`shifts.shiftType.${task.task_type}`)}
              </Badge>
            </div>
          </div>
        </div>
        <Badge className={getTaskStatusBadge(task.task_status)}>
          {t(`shifts.status.${task.task_status}`)}
        </Badge>
      </div>

      {/* Multi-day indicator */}
      {task.is_multi_day && (
        <div className={cn(
          "p-2 rounded-lg",
          colors.bg
        )}>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className={cn("font-semibold", colors.text)}>
              {t('common.days')}: {task.current_day} / {task.total_days}
            </span>
            {task.hours_per_day && (
              <span className={cn(colors.text)}>
                ({task.hours_per_day}h/day)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 text-sm">
        {task.start_time && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{task.start_time} {task.end_time && `- ${task.end_time}`}</span>
          </div>
        )}
        
        {task.location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{task.location}</span>
          </div>
        )}
        
        {task.customer_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{task.customer_name}</span>
          </div>
        )}
        
        {task.customer_phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{task.customer_phone}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {onViewClick && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewClick}
          className="w-full"
        >
          {t('shifts.booking.viewDetails')}
        </Button>
      )}
    </div>
  );
}

