"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuotationService } from "@/lib/hooks/useQuotationService";
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
import { ServiceTypeInfo, PricingCategory } from "@/types/quotations";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

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
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedServiceTypesForLink, setSelectedServiceTypesForLink] = useState<Set<string>>(new Set());
  const [categoryToLink, setCategoryToLink] = useState<PricingCategory | null>(null);
  
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
        title: t("pricing.categories.toast.serviceTypesFixedTitle"),
        description: t("pricing.categories.toast.serviceTypesFixedDescription", { count: result.totalUpdated }),
      });
      
      await refreshCategories();
    } catch (error) {
      console.error("Error fixing service types:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("pricing.categories.toast.fixServiceTypesError"),
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
      toast({ title: t("common.error.validationError"), description: t("pricing.categories.toast.nameRequiredError"), variant: "destructive" });
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
  
  const handleServiceTypeToggle = (serviceId: string, isActive: boolean) => {
    if (currentCategory) {
      const currentSelectedIds = currentCategory.service_type_ids || [];
      const newSelectedIds = isActive
        ? [...currentSelectedIds, serviceId]
        : currentSelectedIds.filter(id => id !== serviceId);
      handleInputChange("service_type_ids", newSelectedIds);
    }
  };
  
  const handleOpenLinkDialog = (category: PricingCategory) => {
    setCategoryToLink(category);
    setIsLinkDialogOpen(true);
  };
  
  const handleSaveLinks = async () => {
    if (!categoryToLink) return;

    const newServiceTypes = selectedServiceTypesForLink.map(id => allServiceTypes.find(st => st.id === id));
    const result = await updatePricingCategory(categoryToLink.id, {
      service_type_ids: newServiceTypes.map(st => st?.id)
    });

    if (result) {
      await refreshCategories();
      handleCloseDialog();
    } else {
      // Error toast is handled by the hook, keep dialog open
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading pricing categories...</div>;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("pricing.categories.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("pricing.categories.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fixServiceTypes} variant="outline">Fix Service Types</Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t("common.addNew")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>{t("common.loading")}</p>
        ) : categories.length === 0 ? (
          <p>No categories found. Click 'Add New' to create one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">{t("pricing.categories.table.id")}</TableHead>
                <TableHead>{t("pricing.categories.table.details")}</TableHead>
                <TableHead>{t("pricing.categories.table.services")}</TableHead>
                <TableHead className="w-[100px] text-center">{t("pricing.categories.table.status")}</TableHead>
                <TableHead className="w-[100px] text-center">{t("pricing.categories.table.order")}</TableHead>
                <TableHead className="w-[120px] text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {category.service_type_ids && category.service_type_ids.length > 0 
                      ? category.service_type_ids.map(id => allServiceTypes.find(st => st.id === id)?.name || id).join(', ') 
                      : t("common.notAssigned")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "outline"}>
                      {category.is_active ? t("common.status.active") : t("common.status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={category.is_active ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openStatusConfirm(category.id, !category.is_active)}
                      title={category.is_active ? t("common.deactivate") : t("common.activate")}
                    >
                      {category.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenLinkDialog(category)} title="Link Service Types">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(category)}
                      title={t("common.edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => openDeleteConfirm(category.id)}
                      title={t("common.delete")}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? t("pricing.categories.editDialog.title") : t("pricing.categories.createDialog.title")}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? t("pricing.categories.editDialog.description")
                  : t("pricing.categories.createDialog.description")
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("pricing.categories.fields.name")}</Label>
                <Input
                  id="name"
                  value={currentCategory?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("pricing.categories.placeholders.name")}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">{t("pricing.categories.fields.descriptionOptional")}</Label>
                <Textarea
                  id="description"
                  value={currentCategory?.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder={t("pricing.categories.placeholders.description")}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sort_order">{t("pricing.categories.fields.sortOrder")}</Label>
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
                <Label htmlFor="is_active">{t("pricing.categories.fields.isActive")}</Label>
              </div>
              
              <div className="grid gap-2">
                <Label>{t("pricing.categories.fields.serviceTypes")}</Label>
                <div className="p-2 border rounded-md grid grid-cols-2 gap-2 h-32 overflow-y-auto">
                  {allServiceTypes.map(st => (
                    <div key={st.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`st-${st.id}`}
                        checked={currentCategory?.service_type_ids?.includes(st.id) || false}
                        onCheckedChange={(checked) => handleServiceTypeToggle(st.id, !!checked)}
                      />
                      <label htmlFor={`st-${st.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {st.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveCategory}>
                {isEditing ? t("common.update") : t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("pricing.categories.deleteDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("pricing.categories.deleteDialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {categoryToToggle?.isActive
                  ? t("pricing.categories.activateDialog.title")
                  : t("pricing.categories.deactivateDialog.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {categoryToToggle?.isActive
                  ? t("pricing.categories.activateDialog.description")
                  : t("pricing.categories.deactivateDialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToToggle(null)}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusConfirm}>
                {categoryToToggle?.isActive ? t("common.activate") : t("common.deactivate")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog for linking service types */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("pricing.categories.linkDialog.title", { categoryName: categoryToLink?.name || '' })}</DialogTitle>
              <DialogDescription>
                {t("pricing.categories.linkDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>{t("pricing.categories.linkDialog.available")}</Label>
                <ScrollArea className="h-72 rounded-md border">
                  <div className="p-4">
                    {allServiceTypes.map(st => (
                      <div key={st.id} className="flex items-center space-x-2 mb-1 p-1 hover:bg-muted rounded">
                        <Checkbox
                          id={`link-available-${st.id}`}
                          checked={selectedServiceTypesForLink.has(st.id)}
                          onCheckedChange={(checked) => {
                            const newSelection = new Set(selectedServiceTypesForLink);
                            if (checked) newSelection.add(st.id);
                            else newSelection.delete(st.id);
                            setSelectedServiceTypesForLink(newSelection);
                          }}
                        />
                        <label htmlFor={`link-available-${st.id}`} className="text-sm leading-none">{st.name}</label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>{t("pricing.categories.linkDialog.linked")}</Label>
                <ScrollArea className="h-72 rounded-md border">
                   <div className="p-4">
                    {selectedServiceTypesForLink.size > 0 ? (
                      Array.from(selectedServiceTypesForLink).map(id => {
                        const serviceType = allServiceTypes.find(st => st.id === id);
                        return (
                          <div key={id} className="flex items-center justify-between space-x-2 mb-1 p-1">
                            <span className="text-sm">{serviceType?.name || id}</span>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                    const newSelection = new Set(selectedServiceTypesForLink);
                                    newSelection.delete(id);
                                    setSelectedServiceTypesForLink(newSelection);
                                }}
                                title={t("pricing.categories.linkDialog.unlink")}
                              >
                               <X className="h-4 w-4" />
                             </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">{t("pricing.categories.linkDialog.noSelectedServiceTypes")}</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSaveLinks}>{t("pricing.categories.linkDialog.saveLinks")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
} 