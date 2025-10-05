"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Clock, MapPin, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { CrewTask } from "@/types/crew-tasks";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

interface EnhancedAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CrewTask | null;
  drivers: Driver[];
  onAssign: (taskId: string, driverId: string) => Promise<void>;
}

export function EnhancedAssignModal({
  isOpen,
  onClose,
  task,
  drivers,
  onAssign
}: EnhancedAssignModalProps) {
  const { t } = useI18n();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!task || !selectedDriverId) return;
    
    setIsAssigning(true);
    setError(null);
    
    try {
      await onAssign(task.id, selectedDriverId);
      onClose();
      setSelectedDriverId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedDriverId(null);
    setError(null);
    onClose();
  };

  if (!task) return null;

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Assign Task
          </DialogTitle>
          <DialogDescription>
            Select a driver to assign this task to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="ml-2">
                {task.task_type}
              </Badge>
            </div>
            
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

          {/* Driver Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Available Drivers</h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {drivers
                  .filter(d => d.id !== '00000000-0000-0000-0000-000000000000')
                  .map((driver) => (
                  <Button
                    key={driver.id}
                    variant={selectedDriverId === driver.id ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start h-auto p-4 transition-all",
                      selectedDriverId === driver.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        selectedDriverId === driver.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">
                          {driver.first_name} {driver.last_name}
                        </p>
                        {driver.email && (
                          <p className="text-sm text-muted-foreground">{driver.email}</p>
                        )}
                      </div>
                      {selectedDriverId === driver.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isAssigning}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedDriverId || isAssigning}
              className="min-w-[100px]"
            >
              {isAssigning ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
