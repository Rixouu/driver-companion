"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Clock, 
  User, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";

interface DriverCapacity {
  id: string;
  driver_id: string;
  driver_name: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  max_hours_per_month: number;
  preferred_start_time: string;
  preferred_end_time: string;
  working_days: string[];
  is_active: boolean;
}

interface RevampedDriverCapacityModalProps {
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  onCapacityUpdate: (capacities: DriverCapacity[]) => void;
}

const DAYS_OF_WEEK = [
  { value: "monday", labelKey: "shifts.driverCapacityModal.driverSettings.monday" },
  { value: "tuesday", labelKey: "shifts.driverCapacityModal.driverSettings.tuesday" },
  { value: "wednesday", labelKey: "shifts.driverCapacityModal.driverSettings.wednesday" },
  { value: "thursday", labelKey: "shifts.driverCapacityModal.driverSettings.thursday" },
  { value: "friday", labelKey: "shifts.driverCapacityModal.driverSettings.friday" },
  { value: "saturday", labelKey: "shifts.driverCapacityModal.driverSettings.saturday" },
  { value: "sunday", labelKey: "shifts.driverCapacityModal.driverSettings.sunday" },
];

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

export function RevampedDriverCapacityModal({
  drivers,
  onCapacityUpdate,
}: RevampedDriverCapacityModalProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [capacities, setCapacities] = useState<DriverCapacity[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize capacities for all drivers
  useEffect(() => {
    if (drivers.length > 0) {
      const initialCapacities = drivers.map(driver => ({
        id: `capacity-${driver.id}`,
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        max_hours_per_day: 8,
        max_hours_per_week: 40,
        max_hours_per_month: 160,
        preferred_start_time: "09:00",
        preferred_end_time: "17:00",
        working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        is_active: true,
      }));
      setCapacities(initialCapacities);
      if (!selectedDriver && initialCapacities.length > 0) {
        setSelectedDriver(initialCapacities[0].driver_id);
      }
    }
  }, [drivers]);

  const selectedCapacity = capacities.find(c => c.driver_id === selectedDriver);

  const handleCapacityChange = (field: keyof DriverCapacity, value: any) => {
    if (!selectedDriver) return;
    
    setCapacities(prev => prev.map(capacity => 
      capacity.driver_id === selectedDriver 
        ? { ...capacity, [field]: value }
        : capacity
    ));
  };

  const handleWorkingDayToggle = (day: string) => {
    if (!selectedDriver) return;
    
    setCapacities(prev => prev.map(capacity => 
      capacity.driver_id === selectedDriver 
        ? {
            ...capacity,
            working_days: capacity.working_days.includes(day)
              ? capacity.working_days.filter(d => d !== day)
              : [...capacity.working_days, day]
          }
        : capacity
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to your backend
      // For now, we'll just update the parent component
      onCapacityUpdate(capacities);
      toast.success("Driver capacities updated successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update driver capacities");
      console.error("Error saving capacities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCapacityStatus = (capacity: DriverCapacity) => {
    const totalDays = capacity.working_days.length;
    const weeklyHours = capacity.max_hours_per_day * totalDays;
    const monthlyHours = capacity.max_hours_per_week * 4;
    
    if (weeklyHours > capacity.max_hours_per_week) {
      return { status: "warning", message: "Weekly hours exceed limit" };
    }
    if (monthlyHours > capacity.max_hours_per_month) {
      return { status: "error", message: "Monthly hours exceed limit" };
    }
    return { status: "success", message: t('shifts.driverCapacityModal.configurationStatus.valid') };
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        {t('shifts.buttons.driverCapacity')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 w-full max-w-[95vw] sm:max-w-6xl">
          <DialogHeader className="p-4 sm:p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-5 w-5" />
              {t('shifts.driverCapacityModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('shifts.driverCapacityModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Driver List Sidebar */}
              <div className="w-full lg:w-80 border-r bg-muted/30 lg:border-r-0 lg:border-b-0 border-b">
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Users className="h-4 w-4" />
                    {t('shifts.driverCapacityModal.driversList.title')} ({drivers.length})
                  </h3>
                  <ScrollArea className="h-[200px] lg:h-[calc(100vh-200px)]">
                    <div className="space-y-2">
                      {capacities.map((capacity) => {
                        const status = getCapacityStatus(capacity);
                        return (
                          <Card
                            key={capacity.driver_id}
                            className={cn(
                              "cursor-pointer transition-all duration-200 group",
                              selectedDriver === capacity.driver_id 
                                ? "ring-2 ring-primary bg-primary border-primary shadow-md" 
                                : "hover:bg-muted/50 hover:border-muted-foreground/50 hover:shadow-sm dark:hover:bg-muted/30 dark:hover:border-muted-foreground/30"
                            )}
                            onClick={() => setSelectedDriver(capacity.driver_id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "font-medium text-sm truncate transition-colors",
                                    selectedDriver === capacity.driver_id 
                                      ? "text-primary-foreground" 
                                      : "text-foreground group-hover:text-foreground"
                                  )}>
                                    {capacity.driver_name}
                                  </p>
                                  <p className={cn(
                                    "text-xs transition-colors",
                                    selectedDriver === capacity.driver_id 
                                      ? "text-primary-foreground/90" 
                                      : "text-muted-foreground group-hover:text-muted-foreground/80"
                                  )}>
                                    {t('shifts.driverCapacityModal.driversList.workSchedule', {
                                      hours: capacity.max_hours_per_day,
                                      days: capacity.working_days.length
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {status.status === "success" && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  {status.status === "warning" && (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  )}
                                  {status.status === "error" && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Capacity Configuration */}
              <div className="flex-1 overflow-hidden">
                {selectedCapacity ? (
                  <ScrollArea className="h-full">
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Driver Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold">{selectedCapacity.driver_name}</h2>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('shifts.driverCapacityModal.driverSettings.configure')}
                          </p>
                        </div>
                        <Badge variant={selectedCapacity.is_active ? "default" : "secondary"} className="w-fit">
                          {selectedCapacity.is_active ? t('shifts.driverCapacityModal.status.active') : t('shifts.driverCapacityModal.status.inactive')}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Hours Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {t('shifts.driverCapacityModal.driverSettings.workingHours')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="max_hours_per_day">{t('shifts.driverCapacityModal.driverSettings.maxHoursPerDay')}</Label>
                              <Input
                                id="max_hours_per_day"
                                type="number"
                                min="1"
                                max="24"
                                value={selectedCapacity.max_hours_per_day}
                                onChange={(e) => handleCapacityChange("max_hours_per_day", parseInt(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max_hours_per_week">{t('shifts.driverCapacityModal.driverSettings.maxHoursPerWeek')}</Label>
                              <Input
                                id="max_hours_per_week"
                                type="number"
                                min="1"
                                max="168"
                                value={selectedCapacity.max_hours_per_week}
                                onChange={(e) => handleCapacityChange("max_hours_per_week", parseInt(e.target.value))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max_hours_per_month">{t('shifts.driverCapacityModal.driverSettings.maxHoursPerMonth')}</Label>
                              <Input
                                id="max_hours_per_month"
                                type="number"
                                min="1"
                                max="720"
                                value={selectedCapacity.max_hours_per_month}
                                onChange={(e) => handleCapacityChange("max_hours_per_month", parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Preferred Working Times */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {t('shifts.driverCapacityModal.driverSettings.preferredTimes')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="preferred_start_time">{t('shifts.driverCapacityModal.driverSettings.preferredStartTime')}</Label>
                              <Select
                                value={selectedCapacity.preferred_start_time}
                                onValueChange={(value) => handleCapacityChange("preferred_start_time", value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_SLOTS.map(time => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="preferred_end_time">{t('shifts.driverCapacityModal.driverSettings.preferredEndTime')}</Label>
                              <Select
                                value={selectedCapacity.preferred_end_time}
                                onValueChange={(value) => handleCapacityChange("preferred_end_time", value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_SLOTS.map(time => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Working Days */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {t('shifts.driverCapacityModal.driverSettings.workingDays')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {DAYS_OF_WEEK.map((day) => (
                              <div
                                key={day.value}
                                className={cn(
                                  "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all duration-200",
                                  selectedCapacity.working_days.includes(day.value)
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm dark:bg-primary dark:border-primary dark:text-primary-foreground"
                                    : "bg-background dark:bg-card text-foreground dark:text-foreground border-input dark:border-border hover:bg-muted/50 hover:border-muted-foreground/50 hover:shadow-sm dark:hover:bg-muted/30 dark:hover:border-muted-foreground/30"
                                )}
                                onClick={() => handleWorkingDayToggle(day.value)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCapacity.working_days.includes(day.value)}
                                  onChange={() => handleWorkingDayToggle(day.value)}
                                  className="sr-only"
                                  aria-label={`Toggle ${day.label} as working day`}
                                />
                                <div className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200",
                                  selectedCapacity.working_days.includes(day.value)
                                    ? "bg-primary-foreground border-primary-foreground shadow-sm dark:bg-primary-foreground dark:border-primary-foreground"
                                    : "border-current hover:border-primary/50 hover:bg-primary/5 dark:border-muted-foreground dark:hover:border-primary/50 dark:hover:bg-primary/5"
                                )}>
                                  {selectedCapacity.working_days.includes(day.value) && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </div>
                                <span className="text-sm font-medium">{t(day.labelKey)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Status Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('shifts.driverCapacityModal.configurationStatus.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const status = getCapacityStatus(selectedCapacity);
                            return (
                              <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg",
                                status.status === "success" && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                                status.status === "warning" && "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                                status.status === "error" && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              )}>
                                {status.status === "success" && <CheckCircle className="h-4 w-4" />}
                                {status.status === "warning" && <AlertCircle className="h-4 w-4" />}
                                {status.status === "error" && <AlertCircle className="h-4 w-4" />}
                                <span className="text-sm font-medium">{status.message}</span>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Select a driver to configure their capacity</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {t('shifts.driverCapacityModal.driversList.status', {
                  active: capacities.filter(c => c.is_active).length,
                  total: capacities.length
                })}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                  {t('shifts.driverCapacityModal.buttons.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('shifts.driverCapacityModal.buttons.saveChanges')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
