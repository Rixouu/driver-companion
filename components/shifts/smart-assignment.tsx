"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, User, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { CrewTask } from "@/types/crew-tasks";
import { format } from "date-fns";
import { toast } from "sonner";

interface DriverCapacity {
  id: string;
  first_name: string;
  last_name: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  max_hours_per_month: number;
  current_hours_today?: number;
  current_hours_week?: number;
  current_hours_month?: number;
  preferred_start_time?: string;
  preferred_end_time?: string;
}

interface SmartAssignmentProps {
  unassignedTasks: CrewTask[];
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  driverCapacities: DriverCapacity[];
  onAssignTasks: (assignments: Array<{ taskId: string; driverId: string }>) => Promise<void>;
}

interface AssignmentSuggestion {
  taskId: string;
  driverId: string;
  driverName: string;
  score: number;
  reasons: string[];
  conflicts: string[];
}

export function SmartAssignment({ 
  unassignedTasks, 
  drivers, 
  driverCapacities, 
  onAssignTasks 
}: SmartAssignmentProps) {
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  // Calculate assignment suggestions
  const assignmentSuggestions = useMemo(() => {
    const suggestions: AssignmentSuggestion[] = [];

    // Filter out the unassigned driver from assignment suggestions
    const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
    const availableDrivers = drivers.filter(driver => driver.id !== unassignedDriverId);
    
    unassignedTasks.forEach(task => {
      availableDrivers.forEach(driver => {
        const capacity = driverCapacities.find(c => c.id === driver.id);
        if (!capacity) return;

        const reasons: string[] = [];
        const conflicts: string[] = [];
        let score = 0;

        // Check capacity constraints
        const taskHours = task.hours_per_day || 0;
        const currentHoursToday = capacity.current_hours_today || 0;
        const currentHoursWeek = capacity.current_hours_week || 0;
        const currentHoursMonth = capacity.current_hours_month || 0;

        // Daily capacity check
        if (currentHoursToday + taskHours <= capacity.max_hours_per_day) {
          score += 30;
          reasons.push(`Fits daily capacity (${currentHoursToday + taskHours}/${capacity.max_hours_per_day}h)`);
        } else {
          conflicts.push(`Exceeds daily capacity (${currentHoursToday + taskHours}/${capacity.max_hours_per_day}h)`);
        }

        // Weekly capacity check
        if (currentHoursWeek + taskHours <= capacity.max_hours_per_week) {
          score += 20;
          reasons.push(`Fits weekly capacity (${currentHoursWeek + taskHours}/${capacity.max_hours_per_week}h)`);
        } else {
          conflicts.push(`Exceeds weekly capacity (${currentHoursWeek + taskHours}/${capacity.max_hours_per_week}h)`);
        }

        // Monthly capacity check
        if (currentHoursMonth + taskHours <= capacity.max_hours_per_month) {
          score += 10;
          reasons.push(`Fits monthly capacity (${currentHoursMonth + taskHours}/${capacity.max_hours_per_month}h)`);
        } else {
          conflicts.push(`Exceeds monthly capacity (${currentHoursMonth + taskHours}/${capacity.max_hours_per_month}h)`);
        }

        // Time preference matching
        if (capacity.preferred_start_time && capacity.preferred_end_time) {
          const taskStart = task.start_time || "09:00";
          const taskEnd = task.end_time || "17:00";
          
          if (taskStart >= capacity.preferred_start_time && taskEnd <= capacity.preferred_end_time) {
            score += 15;
            reasons.push("Matches preferred working hours");
          } else {
            score += 5;
            reasons.push("Outside preferred hours but acceptable");
          }
        }

        // Task type preferences (you can expand this)
        if (task.task_type === 'charter' || task.task_type === 'regular') {
          score += 10;
          reasons.push("Suitable for service tasks");
        }

        // Location proximity (simplified - you can add real distance calculation)
        if (task.location && task.location.includes('Tokyo')) {
          score += 5;
          reasons.push("Tokyo area - good accessibility");
        }

        // Only suggest if there are no major conflicts
        if (conflicts.length === 0 || score >= 50) {
          suggestions.push({
            taskId: task.id,
            driverId: driver.id,
            driverName: `${driver.first_name} ${driver.last_name}`,
            score: Math.min(score, 100),
            reasons,
            conflicts
          });
        }
      });
    });

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
  }, [unassignedTasks, drivers, driverCapacities]);

  // Group suggestions by task
  const suggestionsByTask = useMemo(() => {
    const grouped: Record<string, AssignmentSuggestion[]> = {};
    assignmentSuggestions.forEach(suggestion => {
      if (!grouped[suggestion.taskId]) {
        grouped[suggestion.taskId] = [];
      }
      grouped[suggestion.taskId].push(suggestion);
    });
    return grouped;
  }, [assignmentSuggestions]);

  const handleAssignmentToggle = (taskId: string, driverId: string) => {
    const key = `${taskId}-${driverId}`;
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleAssignSelected = async () => {
    if (selectedAssignments.size === 0) {
      toast.error("Please select at least one assignment");
      return;
    }

    setIsAssigning(true);
    try {
      const assignments = Array.from(selectedAssignments).map(key => {
        const [taskId, driverId] = key.split('-');
        return { taskId, driverId };
      });

      await onAssignTasks(assignments);
      setSelectedAssignments(new Set());
      toast.success(`Successfully assigned ${assignments.length} task(s)`);
    } catch (error) {
      console.error("Error assigning tasks:", error);
      toast.error("Failed to assign tasks");
    } finally {
      setIsAssigning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    if (score >= 40) return "outline";
    return "destructive";
  };

  if (unassignedTasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">All Tasks Assigned</h3>
          <p className="text-muted-foreground">No unassigned tasks found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Smart Assignment</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered task assignment based on driver capacity and preferences
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {unassignedTasks.length} unassigned tasks
          </Badge>
          <Button 
            onClick={handleAssignSelected}
            disabled={selectedAssignments.size === 0 || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign Selected ({selectedAssignments.size})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Assignment Suggestions */}
      <div className="space-y-4">
        {Object.entries(suggestionsByTask).map(([taskId, suggestions]) => {
          const task = unassignedTasks.find(t => t.id === taskId);
          if (!task) return null;

          return (
            <Card key={taskId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{task.task_type}</Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.hours_per_day || 0}h
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(task.start_date), "MMM d")} • {task.start_time} - {task.end_time}
                  </div>
                  {task.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {task.location}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.slice(0, 3).map((suggestion, index) => {
                    const key = `${taskId}-${suggestion.driverId}`;
                    const isSelected = selectedAssignments.has(key);
                    
                    return (
                      <div
                        key={suggestion.driverId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleAssignmentToggle(taskId, suggestion.driverId)}
                          />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{suggestion.driverName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Match Score:</span>
                                <Badge 
                                  variant={getScoreBadgeVariant(suggestion.score)}
                                  className="text-xs"
                                >
                                  {suggestion.score}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm space-y-1">
                              {suggestion.reasons.slice(0, 2).map((reason, i) => (
                                <div key={i} className="text-green-600 dark:text-green-400">
                                  ✓ {reason}
                                </div>
                              ))}
                              {suggestion.conflicts.slice(0, 1).map((conflict, i) => (
                                <div key={i} className="text-red-600 dark:text-red-400">
                                  ⚠ {conflict}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
