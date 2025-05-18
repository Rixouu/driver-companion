"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash, Clock, Calendar, Check, X } from "lucide-react";
import { useQuotationService } from "@/hooks/useQuotationService";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TimeInput } from "@/components/time-input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Type definitions
interface TimeBasedRule {
  id?: string;
  name: string;
  category_id: string | null;
  service_type_id: string | null;
  start_time: string;
  end_time: string;
  days_of_week: string[] | null;
  adjustment_percentage: number;
  priority: number;
  is_active: boolean;
  description?: string | null;
}

interface PricingCategory {
  id: string;
  name: string;
  service_type_ids?: string[];
}

interface ServiceTypeInfo {
  id: string;
  name: string;
}

// Custom hook to fetch categories and service types
const usePricingData = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('pricing_categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // Fetch service types
        const { data: serviceTypesData, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('id, name')
          .order('name');
        
        if (serviceTypesError) throw serviceTypesError;
        setServiceTypes(serviceTypesData || []);
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [supabase]);

  return { categories, serviceTypes, loading };
};

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function TimeBasedPricingTab() {
  const { t } = useI18n();
  const { categories, serviceTypes, loading: dataLoading } = usePricingData();

  // State
  const [rules, setRules] = useState<TimeBasedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<TimeBasedRule>;
  }>({
    open: false,
    mode: "add",
    data: {},
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({
    open: false,
    id: null,
  });

  // Load time-based pricing rules
  useEffect(() => {
    fetchRules();
  }, [selectedCategoryId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      
      let url = "/api/admin/pricing/time-based-rules";
      if (selectedCategoryId) {
        url += `?category_id=${selectedCategoryId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch time-based pricing rules");
      }
      
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Error fetching time-based rules:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load time-based pricing rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open
  const handleOpenDialog = (mode: "add" | "edit", rule?: TimeBasedRule) => {
    if (mode === "add") {
      setDialog({
        open: true,
        mode: "add",
        data: {
          name: "",
          category_id: selectedCategoryId,
          service_type_id: null,
          start_time: "22:00",
          end_time: "06:00",
          days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          adjustment_percentage: 25,
          priority: 1,
          is_active: true,
        },
      });
    } else if (mode === "edit" && rule) {
      setDialog({
        open: true,
        mode: "edit",
        data: { ...rule },
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
  };

  // Handle input change in dialog
  const handleInputChange = (field: string, value: any) => {
    setDialog((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  // Toggle day selection
  const toggleDay = (day: string) => {
    const currentDays = dialog.data.days_of_week || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    
    handleInputChange("days_of_week", updatedDays.length > 0 ? updatedDays : null);
  };

  // Handle save rule
  const handleSaveRule = async () => {
    try {
      const { id, ...ruleData } = dialog.data as TimeBasedRule;
      
      // Validation
      if (!ruleData.name || !ruleData.start_time || !ruleData.end_time) {
        toast({
          title: t("common.error"),
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (dialog.mode === "add") {
        const response = await fetch("/api/admin/pricing/time-based-rules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ruleData),
        });

        if (!response.ok) {
          throw new Error("Failed to create time-based pricing rule");
        }

        toast({
          title: t("common.success"),
          description: t("pricing.items.timeBasedPricing.createSuccess"),
        });
      } else {
        const response = await fetch(`/api/admin/pricing/time-based-rules/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ruleData),
        });

        if (!response.ok) {
          throw new Error("Failed to update time-based pricing rule");
        }

        toast({
          title: t("common.success"),
          description: t("pricing.items.timeBasedPricing.updateSuccess"),
        });
      }

      handleCloseDialog();
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Open delete confirmation dialog
  const openDeleteConfirm = (id: string) => {
    setConfirmDialog({
      open: true,
      id,
    });
  };

  // Handle delete rule
  const handleDeleteRule = async () => {
    try {
      if (!confirmDialog.id) return;

      const response = await fetch(`/api/admin/pricing/time-based-rules/${confirmDialog.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete time-based pricing rule");
      }

      toast({
        title: t("common.success"),
        description: t("pricing.items.timeBasedPricing.deleteSuccess"),
      });

      setConfirmDialog({ open: false, id: null });
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Format time display
  const formatTime = (time: string) => {
    return time;
  };

  // Format days display
  const formatDays = (days: string[] | null) => {
    if (!days || days.length === 0) return t("pricing.items.timeBasedPricing.days.all");
    
    if (
      days.includes("monday") &&
      days.includes("tuesday") &&
      days.includes("wednesday") &&
      days.includes("thursday") &&
      days.includes("friday") &&
      !days.includes("saturday") &&
      !days.includes("sunday")
    ) {
      return t("pricing.items.timeBasedPricing.days.weekdays");
    }
    
    if (
      !days.includes("monday") &&
      !days.includes("tuesday") &&
      !days.includes("wednesday") &&
      !days.includes("thursday") &&
      !days.includes("friday") &&
      days.includes("saturday") &&
      days.includes("sunday")
    ) {
      return t("pricing.items.timeBasedPricing.days.weekends");
    }
    
    return days.map(day => t(`pricing.items.timeBasedPricing.days.${day}`)).join(", ");
  };

  if (loading) {
    return <div className="p-4 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            {t("pricing.items.timeBasedPricing.title")}
          </h3>
         </div>
        
        <div className="flex gap-4 items-center">
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) =>
              setSelectedCategoryId(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue
                placeholder={t("pricing.items.timeBasedPricing.categoryLabel")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("pricing.items.timeBasedPricing.allCategories")}
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => handleOpenDialog("add")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("pricing.items.timeBasedPricing.addRule")}
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {t("pricing.items.timeBasedPricing.noRules")}
        </div>
      ) : (
        <div className="border rounded-md">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pricing.items.timeBasedPricing.ruleName")}</TableHead>
                  <TableHead>{t("pricing.items.timeBasedPricing.startTime")}</TableHead>
                  <TableHead>{t("pricing.items.timeBasedPricing.endTime")}</TableHead>
                  <TableHead>{t("pricing.items.timeBasedPricing.days.all")}</TableHead>
                  <TableHead>{t("pricing.items.timeBasedPricing.adjustmentPercentage")}</TableHead>
                  <TableHead>{t("pricing.items.timeBasedPricing.applies")}</TableHead>
                  <TableHead className="w-[100px] text-center">{t("pricing.items.timeBasedPricing.priority")}</TableHead>
                  <TableHead className="w-[100px] text-center">{t("common.status.active")}</TableHead>
                  <TableHead className="w-[120px] text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="font-medium">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatTime(rule.start_time)}</TableCell>
                    <TableCell>{formatTime(rule.end_time)}</TableCell>
                    <TableCell>{formatDays(rule.days_of_week)}</TableCell>
                    <TableCell>
                      <span className={rule.adjustment_percentage > 0 ? "text-green-600" : rule.adjustment_percentage < 0 ? "text-red-600" : ""}>
                        {rule.adjustment_percentage > 0 ? "+" : ""}
                        {rule.adjustment_percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {rule.category_id
                        ? categories.find(c => c.id === rule.category_id)?.name || "-"
                        : t("pricing.items.timeBasedPricing.allCategories")}
                      {rule.service_type_id && (
                        <>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {serviceTypes.find(s => s.id === rule.service_type_id)?.name || "-"}
                          </span>
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{rule.priority}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Button
                          variant={rule.is_active ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          disabled
                        >
                          {rule.is_active ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog("edit", rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => openDeleteConfirm(rule.id!)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "add"
                ? t("pricing.items.timeBasedPricing.addRule")
                : t("pricing.items.timeBasedPricing.editRule")}
            </DialogTitle>
            <DialogDescription>
              {t("pricing.items.timeBasedPricing.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  {t("pricing.items.timeBasedPricing.ruleName")}
                </Label>
                <Input
                  id="name"
                  value={dialog.data.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("pricing.items.timeBasedPricing.ruleNamePlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor="startTime">
                  {t("pricing.items.timeBasedPricing.startTime")}
                </Label>
                <TimeInput
                  id="startTime"
                  value={dialog.data.start_time || "22:00"}
                  onChange={(value) => handleInputChange("start_time", value)}
                />
              </div>

              <div>
                <Label htmlFor="endTime">
                  {t("pricing.items.timeBasedPricing.endTime")}
                </Label>
                <TimeInput
                  id="endTime"
                  value={dialog.data.end_time || "06:00"}
                  onChange={(value) => handleInputChange("end_time", value)}
                />
              </div>

              <div className="col-span-2">
                <Label className="mb-2 block">
                  {t("pricing.items.timeBasedPricing.days.all")}
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={(dialog.data.days_of_week || []).includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <Label
                        htmlFor={`day-${day}`}
                        className="text-xs cursor-pointer"
                      >
                        {t(`pricing.items.timeBasedPricing.days.${day}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="adjustment">
                  {t("pricing.items.timeBasedPricing.adjustmentPercentage")}:{" "}
                  <span className={dialog.data.adjustment_percentage! > 0 ? "text-green-600" : dialog.data.adjustment_percentage! < 0 ? "text-red-600" : ""}>
                    {dialog.data.adjustment_percentage! > 0 ? "+" : ""}
                    {dialog.data.adjustment_percentage || 0}%
                  </span>
                </Label>
                <Slider
                  id="adjustment"
                  min={-50}
                  max={100}
                  step={5}
                  value={[dialog.data.adjustment_percentage || 0]}
                  onValueChange={([value]) =>
                    handleInputChange("adjustment_percentage", value)
                  }
                  className="py-4"
                />
              </div>

              <div>
                <Label htmlFor="category">
                  {t("pricing.items.timeBasedPricing.categoryLabel")}
                </Label>
                <Select
                  value={dialog.data.category_id || "all"}
                  onValueChange={(value) =>
                    handleInputChange(
                      "category_id",
                      value === "all" ? null : value
                    )
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue
                      placeholder={t("pricing.items.timeBasedPricing.allCategories")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("pricing.items.timeBasedPricing.allCategories")}
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serviceType">
                  {t("pricing.items.timeBasedPricing.serviceTypeLabel")}
                </Label>
                <Select
                  value={dialog.data.service_type_id || "all"}
                  onValueChange={(value) =>
                    handleInputChange(
                      "service_type_id",
                      value === "all" ? null : value
                    )
                  }
                  disabled={!dialog.data.category_id}
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue
                      placeholder={t("pricing.items.timeBasedPricing.allServiceTypes")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("pricing.items.timeBasedPricing.allServiceTypes")}
                    </SelectItem>
                    {serviceTypes
                      .filter(
                        (st) =>
                          !dialog.data.category_id ||
                          categories
                            .find((c) => c.id === dialog.data.category_id)
                            ?.service_type_ids?.includes(st.id)
                      )
                      .map((serviceType) => (
                        <SelectItem key={serviceType.id} value={serviceType.id}>
                          {serviceType.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">
                  {t("pricing.items.timeBasedPricing.priority")}
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={100}
                  value={dialog.data.priority || 1}
                  onChange={(e) =>
                    handleInputChange("priority", parseInt(e.target.value, 10))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={dialog.data.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                />
                <Label htmlFor="is_active">
                  {t("pricing.items.timeBasedPricing.active")}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveRule}>
              {dialog.mode === "add" ? t("common.create") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("pricing.items.timeBasedPricing.deleteRule")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("pricing.items.timeBasedPricing.deleteRuleConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 