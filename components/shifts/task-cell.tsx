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
import { CrewTask } from "@/types/crew-tasks";

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
  isDragOver?: boolean;
  onTaskDrop?: (taskId: string, driverId: string, date: string) => void | Promise<void>;
}

// =====================================================
// IMPROVED COLOR SCHEME - High Contrast for Light/Dark
// =====================================================

const getTaskTypeColor = (taskType: string, colorOverride?: string) => {
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
  
  // If colorOverride is provided, create a custom color scheme
  if (colorOverride) {
    return {
      bg: `bg-${colorOverride}-50 dark:bg-${colorOverride}-950/40`,
      text: `text-${colorOverride}-900 dark:text-${colorOverride}-100`,
      border: `border-l-${colorOverride}-600 dark:border-l-${colorOverride}-400`,
      badge: `bg-${colorOverride}-100 text-${colorOverride}-800 dark:bg-${colorOverride}-900/60 dark:text-${colorOverride}-200`
    };
  }
  
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
  isDragOver = false,
  onTaskDrop,
}: TaskCellProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropped, setIsDropped] = useState(false);

  // Handle drag over
  const [isDragOverLocal, setIsDragOverLocal] = useState(false);
  const [isValidDropZone, setIsValidDropZone] = useState(true);

  // Check if the drop date is valid for the task
  const validateDropDate = (taskStartDate: string, dropDate: string): boolean => {
    // Cannot drop task on a date before its current start date
    // Also check if the task is being moved to a different driver (same date is always valid)
    return dropDate >= taskStartDate;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get the dragged task from localStorage to validate
    if (typeof window !== "undefined") {
      const draggedTaskStr = localStorage.getItem("draggedTask");
      if (draggedTaskStr) {
        try {
          const draggedTask = JSON.parse(draggedTaskStr);
          const isValid = validateDropDate(draggedTask.start_date, date);
          setIsValidDropZone(isValid);
          e.dataTransfer.dropEffect = isValid ? "move" : "none";
        } catch (error) {
          console.error("Error parsing dragged task:", error);
          setIsValidDropZone(false);
          e.dataTransfer.dropEffect = "none";
        }
      } else {
        setIsValidDropZone(false);
        e.dataTransfer.dropEffect = "none";
      }
    } else {
      setIsValidDropZone(false);
      e.dataTransfer.dropEffect = "none";
    }
    
    setIsDragOverLocal(true);
  };

  const handleDragLeave = () => {
    setIsDragOverLocal(false);
    setIsValidDropZone(true); // Reset validation state
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverLocal(false);

    // Get dragged task from storage
    if (typeof window !== "undefined") {
      const draggedTaskStr = localStorage.getItem("draggedTask");
      if (draggedTaskStr) {
        const draggedTask = JSON.parse(draggedTaskStr);
        
        // Validate drop date before processing
        if (!validateDropDate(draggedTask.start_date, date)) {
          alert(`Cannot move task to ${date}. Tasks cannot be moved to dates before their start date (${draggedTask.start_date}).`);
          return;
        }
        
        setIsDropped(true);
        
        try {
          // Use the callback function if provided, otherwise fall back to direct API call
          if (onTaskDrop) {
            await Promise.resolve(onTaskDrop(draggedTask.id, driverId, date));
            // Success animation - reset after animation
            setTimeout(() => {
              setIsDropped(false);
            }, 300);
          } else {
            // Fallback to direct API call (for backward compatibility)
            const response = await fetch(`/api/crew-tasks/${draggedTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                driver_id: driverId,
                start_date: date,
                end_date: date, // Single day assignment
              }),
            });
            
            if (response.ok) {
              console.log("Task assigned successfully");
              // Success animation - reset after animation
              setTimeout(() => {
                setIsDropped(false);
                window.location.reload(); // Fallback refresh
              }, 300);
            } else {
              const error = await response.json();
              alert(`Failed to assign task: ${error.error || "Unknown error"}`);
              setIsDropped(false);
            }
          }
        } catch (error) {
          console.error("Error assigning task:", error);
          alert("Failed to assign task");
          setIsDropped(false);
        } finally {
          localStorage.removeItem("draggedTask");
        }
      }
    }
  };

  // Empty cell - show "+" button with drag-drop support
  if (!data || !data.tasks || data.tasks.length === 0) {
    return (
      <div 
        className={cn(
          "h-full min-h-[120px] p-2 flex items-center justify-center cursor-pointer transition-all duration-200 border border-border/50",
          (isDragOver || isDragOverLocal) && isValidDropZone && "bg-green-100 dark:bg-green-900/20 border-green-500 border-2 border-dashed shadow-lg scale-105",
          (isDragOver || isDragOverLocal) && !isValidDropZone && "bg-red-100 dark:bg-red-900/20 border-red-500 border-2 border-dashed cursor-not-allowed",
          !isDragOver && !isDragOverLocal && "hover:bg-muted/50"
        )}
        onClick={() => onCellClick?.(driverId, date)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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

  // Multiple tasks - show stacked vertically
  return (
      <div 
        className={cn(
          "h-full min-h-[120px] p-1 space-y-1 overflow-y-auto transition-all duration-200",
          (isDragOver || isDragOverLocal) && isValidDropZone && 
          "bg-green-100 dark:bg-green-900/20 border-2 border-green-300 border-dashed",
          (isDragOver || isDragOverLocal) && !isValidDropZone && 
          "bg-red-100 dark:bg-red-900/20 border-2 border-red-300 border-dashed",
          isDropped && "bg-green-100 border-green-300 border-2 border-dashed"
        )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {tasks.map((task) => {
        const colors = getTaskTypeColor(task.task_type, task.color_override);
        
        return (
          <Popover key={task.id}>
            <PopoverTrigger asChild>
              <div 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(task));
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.dropEffect = "move";
                  setIsDragging(true);
                  // Store in localStorage for drop handling
                  if (typeof window !== "undefined") {
                    localStorage.setItem("draggedTask", JSON.stringify(task));
                  }
                  // Prevent default to avoid conflicts
                  e.stopPropagation();
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  // Clean up localStorage
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("draggedTask");
                  }
                }}
                className={cn(
                  "p-1.5 cursor-move hover:shadow-lg transition-all duration-200 border-l-3 rounded transform",
                  isDragging ? "opacity-50 scale-95 shadow-2xl" : "hover:scale-105 active:scale-95",
                  isDropped && "animate-pulse bg-green-100 border-green-500 scale-110",
                  colors.bg,
                  colors.border
                )}
              >
                <div className="space-y-0.5">
                  {/* Task Number and Title */}
                  <div className="flex items-start gap-1.5">
                    <div className={cn(
                      "text-lg font-bold leading-none flex-shrink-0",
                      colors.text
                    )}>
                      {task.task_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-[11px] font-semibold truncate leading-tight",
                        colors.text
                      )}>
                        {task.title || task.booking_service_name || t(`shifts.shiftType.${task.task_type}`)}
                      </div>
                      {/* Time */}
                      {task.start_time && (
                        <div className={cn(
                          "text-[9px] font-medium truncate",
                          colors.text,
                          "opacity-80"
                        )}>
                          {task.start_time}
                          {task.hours_per_day && ` • ${task.hours_per_day}h`}
                        </div>
                      )}
                    </div>
                    {task.is_multi_day && (
                      <Badge variant="outline" className={cn("text-[8px] px-0.5 py-0 h-4", colors.badge)}>
                        {task.current_day}/{task.total_days}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <TaskDetails 
                task={task} 
                onViewClick={() => {
                  onTaskClick?.(task);
                }}
              />
            </PopoverContent>
          </Popover>
        );
      })}
      
      {/* Add More Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCellClick?.(driverId, date)}
        className="w-full h-6 text-[10px] text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Task
      </Button>
    </div>
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

