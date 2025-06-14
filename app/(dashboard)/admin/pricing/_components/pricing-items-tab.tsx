"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PricingItem, PricingCategory, ServiceTypeInfo } from "@/types/quotations";
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash, Check, X, Filter, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";

// Utility functions
// const getVehicleTypes = () => ["Sedan", "Van", "Minibus", "Bus", "Coach"]; // Removed as per requirement

const getDurationOptions = (t: Function) => [
  { value: 1, label: t("pricing.items.durations.hour", { count: 1 }) },
  { value: 4, label: t("pricing.items.durations.hours", { count: 4 }) },
  { value: 6, label: t("pricing.items.durations.hours", { count: 6 }) },
  { value: 8, label: t("pricing.items.durations.hours", { count: 8 }) },
  { value: 10, label: t("pricing.items.durations.hours", { count: 10 }) },
  { value: 12, label: t("pricing.items.durations.hours", { count: 12 }) },
  { value: 24, label: t("pricing.items.durations.day", { count: 1 }) },
  { value: 48, label: t("pricing.items.durations.days", { count: 2 }) },
  { value: 72, label: t("pricing.items.durations.days", { count: 3 }) },
];

// Types for price table
interface PriceData {
  price: number;
  currency: string;
  itemId: string;
  isActive: boolean;
}

interface PriceRow {
  duration: number;
  // vehicleType: string; // Removed
  prices: Record<string, PriceData>;
}

interface DurationGroup {
  duration: number;
  rows: PriceRow[]; // Each row is now just a duration with prices for different service types
}

interface PriceTableData {
  durations: number[];
  serviceTypes: { id: string; name: string }[];
  groupedRows: DurationGroup[];
}

