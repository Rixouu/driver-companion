"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell } from './pricing-responsive-table';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TimeInput } from "@/components/ui/time-input";
import { createBrowserClient } from "@supabase/ssr";
import { Badge } from "@/components/ui/badge";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";

// Type definitions
interface TimeBasedRule {
  id?: string;
  name: string;
  category_id: string | null;
  service_type_ids: string[] | null;
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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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

const DAY_OPTIONS = (t: Function) => [
  { value: "sunday", label: t("pricing.items.timeBasedPricing.days.sunday") },
  { value: "monday", label: t("pricing.items.timeBasedPricing.days.monday") },
  { value: "tuesday", label: t("pricing.items.timeBasedPricing.days.tuesday") },
  { value: "wednesday", label: t("pricing.items.timeBasedPricing.days.wednesday") },
  { value: "thursday", label: t("pricing.items.timeBasedPricing.days.thursday") },
  { value: "friday", label: t("pricing.items.timeBasedPricing.days.friday") },
  { value: "saturday", label: t("pricing.items.timeBasedPricing.days.saturday") },
];

export default function TimeBasedPricingTab() {
  const { t } = useI18n();
  const { categories, serviceTypes, loading: dataLoading } = usePricingData();
  const [isMobileView, setIsMobileView] = useState(false);

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

  // Check mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        description: t("pricing.items.timeBasedPricing.toast.fetchFailed"),
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
          service_type_ids: null,
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

  // Toggle service type selection
  const toggleServiceType = (serviceTypeId: string) => {
    const currentServiceTypes = dialog.data.service_type_ids || [];
    const updatedServiceTypes = currentServiceTypes.includes(serviceTypeId)
      ? currentServiceTypes.filter((id) => id !== serviceTypeId)
      : [...currentServiceTypes, serviceTypeId];
    
    handleInputChange("service_type_ids", updatedServiceTypes.length > 0 ? updatedServiceTypes : null);
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
    
    if (days.length === 7) {
      return t("pricing.items.timeBasedPricing.days.all");
    }
    
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

  // Mobile card component
  const TimeBasedRuleMobileCard = ({ rule, index }: { rule: TimeBasedRule; index: number }) => {
    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with name and description */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground text-base">{rule.name}</h3>
              {rule.description && (
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              )}
            </div>

            {/* Applies To */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Applies To
              </div>
              <div className="text-sm text-foreground">
                {rule.category_id
                  ? categories.find(c => c.id === rule.category_id)?.name || "-"
                  : t("pricing.items.timeBasedPricing.allCategories")}
                {rule.service_type_ids && rule.service_type_ids.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {rule.service_type_ids.length === 1 
                      ? serviceTypes.find(s => s.id === rule.service_type_ids![0])?.name || "-"
                      : `${rule.service_type_ids.length} service types`
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Time Range and Days */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Time Range
                </div>
                <div className="text-sm text-foreground">
                  {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Days
                </div>
                <div className="text-sm text-foreground">
                  {formatDays(rule.days_of_week)}
                </div>
              </div>
            </div>

            {/* Adjustment and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Adjustment
                </div>
                <div className={rule.adjustment_percentage > 0 ? "text-green-600" : rule.adjustment_percentage < 0 ? "text-red-600" : ""}>
                  {rule.adjustment_percentage > 0 ? "+" : ""}
                  {rule.adjustment_percentage}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Priority
                </div>
                <div className="text-sm text-foreground">{rule.priority}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={cn('text-xs px-3 py-1.5 font-medium', getStatusBadgeClasses(rule.is_active ? 'active' : 'inactive'))}
              >
                {rule.is_active ? t('common.status.active') : t('common.status.inactive')}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-9 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => handleOpenDialog("edit", rule)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => openDeleteConfirm(rule.id!)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="p-4 text-center">{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <PricingTabHeader
          title={t("pricing.items.timeBasedPricing.title")}
          description={t("pricing.items.timeBasedPricing.description")}
          icon={<Clock className="h-5 w-5" />}
          badges={
            <>
              {!loading && rules.length > 0 && (
                <StatusBadge type="info">⚡ {rules.length} rules loaded</StatusBadge>
              )}
              {selectedCategoryId && (
                <StatusBadge type="success">📁 Category filtered</StatusBadge>
              )}
            </>
          }
          actions={
            <Button onClick={() => handleOpenDialog("add")} variant="default" className="h-9 px-3">
              <Plus className="mr-2 h-4 w-4" /> 
              <span className="hidden sm:inline">{t("pricing.items.timeBasedPricing.buttons.addRule")}</span>
              <span className="sm:hidden">Add Rule</span>
            </Button>
          }
        />
        <CardContent className="pt-6">
          
                {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Loading Time-based Rules</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your rules...</p>
                </div>
              </div>
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Time-based Rules Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {selectedCategoryId 
                      ? t("pricing.items.timeBasedPricing.emptyState.noRulesForCategory")
                      : t("pricing.items.timeBasedPricing.emptyState.selectCategoryOrAddRule")}
                  </p>
                </div>
                <Button onClick={() => handleOpenDialog("add")} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </div>
            </div>
          ) : null}

          {!loading && rules.length > 0 && (
            <div className="mt-6">
              {isMobileView ? (
                // Mobile Cards View
                <div className="space-y-4">
                  {rules.map((rule, index) => (
                    <TimeBasedRuleMobileCard key={rule.id} rule={rule} index={index} />
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <PricingResponsiveTable>
                  <PricingTableHeader>
                    <PricingTableHead>{t("pricing.items.timeBasedPricing.table.ruleName")}</PricingTableHead>
                    <PricingTableHead>{t("pricing.items.timeBasedPricing.table.appliesTo")}</PricingTableHead>
                    <PricingTableHead>{t("pricing.items.timeBasedPricing.table.timeRange")}</PricingTableHead>
                    <PricingTableHead>{t("pricing.items.timeBasedPricing.table.days")}</PricingTableHead>
                    <PricingTableHead className="text-center">{t("pricing.items.timeBasedPricing.table.adjustment")}</PricingTableHead>
                    <PricingTableHead className="text-center">{t("pricing.items.timeBasedPricing.table.priority")}</PricingTableHead>
                    <PricingTableHead className="text-center">{t("pricing.items.timeBasedPricing.table.status")}</PricingTableHead>
                    <PricingTableHead className="text-right">{t("common.actions.default")}</PricingTableHead>
                  </PricingTableHeader>
                  <TableBody>
                    {rules.map((rule, index) => (
                      <PricingTableRow key={rule.id} index={index}>
                        <PricingTableCell>
                          <div className="font-medium text-foreground">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground">{rule.description}</div>
                          )}
                        </PricingTableCell>
                        <PricingTableCell>
                          {rule.category_id
                            ? categories.find(c => c.id === rule.category_id)?.name || "-"
                            : t("pricing.items.timeBasedPricing.allCategories")}
                          {rule.service_type_ids && rule.service_type_ids.length > 0 && (
                            <>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {rule.service_type_ids.length === 1 
                                  ? serviceTypes.find(s => s.id === rule.service_type_ids![0])?.name || "-"
                                  : `${rule.service_type_ids.length} service types`
                                }
                              </span>
                            </>
                          )}
                        </PricingTableCell>
                        <PricingTableCell>{formatTime(rule.start_time)} - {formatTime(rule.end_time)}</PricingTableCell>
                        <PricingTableCell>{formatDays(rule.days_of_week)}</PricingTableCell>
                        <PricingTableCell className="text-center">
                          <span className={rule.adjustment_percentage > 0 ? "text-green-600" : rule.adjustment_percentage < 0 ? "text-red-600" : ""}>
                            {rule.adjustment_percentage > 0 ? "+" : ""}
                            {rule.adjustment_percentage}%
                          </span>
                        </PricingTableCell>
                        <PricingTableCell className="text-center">{rule.priority}</PricingTableCell>
                        <PricingTableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getStatusBadgeClasses(rule.is_active ? 'active' : 'inactive'))}
                          >
                            {rule.is_active ? t('common.status.active') : t('common.status.inactive')}
                          </Badge>
                        </PricingTableCell>
                        <PricingTableCell className="text-right">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleOpenDialog("edit", rule)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteConfirm(rule.id!)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </PricingTableCell>
                      </PricingTableRow>
                    ))}
                  </TableBody>
                </PricingResponsiveTable>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Define the rule name and basic details</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">
                    {t("pricing.items.timeBasedPricing.ruleName")}
                  </Label>
                  <Input
                    id="name"
                    value={dialog.data.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("pricing.items.timeBasedPricing.ruleNamePlaceholder")}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Time Configuration Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Time Configuration</h3>
                <p className="text-sm text-muted-foreground">Set when this rule applies</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">
                    {t("pricing.items.timeBasedPricing.startTime")}
                  </Label>
                  <TimeInput
                    id="startTime"
                    value={dialog.data.start_time || "22:00"}
                    onChange={(value) => handleInputChange("start_time", value)}
                    className="mt-1"
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
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">
                  {t("pricing.items.timeBasedPricing.days.all")}
                </Label>
                <div className="grid grid-cols-7 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex flex-col items-center space-y-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={(dialog.data.days_of_week || []).includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <Label
                        htmlFor={`day-${day}`}
                        className="text-xs cursor-pointer text-center"
                      >
                        {t(`pricing.items.timeBasedPricing.days.${day}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Configuration Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Pricing Configuration</h3>
                <p className="text-sm text-muted-foreground">Set the price adjustment for this rule</p>
              </div>
              
              <div>
                <Label htmlFor="adjustment" className="text-base font-medium">
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
                  className="py-4 mt-2"
                />
              </div>
            </div>

            {/* Scope Configuration Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Scope Configuration</h3>
                <p className="text-sm text-muted-foreground">Define which services this rule applies to</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <SelectTrigger id="category" className="mt-1">
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

                <div className="sm:col-span-2">
                  <Label className="mb-3 block">
                    {t("pricing.items.timeBasedPricing.serviceTypeLabel")}
                  </Label>
                  <div className="space-y-3 max-h-40 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                    {serviceTypes
                      .filter(
                        (st) =>
                          !dialog.data.category_id ||
                          categories
                            .find((c) => c.id === dialog.data.category_id)
                            ?.service_type_ids?.includes(st.id) ||
                          !categories
                            .find((c) => c.id === dialog.data.category_id)
                            ?.service_type_ids
                      )
                      .map((serviceType) => (
                        <div key={serviceType.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`service-${serviceType.id}`}
                            checked={(dialog.data.service_type_ids || []).includes(serviceType.id)}
                            onCheckedChange={() => toggleServiceType(serviceType.id)}
                          />
                          <Label
                            htmlFor={`service-${serviceType.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {serviceType.name}
                          </Label>
                        </div>
                      ))}
                    {serviceTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No service types available
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select one or more service types. Leave empty to apply to all service types.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule Settings Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Rule Settings</h3>
                <p className="text-sm text-muted-foreground">Configure priority and activation status</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-sm font-medium mb-3 block">
                    {t("pricing.items.timeBasedPricing.priority")}
                  </Label>
                  <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="mb-3">
                      <p className="text-sm text-foreground font-medium">
                        Set rule priority
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher numbers have higher priority (1-100)
                      </p>
                    </div>
                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      max={100}
                      value={dialog.data.priority || 1}
                      onChange={(e) =>
                        handleInputChange("priority", parseInt(e.target.value, 10))
                      }
                      className="w-32"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium mb-3 block">
                    {t("pricing.items.timeBasedPricing.active")}
                  </Label>
                  <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="mb-3">
                      <p className="text-sm text-foreground font-medium">
                        Enable this pricing rule
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When enabled, this rule will be applied to matching bookings
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Switch
                        id="is_active"
                        checked={dialog.data.is_active}
                        onCheckedChange={(checked) =>
                          handleInputChange("is_active", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
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