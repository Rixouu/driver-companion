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
// const getVehicleTypes = () => ["Sedan", "Van", "Minibus", "Bus", "Coach"]; // Removed as per requirement

const getDurationOptions = () => [
  { value: 1, label: "1 hour" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" },
  { value: 10, label: "10 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
  { value: 72, label: "72 hours" },
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
  const { t } = useI18n();
  
  const refreshItems = useCallback(async (currentCategoryId?: string | null) => {
    setIsLoading(true);
    try {
      const categoryToFetch = currentCategoryId === undefined ? selectedCategory : currentCategoryId;
      if (categoryToFetch) {
        // Assuming getPricingItems can be called with (categoryId, serviceTypeId (optional))
        // Vehicle type filter removed from API call if it was there
        const [itemsData, serviceTypesData] = await Promise.all([
          getPricingItems(categoryToFetch, undefined /* service_type_id filter if needed, else just categoryId */),
          getServiceTypes() // Still needed for service type names and potentially for columns
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
        if (categoriesData.length > 0 && !selectedCategory) { // Select first category if none is selected yet
          const initialCategory = categoriesData[0].id;
          setSelectedCategory(initialCategory);
        } else if (categoriesData.length === 0) {
          setItems([]); 
        }
        // Fetch all service types once for reference
        const serviceTypesData = await getServiceTypes();
        setAllServiceTypes(serviceTypesData);

      } catch (error) {
        console.error("Error loading initial categories/services:", error);
        toast({ title: t('common.error.genericTitle'), description: t('common.error.initialLoadFailed', { context: 'pricing setup' }), variant: 'destructive' });
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
        duration_hours: 1,
        price: 0,
        currency: 'JPY',
        is_active: true,
        vehicle_type: "N/A", // Default for new items
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
          vehicle_type: "N/A",
        };
        success = !!(await createPricingItem(createPayload));
      }

      if (success) {
        await refreshItems();
        handleCloseDialog();
      } 
    } catch (error) {
      console.error("Error saving pricing item:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.saveFailed', { entity: 'pricing item' }), variant: 'destructive' });
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
      toast({ title: t('common.error.genericTitle'), description: t('common.error.deleteFailed', { entity: 'pricing item' }), variant: 'destructive' });
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
      const updateData = { is_active: !itemToToggle.is_active };
      const success = await updatePricingItem(itemToToggle.id, updateData);
      if (success) {
        await refreshItems();
        toast({ title: t('pricing.items.statusUpdateSuccess') });
      }
    } catch (error) {
      console.error("Error toggling item status:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.updateFailed', { entity: 'item status' }), variant: 'destructive' });
    } finally {
      setIsStatusConfirmOpen(false);
      setItemToToggle(null);
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
      if (selectedDuration !== 'all' && item.duration_hours !== Number(selectedDuration)) return false;
      // Vehicle type filter removed
      return true;
    });
  }, [items, selectedDuration]);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-muted-foreground" /> 
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Adjusted to 2 cols */} 
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

            {/* Vehicle Select Removed */}
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
      
      {isLoading && items.length === 0 && selectedCategory ? (
        <div className="p-4 text-center">Loading pricing items for {currentCategoryName}...</div>
      ) : !selectedCategory ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          Please select a pricing category to view items.
        </div>
      ) : filteredItems.length === 0 && activeServiceTypesForTable.length > 0 ? ( // Show message if filters result in no items but columns exist
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {items.length === 0 
            ? `No pricing items found in ${currentCategoryName}. Add your first item.`
            : `No items in ${currentCategoryName} match your current filters. Try adjusting filter settings.`
          }
        </div>
      ) : priceTable.serviceTypes.length === 0 && selectedCategory && !isLoading ? ( // Message if category selected but it has no service types linked
         <div className="p-8 text-center text-muted-foreground border rounded-md">
            The selected category '{currentCategoryName}' has no service types linked to it. Please edit the category to add service types.
        </div>
      ): (
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="w-full overflow-auto">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-32 bg-muted/80 sticky left-0 z-20">Duration</TableHead> {/* Increased width for duration header */} 
                    {/* Vehicle Type Header Removed */}
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
                          colSpan={1 + (priceTable.serviceTypes?.length ?? 0)} // Adjusted colSpan
                          className="py-1.5 font-medium sticky left-0 z-10 bg-muted/20"
                        >
                          {group.duration === 1 
                            ? "Hourly Rate" 
                            : `${group.duration} hours`
                          }
                        </TableCell>
                      </TableRow>
                      
                      {group.rows.map((row, rowIndex) => (
                        <TableRow key={`${row.duration}-${rowIndex}`} className="hover:bg-muted/10 group">
                          <TableCell className="text-muted-foreground sticky left-0 z-10 bg-background group-hover:bg-muted/10">
                            {/* Duration value is now in the group header, cell can be empty or for actions later */}
                          </TableCell>
                          {/* Vehicle Type Cell Removed */}
                          
                          {priceTable.serviceTypes?.map(service => {
                            const priceData = row.prices[service.id];
                            const itemForDialog = priceData ? filteredItems.find(i => i.id === priceData.itemId) : undefined;
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
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { if (itemForDialog) handleOpenDialog(itemForDialog); }}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => openDeleteConfirm(priceData.itemId)}>
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { if (itemForDialog) openStatusConfirm(itemForDialog); }}>
                                        {priceData.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { if (selectedCategory) { const newItem: Partial<PricingItem> = { category_id: selectedCategory, service_type_id: service.id, duration_hours: row.duration, price: 0, currency: 'JPY', is_active: true }; handleOpenDialog(newItem); } }}>
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
                disabled={isEditing} // Disable if editing, as service type defines the column
              >
                <SelectTrigger id="service_type_id">
                  <SelectValue placeholder="Select service type" />
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
                  {getDurationOptions().map((option) => (
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
                  value={currentItem?.currency ?? "JPY"}
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