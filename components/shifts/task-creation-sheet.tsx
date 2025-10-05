"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Users, 
  AlertCircle,
  GraduationCap,
  Wrench,
  Coffee,
  Cake,
  Calendar as CalendarCheck,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GooglePlaceAutocomplete } from "@/components/bookings/google-place-autocomplete";
import type { TaskType, TaskStatus, CreateCrewTaskRequest } from "@/types/crew-tasks";

interface TaskCreationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateCrewTaskRequest, applyToMultiple: boolean, selectedDriverIds: string[], isEditing: boolean, editingTaskId?: string) => Promise<void>;
  selectedDriverId?: string;
  selectedDate?: string;
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  isLoading?: boolean;
  editingTask?: any; // For editing existing tasks
}

const TASK_TYPES: { 
  value: TaskType; 
  labelKey: string; 
  color: string; 
  icon: React.ReactNode;
  descriptionKey: string;
}[] = [
  { 
    value: "charter", 
    labelKey: "shifts.modal.taskTypes.charter.title", 
    color: "bg-blue-500", 
    icon: <Users className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.charter.description"
  },
  { 
    value: "regular", 
    labelKey: "shifts.modal.taskTypes.regular.title", 
    color: "bg-emerald-500", 
    icon: <CalendarCheck className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.regular.description"
  },
  { 
    value: "training", 
    labelKey: "shifts.modal.taskTypes.training.title", 
    color: "bg-purple-500", 
    icon: <GraduationCap className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.training.description"
  },
  { 
    value: "day_off", 
    labelKey: "shifts.modal.taskTypes.day_off.title", 
    color: "bg-gray-500", 
    icon: <Coffee className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.day_off.description"
  },
  { 
    value: "maintenance", 
    labelKey: "shifts.modal.taskTypes.maintenance.title", 
    color: "bg-orange-500", 
    icon: <Wrench className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.maintenance.description"
  },
  { 
    value: "meeting", 
    labelKey: "shifts.modal.taskTypes.meeting.title", 
    color: "bg-indigo-500", 
    icon: <Users className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.meeting.description"
  },
  { 
    value: "standby", 
    labelKey: "shifts.modal.taskTypes.standby.title", 
    color: "bg-amber-500", 
    icon: <Clock className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.standby.description"
  },
  { 
    value: "special", 
    labelKey: "shifts.modal.taskTypes.special_event.title", 
    color: "bg-pink-500", 
    icon: <Cake className="h-4 w-4" />,
    descriptionKey: "shifts.modal.taskTypes.special_event.description"
  },
];

