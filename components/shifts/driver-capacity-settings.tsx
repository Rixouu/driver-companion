"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Clock, User, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface DriverCapacity {
  id: string;
  first_name: string;
  last_name: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  max_hours_per_month: number;
  preferred_start_time?: string;
  preferred_end_time?: string;
}

interface DriverCapacitySettingsProps {
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  onCapacityUpdate: (capacities: DriverCapacity[]) => void;
}

export function DriverCapacitySettings({ drivers, onCapacityUpdate }: DriverCapacitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [capacities, setCapacities] = useState<DriverCapacity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize capacities with default values
  useEffect(() => {
    if (drivers.length > 0 && capacities.length === 0) {
      const defaultCapacities = drivers.map(driver => ({
        id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        max_hours_per_day: 8,
        max_hours_per_week: 40,
        max_hours_per_month: 160,
        preferred_start_time: "09:00",
        preferred_end_time: "17:00",
      }));
      setCapacities(defaultCapacities);
    }
  }, [drivers, capacities.length]);

  const handleCapacityChange = (driverId: string, field: keyof DriverCapacity, value: string | number) => {
    setCapacities(prev => 
      prev.map(driver => 
        driver.id === driverId 
          ? { ...driver, [field]: value }
          : driver
      )
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to your database
      // For now, we'll just update the parent component
      onCapacityUpdate(capacities);
      toast.success("Driver capacities updated successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving capacities:", error);
      toast.error("Failed to save driver capacities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultCapacities = drivers.map(driver => ({
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      max_hours_per_day: 8,
      max_hours_per_week: 40,
      max_hours_per_month: 160,
      preferred_start_time: "09:00",
      preferred_end_time: "17:00",
    }));
    setCapacities(defaultCapacities);
    toast.info("Capacities reset to defaults");
  };

  const getCapacityColor = (hours: number, maxHours: number) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 100) return "text-red-600 dark:text-red-400";
    if (percentage >= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Driver Capacity Settings
          </DialogTitle>
          <DialogDescription>
            Configure maximum working hours and preferences for each driver
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-daily">Default Daily Hours</Label>
                  <Input
                    id="default-daily"
                    type="number"
                    value="8"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-weekly">Default Weekly Hours</Label>
                  <Input
                    id="default-weekly"
                    type="number"
                    value="40"
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-monthly">Default Monthly Hours</Label>
                  <Input
                    id="default-monthly"
                    type="number"
                    value="160"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Capacities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Driver Capacities</h3>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>

            <div className="grid gap-4">
              {capacities.map((driver) => (
                <Card key={driver.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {driver.first_name} {driver.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Driver ID: {driver.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {driver.max_hours_per_day}h/day
                        </Badge>
                        <Badge variant="outline">
                          {driver.max_hours_per_week}h/week
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`daily-${driver.id}`}>Daily Hours</Label>
                        <Input
                          id={`daily-${driver.id}`}
                          type="number"
                          min="1"
                          max="12"
                          value={driver.max_hours_per_day}
                          onChange={(e) => handleCapacityChange(driver.id, 'max_hours_per_day', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`weekly-${driver.id}`}>Weekly Hours</Label>
                        <Input
                          id={`weekly-${driver.id}`}
                          type="number"
                          min="1"
                          max="60"
                          value={driver.max_hours_per_week}
                          onChange={(e) => handleCapacityChange(driver.id, 'max_hours_per_week', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`monthly-${driver.id}`}>Monthly Hours</Label>
                        <Input
                          id={`monthly-${driver.id}`}
                          type="number"
                          min="1"
                          max="240"
                          value={driver.max_hours_per_month}
                          onChange={(e) => handleCapacityChange(driver.id, 'max_hours_per_month', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`start-${driver.id}`}>Preferred Start</Label>
                        <Input
                          id={`start-${driver.id}`}
                          type="time"
                          value={driver.preferred_start_time}
                          onChange={(e) => handleCapacityChange(driver.id, 'preferred_start_time', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`end-${driver.id}`}>Preferred End</Label>
                        <Input
                          id={`end-${driver.id}`}
                          type="time"
                          value={driver.preferred_end_time}
                          onChange={(e) => handleCapacityChange(driver.id, 'preferred_end_time', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
