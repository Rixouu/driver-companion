"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit, Trash, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";

// Utility functions (moved to top for availability)
const getVehicleTypes = () => ["Sedan", "Van", "Minibus", "Bus", "Coach"];

const getDurationOptions = () => [
  { value: 1, label: "1 hour" },
  { value: 4, label: "4 hours" },
  { value: 6, label: "6 hours" },
  { value: 8, label: "8 hours" },
  { value: 10, label: "10 hours" },
  { value: 12, label: "12 hours" },
];

export default function PricingItemsTab() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  
  // Function to refresh items
  const refreshItems = useCallback(async (currentCategoryId?: string | null) => {
    setIsLoading(true);
    try {
      // Determine the category ID to use for fetching
      const categoryToFetch = currentCategoryId === undefined ? selectedCategory : currentCategoryId;
      
      if (categoryToFetch) {
        const itemsData = await getPricingItems(categoryToFetch, undefined /* service_type_id */, undefined /* vehicle_type */);
        const serviceTypesData = await getServiceTypes(); // Fetch all service types for name mapping
        setAllServiceTypes(serviceTypesData);

        // Map service_type_id to service_type_name
        const itemsWithServiceNames = itemsData.map(item => ({
          ...item,
          service_type_name: serviceTypesData.find(st => st.id === item.service_type_id)?.name || item.service_type_id
        }));        
        setItems(itemsWithServiceNames);
      } else {
        setItems([]); // Clear items if no category is selected
      }
    } catch (error) {
      console.error("Error refreshing pricing items:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.fetchFailed', { entity: 'pricing items' }), variant: 'destructive' });
      setItems([]); // Clear items on error
    } finally {
      setIsLoading(false);
    }
  }, [getPricingItems, getServiceTypes, selectedCategory, t]);

  // Load categories and initial items
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
        if (categoriesData.length > 0) {
          const initialCategory = categoriesData[0].id;
          setSelectedCategory(initialCategory);
          await refreshItems(initialCategory); 
        } else {
          setItems([]); 
        }
      } catch (error) {
        console.error("Error loading initial pricing data:", error);
        toast({ title: t('common.error.genericTitle'), description: t('common.error.initialLoadFailed', { context: 'pricing setup' }), variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [getPricingCategories, getServiceTypes, refreshItems]);

  // Effect to reload items when selectedCategory changes
  useEffect(() => {
    if (selectedCategory) {
      refreshItems(selectedCategory);
    } else {
      // If no category is selected (e.g., all categories were deleted), clear items
      setItems([]);
    }
  }, [selectedCategory, refreshItems]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleOpenDialog = (item?: PricingItem) => {
    const defaultServiceTypeId = allServiceTypes.length > 0 ? allServiceTypes[0].id : undefined;
    if (item) {
      setCurrentItem({ ...item });
      setIsEditing(true);
    } else {
      // For new item, ensure category_id is set if a category is selected
      setCurrentItem({
        category_id: selectedCategory,
        service_type_id: defaultServiceTypeId,
        vehicle_type: getVehicleTypes()[0] || "", // Assuming getVehicleTypes exists and provides defaults
        duration_hours: 1,
        price: 0,
        currency: 'JPY', // Default currency
        is_active: true,
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
    if (!currentItem) return;

    // Validate that a service_type_id is selected
    if (!currentItem.service_type_id) {
      toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.serviceTypeRequired'), variant: 'destructive' });
      return;
    }
    
    // Remove service_type_name before sending to API, as it's a client-side property
    const { service_type_name, ...itemToSave } = currentItem as PricingItem; 

    // Ensure category_id is present, default to selectedCategory if item is new and doesn't have one
    const payload = {
      ...itemToSave,
      category_id: itemToSave.category_id || selectedCategory || null,
    };

    if (!payload.category_id) {
        toast({ title: t('common.error.validationError'), description: t('pricing.items.errors.categoryRequired'), variant: 'destructive' });
        return;
    }

    try {
      let success = false;
      if (isEditing && currentItem.id) {
        // Ensure 'id' is not in the payload for update, only service function needs it
        const { id, ...updatePayload } = payload as PricingItem; 
        if (id) { // Check if id is defined before calling update
            success = !!(await updatePricingItem(id, updatePayload));
        }
      } else {
        // For create, ensure required fields are present from Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>
        const createPayload = payload as Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>;
        success = !!(await createPricingItem(createPayload));
      }

      if (success) {
        await refreshItems();
        handleCloseDialog();
      } else {
        // Error toast is shown by the service hook
      }
    } catch (error) {
      console.error("Error saving pricing item:", error);
      // Error toast is typically handled by the hook, but a fallback can be here
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
      } else {
        // Error toast is shown by the service hook
      }
    } catch (error) {
      console.error("Error deleting pricing item:", error);
      toast({ title: t('common.error.genericTitle'), description: t('common.error.deleteFailed', { entity: 'pricing item' }), variant: 'destructive' });
    }
  };

  // Placeholder - actual implementation would call API via useQuotationService
  const handleToggleItemStatus = async (item: PricingItem) => {
    if (!item || typeof item.id === 'undefined') return;
    try {
        const success = await updatePricingItem(item.id, { is_active: !item.is_active });
        if (success) {
            await refreshItems();
            toast({ title: t('pricing.items.statusUpdateSuccess') });
        } else {
           // Error toast handled by hook
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
  
  if (isLoading && categories.length === 0) {
    return <div className="p-4 text-center">Loading pricing data...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select
          value={selectedCategory || ""}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={() => handleOpenDialog()} size="sm" disabled={!selectedCategory}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center">Loading pricing items...</div>
      ) : !selectedCategory ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          Please select a category to view pricing items.
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          No pricing items found in this category. Add your first item.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[80px] text-center">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.service_type_name}</TableCell>
                  <TableCell>{item.vehicle_type}</TableCell>
                  <TableCell className="text-center">{item.duration_hours} hour{item.duration_hours !== 1 ? 's' : ''}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('ja-JP', { 
                      style: 'currency', 
                      currency: item.currency,
                      minimumFractionDigits: 0
                    }).format(item.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={item.is_active ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleItemStatus(item)}
                    >
                      {item.is_active ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Pricing Item" : "Add New Pricing Item"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Edit the details of this pricing item"
                : "Create a new pricing item for your services"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select
                value={currentItem?.service_type_id || ""}
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
                value={currentItem?.vehicle_type || ""}
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
                value={String(currentItem?.duration_hours || 1)}
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
                  value={currentItem?.currency || "JPY"}
                  onValueChange={(value) => handleInputChange("currency", value)}
                  disabled
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="price"
                  type="number"
                  placeholder="Price"
                  value={currentItem?.price || 0}
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
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 