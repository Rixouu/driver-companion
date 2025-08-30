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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell } from './pricing-responsive-table';
import { Plus, Edit, Trash, Check, X, Filter, Search, Car, Clock, DollarSign, Database, RefreshCw, Users, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageVehiclesModal } from "./manage-vehicles-modal";

// Utility functions
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

// Types for grouped pricing items
interface ServiceTypeGroup {
  serviceTypeId: string;
  serviceTypeName: string;
  items: PricingItem[];
}

// Enhanced interface for vehicles
interface VehicleInfo {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: string;
  status: string;
  vehicle_category_id: string;
}

// Component for displaying vehicles in a category
function CategoryVehiclesSection({ 
  category, 
  items, 
  vehicles, 
  getVehiclesForCategory, 
  handleOpenDialog, 
  setManageVehiclesModal,
  handleShowPricingBreakdown,
  handleCopyPricing
}: {
  category: PricingCategory;
  items: PricingItem[];
  vehicles: VehicleInfo[];
  getVehiclesForCategory: (categoryId: string) => VehicleInfo[];
  handleOpenDialog: (vehicle?: VehicleInfo, categoryId?: string) => void;
  setManageVehiclesModal: (modal: { open: boolean; category: PricingCategory } | null) => void;
  handleShowPricingBreakdown: (vehicle: VehicleInfo, items: PricingItem[]) => void;
  handleCopyPricing: (fromVehicle: VehicleInfo, toVehicle: VehicleInfo) => void;
}) {
  const categoryVehicles = getVehiclesForCategory(category.id);
  // Get pricing items specifically for this category
  const categoryItems = items.filter(item => item.category_id === category.id);
  
  return (
                        <div key={category.id} className="border rounded-lg p-4 bg-card dark:bg-card mb-6">
                          {/* Mobile-first responsive layout */}
                          <div className="space-y-4">
                            {/* Category header - stacked on mobile */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <Badge variant="outline" className="text-base px-3 py-1 border-2 w-fit">
                                  {category.name}
                                </Badge>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Car className="h-4 w-4" />
                                    {categoryVehicles.length} vehicles
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {categoryItems.length} pricing items
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons - stacked on mobile */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(undefined, category.id)}
                                className="border-border hover:bg-muted/50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                + Add Pricing for {category.name}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setManageVehiclesModal({ open: true, category })}
                                className="border-border hover:bg-muted/50"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Manage Vehicles for {category.name}
                              </Button>
                            </div>
                          </div>
      
      {categoryVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {categoryVehicles.map((vehicle, index) => {
            // Check if this vehicle has pricing items in THIS category
            const vehicleItems = categoryItems.filter(item => item.vehicle_id === vehicle.id);
            const hasPricing = vehicleItems.length > 0;
            
            return (
                                            <div 
                                key={vehicle.id} 
                                className={cn(
                                  "p-4 rounded-lg border transition-colors hover:bg-muted/50 dark:hover:bg-muted/30",
                                  hasPricing 
                                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-700/50" 
                                    : "bg-muted/30 border-muted-foreground/20"
                                )}
                              >
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Car className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-sm text-foreground">{vehicle.brand} {vehicle.model}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                      {vehicle.name} • {vehicle.year}
                                    </div>
                                    {vehicleItems.length > 0 && (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                        <span>{vehicleItems.length} pricing option{vehicleItems.length > 1 ? 's' : ''}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 w-fit"
                                          onClick={() => handleShowPricingBreakdown(vehicle, vehicleItems)}
                                        >
                                          View Details
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <Badge 
                                    variant={hasPricing ? "default" : "destructive"}
                                    className={cn(
                                      "text-xs w-fit",
                                      hasPricing 
                                        ? "bg-emerald-600 text-white border-emerald-700" 
                                        : "bg-red-600 text-white border-red-700"
                                    )}
                                  >
                                    {hasPricing ? "Has Pricing" : "No Pricing"}
                                  </Badge>
                                </div>
                
                                                <div className="flex flex-col sm:flex-row gap-2">
                                  {!hasPricing && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenDialog(vehicle, category.id)}
                                      className="flex-1 text-muted-foreground border-border hover:bg-muted/50"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Pricing
                                    </Button>
                                  )}
                                  {hasPricing && (
                                    <div className="flex-1">
                                      <Select onValueChange={(targetVehicleId) => {
                                        const targetVehicle = vehicles.find(v => v.id === targetVehicleId);
                                        if (targetVehicle) {
                                          handleCopyPricing(vehicle, targetVehicle);
                                        }
                                      }}>
                                        <SelectTrigger className="text-emerald-600 border-emerald-300 hover:bg-emerald-100 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/20">
                                          <SelectValue placeholder="Copy to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {vehicles
                                            .filter(v => v.id !== vehicle.id)
                                            .map((targetVehicle) => (
                                              <SelectItem key={targetVehicle.id} value={targetVehicle.id}>
                                                <div className="flex items-center gap-2">
                                                  <Car className="h-4 w-4" />
                                                  <span>{targetVehicle.brand} {targetVehicle.model}</span>
                                                  <span className="text-xs text-muted-foreground">({targetVehicle.name})</span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </div>
              </div>
            );
          })}
        </div>
                            ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm text-muted-foreground">No vehicles in this category</p>
                        </div>
                      )}
    </div>
  );
}

export default function PricingItemsTab() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
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
  const [activeTab, setActiveTab] = useState("pricing");



  const [manageVehiclesModal, setManageVehiclesModal] = useState<{ open: boolean; category: PricingCategory } | null>(null);
     const [pricingBreakdownModal, setPricingBreakdownModal] = useState<{ open: boolean; vehicle: VehicleInfo; items: PricingItem[]; selectedServiceType?: string } | null>(null);
  const [copyFromVehicle, setCopyFromVehicle] = useState<{ 
    open: boolean; 
    fromVehicle: VehicleInfo; 
    toVehicle: VehicleInfo;
    conflictResolution: 'create' | 'update' | 'overwrite' | null;
  } | null>(null);
  
  const [bulkUpdateModal, setBulkUpdateModal] = useState<{ 
    open: boolean; 
    type: 'percentage' | 'fixed';
    value: number;
    selectedCategories: string[];
    selectedServiceTypes: string[];
    selectedVehicles: string[];
  } | null>(null);
  
  const {
    getPricingCategories,
    getServiceTypes,
    getPricingItems,
    createPricingItem,
    updatePricingItem,
    deletePricingItem
  } = useQuotationService();
  const { t, language } = useI18n();
  
  // Group items by service type for better organization
  const groupItemsByServiceType = useCallback((items: PricingItem[]): ServiceTypeGroup[] => {
    const groups: Record<string, ServiceTypeGroup> = {};
    
    items.forEach(item => {
      const key = item.service_type_id || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          serviceTypeId: key,
          serviceTypeName: item.service_type_name || 'Unknown Service',
          items: []
        };
      }
      groups[key].items.push(item);
    });
    
    // Sort items within each group by duration
    Object.values(groups).forEach(group => {
      group.items.sort((a, b) => a.duration_hours - b.duration_hours);
    });
    
         return Object.values(groups).sort((a, b) => a.serviceTypeName.localeCompare(b.serviceTypeName));
  }, []);

  // Load vehicles data
  const loadVehicles = useCallback(async () => {
    try {
      console.log('🔍 [VEHICLES] Loading vehicles...');
      const response = await fetch('/api/vehicles?pageSize=100');
      if (response.ok) {
        const vehiclesData = await response.json();
        console.log('🔍 [VEHICLES] Loaded vehicles:', vehiclesData.vehicles?.length || 0);
        setVehicles(vehiclesData.vehicles || []);
      } else {
        console.error('❌ [VEHICLES] Failed to load vehicles:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ [VEHICLES] Error loading vehicles:', error);
    }
  }, []);

  // Get vehicles for a specific category
  const getVehiclesForCategory = useCallback((categoryId: string) => {
    return vehicles.filter(v => v.vehicle_category_id === categoryId);
  }, [vehicles]);

  // Get pricing items for a specific category
  const getPricingItemsForCategory = useCallback((categoryId: string) => {
    return items.filter(item => item.category_id === categoryId);
  }, [items]);

  // Get all vehicles that should be shown in Price Vehicle Management for a category
  const getVehiclesForCategoryDisplay = useCallback((categoryId: string) => {
    // Show vehicles that are assigned to this category
    return vehicles.filter(vehicle => vehicle.vehicle_category_id === categoryId);
  }, [vehicles]);



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
          service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name
        }));        
        setItems(itemsWithServiceNames as PricingItem[]);
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

  // Refresh pricing items when switching to Price Vehicle Management tab
  useEffect(() => {
    if (activeTab === "vehicles") {
      setIsLoading(true);
      // Load all pricing items to properly show discrepancies
      const loadAllItems = async () => {
        try {
          const allItems: PricingItem[] = [];
          
          // Load pricing items for each category
          for (const category of categories) {
            const categoryItems = await getPricingItems(category.id, undefined);
            allItems.push(...categoryItems);
          }
          
          // Get service types for item names
          const serviceTypesData = await getServiceTypes();
          const itemsWithServiceNames = allItems.map(item => ({
            ...item,
            service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name
          }));
          
          setItems(itemsWithServiceNames as PricingItem[]);
        } catch (error) {
          console.error('Error loading all pricing items:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      if (categories.length > 0) {
        loadAllItems();
      } else {
        setIsLoading(false);
      }
    }
  }, [activeTab, categories, getPricingItems, getServiceTypes]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, serviceTypesData] = await Promise.all([
          getPricingCategories(),
          getServiceTypes()
        ]);
        
        setCategories(categoriesData);
        setAllServiceTypes(serviceTypesData);
        
        if (categoriesData.length > 0 && !selectedCategory) {
          const initialCategory = categoriesData[0].id;
          setSelectedCategory(initialCategory);
        } else if (categoriesData.length === 0) {
          setItems([]); 
          toast({ title: t('pricing.categories.toast.noCategoriesTitle'), description: t('pricing.categories.toast.noCategoriesDescription'), variant: 'default' });
        }

        // Load vehicles
        await loadVehicles();

    } catch (error) {
        console.error("Error loading initial data:", error);
        toast({ title: t('common.error'), description: t('pricing.items.toast.initialLoadFailed'), variant: 'destructive' });
    } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [getPricingCategories, getServiceTypes, loadVehicles, t]);

  useEffect(() => {
    if (selectedCategory) {
      refreshItems(selectedCategory);
    } else {
      setItems([]);
    }
  }, [selectedCategory, refreshItems]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedServiceType("all");
    setSelectedVehicle("all");
  };

  const handleOpenDialog = (item?: Partial<PricingItem> | VehicleInfo, serviceTypeId?: string) => {
    const defaultServiceTypeId = serviceTypeId || (allServiceTypes.length > 0 ? allServiceTypes[0].id : undefined);
    
    if (item && 'id' in item && 'price' in item) {
      // This is a PricingItem - editing mode
      setCurrentItem({ ...item });
      setIsEditing(true);
    } else if (item && 'id' in item && 'brand' in item) {
      // This is a VehicleInfo - creating new pricing for specific vehicle
    setCurrentItem({
        category_id: serviceTypeId || selectedCategory || null,
        service_type_id: defaultServiceTypeId,
      duration_hours: 1,
      price: 0,
      currency: 'JPY',
        is_active: true,
        vehicle_id: item.id
    });
    setIsEditing(false);
    } else {
      // Creating new pricing item
    setCurrentItem({
        category_id: selectedCategory || null,
        service_type_id: defaultServiceTypeId,
      duration_hours: 1,
      price: 0,
      currency: 'JPY',
        is_active: true,
        vehicle_id: null,
        ...(item || {currency: 'JPY'})
    });
    setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentItem(null);
    setIsEditing(false);
    setCustomDuration(null);
  };

  const handleInputChange = (field: keyof PricingItem, value: any) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [field]: value });
    }
  };

  const handleSaveItem = async () => {
    if (!currentItem) return;
    
    try {
      if (isEditing && currentItem.id) {
        await updatePricingItem(currentItem.id, currentItem);
        toast({ title: t('common.success'), description: t('pricing.items.toast.updateSuccess') });
      } else {
        // Ensure all required fields are present for creation
        const itemData = {
          category_id: currentItem.category_id || null,
          service_type_id: currentItem.service_type_id || null,
          duration_hours: currentItem.duration_hours || 1,
          price: currentItem.price || 0,
          currency: currentItem.currency || 'JPY',
          is_active: currentItem.is_active !== undefined ? currentItem.is_active : true,
          vehicle_id: currentItem.vehicle_id === 'none' ? null : currentItem.vehicle_id || null
        };
        await createPricingItem(itemData);
        toast({ title: t('common.success'), description: t('pricing.items.toast.createSuccess') });
      }
      
      handleCloseDialog();
      refreshItems();
    } catch (error) {
      console.error('Error saving pricing item:', error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.saveFailed'), variant: 'destructive' });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;
    
    try {
      await deletePricingItem(itemToDelete);
      toast({ title: t('common.success'), description: t('pricing.items.toast.deleteSuccess') });
      refreshItems();
    } catch (error) {
      console.error('Error deleting pricing item:', error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.deleteFailed'), variant: 'destructive' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleStatusToggle = (item: PricingItem) => {
    setItemToToggle(item);
    setIsStatusConfirmOpen(true);
  };

  const handleStatusToggleConfirmed = async () => {
    if (!itemToToggle) return;
    
    try {
      await updatePricingItem(itemToToggle.id, { is_active: !itemToToggle.is_active });
      toast({ title: t('common.success'), description: t('pricing.items.toast.statusToggleSuccess') });
      refreshItems();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ title: t('common.error'), description: t('pricing.items.toast.statusToggleFailed'), variant: 'destructive' });
    } finally {
      setIsStatusConfirmOpen(false);
      setItemToToggle(null);
    }
  };

  const handleShowPricingBreakdown = (vehicle: VehicleInfo, items: PricingItem[]) => {
    setPricingBreakdownModal({ open: true, vehicle, items });
  };

  const handleCopyPricing = (fromVehicle: VehicleInfo, toVehicle: VehicleInfo) => {
    setCopyFromVehicle({ 
      open: true, 
      fromVehicle, 
      toVehicle,
      conflictResolution: 'create' // Default to create mode
    });
  };

    const handleCopyPricingConfirmed = async () => {
    if (!copyFromVehicle || !copyFromVehicle.conflictResolution) {
        toast({
        title: t('common.warning'), 
        description: 'Please select a conflict resolution strategy', 
        variant: 'default' 
      });
      return;
    }
    
    try {
      const { fromVehicle, toVehicle, conflictResolution } = copyFromVehicle;
      const sourceItems = items.filter(item => item.vehicle_id === fromVehicle.id);
      const targetItems = items.filter(item => item.vehicle_id === toVehicle.id);
      
      if (sourceItems.length === 0) {
        toast({ 
          title: t('common.warning'), 
          description: 'No pricing items found to copy', 
          variant: 'default' 
        });
        return;
      }
      
      let itemsProcessed = 0;
      let itemsUpdated = 0;
      let itemsCreated = 0;
      
      if (conflictResolution === 'overwrite') {
        // Delete all existing pricing items for target vehicle
        for (const targetItem of targetItems) {
          await deletePricingItem(targetItem.id);
        }
        itemsProcessed = targetItems.length;
      }
      
      // Process each source item
      for (const sourceItem of sourceItems) {
        if (conflictResolution === 'update') {
          // Try to find existing item with same service type and duration
          const existingItem = targetItems.find(item => 
            item.service_type_id === sourceItem.service_type_id && 
            item.duration_hours === sourceItem.duration_hours
          );
          
          if (existingItem) {
            // Update existing item
            await updatePricingItem(existingItem.id, {
              price: sourceItem.price,
              is_active: sourceItem.is_active
            });
            itemsUpdated++;
      } else {
            // Create new item if no match found
            const newItem = {
              ...sourceItem,
              id: undefined,
              vehicle_id: toVehicle.id,
              created_at: undefined,
              updated_at: undefined
            };
            await createPricingItem(newItem);
            itemsCreated++;
          }
        } else {
          // Create new item (for 'create' and 'overwrite' modes)
          const newItem = {
            ...sourceItem,
            id: undefined,
              vehicle_id: toVehicle.id,
              created_at: undefined,
              updated_at: undefined
            };
            await createPricingItem(newItem);
            itemsCreated++;
        }
      }
      
      let description = `Successfully processed ${sourceItems.length} pricing items from ${fromVehicle.brand} ${fromVehicle.model} to ${toVehicle.brand} ${toVehicle.model}`;
      if (conflictResolution === 'update') {
        description += ` (${itemsUpdated} updated, ${itemsCreated} created)`;
      } else if (conflictResolution === 'overwrite') {
        description += ` (${itemsProcessed} existing items removed, ${itemsCreated} new items created)`;
      }
      
      toast({ 
        title: t('common.success'), 
        description 
      });
      
      refreshItems();
      setCopyFromVehicle(null);
    } catch (error) {
      console.error('Error copying pricing items:', error);
      toast({
        title: t('common.error'), 
        description: 'Failed to copy pricing items', 
        variant: 'destructive'
      });
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkUpdateModal) return;
    
    try {
      const { type, value, selectedCategories, selectedServiceTypes, selectedVehicles } = bulkUpdateModal;
      
      // Filter items based on selection
      let itemsToUpdate = items;
      
      if (selectedCategories.length > 0) {
        itemsToUpdate = itemsToUpdate.filter(item => 
          selectedCategories.includes(item.category_id || '')
        );
      }
      
      if (selectedServiceTypes.length > 0) {
        itemsToUpdate = itemsToUpdate.filter(item => 
          selectedServiceTypes.includes(item.service_type_id || '')
        );
      }
      
      if (selectedVehicles.length > 0) {
        itemsToUpdate = itemsToUpdate.filter(item => 
          selectedVehicles.includes(item.vehicle_id || '')
        );
      }
      
      if (itemsToUpdate.length === 0) {
        toast({ 
          title: t('common.warning'), 
          description: 'No items match the selected criteria', 
          variant: 'default' 
        });
        return;
      }
      
      let itemsUpdated = 0;
      
      // Update each item
      for (const item of itemsToUpdate) {
        let newPrice = item.price || 0;
        
        if (type === 'percentage') {
          // Apply percentage change
          newPrice = Math.round(newPrice * (1 + value / 100));
        } else {
          // Apply fixed amount change
          newPrice = Math.round(newPrice + value);
        }
        
        // Ensure price doesn't go below 0
        newPrice = Math.max(0, newPrice);
        
        await updatePricingItem(item.id, { price: newPrice });
        itemsUpdated++;
      }
      
      const changeType = type === 'percentage' ? `${value > 0 ? '+' : ''}${value}%` : `${value > 0 ? '+' : ''}¥${value.toLocaleString()}`;
      
      toast({ 
        title: t('common.success'), 
        description: `Successfully updated ${itemsUpdated} pricing items by ${changeType}` 
      });
      
      refreshItems();
      setBulkUpdateModal(null);
    } catch (error) {
      console.error('Error updating prices in bulk:', error);
      toast({
        title: t('common.error'), 
        description: 'Failed to update prices in bulk', 
        variant: 'destructive'
      });
    }
  };

  // Filtered items based on current selections
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (selectedServiceType !== "all") {
      filtered = filtered.filter(item => item.service_type_id === selectedServiceType);
    }
    
    if (selectedDuration !== "all") {
      filtered = filtered.filter(item => item.duration_hours === parseInt(selectedDuration));
    }
    
    if (selectedVehicle !== "all") {
      filtered = filtered.filter(item => item.vehicle_id === selectedVehicle);
    }
    
    return filtered;
  }, [items, selectedServiceType, selectedDuration, selectedVehicle]);

  // Get unique durations for the selected category
  const uniqueDurations = useMemo(() => {
    const durations = [...new Set(items.map(item => item.duration_hours))];
    return durations.sort((a, b) => a - b);
  }, [items]);

  // Get active service types for the selected category
  const activeServiceTypesForTable = useMemo(() => {
    const serviceTypeIds = [...new Set(items.map(item => item.service_type_id))];
    return allServiceTypes.filter(st => serviceTypeIds.includes(st.id));
  }, [items, allServiceTypes]);

  // Get current category name
  const currentCategoryName = useMemo(() => {
    return categories.find(c => c.id === selectedCategory)?.name;
  }, [categories, selectedCategory]);



  return (
    <div className="space-y-6">
             <PricingTabHeader 
         title="Vehicle Pricing"
         description={t("pricing.items.description")}
         icon={<Plus className="h-5 w-5" />}
         badges={
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
             {selectedCategory && (
               <StatusBadge type="info">
                 {currentCategoryName}
               </StatusBadge>
             )}
             <StatusBadge type="success">
               {items.length} items loaded
             </StatusBadge>
        </div>
         }
         actions={
           <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
             <Plus className="h-4 w-4 mr-2" />
             {t("pricing.items.buttons.addItemToCategory", { categoryName: selectedCategory ? currentCategoryName : 'Category' })}
        </Button>
         }
       />

      {/* Enhanced Tabs - Mobile and tablet optimized */}
      <div className="border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-1 sm:p-2 mb-4 sm:mb-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col sm:flex-row w-full h-auto min-h-12 sm:min-h-16 items-stretch sm:items-center justify-stretch sm:justify-start rounded-lg border border-border/60 bg-muted/30 backdrop-blur p-1 gap-1">
            <TabsTrigger 
              value="pricing" 
              className="relative flex-1 sm:flex-none h-12 sm:h-16 px-4 sm:px-6 lg:px-8 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:scale-[1.02] sm:data-[state=active]:scale-105"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm sm:text-base font-semibold leading-tight">Vehicle Pricing</span>
                <span className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80 leading-tight hidden sm:block">Manage individual prices</span>
                <span className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80 leading-tight sm:hidden">Individual prices</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="vehicles" 
              className="relative flex-1 sm:flex-none h-12 sm:h-16 px-4 sm:px-6 lg:px-8 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md data-[state=active]:scale-[1.02] sm:data-[state=active]:scale-105"
            >
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm sm:text-base font-semibold leading-tight">Price Vehicle Management</span>
                <span className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80 leading-tight hidden sm:block">Bulk operations & setup</span>
                <span className="text-xs text-muted-foreground data-[state=active]:text-primary-foreground/80 leading-tight sm:hidden">Bulk operations</span>
              </div>
            </TabsTrigger>
          </TabsList>

        {/* Vehicle Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
                     {/* Enhanced Filters */}
        <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <Filter className="h-5 w-5" />
                 Filters & Search
               </CardTitle>
          </CardHeader>
                          <CardContent className="space-y-4">
               {/* Advanced Filters - Responsive Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div>
                   <Label htmlFor="service-type-select" className="text-sm font-medium mb-1 block">Service Type</Label>
                   <Select
                     value={selectedServiceType}
                     onValueChange={setSelectedServiceType}
                     disabled={!selectedCategory}
                   >
                     <SelectTrigger id="service-type-select">
                       <SelectValue placeholder="All Service Types" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Service Types</SelectItem>
                       {activeServiceTypesForTable.map(st => (
                         <SelectItem key={st.id} value={st.id}>
                           {st.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
            </div>

                <div>
                  <Label htmlFor="pricing-category-select" className="text-sm font-medium mb-1 block">Category</Label>
                  <Select
                    value={selectedCategory ?? "all"}
                    onValueChange={(val) => handleCategoryChange(val === "all" ? null : val)}
                  >
                    <SelectTrigger id="pricing-category-select">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="disabled" disabled>No Categories Available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
            </div>

                <div>
                  <Label htmlFor="duration-select" className="text-sm font-medium mb-1 block">Duration</Label>
                  <Select
                    value={selectedDuration}
                    onValueChange={setSelectedDuration}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="duration-select">
                      <SelectValue placeholder="All Durations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      {uniqueDurations.map(duration => (
                        <SelectItem key={`duration-${duration}`} value={String(duration)}>
                          {t("pricing.items.durations.hours", { count: duration })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle-select" className="text-sm font-medium mb-1 block">Vehicle</Label>
                  <Select
                    value={selectedVehicle}
                    onValueChange={setSelectedVehicle}
                  >
                    <SelectTrigger id="vehicle-select">
                      <SelectValue placeholder="All Vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </CardContent>
        </Card>
        
          {/* Enhanced Pricing Items Display */}
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
            <div className="space-y-4">
              {/* Group items by service type for better organization */}
              {groupItemsByServiceType(filteredItems).map((serviceGroup) => (
                <Card key={serviceGroup.serviceTypeId} className="overflow-hidden">
                                     <div className="bg-muted/30 pb-3 px-4 sm:px-6 pt-4">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                       <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                         <h3 className="text-lg font-semibold">{serviceGroup.serviceTypeName}</h3>
                         <Badge variant="outline" className="text-xs w-fit">
                           {serviceGroup.items.length} pricing options
                         </Badge>
                       </div>
                       <Button 
                         onClick={() => handleOpenDialog(undefined, serviceGroup.serviceTypeId)} 
                         size="sm" 
                         variant="outline"
                         className="w-full sm:w-auto"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Add {serviceGroup.serviceTypeName}
                       </Button>
                     </div>
                   </div>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                      {serviceGroup.items.map((item) => {
                        const vehicle = vehicles.find(v => v.id === item.vehicle_id);
                        return (
                          <div 
                            key={item.id} 
                            className={cn(
                              "p-4 rounded-lg border transition-all hover:shadow-md",
                              item.is_active ? "bg-background" : "bg-muted/20 opacity-75"
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                        {item.duration_hours}h
                                  </span>
                                  <StatusBadge type={item.is_active ? 'success' : 'error'}>
                                    {item.is_active ? 'Active' : 'Inactive'}
                                  </StatusBadge>
                      </div>
                                {vehicle && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Car className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {vehicle.brand} {vehicle.model}
                      </span>
                                  </div>
                                )}
                      <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xl font-bold text-white">
                                    ¥{item.price?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenDialog(item)}
                                  className="h-8 w-8 p-0"
                        >
                                  <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusToggle(item)}
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    item.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"
                                  )}
                                >
                                  {item.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                                  variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                                  <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          )}
        </TabsContent>

                {/* Price Vehicle Management Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5" />
                Price Vehicle Management
              </CardTitle>
              <CardDescription>
                Manage vehicles per category and view pricing distribution
              </CardDescription>
            </CardHeader>
            <CardContent>


              {/* Bulk Price Update Section */}
              <div className="mb-6 p-4 border rounded-lg bg-blue-50/20 dark:bg-blue-950/20 border-blue-200/30 dark:border-blue-800/30">
                <div className="flex flex-col gap-4 mb-4">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">Bulk Price Update</h4>
                  <div className="w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkUpdateModal({ 
                        open: true, 
                        type: 'percentage',
                        value: 0,
                        selectedCategories: [],
                        selectedServiceTypes: [],
                        selectedVehicles: []
                      })}
                      className="w-full sm:w-auto text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Update All Prices
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> Use this feature to adjust all pricing items by a percentage or fixed amount across selected categories, service types, or vehicles.
                </div>
              </div>

              {/* Filter Section */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <div className="mb-4">
                  <h4 className="font-medium">Quick Filters</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category Filter</Label>
                    <Select value={selectedCategory || "all"} onValueChange={(val) => {
                      const categoryId = val === "all" ? null : val;
                      setSelectedCategory(categoryId);
                      // Refresh items for the selected category
                      if (categoryId) {
                        refreshItems(categoryId);
                      } else {
                        // Load all items for all categories
                        const loadAllItems = async () => {
                          try {
                            const allItems: PricingItem[] = [];
                            for (const category of categories) {
                              const categoryItems = await getPricingItems(category.id, undefined);
                              allItems.push(...categoryItems);
                            }
                            const serviceTypesData = await getServiceTypes();
                            const itemsWithServiceNames = allItems.map(item => ({
                              ...item,
                              service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name
                            }));
                            setItems(itemsWithServiceNames as PricingItem[]);
                          } catch (error) {
                            console.error('Error loading all pricing items:', error);
                          }
                        };
                        loadAllItems();
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Pricing Status</Label>
                    <Select value={activeTab === "vehicles" ? "all" : "all"} onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="has-pricing">Has Pricing</SelectItem>
                        <SelectItem value="no-pricing">No Pricing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label className="text-sm font-medium">Vehicle Search</Label>
                    <Input placeholder="Search vehicles..." className="h-10" />
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Use these filters to quickly find vehicles. The "Has Pricing" and "No Pricing" badges show the current status for each vehicle in their assigned category.
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading vehicle pricing data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                   {/* Filter categories based on selectedCategory */}
                   {categories
                     .filter(category => !selectedCategory || category.id === selectedCategory)
                     .map((category, index) => (
                       <CategoryVehiclesSection
                         key={category.id}
                         category={category}
                         items={getPricingItemsForCategory(category.id)}
                         vehicles={vehicles}
                         getVehiclesForCategory={getVehiclesForCategoryDisplay}
                         handleOpenDialog={handleOpenDialog}
                         setManageVehiclesModal={setManageVehiclesModal}
                         handleShowPricingBreakdown={handleShowPricingBreakdown}
                         handleCopyPricing={handleCopyPricing}
                       />
                     ))}
                   {/* Add bottom spacing for the last category */}
                   <div className="h-6"></div>
                </div>
              )}
        </CardContent>
      </Card>
        </TabsContent>


      </Tabs>
        </div>

             {/* Enhanced Dialog for Creating/Editing Pricing Items */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
           <DialogHeader className="pb-4 border-b">
             <DialogTitle className="text-xl">
               {isEditing ? "Edit Pricing Item" : "Create New Pricing Item"}
            </DialogTitle>
             <DialogDescription className="text-base">
              {isEditing 
                 ? `Update pricing for ${currentItem?.vehicle_id ? 
                     vehicles.find(v => v.id === currentItem.vehicle_id)?.name || 'this vehicle' : 'this service'}`
                 : "Create a new pricing item by filling in the details below."
              }
            </DialogDescription>
          </DialogHeader>
          
           <div className="space-y-6 py-6">
             {/* Active Status Section */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-foreground border-b pb-2">Status</h3>
               <div className="flex items-center space-x-3">
                 <Checkbox
                   id="is_active"
                   checked={currentItem?.is_active ?? true}
                   onCheckedChange={(checked) => handleInputChange("is_active", checked === true)}
                 />
                 <Label htmlFor="is_active" className="text-base">Active</Label>
               </div>
             </div>
             
             {/* Basic Information Section */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="category_id">Category</Label>
                   <Select
                     value={currentItem?.category_id || ""}
                     onValueChange={(value) => handleInputChange("category_id", value)}
                     disabled={false}
                   >
                     <SelectTrigger id="category_id">
                       <SelectValue placeholder="Select category" />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map((category) => (
                         <SelectItem key={category.id} value={category.id}>
                           {category.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="service_type_id">Service Type</Label>
                   <Select
                     value={currentItem?.service_type_id || ""}
                     onValueChange={(value) => handleInputChange("service_type_id", value)}
                     disabled={false}
                   >
                     <SelectTrigger id="service_type_id">
                       <SelectValue placeholder="Select service type" />
                     </SelectTrigger>
                     <SelectContent>
                       {allServiceTypes.map((serviceType) => (
                         <SelectItem key={serviceType.id} value={serviceType.id}>
                           <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 text-muted-foreground" />
                             {serviceType.name}
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </div>
             
             {/* Vehicle Selection Section */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-foreground border-b pb-2">Vehicle Selection</h3>
               
               <div className="space-y-4">
                 <div className="space-y-4">
                   <Label htmlFor="vehicle_id" className="text-base font-medium">Pricing Scope</Label>
                   
                   {/* Vehicle Selection Options - Now in 1 row × 2 columns */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {/* Category-wide Option */}
                     <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                       <input
                         type="radio"
                         name="vehicle_selection"
                         id="category_wide"
                         checked={!currentItem?.vehicle_id}
                         onChange={() => handleInputChange("vehicle_id", null)}
                         className="text-primary"
                       />
                       <label htmlFor="category_wide" className="flex-1 cursor-pointer">
                         <div className="font-medium text-foreground">Category-wide pricing</div>
                         <div className="text-sm text-muted-foreground">Apply to all vehicles in the category</div>
                       </label>
                     </div>
                     
                     {/* Specific Vehicle Option */}
                     <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                       <input
                         type="radio"
                         name="vehicle_selection"
                         id="specific_vehicle"
                         checked={!!currentItem?.vehicle_id}
                         onChange={() => {
                           // Set to first available vehicle if none selected
                           if (!currentItem?.vehicle_id && vehicles.length > 0) {
                             handleInputChange("vehicle_id", vehicles[0].id);
                           }
                         }}
                         className="text-primary"
                       />
                       <label htmlFor="specific_vehicle" className="flex-1 cursor-pointer">
                         <div className="font-medium text-foreground">Specific vehicle pricing</div>
                         <div className="text-sm text-muted-foreground">Apply to a selected vehicle only</div>
                       </label>
                     </div>
                   </div>
              
              {/* Vehicle Selection Interface */}
              {currentItem?.vehicle_id && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Select Vehicle</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("vehicle_id", null)}
                      className="text-xs"
                    >
                      Clear Selection
                    </Button>
                  </div>
                  
                  {/* Vehicle Search and Filter */}
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vehicles by brand, model, name, or year..."
                        className="pl-10 h-10"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          // In a real implementation, you'd filter the displayed vehicles here
                        }}
                      />
                    </div>
                    
                    {/* Brand Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="text-sm font-medium min-w-[80px]">Brand:</Label>
                      <Select onValueChange={(brand) => {
                        // Filter vehicles by brand
                      }}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Brands</SelectItem>
                          {Array.from(new Set(vehicles.map(v => v.brand))).sort().map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Vehicle List */}
                  <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 p-2">
                      {vehicles.map((vehicle) => (
                                                 <div
                           key={vehicle.id}
                           className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                             currentItem?.vehicle_id === vehicle.id
                               ? 'bg-primary/20 border border-primary/30'
                               : 'hover:bg-muted/30 border border-transparent'
                           }`}
                           onClick={() => handleInputChange("vehicle_id", vehicle.id)}
                         >
                           <input
                             type="radio"
                             name="vehicle_id"
                             id={`vehicle_${vehicle.id}`}
                             checked={currentItem?.vehicle_id === vehicle.id}
                             onChange={() => handleInputChange("vehicle_id", vehicle.id)}
                             className="text-primary"
                             aria-label={`Select ${vehicle.brand} ${vehicle.model} ${vehicle.name} ${vehicle.year}`}
                           />
                          <Car className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {vehicle.name} • {vehicle.year}
                            </div>
                          </div>
                          {currentItem?.vehicle_id === vehicle.id && (
                            <div className="text-primary">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Selected Vehicle Info */}
                  {currentItem?.vehicle_id && (
                    <div className="p-3 bg-muted/20 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Selected Vehicle:</span>
                      </div>
                      <div className="text-sm text-foreground">
                        {(() => {
                          const vehicle = vehicles.find(v => v.id === currentItem.vehicle_id);
                          return vehicle ? (
                            <div>
                              <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
                              <span className="text-muted-foreground"> • {vehicle.name} • {vehicle.year}</span>
                            </div>
                          ) : 'Unknown Vehicle';
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                {currentItem?.vehicle_id 
                  ? "This pricing will only apply to the selected vehicle"
                  : "This pricing will apply to all vehicles in the category (unless overridden by vehicle-specific pricing)"
                }
              </p>
            </div>
            
            {/* Pricing Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Pricing Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                     <Label htmlFor="duration_hours">Duration (hours)</Label>
                     <Select
                       value={String(currentItem?.duration_hours ?? 1)}
                       onValueChange={(value) => {
                         if (value === 'custom') {
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
            
            <div className="space-y-2">
                     <Label htmlFor="price">Price</Label>
                     <div className="flex space-x-2">
              <Select
                         value={currentItem?.currency || "JPY"}
                         onValueChange={(value) => handleInputChange("currency", value)}
                         disabled 
              >
                         <SelectTrigger className="w-[100px]">
                           <SelectValue placeholder="Currency" />
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
          </div>
            </div>
          
               </div>
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

      {/* Delete Confirmation Dialog */}
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

      {/* Status Toggle Confirmation Dialog */}
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

        {/* Manage Vehicles Modal */}
        {manageVehiclesModal && (
          <ManageVehiclesModal
            open={manageVehiclesModal.open}
            onClose={() => setManageVehiclesModal(null)}
            category={manageVehiclesModal.category}
            vehicles={vehicles}
            setVehicles={setVehicles}
            getVehiclesForCategory={getVehiclesForCategory}
            refreshItems={refreshItems}
          />
        )}

                 {/* Pricing Breakdown Modal */}
         {pricingBreakdownModal && (
           <Dialog open={pricingBreakdownModal.open} onOpenChange={(open) => !open && setPricingBreakdownModal(null)}>
             <DialogContent className="max-w-6xl max-h-[90vh]">
               <DialogHeader className="pb-4 border-b">
                 <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3 text-xl">
                   <Car className="h-6 w-6 text-muted-foreground" />
                   <div className="text-center sm:text-left">
                     <div className="font-semibold text-lg">{pricingBreakdownModal.vehicle.brand} {pricingBreakdownModal.vehicle.model}</div>
                     <div className="text-sm text-muted-foreground">
                       {pricingBreakdownModal.vehicle.name} • {pricingBreakdownModal.vehicle.year}
                     </div>
                   </div>
                 </DialogTitle>
                 <DialogDescription className="text-base text-center sm:text-left">
                   {pricingBreakdownModal.items.length} pricing options available for this vehicle
                 </DialogDescription>
               </DialogHeader>
               
               <div className="space-y-6 py-6 px-2 sm:px-0">
                 {/* Summary Stats - Sales Calendar Style */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-foreground text-left">Pricing Overview</h3>
                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center border-l-4 border-blue-500">
                       <div className="text-xl sm:text-2xl font-bold text-blue-500">
                         {pricingBreakdownModal.items.filter(item => item.is_active).length}
                       </div>
                       <div className="text-xs sm:text-sm text-muted-foreground">Active Items</div>
                     </div>
                     <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center border-l-4 border-orange-500">
                       <div className="text-xl sm:text-2xl font-bold text-orange-500">
                         {pricingBreakdownModal.items.filter(item => !item.is_active).length}
                       </div>
                       <div className="text-xs sm:text-sm text-muted-foreground">Inactive Items</div>
                     </div>
                     <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center border-l-4 border-green-500">
                       <div className="text-xl sm:text-2xl font-bold text-green-500">
                         {new Set(pricingBreakdownModal.items.map(item => item.service_type_name)).size}
                       </div>
                       <div className="text-xs sm:text-sm text-muted-foreground">Service Types</div>
                     </div>
                     <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center border-l-4 border-purple-500">
                       <div className="text-xl sm:text-2xl font-bold text-purple-500">
                         {new Set(pricingBreakdownModal.items.map(item => item.duration_hours)).size}
                       </div>
                       <div className="text-xs sm:text-sm text-muted-foreground">Durations</div>
                     </div>
                   </div>
                 </div>

                 {/* Service Type Filters */}
                 <div className="space-y-3">
                   <h3 className="text-lg font-semibold text-foreground">Filter by Service Type</h3>
                   <div className="grid grid-cols-2 gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setPricingBreakdownModal(prev => prev ? { ...prev, selectedServiceType: 'all' } : null)}
                       className={cn(
                         "text-xs px-2 py-1 h-8",
                         (!pricingBreakdownModal.selectedServiceType || pricingBreakdownModal.selectedServiceType === 'all') 
                           ? "bg-primary text-primary-foreground" 
                           : "hover:bg-muted/50"
                       )}
                     >
                       All Services
                     </Button>
                     {Array.from(new Set(pricingBreakdownModal.items.map(item => item.service_type_name))).map(serviceType => (
                       <Button
                         key={serviceType}
                         variant="outline"
                         size="sm"
                         onClick={() => setPricingBreakdownModal(prev => prev ? { ...prev, selectedServiceType: serviceType } : null)}
                         className={cn(
                           "text-xs px-2 py-1 h-8",
                           pricingBreakdownModal.selectedServiceType === serviceType 
                             ? "bg-primary text-primary-foreground" 
                             : "hover:bg-muted/50"
                         )}
                       >
                         {serviceType}
                       </Button>
                     ))}
                   </div>
                 </div>

                                 {/* Pricing Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                   {(pricingBreakdownModal.selectedServiceType && pricingBreakdownModal.selectedServiceType !== 'all' 
                     ? pricingBreakdownModal.items.filter(item => item.service_type_name === pricingBreakdownModal.selectedServiceType)
                     : pricingBreakdownModal.items
                   )
                   .sort((a, b) => {
                     // Active items first, then by duration, then by service type
                     if (a.is_active !== b.is_active) return b.is_active ? 1 : -1;
                     if (a.duration_hours !== b.duration_hours) return a.duration_hours - b.duration_hours;
                     return (a.service_type_name || '').localeCompare(b.service_type_name || '');
                   })
                   .map((item) => (
                     <div key={item.id} className="p-3 sm:p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-200">
                       <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
                         <div className="flex items-center gap-2 mb-2">
                           <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                           <span className="text-lg sm:text-xl font-bold text-foreground">{item.duration_hours}h</span>
                         </div>
                         <Badge 
                           variant={item.is_active ? "default" : "secondary"}
                           className={cn(
                             "text-xs px-2 py-1",
                             item.is_active 
                               ? "bg-green-600 text-white border-green-700" 
                               : "bg-gray-600 text-white border-gray-700"
                           )}
                         >
                           {item.is_active ? "Active" : "Inactive"}
                         </Badge>
                       </div>
                       
                       <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">
                         {allServiceTypes.find(st => st.id === item.service_type_id)?.name || 'Unknown Service'}
                       </div>
                       
                       <div className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 text-center">
                         ¥{item.price?.toLocaleString()}
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             setPricingBreakdownModal(null);
                             handleOpenDialog(item);
                           }}
                           className="w-full text-xs h-8"
                         >
                           <Edit className="h-3 w-3 mr-1" />
                           Edit
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleCopyPricing(pricingBreakdownModal.vehicle, pricingBreakdownModal.vehicle)}
                           className="w-full text-xs h-8"
                         >
                           <Copy className="h-3 w-3 mr-1" />
                           Copy
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

                 {/* Copy Pricing Modal */}
         {copyFromVehicle && (
           <Dialog open={copyFromVehicle.open} onOpenChange={(open) => !open && setCopyFromVehicle(null)}>
             <DialogContent className="sm:max-w-[600px]">
               <DialogHeader className="pb-4 border-b">
                 <DialogTitle className="flex items-center gap-2 text-xl">
                   <Copy className="h-6 w-6" />
                   Copy Pricing
                 </DialogTitle>
                 <DialogDescription className="text-base">
                   Copy all pricing items from one vehicle to another
                 </DialogDescription>
               </DialogHeader>
               
               <div className="space-y-6 py-6">
                 {/* Vehicle Information Section */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-foreground border-b pb-2">Vehicle Information</h3>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="p-4 border rounded-lg bg-muted/30 border-border">
                       <div className="text-sm font-medium mb-2 text-muted-foreground">Source Vehicle:</div>
                       <div className="text-lg font-semibold text-foreground">{copyFromVehicle.fromVehicle.brand} {copyFromVehicle.fromVehicle.model}</div>
                       <div className="text-sm text-muted-foreground">{copyFromVehicle.fromVehicle.name} • {copyFromVehicle.fromVehicle.year}</div>
                       <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                         {items.filter(item => item.vehicle_id === copyFromVehicle.fromVehicle.id).length} pricing items available
                       </div>
                     </div>
                     
                     <div className="p-4 border rounded-lg bg-muted/30 border-border">
                       <div className="text-sm font-medium mb-2 text-muted-foreground">Target Vehicle:</div>
                       <div className="text-lg font-semibold text-foreground">{copyFromVehicle.toVehicle.brand} {copyFromVehicle.toVehicle.model}</div>
                       <div className="text-sm text-muted-foreground">{copyFromVehicle.toVehicle.name} • {copyFromVehicle.toVehicle.year}</div>
                       <div className="text-sm text-muted-foreground mt-2 font-medium">
                         Will receive copied pricing items
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Conflict Resolution Section */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-foreground border-b pb-2">Conflict Resolution</h3>
                   
                   <div className="p-4 bg-muted/30 border border-border rounded-lg">
                     <div className="text-sm text-foreground mb-4">
                       <strong>Note:</strong> Choose how to handle existing pricing items on the target vehicle.
                     </div>
                     
                     <div className="space-y-3">
                       <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                         <input
                           type="radio"
                           name="conflictResolution"
                           value="create"
                           checked={copyFromVehicle.conflictResolution === 'create'}
                           onChange={(e) => setCopyFromVehicle(prev => prev ? { ...prev, conflictResolution: e.target.value as 'create' } : null)}
                           className="text-emerald-600"
                         />
                         <div>
                           <div className="text-sm font-medium text-foreground">Create new items</div>
                           <div className="text-xs text-muted-foreground">Keep all existing pricing, add new ones</div>
                         </div>
                       </label>
                       
                       <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                         <input
                           type="radio"
                           name="conflictResolution"
                           value="update"
                           checked={copyFromVehicle.conflictResolution === 'update'}
                           onChange={(e) => setCopyFromVehicle(prev => prev ? { ...prev, conflictResolution: e.target.value as 'update' } : null)}
                           className="text-emerald-600"
                         />
                         <div>
                           <div className="text-sm font-medium text-foreground">Update existing items</div>
                           <div className="text-xs text-muted-foreground">Update matching service types & durations, create new for others</div>
                         </div>
                       </label>
                       
                       <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                         <input
                           type="radio"
                           name="conflictResolution"
                           value="overwrite"
                           checked={copyFromVehicle.conflictResolution === 'overwrite'}
                           onChange={(e) => setCopyFromVehicle(prev => prev ? { ...prev, conflictResolution: e.target.value as 'overwrite' } : null)}
                           className="text-emerald-600"
                         />
                         <div>
                           <div className="text-sm font-medium text-foreground">Overwrite all existing items</div>
                           <div className="text-xs text-muted-foreground">Remove all existing pricing, create new ones</div>
                         </div>
                       </label>
                     </div>
                   </div>
                 </div>
               </div>
               
               <DialogFooter className="pt-4 border-t">
                 <Button variant="outline" onClick={() => setCopyFromVehicle(null)}>
                   Cancel
                 </Button>
                 <Button 
                   onClick={handleCopyPricingConfirmed} 
                   disabled={!copyFromVehicle.conflictResolution}
                   className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Copy className="h-4 w-4 mr-2" />
                   Copy Pricing
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         )}

        {/* Bulk Price Update Modal */}
        {bulkUpdateModal && (
          <Dialog open={bulkUpdateModal.open} onOpenChange={(open) => !open && setBulkUpdateModal(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <RefreshCw className="h-6 w-6" />
                  Bulk Price Update
                </DialogTitle>
                <DialogDescription className="text-base">
                  Update multiple pricing items at once by percentage or fixed amount
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-6">
                {/* Update Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Update Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={bulkUpdateModal.type === 'percentage' ? "default" : "outline"}
                      onClick={() => setBulkUpdateModal(prev => prev ? { ...prev, type: 'percentage' } : null)}
                      className="h-12"
                    >
                      <div className="text-center">
                        <div className="font-medium">Percentage</div>
                        <div className="text-xs text-muted-foreground">e.g., -10% for all prices</div>
                      </div>
                    </Button>
                    <Button
                      variant={bulkUpdateModal.type === 'fixed' ? "default" : "outline"}
                      onClick={() => setBulkUpdateModal(prev => prev ? { ...prev, type: 'fixed' } : null)}
                      className="h-12"
                    >
                      <div className="text-center">
                        <div className="font-medium">Fixed Amount</div>
                        <div className="text-xs text-muted-foreground">e.g., -¥1000 from all prices</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Update Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Update Parameters</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="update-value">Update Value</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="update-value"
                          type="number"
                          placeholder={bulkUpdateModal.type === 'percentage' ? "10" : "1000"}
                          value={bulkUpdateModal.value}
                          onChange={(e) => setBulkUpdateModal(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-[40px]">
                          {bulkUpdateModal.type === 'percentage' ? '%' : '¥'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bulkUpdateModal.type === 'percentage' 
                          ? 'Use positive for increase, negative for decrease'
                          : 'Use positive to add, negative to subtract'
                        }
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="update-currency">Currency</Label>
                      <Select value="JPY" disabled>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Scope Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Update Scope</h3>
                  
                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <Label>Categories</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                        {categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              id={`cat-${category.id}`} 
                              checked={bulkUpdateModal.selectedCategories.includes(category.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedCategories: [...prev.selectedCategories, category.id] 
                                  } : null);
                                } else {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedCategories: prev.selectedCategories.filter(id => id !== category.id) 
                                  } : null);
                                }
                              }}
                            />
                            <span className="text-sm">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Service Type Filter */}
                    <div className="space-y-2">
                      <Label>Service Types</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                        {allServiceTypes.map((serviceType) => (
                          <label key={serviceType.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              id={`st-${serviceType.id}`} 
                              checked={bulkUpdateModal.selectedServiceTypes.includes(serviceType.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedServiceTypes: [...prev.selectedServiceTypes, serviceType.id] 
                                  } : null);
                                } else {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedServiceTypes: prev.selectedServiceTypes.filter(id => id !== serviceType.id) 
                                  } : null);
                                }
                              }}
                            />
                            <span className="text-sm">{serviceType.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle Filter */}
                    <div className="space-y-2">
                      <Label>Vehicles</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                        {vehicles.map((vehicle) => (
                          <label key={vehicle.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              id={`veh-${vehicle.id}`} 
                              checked={bulkUpdateModal.selectedVehicles.includes(vehicle.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedVehicles: [...prev.selectedVehicles, vehicle.id] 
                                  } : null);
                                } else {
                                  setBulkUpdateModal(prev => prev ? { 
                                    ...prev, 
                                    selectedVehicles: prev.selectedVehicles.filter(id => id !== vehicle.id) 
                                  } : null);
                                }
                              }}
                            />
                            <span className="text-sm">{vehicle.brand} {vehicle.model}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Preview</h3>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-2">
                      This will update approximately <strong>{items.length}</strong> pricing items
                    </div>
                    <div className="text-xs text-muted-foreground">
                      💡 <strong>Note:</strong> Review the scope carefully. This action cannot be easily undone.
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setBulkUpdateModal(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBulkPriceUpdate}
                  disabled={bulkUpdateModal.value === 0}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Prices
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
} 