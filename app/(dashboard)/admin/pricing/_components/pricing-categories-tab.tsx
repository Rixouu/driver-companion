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
import { Plus, Edit, Trash, Check, X, Car, Link as LinkIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { ServiceTypeInfo, PricingCategory } from "@/types/quotations";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import type { Vehicle } from "@/types/vehicles";

// Extend PricingCategory to include vehicle_ids coming from the new junction table
type CategoryWithVehicles = PricingCategory & { vehicle_ids?: string[] };

export default function PricingCategoriesTab() {
  const [categories, setCategories] = useState<CategoryWithVehicles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<CategoryWithVehicles> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<{id: string, isActive: boolean} | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedServiceTypesForLink, setSelectedServiceTypesForLink] = useState<Set<string>>(new Set());
  const [categoryToLink, setCategoryToLink] = useState<CategoryWithVehicles | null>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [categoryForVehicles, setCategoryForVehicles] = useState<CategoryWithVehicles | null>(null);
  
  const { getPricingCategories, getServiceTypes, createPricingCategory, updatePricingCategory, deletePricingCategory, addVehiclesToCategory, removeVehiclesFromCategory, replaceServiceTypesOfCategory } = useQuotationService();
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
  
  const handleOpenDialog = (category: CategoryWithVehicles | null = null) => {
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

    let result: CategoryWithVehicles | null = null;
    if (isEditing && currentCategory.id) {
      // Update existing category
      const { id, created_at, updated_at, ...updateData } = currentCategory as CategoryWithVehicles;
      result = await updatePricingCategory(id, updateData);
    } else {
      // Create new category
      const { id, created_at, updated_at, ...createData } = currentCategory; // currentCategory is Partial here
      result = await createPricingCategory(createData as Omit<CategoryWithVehicles, 'id' | 'created_at' | 'updated_at'>);
    }

    if (result) {
      // sync service types via junction table
      await replaceServiceTypesOfCategory(result.id, currentCategory.service_type_ids || []);
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
  
  const handleOpenLinkDialog = (category: CategoryWithVehicles) => {
    setCategoryToLink(category);
    setSelectedServiceTypesForLink(new Set(category.service_type_ids || []));
    setIsLinkDialogOpen(true);
  };
  
  const handleSaveLinks = async () => {
    if (!categoryToLink) return;

    const result = await updatePricingCategory(categoryToLink.id, {
      service_type_ids: Array.from(selectedServiceTypesForLink),
    });

    if (result) {
      toast({
        title: t("notifications.updateSuccess"),
        description: t("pricing.categories.updateSuccessDescription"),
      });
      setIsLinkDialogOpen(false);
      setCategoryToLink(null);
      await refreshCategories();
    } else {
      toast({
        title: t("notifications.error"),
        description: t("pricing.categories.updateError"),
        variant: "destructive",
      });
    }
  };
  
  const handleOpenVehicleDialog = async (category: CategoryWithVehicles) => {
    setCategoryForVehicles(category);
    // load vehicles if not loaded
    if (allVehicles.length === 0) {
      try {
        // Fetch vehicles in pages of 100 (API limit)
        const pageSize = 100;
        let page = 1;
        let hasMore = true;
        const collected: Vehicle[] = [];

        while (hasMore) {
          const res = await fetch(`/api/vehicles?page=${page}&pageSize=${pageSize}&sortBy=name&sortOrder=asc`);
          if (!res.ok) throw new Error(`Failed to load vehicles (page ${page})`);

          const data = await res.json();
          const raw: any[] = data.vehicles || data.data || [];

          const normalised: Vehicle[] = raw.map(v => ({
            ...v,
            plate_number: v.plate_number ?? v.license_plate,
            brand: v.brand ?? v.make,
          }));

          collected.push(...normalised);

          // If we received fewer than pageSize, we have all data
          hasMore = raw.length === pageSize;
          page += 1;
        }

        setAllVehicles(collected);
      } catch (err) {
        console.error('Error loading vehicles', err);
      }
    }
    setSelectedVehicleIds(new Set(category.vehicle_ids || []));
    setIsVehicleDialogOpen(true);
  };
  
  const handleSaveVehicles = async () => {
    if (!categoryForVehicles) return;
    const originalIds = new Set(categoryForVehicles.vehicle_ids || []);
    const newIds = selectedVehicleIds;
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    newIds.forEach(id => { if (!originalIds.has(id)) toAdd.push(id); });
    originalIds.forEach(id => { if (!newIds.has(id)) toRemove.push(id); });
    try {
      if (toAdd.length) await addVehiclesToCategory(categoryForVehicles.id, toAdd);
      if (toRemove.length) await removeVehiclesFromCategory(categoryForVehicles.id, toRemove);
      toast({ title: t('pricing.categories.toast.vehiclesUpdated') });
      await refreshCategories();
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('pricing.categories.toast.vehiclesUpdateError'), variant: 'destructive' });
    } finally {
      setIsVehicleDialogOpen(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-4 text-center">Loading pricing categories...</div>;
  }
  
  return (
    <>
      {/* Page-level header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t("pricing.categories.title")}</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> {t("pricing.categories.buttons.addCategory")}
        </Button>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <p>{t("common.loading")}</p>
          ) : categories.length === 0 ? (
            <p>No categories found. Click 'Add New' to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.details')}</TableHead>
                  <TableHead>{t('pricing.categories.table.services')}</TableHead>
                  <TableHead>{t('common.status.type')}</TableHead>
                  <TableHead>{t('common.order')}</TableHead>
                  <TableHead>{t('common.actions.default')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" onClick={() => handleOpenLinkDialog(category)} className="px-2 py-1 h-auto">
                        {category.service_type_ids?.length || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusBadgeClasses(category.is_active ? 'active' : 'inactive'))}
                      >
                        {category.is_active ? t('common.status.active') : t('common.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Link Services"
                          onClick={() => handleOpenLinkDialog(category)}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={t("common.edit")}
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={category.is_active ? t("common.deactivate") : t("common.activate")}
                          onClick={() => openStatusConfirm(category.id, !category.is_active)}
                        >
                          {category.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title={t("common.delete")}
                          onClick={() => openDeleteConfirm(category.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={t('pricing.categories.actions.manageVehicles')}
                          onClick={() => handleOpenVehicleDialog(category)}
                        >
                          <Car className="h-4 w-4" />
                        </Button>
                      </div>
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

          {/* Manage Vehicles Dialog */}
          <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t('pricing.categories.vehicleDialog.title', { categoryName: categoryForVehicles?.name || '' })}</DialogTitle>
                <DialogDescription>{t('pricing.categories.vehicleDialog.description')}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh]">
                <div>
                  <Label>{t('pricing.categories.vehicleDialog.available')}</Label>
                  <ScrollArea className="h-[45vh] border rounded-md p-2">
                    {allVehicles.map(v => {
                      const checked = selectedVehicleIds.has(v.id);
                      return (
                        <div key={v.id} className="flex items-center gap-2 py-1">
                          <Checkbox checked={checked} onCheckedChange={(val) => {
                            setSelectedVehicleIds(prev => {
                              const set = new Set(prev);
                              if (val) set.add(v.id); else set.delete(v.id);
                              return set;
                            });
                          }} />
                          <span className="text-sm">{v.name} ({v.plate_number})</span>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>
                <div>
                  <Label>{t('pricing.categories.vehicleDialog.selected')}</Label>
                  <ScrollArea className="h-[45vh] border rounded-md p-2">
                    {[...selectedVehicleIds].map(id => {
                      const v = allVehicles.find(av => av.id === id);
                      if (!v) return null;
                      return (
                        <Badge key={id} className="mr-2 mb-2 inline-flex items-center gap-1">
                          {v.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => {
                            setSelectedVehicleIds(prev => {
                              const set = new Set(prev);
                              set.delete(id);
                              return set;
                            });
                          }} />
                        </Badge>
                      );
                    })}
                    {selectedVehicleIds.size === 0 && <p className="text-sm text-muted-foreground p-2">{t('pricing.categories.vehicleDialog.noVehicles')}</p>}
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleSaveVehicles}>{t('common.save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </>
  );
} 