"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Calendar, Clock, User, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { format } from "date-fns";

interface Conflict {
  id: string;
  task_number: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

interface DriverConflict {
  driverId: string;
  driverName: string;
  conflicts: Conflict[];
}

interface ConflictDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  driverConflicts: DriverConflict[];
  onResolve: (resolution: 'skip' | 'overwrite', driverIds: string[]) => Promise<void>;
}

export function ConflictDetectionModal({
  isOpen,
  onClose,
  task,
  driverConflicts,
  onResolve
}: ConflictDetectionModalProps) {
  const { t } = useI18n();
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionType, setResolutionType] = useState<'skip' | 'overwrite' | null>(null);

  const handleResolve = async (type: 'skip' | 'overwrite') => {
    if (selectedDrivers.length === 0) return;
    
    setIsResolving(true);
    setResolutionType(type);
    
    try {
      await onResolve(type, selectedDrivers);
      onClose();
    } catch (error) {
      console.error('Error resolving conflicts:', error);
    } finally {
      setIsResolving(false);
      setResolutionType(null);
    }
  };

  const handleClose = () => {
    setSelectedDrivers([]);
    setResolutionType(null);
    onClose();
  };

  const toggleDriver = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const selectAllDrivers = () => {
    setSelectedDrivers(driverConflicts.map(dc => dc.driverId));
  };

  const clearSelection = () => {
    setSelectedDrivers([]);
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Task Creation Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Some drivers have conflicting tasks. Choose how to resolve these conflicts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{task.start_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{task.hours_per_day || 0}h</span>
              </div>
              {task.location && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{task.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conflict Summary */}
          <Alert className="border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>{driverConflicts.length} driver(s)</strong> have conflicting tasks on {task.start_date}. 
              You can skip these drivers or overwrite their existing tasks.
            </AlertDescription>
          </Alert>

          {/* Driver Conflicts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Conflicting Drivers</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllDrivers}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {driverConflicts.map((driverConflict) => (
                  <div 
                    key={driverConflict.driverId}
                    className={cn(
                      "border rounded-lg p-4 transition-colors cursor-pointer",
                      selectedDrivers.includes(driverConflict.driverId) 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => toggleDriver(driverConflict.driverId)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{driverConflict.driverName}</span>
                        <Badge variant="destructive" className="text-xs">
                          {driverConflict.conflicts.length} conflict(s)
                        </Badge>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded border-2 transition-colors",
                        selectedDrivers.includes(driverConflict.driverId)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}>
                        {selectedDrivers.includes(driverConflict.driverId) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <X className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {driverConflict.conflicts.map((conflict) => (
                        <div key={conflict.id} className="bg-muted/50 rounded p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{conflict.title}</span>
                            <Badge variant="outline" className="text-xs">
                              #{conflict.task_number}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{conflict.start_date}</span>
                            {conflict.start_time && (
                              <span>{conflict.start_time}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Resolution Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Skip Selected Drivers</h5>
                <p className="text-xs text-muted-foreground">
                  Don't create tasks for selected drivers. Keep existing tasks unchanged.
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Overwrite Existing Tasks</h5>
                <p className="text-xs text-muted-foreground">
                  Delete existing conflicting tasks and create new ones for selected drivers.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isResolving}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleResolve('skip')}
              disabled={selectedDrivers.length === 0 || isResolving}
              className="min-w-[120px]"
            >
              {isResolving && resolutionType === 'skip' ? "Skipping..." : `Skip (${selectedDrivers.length})`}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleResolve('overwrite')}
              disabled={selectedDrivers.length === 0 || isResolving}
              className="min-w-[120px]"
            >
              {isResolving && resolutionType === 'overwrite' ? "Overwriting..." : `Overwrite (${selectedDrivers.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
