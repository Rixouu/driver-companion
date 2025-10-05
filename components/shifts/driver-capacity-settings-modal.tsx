"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Clock, Users, Save, RotateCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

interface DriverCapacity {
  id: string;
  driver_id: string;
  daily_hours_limit: number;
  weekly_hours_limit: number;
  monthly_hours_limit: number;
  preferred_start_time: string;
  preferred_end_time: string;
}

interface DriverCapacitySettingsModalProps {
  drivers: Driver[];
  onCapacityUpdate: (capacities: DriverCapacity[]) => void;
}

export function DriverCapacitySettingsModal({ drivers, onCapacityUpdate }: DriverCapacitySettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [capacities, setCapacities] = useState<Record<string, DriverCapacity>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize capacities with default values
  useEffect(() => {
    if (drivers.length > 0 && Object.keys(capacities).length === 0) {
      const defaultCapacities: Record<string, DriverCapacity> = {};
      drivers.forEach(driver => {
        defaultCapacities[driver.id] = {
          id: `capacity-${driver.id}`,
          driver_id: driver.id,
          daily_hours_limit: 8,
          weekly_hours_limit: 40,
          monthly_hours_limit: 160,
          preferred_start_time: "09:00",
          preferred_end_time: "17:00",
        };
      });
      setCapacities(defaultCapacities);
    }
  }, [drivers, capacities]);

  const handleCapacityChange = (driverId: string, field: keyof DriverCapacity, value: any) => {
    setCapacities(prev => ({
      ...prev,
      [driverId]: {
        ...prev[driverId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const capacityArray = Object.values(capacities);
    onCapacityUpdate(capacityArray);
    setHasChanges(false);
    toast.success("Driver capacities updated successfully");
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultCapacities: Record<string, DriverCapacity> = {};
    drivers.forEach(driver => {
      defaultCapacities[driver.id] = {
        id: `capacity-${driver.id}`,
        driver_id: driver.id,
        daily_hours_limit: 8,
        weekly_hours_limit: 40,
        monthly_hours_limit: 160,
        preferred_start_time: "09:00",
        preferred_end_time: "17:00",
        is_active: true,
      };
    });
    setCapacities(defaultCapacities);
    setHasChanges(true);
    toast.info("Reset to default values");
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Driver Capacity Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{drivers.length}</div>
                <p className="text-xs text-muted-foreground">Active drivers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Capacities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(capacities).filter(c => c.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Configured drivers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hasChanges ? (
                    <Badge variant="destructive">Unsaved</Badge>
                  ) : (
                    <Badge variant="secondary">Saved</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Current status</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Driver Capacity Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Driver Capacities</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {drivers.map((driver) => {
                const capacity = capacities[driver.id];
                if (!capacity) return null;

                return (
                  <Card key={driver.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {driver.first_name} {driver.last_name}
                        </CardTitle>
                        <Switch
                          checked={capacity.is_active}
                          onCheckedChange={(checked) => 
                            handleCapacityChange(driver.id, 'is_active', checked)
                          }
                        />
                      </div>
                      <CardDescription>
                        Configure working hours and capacity limits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hours Limits */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hours Limits
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`daily-${driver.id}`} className="text-xs">Daily</Label>
                            <Input
                              id={`daily-${driver.id}`}
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={capacity.daily_hours_limit}
                              onChange={(e) => 
                                handleCapacityChange(driver.id, 'daily_hours_limit', parseFloat(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`weekly-${driver.id}`} className="text-xs">Weekly</Label>
                            <Input
                              id={`weekly-${driver.id}`}
                              type="number"
                              min="0"
                              max="168"
                              step="1"
                              value={capacity.weekly_hours_limit}
                              onChange={(e) => 
                                handleCapacityChange(driver.id, 'weekly_hours_limit', parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`monthly-${driver.id}`} className="text-xs">Monthly</Label>
                            <Input
                              id={`monthly-${driver.id}`}
                              type="number"
                              min="0"
                              max="744"
                              step="1"
                              value={capacity.monthly_hours_limit}
                              onChange={(e) => 
                                handleCapacityChange(driver.id, 'monthly_hours_limit', parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preferred Times */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Preferred Times
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`start-${driver.id}`} className="text-xs">Start Time</Label>
                            <Input
                              id={`start-${driver.id}`}
                              type="time"
                              value={capacity.preferred_start_time}
                              onChange={(e) => 
                                handleCapacityChange(driver.id, 'preferred_start_time', e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`end-${driver.id}`} className="text-xs">End Time</Label>
                            <Input
                              id={`end-${driver.id}`}
                              type="time"
                              value={capacity.preferred_end_time}
                              onChange={(e) => 
                                handleCapacityChange(driver.id, 'preferred_end_time', e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${capacity.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {capacity.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Help Text */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">How it works:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <strong>Daily Limit:</strong> Maximum hours per day (0.5 hour increments)</li>
                    <li>• <strong>Weekly Limit:</strong> Maximum hours per week (Monday-Sunday)</li>
                    <li>• <strong>Monthly Limit:</strong> Maximum hours per calendar month</li>
                    <li>• <strong>Preferred Times:</strong> Used for smart assignment suggestions</li>
                    <li>• <strong>Inactive drivers:</strong> Won't receive new task assignments</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
