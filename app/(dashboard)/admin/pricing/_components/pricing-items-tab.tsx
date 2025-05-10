"use client";

import { useState, useEffect } from "react";
import { PricingItem, PricingCategory } from "@/types/quotations";
import { useQuotationService } from "@/hooks/useQuotationService";
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

export default function PricingItemsTab() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PricingItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { getPricingCategories, getPricingItems } = useQuotationService();
  const { t } = useI18n();
  
  // Load categories on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const categoriesData = await getPricingCategories();
        setCategories(categoriesData);
        
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (error) {
        console.error("Error loading pricing categories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Load items when category changes
  useEffect(() => {
    async function loadItems() {
      if (!selectedCategory) return;
      
      setIsLoading(true);
      try {
        // Find the selected category object
        const categoryObj = categories.find(c => c.id === selectedCategory);
        if (!categoryObj) {
          setItems([]);
          return;
        }
        
        // Load items based on the service types in the category, not by category_id
        // This ensures that we show all items that match the service types for this category
        const serviceTypesToMatch = categoryObj.service_types || [];
        
        if (serviceTypesToMatch.length === 0) {
          // If no service types, just load by category ID (fallback)
          const data = await getPricingItems(selectedCategory);
          setItems(data);
        } else {
          // For categories like "Airport Transfers" or "Charter Services",
          // get items that match ANY of the service types listed
          let allItems: PricingItem[] = [];
          
          // Fetch items for each service type and combine results
          for (const serviceType of serviceTypesToMatch) {
            const serviceItems = await getPricingItems(undefined, serviceType);
            allItems = [...allItems, ...serviceItems];
          }
          
          // Remove duplicates by ID
          const uniqueItems = allItems.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
          );
          
          setItems(uniqueItems);
        }
      } catch (error) {
        console.error("Error loading pricing items:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadItems();
  }, [selectedCategory, categories]);
  
  const getServiceTypes = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return category?.service_types || [];
  };
  
  const getVehicleTypes = () => {
    return [
      "Mercedes Benz V Class - Black Suite",
      "Toyota Alphard Executive Lounge",
      "Mercedes Benz V class - Extra Long",
      "Toyota Alphard Z class",
      "Toyota Alphard S class",
      "Toyota Hiace GL",
    ];
  };
  
  const getDurationOptions = () => {
    return [
      { value: 1, label: "1 hour" },
      { value: 4, label: "4 hours" },
      { value: 6, label: "6 hours" },
      { value: 8, label: "8 hours" },
      { value: 10, label: "10 hours" },
      { value: 12, label: "12 hours" },
    ];
  };
  
  const handleOpenDialog = (item: PricingItem | null = null) => {
    if (item) {
      setCurrentItem({ ...item });
      setIsEditing(true);
    } else {
      setCurrentItem({
        category_id: selectedCategory,
        service_type: getServiceTypes()[0] || "",
        vehicle_type: getVehicleTypes()[0] || "",
        duration_hours: 1,
        price: 0,
        currency: "JPY",
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
    // Save item logic would go here
    console.log("Saving item:", currentItem);
    
    // Placeholder - in real implementation, this would call to API
    if (isEditing && currentItem?.id) {
      // Update existing item
      const updatedItems = items.map(item => 
        item.id === currentItem.id ? { ...item, ...currentItem } : item
      );
      setItems(updatedItems);
    } else if (currentItem) {
      // Create new item
      const newItem = {
        ...currentItem,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as PricingItem;
      
      setItems([...items, newItem]);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteItem = (itemId: string) => {
    // Delete item logic would go here
    console.log("Deleting item:", itemId);
    
    // Placeholder - filter out the deleted item
    setItems(items.filter(item => item.id !== itemId));
  };
  
  const handleToggleItemStatus = (itemId: string, isActive: boolean) => {
    // Toggle item status logic would go here
    console.log("Toggling item status:", itemId, isActive);
    
    // Placeholder - update the item status
    setItems(items.map(item => 
      item.id === itemId ? { ...item, is_active: isActive } : item
    ));
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
                  <TableCell>{item.service_type}</TableCell>
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
                      onClick={() => handleToggleItemStatus(item.id, !item.is_active)}
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
                value={currentItem?.service_type || ""}
                onValueChange={(value) => handleInputChange("service_type", value)}
              >
                <SelectTrigger id="service_type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {getServiceTypes().map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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