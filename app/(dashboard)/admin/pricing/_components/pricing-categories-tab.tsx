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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<{id: string, isActive: boolean} | null>(null);
  
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

  // Function to fix service types display
  const fixServiceTypes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/pricing/categories/fix-service-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fix service types');
      }
      
      toast({
        title: "Service Types Fixed",
        description: `Successfully updated ${result.totalUpdated} categories.`,
      });
      
      await refreshCategories();
    } catch (error) {
      console.error("Error fixing service types:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fix service types',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
  
  const openDeleteConfirm = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    const success = await deletePricingCategory(categoryToDelete);
    if (success) {
      await refreshCategories();
    }
    
    setCategoryToDelete(null);
    setDeleteConfirmOpen(false);
  };
  
  const openStatusConfirm = (categoryId: string, isActive: boolean) => {
    setCategoryToToggle({ id: categoryId, isActive });
    setStatusConfirmOpen(true);
  };
  
  const handleStatusConfirm = async () => {
    if (!categoryToToggle) return;
    
    const result = await updatePricingCategory(categoryToToggle.id, { is_active: categoryToToggle.isActive });
    if (result) {
      await refreshCategories();
    }
    
    setCategoryToToggle(null);
    setStatusConfirmOpen(false);
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
        <div className="flex space-x-2">
          <Button onClick={fixServiceTypes} size="sm" variant="outline">
            Fix Service Types
          </Button>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
        </div>
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
                      onClick={() => openStatusConfirm(category.id, !category.is_active)}
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
                        onClick={() => openDeleteConfirm(category.id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pricing.categories.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pricing.categories.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {categoryToToggle?.isActive
                ? t('pricing.categories.activateConfirmTitle')
                : t('pricing.categories.deactivateConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToToggle?.isActive
                ? t('pricing.categories.activateConfirmDescription')
                : t('pricing.categories.deactivateConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToToggle(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusConfirm}>
              {categoryToToggle?.isActive ? t('common.activate') : t('common.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 