export default function PricingItemsTab() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  // const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all"); // Removed
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PricingItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToToggle, setItemToToggle] = useState<PricingItem | null>(null);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  
  const {
    getPricingCategories,
    getServiceTypes,
    getPricingItems,
    createPricingItem,
    updatePricingItem,
    deletePricingItem
  } = useQuotationService();
  const { t, language } = useI18n();
  
  const durationOptions = useMemo(() => getDurationOptions(t), [t]);
  
  const refreshItems = useCallback(async (currentCategoryId?: string | null) => {
    setIsLoading(true);
    try {
      const categoryToFetch = currentCategoryId === undefined ? selectedCategory : currentCategoryId;
      if (categoryToFetch) {
        const [itemsData, serviceTypesData] = await Promise.all([
          getPricingItems(categoryToFetch, undefined),
          getServiceTypes()
        ]);
        setAllServiceTypes(serviceTypesData);
        const itemsWithServiceNames = itemsData.map(item => ({
          ...item,
          service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name // Fallback to undefined if not found
        }));        
        setItems(itemsWithServiceNames as PricingItem[]); // Explicit cast if needed, or ensure map result matches type
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(t("pricing.items.errors.refreshError"), error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.fetchFailed'), variant: 'destructive' });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [getPricingItems, getServiceTypes, selectedCategory, t]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const categoriesData = await getPricingCategories();
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !selectedCategory) { // Select first category if none is selected yet
          const initialCategory = categoriesData[0].id;
          setSelectedCategory(initialCategory);
        } else if (categoriesData.length === 0) {
          setItems([]); 
          toast({ title: t('pricing.categories.toast.noCategoriesTitle'), description: t('pricing.categories.toast.noCategoriesDescription'), variant: 'default' });
        }
        // Fetch all service types once for reference
        const serviceTypesData = await getServiceTypes();
        setAllServiceTypes(serviceTypesData);

      } catch (error) {
        console.error("Error loading initial categories/services:", error);
        toast({ title: t('common.error'), description: t('pricing.items.toast.initialLoadFailed'), variant: 'destructive' });
      } finally {
         // isLoading is for items, managed by refreshItems
      }
    };
    loadInitialData();
  }, [getPricingCategories, getServiceTypes, t, selectedCategory]); // Added selectedCategory to prevent re-fetch if already set

  useEffect(() => {
    if (selectedCategory) {
      refreshItems(selectedCategory);
    } else {
      setItems([]);
    }
  }, [selectedCategory, refreshItems]); // refreshItems dependency is important

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedServiceType("all");
  };

  const handleOpenDialog = (item?: Partial<PricingItem>) => {
    const defaultServiceTypeId = allServiceTypes.length > 0 ? allServiceTypes[0].id : undefined;
    if (item && 'id' in item && item.id) {
      setCurrentItem({ ...item });
      setIsEditing(true);
    } else {
      setCurrentItem({
        category_id: selectedCategory,
        service_type_id: defaultServiceTypeId,
        duration_hours: customDuration !== null ? customDuration : (durationOptions.length > 0 ? durationOptions[0].value : 1),
        price: 0,
        currency: 'JPY', // Default currency
        is_active: true,
        vehicle_type: "N/A", // Default for new items, this field is not actively used
        ...(item || {currency: 'JPY'}) // Ensure currency is set for new items
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async () => {
    if (!currentItem || !currentItem.category_id) {
        toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.categoryRequired'), variant: 'destructive' });
        return;
    }
    if (!currentItem.service_type_id) {
      toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.serviceTypeRequired'), variant: 'destructive' });
      return;
    }
    if (currentItem.price === undefined || currentItem.price === null || isNaN(Number(currentItem.price)) ) {
      toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.priceRequired'), variant: 'destructive' });
      return;
    }
    if (currentItem.duration_hours === undefined || currentItem.duration_hours === null || isNaN(Number(currentItem.duration_hours)) || Number(currentItem.duration_hours) <= 0) {
      toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.durationRequired'), variant: 'destructive' });
      return;
    }
    
    const { service_type_name, vehicle_type, ...itemDataForSave } = currentItem as Partial<PricingItem> & { service_type_name?: string };

    try {
      let success = false;
      if (isEditing && currentItem.id) {
        // Simplify update payload to only send mutable fields
        const updateData = { 
          price: currentItem.price,
          is_active: currentItem.is_active,
          currency: currentItem.currency || 'JPY',
          duration_hours: currentItem.duration_hours
        };
        success = !!(await updatePricingItem(currentItem.id, updateData));
      } else {
        const createPayload: Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'> = {
          category_id: currentItem.category_id!,
          service_type_id: currentItem.service_type_id!,
          duration_hours: currentItem.duration_hours!,
          price: currentItem.price!,
          currency: currentItem.currency || 'JPY',
          is_active: currentItem.is_active ?? true,
          vehicle_type: "N/A", // This field is not actively used per current understanding
        };
        success = !!(await createPricingItem(createPayload));
      }

      if (success) {
        toast({ title: isEditing ? t('pricing.items.toast.updateSuccessTitle') : t('pricing.items.toast.createSuccessTitle') });
        await refreshItems();
        handleCloseDialog();
      } 
    } catch (error) {
      console.error(t("pricing.items.errors.saveError"), error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.saveFailed'), variant: 'destructive' });
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;
    try {
      const success = await deletePricingItem(itemToDelete);
      if (success) {
        await refreshItems();
        toast({ title: t('pricing.items.deleteSuccess') });
      }
    } catch (error) {
      console.error("Error deleting pricing item:", error);
      toast({ title: t("common.error"), description: t("pricing.items.toast.deleteFailed"), variant: "destructive" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const openStatusConfirm = (item: PricingItem) => {
    setItemToToggle(item);
    setIsStatusConfirmOpen(true);
  };

  const handleStatusToggleConfirmed = async () => {
    if (!itemToToggle) return;
    try {
      const success = await updatePricingItem(itemToToggle.id, { is_active: !itemToToggle.is_active });
      if (success) {
        toast({ title: t('pricing.items.toast.statusUpdateSuccessTitle') });
        await refreshItems();
      }
    } catch (error) {
      console.error(t("pricing.items.errors.statusToggleError"), error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.statusUpdateFailed'), variant: 'destructive' });
    }
    setIsStatusConfirmOpen(false);
    setItemToToggle(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setCurrentItem(prev => {
      if (!prev) return null;
      let processedValue = value;
      if (field === 'price' || field === 'duration_hours') {
        processedValue = value === '' ? null : Number(value);
        if (isNaN(processedValue as number)) {
            // If user clears the input or types non-numeric, keep it as null or current input
            // to allow them to correct, rather than reverting. Validation will catch it on save.
            processedValue = value === '' ? null : prev[field as keyof PricingItem];
        }
      }
      return { ...prev, [field]: processedValue };
    });
  };

  const uniqueDurations = useMemo(() => {
    const durations = new Set<number>();
    items.forEach(item => durations.add(item.duration_hours));
    return Array.from(durations).sort((a, b) => a - b);
  }, [items]);

  // const uniqueVehicleTypes = useMemo(() => { // Removed
  //   const types = new Set<string>();
  //   items.forEach(item => types.add(item.vehicle_type));
  //   return Array.from(types).sort();
  // }, [items]);

  const activeServiceTypesForTable = useMemo<ServiceTypeInfo[]>(() => {
    if (!selectedCategory || categories.length === 0 || allServiceTypes.length === 0) return [];
    const currentCat = categories.find(c => c.id === selectedCategory);
    if (!currentCat || !currentCat.service_type_ids || currentCat.service_type_ids === null) return [];
    
    // Make a safer version of the filtering
    return allServiceTypes.filter(serviceType => {
      // Check that the service type ID is included in the category's service_type_ids array
      if (Array.isArray(currentCat.service_type_ids)) {
        return currentCat.service_type_ids.includes(serviceType.id);
      }
      return false;
    }).sort((a, b) => a.name.localeCompare(b.name)); // Optional: sort columns by name
  }, [selectedCategory, categories, allServiceTypes]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesDuration = selectedDuration === "all" || item.duration_hours === parseInt(selectedDuration);
      const matchesServiceType = selectedServiceType === "all" || item.service_type_id === selectedServiceType;
      return matchesDuration && matchesServiceType;
    });
  }, [items, selectedDuration, selectedServiceType]);

  const priceTable = useMemo<PriceTableData>(() => {
    if (filteredItems.length === 0 || activeServiceTypesForTable.length === 0) return { durations: [], serviceTypes: [], groupedRows: [] };
    
    const durations = Array.from(new Set(filteredItems.map(item => item.duration_hours))).sort((a, b) => a - b);
    // const vehicleTypes = Array.from(new Set(filteredItems.map(item => item.vehicle_type))).sort(); // Removed
    
    const rows: PriceRow[] = [];
    durations.forEach(duration => {
      // vehicleTypes.forEach(vehicleType => { // Removed loop
        const row: PriceRow = {
          duration,
          // vehicleType, // Removed
          prices: {} 
        };
        activeServiceTypesForTable.forEach(serviceType => {
          const matchingItem = filteredItems.find(item => 
            item.duration_hours === duration && 
            // item.vehicle_type === vehicleType && // Removed
            item.service_type_id === serviceType.id
          );
          if (matchingItem) {
            row.prices[serviceType.id] = { 
              price: matchingItem.price,
              currency: matchingItem.currency,
              itemId: matchingItem.id,
              isActive: matchingItem.is_active
            };
          }
        });
        if (Object.keys(row.prices).length > 0 || activeServiceTypesForTable.length > 0) { // Ensure row is added if service types exist, even if no prices yet
            rows.push(row);
        }
      // }); // Removed loop
    });
    
    const groupedRows: DurationGroup[] = durations.map(duration => ({
      duration,
      rows: rows.filter(row => row.duration === duration)
    })).filter(group => group.rows.length > 0);
    
    return { 
      durations,
      serviceTypes: activeServiceTypesForTable,
      groupedRows 
    };
  }, [filteredItems, activeServiceTypesForTable]);
  
  const currentCategoryName = useMemo(() => 
    categories.find(c => c.id === selectedCategory)?.name || 'Category'
  , [categories, selectedCategory]);

  if (categories.length === 0 && isLoading) {
    return <div className="p-4 text-center">Loading categories...</div>;
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-muted-foreground" />
            {t("pricing.items.filters.title")}
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm" disabled={!selectedCategory}>
            <Plus className="h-4 w-4 mr-2" />
            {t("pricing.items.buttons.addItemToCategory", { categoryName: currentCategoryName || "..." })}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
            <div>
              <Label htmlFor="service-type-select" className="text-sm font-medium mb-1 block">{t("quotations.form.services.serviceType")}</Label>
              <Select
                value={selectedServiceType}
                onValueChange={setSelectedServiceType}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="service-type-select">
                  <SelectValue placeholder={t("quotations.form.services.serviceType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {activeServiceTypesForTable.map(st => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricing-category-select" className="text-sm font-medium mb-1 block">{t("pricing.items.filters.categoryLabel")}</Label>
              <Select
                value={selectedCategory ?? "all"}
                onValueChange={(val) => handleCategoryChange(val === "all" ? null : val)}
              >
                <SelectTrigger id="pricing-category-select">
                  <SelectValue placeholder={t("pricing.items.filters.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>{t("pricing.items.filters.noCategoriesAvailable")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration-select" className="text-sm font-medium mb-1 block">{t("pricing.items.filters.durationLabel")}</Label>
              <Select
                value={selectedDuration}
                onValueChange={setSelectedDuration}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="duration-select">
                  <SelectValue placeholder={t("pricing.items.filters.allDurations")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("pricing.items.filters.allDurations")}</SelectItem>
                  {uniqueDurations.map(duration => (
                    <SelectItem key={`duration-${duration}`} value={String(duration)}>
                      {t("pricing.items.durations.hours", { count: duration })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && items.length === 0 && selectedCategory ? (
        <div className="p-4 text-center">{t("pricing.items.loadingItemsFor", { categoryName: currentCategoryName || '...' })}</div>
      ) : !selectedCategory ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {t("pricing.items.emptyState.selectCategoryPrompt")}
        </div>
      ) : filteredItems.length === 0 && activeServiceTypesForTable.length > 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {t("pricing.items.emptyState.noItemsFound")}
        </div>
      ) : (
        <ScrollArea className="whitespace-nowrap rounded-md border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t("pricing.items.table.serviceType")}</TableHead>
                <TableHead className="w-[120px]">{t("pricing.items.table.durationHours")}</TableHead>
                <TableHead className="w-[120px]">{t("pricing.items.table.price")}</TableHead>
                <TableHead className="w-[100px] text-center">{t("pricing.items.table.status")}</TableHead>
                <TableHead className="w-[120px] text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground sticky left-0 z-10 bg-background group-hover:bg-muted/10 whitespace-nowrap">
                    {item.service_type_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground sticky left-0 z-10 bg-background group-hover:bg-muted/10 whitespace-nowrap">
                    {item.duration_hours}
                  </TableCell>
                  <TableCell className="text-muted-foreground sticky left-0 z-10 bg-background group-hover:bg-muted/10 whitespace-nowrap">
                    {item.currency} {item.price.toLocaleString(undefined, { style: 'currency', currency: item.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusBadgeClasses(item.is_active ? 'active' : 'inactive'))}
                    >
                      {item.is_active ? t('common.status.active') : t('common.status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openStatusConfirm(item)}>
                        {item.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Pricing Item" : "Add New Pricing Item"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Edit the details of this pricing item"
                : `Create a new pricing item for ${currentCategoryName}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                value={currentItem?.service_type_id ?? ""}
                onValueChange={(value) => handleInputChange("service_type_id", value)}
                disabled={isEditing} // Disable if editing, as service type defines the column
              >
                <SelectTrigger id="service_type_id">
                  <SelectValue placeholder={t("pricing.items.fields.serviceTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {/* Populate with service types relevant to the selected pricing category if creating new */}
                  {/* If editing, it should be fixed. If creating, filter by currentCategory's service_type_ids */}
                  {(isEditing && currentItem?.service_type_id ? 
                    allServiceTypes.filter(st => st.id === currentItem.service_type_id) :
                    activeServiceTypesForTable
                  ).map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Vehicle Type Select Removed from Dialog */}
            
            <div className="grid gap-2">
              <Label htmlFor="duration_hours">Duration</Label>
              <Select
                value={String(currentItem?.duration_hours ?? 1)}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    // Custom duration logic
                    setCustomDuration(currentItem?.duration_hours || null);
                  } else {
                    handleInputChange("duration_hours", parseInt(value));
                    setCustomDuration(null);
                  }
                }}
              >
                <SelectTrigger id="duration_hours">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {getDurationOptions(t).map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Duration</SelectItem>
                </SelectContent>
              </Select>
              {customDuration !== null && (
                <div className="mt-2">
                  <Label htmlFor="custom_duration">Custom Duration (hours)</Label>
                  <Input
                    id="custom_duration"
                    type="number"
                    value={customDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setCustomDuration(value);
                      handleInputChange("duration_hours", value);
                    }}
                    min="1"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <div className="flex space-x-2">
                <Select
                  value={currentItem?.currency || "JPY"}
                  onValueChange={(value) => handleInputChange("currency", value)}
                  disabled 
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={t("pricing.items.fields.currencyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="price"
                  type="number"
                  placeholder="Price"
                  value={currentItem?.price ?? 0}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={currentItem?.is_active ?? true}
                onCheckedChange={(checked) => handleInputChange("is_active", checked === true)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {isEditing ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Price Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this price item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemToToggle?.is_active ? 'Deactivate' : 'Activate'} Price Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {itemToToggle?.is_active ? 'deactivate' : 'activate'} this price item?
              {itemToToggle?.is_active 
                ? ' Deactivated items will not be available for selection.'
                : ' Activated items will be available for selection in quotations and bookings.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusToggleConfirmed}>
              {itemToToggle?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 