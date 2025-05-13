"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PricingItem, PricingCategory } from "@/types/quotations";
import { useQuotationService, ServiceTypeInfo } from "@/hooks/useQuotationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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

// Utility functions
const getVehicleTypes = () => ["Sedan", "Van", "Minibus", "Bus", "Coach"];

const getDurationOptions = () => [
  { value: 1, label: "1 hour" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" },
  { value: 10, label: "10 hours" },
  { value: 12, label: "12 hours" },
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
  vehicleType: string;
  prices: Record<string, PriceData>;
}

interface DurationGroup {
  duration: number;
  rows: PriceRow[];
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
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PricingItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  
  const {
    getPricingCategories,
    getServiceTypes,
    getPricingItems,
    createPricingItem,
    updatePricingItem,
    deletePricingItem
  } = useQuotationService();
  const { t } = useI18n();
  
  const refreshItems = useCallback(async (currentCategoryId?: string | null) => {
    setIsLoading(true);
    try {
      const categoryToFetch = currentCategoryId === undefined ? selectedCategory : currentCategoryId;
      if (categoryToFetch) {
        const [itemsData, serviceTypesData] = await Promise.all([
          getPricingItems(categoryToFetch, undefined, undefined),
          getServiceTypes()
        ]);
        setAllServiceTypes(serviceTypesData);
        const itemsWithServiceNames = itemsData.map(item => ({
          ...item,
          service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name || item.service_type_id
        }));        
        setItems(itemsWithServiceNames);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error refreshing pricing items:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.fetchFailed', { entity: 'pricing items' }), variant: 'destructive' });
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
        if (categoriesData.length > 0) {
          const initialCategory = categoriesData[0].id;
          setSelectedCategory(initialCategory);
          // Items will be loaded by the useEffect watching selectedCategory
        } else {
          setItems([]); 
        }
      } catch (error) {
        console.error("Error loading initial categories:", error);
        toast({ title: t('common.error.genericTitle'), description: t('common.error.initialLoadFailed', { context: 'pricing categories' }), variant: 'destructive' });
      } finally {
        // setIsLoading(false); // isLoading for items will handle this
      }
    };
    loadInitialData();
  }, [getPricingCategories, t]); // Removed getServiceTypes and refreshItems as items load based on selectedCategory

  useEffect(() => {
    if (selectedCategory) {
      refreshItems(selectedCategory);
    } else {
      setItems([]);
    }
  }, [selectedCategory, refreshItems]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleOpenDialog = (item?: Partial<PricingItem>) => {
    const defaultServiceTypeId = allServiceTypes.length > 0 ? allServiceTypes[0].id : undefined;
    if (item && 'id' in item && item.id) { // Check for id presence for editing
      setCurrentItem({ ...item });
      setIsEditing(true);
    } else {
      setCurrentItem({
        category_id: selectedCategory,
        service_type_id: defaultServiceTypeId,
        vehicle_type: getVehicleTypes()[0] || "",
        duration_hours: 1,
        price: 0,
        currency: 'JPY',
        is_active: true,
        ...(item || {})
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
    
    const { service_type_name, ...itemToSave } = currentItem as PricingItem & { service_type_name?: string }; 

    const payload = {
      ...itemToSave,
      category_id: itemToSave.category_id, // Already set in currentItem
    };

    try {
      let success = false;
      if (isEditing && currentItem.id) {
        const { id, ...updatePayload } = payload as PricingItem;
        if (id) success = !!(await updatePricingItem(id, updatePayload));
      } else {
        const createPayload = payload as Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>;
        success = !!(await createPricingItem(createPayload));
      }

      if (success) {
        await refreshItems();
        handleCloseDialog();
      } 
      // Error toasts are handled by useQuotationService
    } catch (error) {
      console.error("Error saving pricing item:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.saveFailed', { entity: 'pricing item' }), variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!itemId) return;
    try {
      const success = await deletePricingItem(itemId);
      if (success) {
        await refreshItems();
        toast({ title: t('pricing.items.deleteSuccess') });
      }
    } catch (error) {
      console.error("Error deleting pricing item:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.deleteFailed', { entity: 'pricing item' }), variant: 'destructive' });
    }
  };

  const handleToggleItemStatus = async (item: PricingItem) => {
    if (!item || typeof item.id === 'undefined') return;
    try {
        const success = await updatePricingItem(item.id, { is_active: !item.is_active });
        if (success) {
            await refreshItems();
            toast({ title: t('pricing.items.statusUpdateSuccess') });
        }
    } catch (error) {
        console.error("Error toggling item status:", error);
        toast({ title: t('common.error.genericTitle'), description: t('common.error.updateFailed', { entity: 'item status' }), variant: 'destructive' });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (currentItem) {
      setCurrentItem({
        ...currentItem,
        [field]: value
      });
    }
  };

  const uniqueDurations = useMemo(() => {
    const durations = new Set<number>();
    items.forEach(item => durations.add(item.duration_hours));
    return Array.from(durations).sort((a, b) => a - b);
  }, [items]);

  const uniqueVehicleTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => types.add(item.vehicle_type));
    return Array.from(types).sort();
  }, [items]);

  const uniqueServiceTypes = useMemo(() => {
    if (!items.length) return [];
    const serviceTypeMap = new Map<string, string>();
    items.forEach(item => {
      if (!serviceTypeMap.has(item.service_type_id)) {
        const name = item.service_type_name || item.service_type_id;
        serviceTypeMap.set(item.service_type_id, name);
      }
    });
    return Array.from(serviceTypeMap.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedDuration !== 'all' && item.duration_hours !== Number(selectedDuration)) return false;
      if (selectedVehicleType !== 'all' && item.vehicle_type !== selectedVehicleType) return false;
      return true;
    });
  }, [items, selectedDuration, selectedVehicleType]);

  const priceTable = useMemo<PriceTableData>(() => {
    if (filteredItems.length === 0) return { durations: [], serviceTypes: [], groupedRows: [] };
    const durations = Array.from(new Set(filteredItems.map(item => item.duration_hours))).sort((a, b) => a - b);
    const vehicleTypes = Array.from(new Set(filteredItems.map(item => item.vehicle_type))).sort();
    const serviceTypes = uniqueServiceTypes;
    const rows: PriceRow[] = [];
    durations.forEach(duration => {
      vehicleTypes.forEach(vehicleType => {
        const row: PriceRow = { duration, vehicleType, prices: {} };
        serviceTypes.forEach(serviceType => {
          const matchingItem = filteredItems.find(item => 
            item.duration_hours === duration && 
            item.vehicle_type === vehicleType && 
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
        if (Object.keys(row.prices).length > 0) rows.push(row);
      });
    });
    const groupedRows: DurationGroup[] = durations.map(duration => ({
      duration,
      rows: rows.filter(row => row.duration === duration)
    })).filter(group => group.rows.length > 0);
    return { durations, serviceTypes, groupedRows };
  }, [filteredItems, uniqueServiceTypes]);
  
  const currentCategoryName = useMemo(() => 
    categories.find(c => c.id === selectedCategory)?.name || 'Category'
  , [categories, selectedCategory]);

  if (categories.length === 0 && isLoading) { // Initial loading for categories
    return <div className="p-4 text-center">Loading categories...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-muted-foreground" /> 
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pricing-category-select" className="text-sm font-medium mb-1 block">Pricing Category</Label>
              <Select
                value={selectedCategory || ""}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="pricing-category-select">
                  <SelectValue placeholder="Select categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>No categories available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration-select" className="text-sm font-medium mb-1 block">Duration</Label>
              <Select
                value={selectedDuration}
                onValueChange={setSelectedDuration}
              >
                <SelectTrigger id="duration-select">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  {uniqueDurations.map(duration => (
                    <SelectItem key={`duration-${duration}`} value={String(duration)}>
                      {duration}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehicle-select" className="text-sm font-medium mb-1 block">Vehicle</Label>
              <Select
                value={selectedVehicleType}
                onValueChange={setSelectedVehicleType}
              >
                <SelectTrigger id="vehicle-select">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicle Types</SelectItem>
                  {uniqueVehicleTypes.map(type => (
                    <SelectItem key={`vehicle-${type}`} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t mt-4">
            <div className="flex gap-2 mb-3 sm:mb-0">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More filters
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm" disabled={!selectedCategory} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Add Item to {currentCategoryName}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && items.length === 0 ? (
        <div className="p-4 text-center">Loading pricing items for {currentCategoryName}...</div>
      ) : !selectedCategory ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          Please select a pricing category to view items.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {items.length === 0 
            ? `No pricing items found in ${currentCategoryName}. Add your first item.`
            : `No items in ${currentCategoryName} match your current filters. Try adjusting filter settings.`
          }
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="w-full overflow-auto">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 bg-muted/80 sticky left-0 z-20">Duration</TableHead>
                    <TableHead className="w-48 bg-muted/80 sticky left-24 z-20">Vehicle Type</TableHead>
                    {priceTable.serviceTypes?.map(service => (
                      <TableHead 
                        key={service.id} 
                        className="text-center min-w-36 bg-muted/50 font-medium"
                      >
                        {service.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceTable.groupedRows?.map(group => (
                    <React.Fragment key={`group-${group.duration}`}>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell 
                          colSpan={2 + (priceTable.serviceTypes?.length ?? 0)} 
                          className="py-1.5 font-medium sticky left-0 z-10 bg-muted/20"
                        >
                          {group.duration === 1 
                            ? "Hourly Rate" 
                            : `${group.duration} hours`
                          }
                        </TableCell>
                      </TableRow>
                      
                      {group.rows.map((row, rowIndex) => (
                        <TableRow key={`${row.duration}-${row.vehicleType}-${rowIndex}`} className="hover:bg-muted/10">
                          <TableCell className="text-muted-foreground sticky left-0 z-10 bg-background group-hover:bg-muted/10">
                            {/* {row.duration}h */}{/* Redundant due to group header, keep for structure if needed or remove */}
                          </TableCell>
                          <TableCell className="font-medium sticky left-24 z-10 bg-background group-hover:bg-muted/10">
                            {row.vehicleType}
                          </TableCell>
                          
                          {priceTable.serviceTypes?.map(service => {
                            const priceData = row.prices[service.id];
                            return (
                              <TableCell key={service.id} className="text-center">
                                {priceData ? (
                                  <div className="flex flex-col items-center">
                                    <div className={`font-medium ${!priceData.isActive ? 'text-muted-foreground line-through' : ''}`}>
                                      {new Intl.NumberFormat('ja-JP', { 
                                        style: 'currency', 
                                        currency: priceData.currency,
                                        minimumFractionDigits: 0
                                      }).format(priceData.price)}
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const item = filteredItems.find(i => i.id === priceData.itemId); if (item) handleOpenDialog(item); }}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteItem(priceData.itemId)}>
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const item = filteredItems.find(i => i.id === priceData.itemId); if (item) handleToggleItemStatus(item); }}>
                                        {priceData.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { if (selectedCategory) { const newItem: Partial<PricingItem> = { category_id: selectedCategory, service_type_id: service.id, vehicle_type: row.vehicleType, duration_hours: row.duration, price: 0, currency: 'JPY', is_active: true }; handleOpenDialog(newItem); } }}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
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
              >
                <SelectTrigger id="service_type_id">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {allServiceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select
                value={currentItem?.vehicle_type ?? ""}
                onValueChange={(value) => handleInputChange("vehicle_type", value)}
              >
                <SelectTrigger id="vehicle_type">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {getVehicleTypes().map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration_hours">Duration</Label>
              <Select
                value={String(currentItem?.duration_hours ?? 1)}
                onValueChange={(value) => handleInputChange("duration_hours", parseInt(value))}
              >
                <SelectTrigger id="duration_hours">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {getDurationOptions().map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <div className="flex space-x-2">
                <Select
                  value={currentItem?.currency ?? "JPY"}
                  onValueChange={(value) => handleInputChange("currency", value)}
                  disabled // Keep currency locked for now, can be enabled if needed
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JPY">JPY</SelectItem>
                    {/* Add other currencies if supported */}
                    {/* <SelectItem value="USD">USD</SelectItem> */}
                    {/* <SelectItem value="EUR">EUR</SelectItem> */}
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
    </div>
  );
} 