export function TaskCreationSheet({
  isOpen,
  onClose,
  onSave,
  selectedDriverId,
  selectedDate,
  drivers,
  isLoading = false,
  editingTask,
}: TaskCreationSheetProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState<"type" | "details">("type");
  const [formData, setFormData] = useState<CreateCrewTaskRequest>({
    task_number: 1,
    task_type: "regular",
    driver_id: selectedDriverId || "",
    start_date: selectedDate || new Date().toISOString().split("T")[0],
    end_date: selectedDate || new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "17:00",
    hours_per_day: 8,
    title: "",
    description: "",
    location: "",
    customer_name: "",
    customer_phone: "",
    priority: 0,
    notes: "",
  });

  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyToMultiple, setApplyToMultiple] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>(
    selectedDriverId ? [selectedDriverId] : []
  );
  const [selectAllDrivers, setSelectAllDrivers] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setFormData({
          ...editingTask,
          // Ensure end_date is not before start_date
          end_date: editingTask.end_date >= editingTask.start_date 
            ? editingTask.end_date 
            : editingTask.start_date
        });
        setCurrentStep("details");
      } else {
        setFormData({
          task_number: 1,
          task_type: "regular",
          driver_id: selectedDriverId || "",
          start_date: selectedDate || new Date().toISOString().split("T")[0],
          end_date: selectedDate || new Date().toISOString().split("T")[0],
          start_time: "09:00",
          end_time: "17:00",
          hours_per_day: 8,
          title: "",
          description: "",
          location: "",
          customer_name: "",
          customer_phone: "",
          priority: 0,
          notes: "",
        });
        setCurrentStep("type");
        setIsMultiDay(false);
        setApplyToMultiple(false);
        setSelectedDriverIds(selectedDriverId ? [selectedDriverId] : []);
        setSelectAllDrivers(false);
      }
    }
  }, [isOpen, selectedDriverId, selectedDate, editingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate dates before submission
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      setDateValidationError("Start date cannot be after end date. Please correct the dates.");
      return;
    }

    setIsSubmitting(true);
    try {
      const driversToApply = selectAllDrivers 
        ? drivers.map(d => d.id) 
        : selectedDriverIds;
      
      const isEditing = !!editingTask;
      const editingTaskId = editingTask?.id;
      
      await onSave(formData, applyToMultiple && !isEditing, driversToApply, isEditing, editingTaskId);
      onClose();
    } catch (error) {
      console.error("Error creating/updating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateCrewTaskRequest, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // If start_date is changed and it's not a multi-day task, update end_date to match
      if (field === "start_date" && !isMultiDay) {
        newData.end_date = value;
      }
      
      // If end_date is changed and it's not a multi-day task, update start_date to match
      if (field === "end_date" && !isMultiDay) {
        newData.start_date = value;
      }
      
      // For multi-day tasks, ensure end_date is not before start_date
      if (isMultiDay && field === "end_date" && newData.start_date && value < newData.start_date) {
        newData.end_date = newData.start_date;
        setDateValidationError("End date cannot be before start date. It has been adjusted.");
      }
      
      // For multi-day tasks, ensure start_date is not after end_date
      if (isMultiDay && field === "start_date" && newData.end_date && value > newData.end_date) {
        newData.end_date = value;
        setDateValidationError("Start date cannot be after end date. End date has been adjusted.");
      }
      
      // Clear validation error if dates are valid
      if (newData.start_date && newData.end_date && newData.start_date <= newData.end_date) {
        setDateValidationError(null);
      }
      
      return newData;
    });
  };

  const handleMultiDayToggle = (checked: boolean) => {
    setIsMultiDay(checked);
    if (!checked) {
      setFormData(prev => ({
        ...prev,
        end_date: prev.start_date,
      }));
    }
  };

  const handleDriverSelection = (driverId: string) => {
    setSelectedDriverIds(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      }
      return [...prev, driverId];
    });
  };

  const handleSelectAllDrivers = (checked: boolean) => {
    setSelectAllDrivers(checked);
    if (checked) {
      setSelectedDriverIds(drivers.map(d => d.id));
    } else {
      setSelectedDriverIds([]);
    }
  };

  const selectedTaskType = TASK_TYPES.find(t => t.value === formData.task_type);

  // Render task type selection step
  if (currentStep === "type") {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-2xl"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on Google Places autocomplete dropdown
            if (e.target && (e.target as Element).closest('.pac-container')) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>{t("shifts.modal.selectTaskType")}</SheetTitle>
            <SheetDescription>
              {t("shifts.modal.selectTaskTypeDescription")}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              {TASK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    handleInputChange("task_type", type.value);
                    setCurrentStep("details");
                  }}
                  className={cn(
                    "p-6 rounded-lg border-2 transition-all text-left hover:shadow-lg",
                    formData.task_type === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-lg", type.color, "text-white")}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{t(type.labelKey)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(type.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Render task details form
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-3xl"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Google Places autocomplete dropdown
          if (e.target && (e.target as Element).closest('.pac-container')) {
            e.preventDefault()
          }
        }}
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", selectedTaskType?.color, "text-white")}>
              {selectedTaskType?.icon}
            </div>
            <div>
              <SheetTitle>
                {editingTask ? t("shifts.modal.editTask") : t("shifts.modal.createTask")}
              </SheetTitle>
              <SheetDescription>
                {selectedTaskType ? t(selectedTaskType.labelKey) : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          <form onSubmit={handleSubmit} className="space-y-6 pr-6">
            {/* Driver Assignment - Show for both create and edit */}
            {(
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {editingTask ? t("shifts.modal.reassignDriver") : t("shifts.modal.assignTo")}
                  </Label>
                  {!editingTask && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="apply_multiple"
                        checked={applyToMultiple}
                        onCheckedChange={(checked) => setApplyToMultiple(checked as boolean)}
                      />
                      <Label htmlFor="apply_multiple" className="text-sm cursor-pointer">
                        {t("shifts.modal.applyToMultipleDrivers")}
                      </Label>
                    </div>
                  )}
                </div>

                {applyToMultiple && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        {selectedDriverIds.length} driver(s) selected
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select_all"
                          checked={selectAllDrivers}
                          onCheckedChange={handleSelectAllDrivers}
                        />
                        <Label htmlFor="select_all" className="text-sm cursor-pointer">
                          Select All
                        </Label>
                      </div>
                    </div>
                    <ScrollArea className="h-32 border rounded-lg p-2">
                      <div className="space-y-1">
                        {drivers.map((driver) => (
                          <div
                            key={driver.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                          >
                            <Checkbox
                              id={`driver-${driver.id}`}
                              checked={selectedDriverIds.includes(driver.id)}
                              onCheckedChange={() => handleDriverSelection(driver.id)}
                            />
                            <Label
                              htmlFor={`driver-${driver.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {driver.first_name} {driver.last_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {!applyToMultiple && (
                  <Select
                    value={formData.driver_id}
                    onValueChange={(value) => handleInputChange("driver_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("shifts.modal.selectDriver")} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.first_name} {driver.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Task Number */}
            <div className="space-y-2">
              <Label htmlFor="task_number">{t("shifts.modal.taskNumber")}</Label>
              <Input
                id="task_number"
                type="number"
                min="1"
                max="10"
                value={formData.task_number}
                onChange={(e) => handleInputChange("task_number", parseInt(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Task number (1-10) for organizing multiple tasks per day
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t("shifts.modal.title")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={`e.g., ${selectedTaskType ? t(selectedTaskType.labelKey) : ""}`}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("shifts.modal.description")}</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t("shifts.modal.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multi_day"
                  checked={isMultiDay}
                  onCheckedChange={handleMultiDayToggle}
                />
                <Label htmlFor="multi_day">{t("shifts.modal.multiDayTask")}</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("shifts.modal.startDate")} *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(new Date(formData.start_date), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date ? new Date(formData.start_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange("start_date", format(date, "yyyy-MM-dd"));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t("shifts.modal.endDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                        disabled={!isMultiDay}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? format(new Date(formData.end_date), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date ? new Date(formData.end_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange("end_date", format(date, "yyyy-MM-dd"));
                          }
                        }}
                        disabled={(date) => !isMultiDay || (formData.start_date && date < new Date(formData.start_date)) || false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Date Validation Alert */}
            {dateValidationError && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  {dateValidationError}
                </AlertDescription>
              </Alert>
            )}

            {/* Time and Hours (conditional based on task type) */}
            {!["day_off", "special"].includes(formData.task_type) && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">{t("shifts.modal.startTime")}</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => handleInputChange("start_time", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">{t("shifts.modal.endTime")}</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => handleInputChange("end_time", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours_per_day">{t("shifts.modal.hoursPerDay")}</Label>
                    <Input
                      id="hours_per_day"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={formData.hours_per_day}
                      onChange={(e) => handleInputChange("hours_per_day", parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Location with Google Maps Autocomplete (for most task types) */}
            {!["day_off", "special"].includes(formData.task_type) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <GooglePlaceAutocomplete
                    id="location"
                    name="location"
                    label={t("shifts.modal.location") || "Location"}
                    value={formData.location || ""}
                    onChange={(name, value) => handleInputChange(name as keyof CreateCrewTaskRequest, value)}
                    placeholder={t("shifts.modal.locationPlaceholder") || "Enter location"}
                    required={false}
                  />
                </div>
              </>
            )}

            {/* Customer Information (for charter/regular services) */}
            {["charter", "regular"].includes(formData.task_type) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">{t("shifts.modal.customerInfo")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">{t("shifts.modal.customerName")}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => handleInputChange("customer_name", e.target.value)}
                          className="pl-10"
                          placeholder={t("shifts.modal.customerNamePlaceholder")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">{t("shifts.modal.customerPhone")}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer_phone"
                          value={formData.customer_phone}
                          onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                          className="pl-10"
                          placeholder={t("shifts.modal.customerPhonePlaceholder")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="notes">{t("shifts.modal.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t("shifts.modal.notesPlaceholder")}
                rows={3}
              />
            </div>

            {/* Summary */}
            {isMultiDay && formData.start_date && formData.end_date && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Task Summary:</p>
                    <ul className="text-sm list-disc list-inside">
                      <li>
                        Duration: {Math.ceil(
                          (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        ) + 1} days
                      </li>
                      {formData.hours_per_day && (
                        <li>Hours per day: {formData.hours_per_day}h</li>
                      )}
                      {applyToMultiple && (
                        <li>Will be assigned to {selectedDriverIds.length} driver(s)</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </form>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => editingTask ? onClose() : setCurrentStep("type")}
          >
            {editingTask ? t("common.cancel") : t("common.back")}
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || (!applyToMultiple && !formData.driver_id) || (applyToMultiple && selectedDriverIds.length === 0)}
          >
            {isSubmitting ? t("common.saving") : editingTask ? t("common.update") : t("shifts.modal.createTask")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

