"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CrewTaskType, CrewTaskStatus, CreateCrewTaskRequest } from "@/types/crew-tasks";

interface TaskAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: CreateCrewTaskRequest) => Promise<void>;
  selectedDriverId?: string;
  selectedDate?: string;
  selectedTaskNumber?: number;
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  isLoading?: boolean;
}

const TASK_TYPES: { value: CrewTaskType; label: string; color: string }[] = [
  { value: "regular", label: "Regular Service", color: "bg-blue-500" },
  { value: "charter", label: "Charter Service", color: "bg-purple-500" },
  { value: "training", label: "Training", color: "bg-green-500" },
  { value: "day_off", label: "Day Off", color: "bg-gray-500" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-500" },
  { value: "other", label: "Other", color: "bg-slate-500" },
];

const TASK_STATUSES: { value: CrewTaskStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskAssignmentModal({
  isOpen,
  onClose,
  onSave,
  selectedDriverId,
  selectedDate,
  selectedTaskNumber,
  drivers,
  isLoading = false,
}: TaskAssignmentModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreateCrewTaskRequest>({
    task_number: selectedTaskNumber || 1,
    task_type: "regular",
    task_status: "scheduled",
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        task_number: selectedTaskNumber || 1,
        task_type: "regular",
        task_status: "scheduled",
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
      setIsMultiDay(false);
    }
  }, [isOpen, selectedDriverId, selectedDate, selectedTaskNumber]);

  // Calculate total days and hours
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalHours = totalDays * (formData.hours_per_day || 0);
      
      setFormData(prev => ({
        ...prev,
        total_days: totalDays,
        total_hours: totalHours,
      }));
    }
  }, [formData.start_date, formData.end_date, formData.hours_per_day]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateCrewTaskRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

  const selectedTaskType = TASK_TYPES.find(t => t.value === formData.task_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", selectedTaskType?.color)} />
            {t("shifts.modal.createTask")}
          </DialogTitle>
          <DialogDescription>
            {t("shifts.modal.createTaskDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Number and Type */}
          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="task_type">{t("shifts.modal.taskType")}</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => handleInputChange("task_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver_id">{t("shifts.modal.driver")}</Label>
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
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("shifts.modal.title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t("shifts.modal.titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("shifts.modal.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t("shifts.modal.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multi_day"
                checked={isMultiDay}
                onChange={(e) => handleMultiDayToggle(e.target.checked)}
                className="rounded"
                aria-label={t("shifts.modal.multiDayTask")}
              />
              <Label htmlFor="multi_day">{t("shifts.modal.multiDayTask")}</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("shifts.modal.startDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(new Date(formData.start_date), "PPP", { locale: ja }) : t("shifts.modal.selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) => handleInputChange("start_date", date?.toISOString().split("T")[0] || "")}
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
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                      disabled={!isMultiDay}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(new Date(formData.end_date), "PPP", { locale: ja }) : t("shifts.modal.selectDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      onSelect={(date) => handleInputChange("end_date", date?.toISOString().split("T")[0] || "")}
                      disabled={(date) => !isMultiDay || (formData.start_date && date < new Date(formData.start_date))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Time and Hours */}
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

          {/* Customer Information */}
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
            <div className="space-y-2">
              <Label htmlFor="location">{t("shifts.modal.location")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="pl-10"
                  placeholder={t("shifts.modal.locationPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t("shifts.modal.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t("shifts.modal.notesPlaceholder")}
              rows={3}
            />
          </div>

          {/* Summary */}
          {formData.total_days && formData.total_hours && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">{t("shifts.modal.summary")}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("shifts.modal.totalDays")}:</span>
                  <span className="ml-2 font-medium">{formData.total_days}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("shifts.modal.hoursPerDay")}:</span>
                  <span className="ml-2 font-medium">{formData.hours_per_day}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("shifts.modal.totalHours")}:</span>
                  <span className="ml-2 font-medium">{formData.total_hours}h</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? t("common.saving") : t("shifts.modal.createTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
