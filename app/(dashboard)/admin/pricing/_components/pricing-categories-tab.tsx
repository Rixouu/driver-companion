"use client";

import { useState, useEffect, useCallback } from "react";
import { PricingCategory } from "@/types/quotations";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { ServiceTypeInfo } from "@/hooks/useQuotationService";
import { toast } from "@/components/ui/use-toast";

export default function PricingCategoriesTab() {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<PricingCategory> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  
  const { getPricingCategories, getServiceTypes, createPricingCategory, updatePricingCategory, deletePricingCategory } = useQuotationService();
  const { t } = useI18n();
  
  // Function to refresh categories
  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoriesData = await getPricingCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error refreshing categories:", error);
      // Optionally set an error state here
    } finally {
      setIsLoading(false);
    }
  }, [getPricingCategories]);

  // Load categories and service types on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const categoriesData = await getPricingCategories();
        setCategories(categoriesData);

        const serviceTypesData = await getServiceTypes();
        setAllServiceTypes(serviceTypesData);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [getPricingCategories, getServiceTypes]);
  
  const handleOpenDialog = (category: PricingCategory | null = null) => {
    if (category) {
      setCurrentCategory({ ...category });
      setIsEditing(true);
    } else {
      setCurrentCategory({
        name: "",
        description: "",
        service_type_ids: [],
        sort_order: categories.length + 1,
        is_active: true
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentCategory(null);
  };
  
  const handleSaveCategory = async () => {
    if (!currentCategory) return;

    // Basic validation (can be enhanced)
    if (!currentCategory.name?.trim()) {
      toast({ title: "Validation Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    let result: PricingCategory | null = null;
    if (isEditing && currentCategory.id) {
      // Update existing category
      const { id, created_at, updated_at, ...updateData } = currentCategory as PricingCategory;
      result = await updatePricingCategory(id, updateData);
    } else {
      // Create new category
      const { id, created_at, updated_at, ...createData } = currentCategory; // currentCategory is Partial here
      result = await createPricingCategory(createData as Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>);
    }

    if (result) {
      await refreshCategories();
      handleCloseDialog();
    } else {
      // Error toast is handled by the hook, keep dialog open
    }
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    const success = await deletePricingCategory(categoryId);
    if (success) {
      await refreshCategories();
    }
  };
  
  const handleToggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    const result = await updatePricingCategory(categoryId, { is_active: isActive });
    if (result) {
      await refreshCategories();
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (currentCategory) {
      setCurrentCategory({
        ...currentCategory,
        [field]: value
      });
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading pricing categories...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">All Categories</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>
      
      {categories.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          No pricing categories found. Create your first category.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-center">Order</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs">{category.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {category.service_type_ids && category.service_type_ids.map((serviceId) => {
                        const serviceType = allServiceTypes.find(st => st.id === serviceId);
                        return (
                          <Badge key={serviceId} variant="outline">
                            {serviceType ? serviceType.name : serviceId}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={category.is_active ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleCategoryStatus(category.id, !category.is_active)}
                    >
                      {category.is_active ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">{category.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
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
              {isEditing ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Edit the details of this pricing category"
                : "Create a new pricing category for your services"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={currentCategory?.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={currentCategory?.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sort_order">Display Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={currentCategory?.sort_order || 0}
                onChange={(e) => handleInputChange("sort_order", parseInt(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={currentCategory?.is_active ?? true}
                onCheckedChange={(checked) => handleInputChange("is_active", checked === true)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <div className="grid gap-2">
              <Label>Service Types</Label>
              <div className="p-2 border rounded-md grid grid-cols-2 gap-2 h-32 overflow-y-auto">
                {allServiceTypes.map((serviceType) => (
                  <div key={serviceType.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${serviceType.id}`}
                      checked={currentCategory?.service_type_ids?.includes(serviceType.id) ?? false}
                      onCheckedChange={(checked) => {
                        const currentSelectedIds = currentCategory?.service_type_ids || [];
                        handleInputChange(
                          "service_type_ids",
                          checked
                            ? [...currentSelectedIds, serviceType.id]
                            : currentSelectedIds.filter(id => id !== serviceType.id)
                        );
                      }}
                    />
                    <Label htmlFor={`service-${serviceType.id}`}>{serviceType.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 