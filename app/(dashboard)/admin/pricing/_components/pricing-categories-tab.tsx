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
import { Plus, Edit, Trash, Check, X, Car, Link as LinkIcon, GripVertical, MoreHorizontal, Search as SearchIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { ServiceTypeInfo, PricingCategory } from "@/types/quotations";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell, SortableMobileCard } from './pricing-responsive-table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import type { Vehicle } from "@/types/vehicles";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use the base PricingCategory type - vehicles are managed through junction table
type CategoryWithVehicles = PricingCategory;



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
  const [isMobileView, setIsMobileView] = useState(false);
  
  const { getPricingCategories, getServiceTypes, createPricingCategory, updatePricingCategory, deletePricingCategory, addVehiclesToCategory, removeVehiclesFromCategory, replaceServiceTypesOfCategory } = useQuotationService();
  const { t } = useI18n();
  
  // Initialize Supabase client
  const supabase = createClientComponentClient();
  
  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);
        
        // Update the sort_order for all affected categories
        try {
          const updates = newCategories.map((cat, index) => ({
            id: cat.id,
            updates: { sort_order: index + 1 }
          }));
          
          // Update each category's sort order
          for (const update of updates) {
            await updatePricingCategory(update.id, update.updates);
          }
          
          toast({
            title: t("pricing.categories.toast.orderUpdated"),
            description: t("pricing.categories.toast.orderUpdatedDescription"),
          });
        } catch (error) {
          console.error("Error updating category order:", error);
          toast({
            title: t("common.error"),
            description: t("pricing.categories.toast.orderUpdateError"),
            variant: 'destructive',
          });
          // Revert to original order
          await refreshCategories();
        }
      }
    }
  };

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

  // Check mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      // Update existing category - only send the fields that exist
      const updateData = {
        name: currentCategory.name,
        description: currentCategory.description,
        sort_order: currentCategory.sort_order,
        is_active: currentCategory.is_active,
        service_type_ids: currentCategory.service_type_ids
      };
      result = await updatePricingCategory(currentCategory.id, updateData);
    } else {
      // Create new category
      const createData = {
        name: currentCategory.name!,
        description: currentCategory.description,
        sort_order: currentCategory.sort_order || 0,
        is_active: currentCategory.is_active ?? true,
        service_type_ids: currentCategory.service_type_ids || []
      };
      result = await createPricingCategory(createData);
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
    // Load currently linked vehicles for this category from junction table
    try {
      const { data: linkedVehicles } = await supabase
        .from('pricing_category_vehicles')
        .select('vehicle_id')
        .eq('category_id', category.id);
      
      if (linkedVehicles) {
        const linkedIds = linkedVehicles.map(lv => lv.vehicle_id);
        setSelectedVehicleIds(new Set(linkedIds));
      } else {
        setSelectedVehicleIds(new Set());
      }
    } catch (err) {
      console.error('Error loading linked vehicles:', err);
      setSelectedVehicleIds(new Set());
    }
    setIsVehicleDialogOpen(true);
  };
  
  const handleSaveVehicles = async () => {
    if (!categoryForVehicles) return;
    
    try {
      // Get current linked vehicles from junction table
      const { data: currentLinkedVehicles } = await supabase
        .from('pricing_category_vehicles')
        .select('vehicle_id')
        .eq('category_id', categoryForVehicles.id);
      
      const currentIds = new Set(currentLinkedVehicles?.map(lv => lv.vehicle_id) || []);
      const newIds = selectedVehicleIds;
      
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      
      newIds.forEach(id => { if (!currentIds.has(id)) toAdd.push(id); });
      currentIds.forEach(id => { if (!newIds.has(id)) toRemove.push(id); });
      
      // Add new vehicles
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('pricing_category_vehicles')
          .insert(toAdd.map(vehicleId => ({
            category_id: categoryForVehicles.id,
            vehicle_id: vehicleId
          })));
        
        if (addError) throw addError;
      }
      
      // Remove vehicles
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('pricing_category_vehicles')
          .delete()
          .eq('category_id', categoryForVehicles.id)
          .in('vehicle_id', toRemove);
        
        if (removeError) throw removeError;
      }
      
      toast({ title: t('pricing.categories.toast.vehiclesUpdated') });
      await refreshCategories();
    } catch (err) {
      console.error('Error saving vehicles:', err);
      toast({ title: t('common.error'), description: t('pricing.categories.toast.vehiclesUpdateError'), variant: 'destructive' });
    } finally {
      setIsVehicleDialogOpen(false);
    }
  };
  
  // Sortable Table Row Component
  function SortableTableRow({ category }: { category: CategoryWithVehicles }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: category.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <TableRow ref={setNodeRef} style={style} className={cn(
        "hover:bg-muted/30 transition-colors",
        isDragging && "bg-muted/50"
      )}>
        <TableCell className="w-12">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted/50 rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="font-semibold text-foreground">{category.name}</div>
            <div className="text-sm text-muted-foreground">{category.description}</div>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleOpenLinkDialog(category)} 
            className="h-8 px-3 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span className="font-medium">{category.service_type_ids?.length || 0}</span>
            <span className="text-xs text-muted-foreground ml-1">services</span>
          </Button>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium px-2 py-1",
              getStatusBadgeClasses(category.is_active ? 'active' : 'inactive')
            )}
          >
            {category.is_active ? t('common.status.active') : t('common.status.inactive')}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-sm font-medium">
            {category.sort_order}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors"
              title={t('pricing.categories.actions.manageVehicles')}
              onClick={() => handleOpenVehicleDialog(category)}
            >
              <Car className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 dark:hover:text-green-400 transition-colors"
              title={t('common.edit')}
              onClick={() => handleOpenDialog(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => openDeleteConfirm(category.id)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading pricing categories...</div>;
  }
  
  return (
    <>
      <Card>
        <PricingTabHeader
          title={t("pricing.categories.title")}
          description="Manage your pricing categories and their associated services and vehicles."
          icon={<Plus className="h-5 w-5" />}
          badges={
            <>
              {!isLoading && categories.length > 0 && (
                <StatusBadge type="info">⚡ {categories.length} categories loaded</StatusBadge>
              )}
            </>
          }
          actions={
            <Button onClick={() => handleOpenDialog()} variant="default">
              <Plus className="mr-2 h-4 w-4" /> {t("pricing.categories.buttons.addCategory")}
            </Button>
          }
        />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Loading Pricing Categories</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your categories...</p>
                </div>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Categories Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get started by creating your first pricing category. This will help you organize your pricing structure.
                  </p>
                </div>
                <Button onClick={() => handleOpenDialog()} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Category
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {isMobileView ? (
                  // Mobile Cards View
                  <div className="space-y-4">
                    <SortableContext
                      items={categories.map(cat => cat.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {categories.map((category) => (
                        <SortableMobileCard
                          key={category.id}
                          category={category}
                          onEdit={handleOpenDialog}
                          onManageVehicles={handleOpenVehicleDialog}
                          onDelete={openDeleteConfirm}
                          onStatusToggle={openStatusConfirm}
                        />
                      ))}
                    </SortableContext>
                  </div>
                ) : (
                  // Desktop Table View
                  <PricingResponsiveTable>
                    <PricingTableHeader>
                      <PricingTableHead className="w-12"> </PricingTableHead>
                      <PricingTableHead>{t('common.details')}</PricingTableHead>
                      <PricingTableHead className="text-center">{t('pricing.categories.table.services')}</PricingTableHead>
                      <PricingTableHead className="text-center">{t('common.status.default')}</PricingTableHead>
                      <PricingTableHead className="text-center">{t('common.order')}</PricingTableHead>
                      <PricingTableHead className="text-center">{t('common.actions.default')}</PricingTableHead>
                    </PricingTableHeader>
                    <TableBody>
                      <SortableContext
                        items={categories.map(cat => cat.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {categories.map((category) => (
                          <SortableTableRow key={category.id} category={category} />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </PricingResponsiveTable>
                )}
              </DndContext>
            </div>
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
              
              <div className="space-y-6 py-4">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("pricing.categories.sections.basicInfo")}
                    </h3>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        {t("pricing.categories.fields.name")} *
                      </Label>
                      <Input
                        id="name"
                        value={currentCategory?.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder={t("pricing.categories.placeholders.name")}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        {t("pricing.categories.fields.descriptionOptional")}
                      </Label>
                      <Textarea
                        id="description"
                        value={currentCategory?.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder={t("pricing.categories.placeholders.description")}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("pricing.categories.sections.settings")}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sort_order" className="text-sm font-medium">
                        {t("pricing.categories.fields.sortOrder")}
                      </Label>
                      <Input
                        id="sort_order"
                        type="number"
                        value={currentCategory?.sort_order || 0}
                        onChange={(e) => handleInputChange("sort_order", parseInt(e.target.value))}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3 pt-6">
                      <Switch
                        id="is_active"
                        checked={currentCategory?.is_active ?? true}
                        onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                      />
                      <Label htmlFor="is_active" className="text-sm font-medium">
                        {t("pricing.categories.fields.isActive")}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Service Types Section */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("pricing.categories.sections.serviceTypes")}
                    </h3>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                      {allServiceTypes.map(st => (
                        <div key={st.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={`st-${st.id}`}
                            checked={currentCategory?.service_type_ids?.includes(st.id) || false}
                            onCheckedChange={(checked) => handleServiceTypeToggle(st.id, !!checked)}
                          />
                          <label 
                            htmlFor={`st-${st.id}`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {st.name}
                          </label>
                        </div>
                      ))}
                    </div>
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
            <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] max-w-[95vw] xl:max-w-6xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {t('pricing.categories.vehicleDialog.title', { categoryName: categoryForVehicles?.name || '' })}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {t('pricing.categories.vehicleDialog.description')}
                </DialogDescription>
              </DialogHeader>
              
              {/* Search and Filters Section - Above both columns */}
              <div className="space-y-4 pb-6 border-b">
                {/* Search Bar */}
                <div className="relative w-full max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicles by name, brand, model, or plate..."
                    className="pl-10 h-9"
                    onChange={(e) => {
                      // Add search functionality here if needed
                    }}
                  />
                </div>
                
                {/* Filters Row - Responsive */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Brand Filter */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{t('pricing.categories.vehicleDialog.filters.brand')}</span>
                    <div className="flex gap-1 flex-wrap">
                      <Badge 
                        variant="default" 
                        className="cursor-pointer text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white border-0"
                      >
                        {t('pricing.categories.vehicleDialog.filters.allBrands')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        Mercedes
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        Toyota
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Year Filter */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm text-muted-nowrap">{t('pricing.categories.vehicleDialog.filters.year')}</span>
                    <div className="flex gap-1 flex-wrap">
                      <Badge 
                        variant="default" 
                        className="cursor-pointer text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white border-0"
                      >
                        {t('pricing.categories.vehicleDialog.filters.allYears')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        2024
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        2023
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                      >
                        2021
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Columns - Perfectly Aligned */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-[50vh] lg:h-[60vh]">
                {/* Available Vehicles Panel */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{t('pricing.categories.vehicleDialog.available')}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allIds = allVehicles.map(v => v.id);
                        setSelectedVehicleIds(new Set(allIds));
                      }}
                      className="text-xs h-7 px-2"
                    >
                      {t('pricing.categories.vehicleDialog.selectAll')}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[40vh] lg:h-[45vh] border rounded-lg">
                    <div className="p-3 space-y-2">
                      {allVehicles.map(v => {
                        const checked = selectedVehicleIds.has(v.id);
                        return (
                          <div 
                            key={v.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                              checked 
                                ? "border-primary bg-primary/5 hover:bg-primary/10" 
                                : "hover:border-primary/50 hover:bg-muted/30"
                            )}
                            onClick={() => {
                              setSelectedVehicleIds(prev => {
                                const set = new Set(prev);
                                if (checked) set.delete(v.id); else set.add(v.id);
                                return set;
                              });
                            }}
                          >
                            <Checkbox 
                              checked={checked} 
                              onCheckedChange={(val) => {
                                setSelectedVehicleIds(prev => {
                                  const set = new Set(prev);
                                  if (val) set.add(v.id); else set.delete(v.id);
                                  return set;
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm truncate">{v.name || 'Unnamed Vehicle'}</span>
                                {v.status && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      getStatusBadgeClasses(v.status === 'active' ? 'active' : 'inactive')
                                    )}
                                  >
                                    {v.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-primary">Brand:</span> 
                                  <span className="truncate">{v.brand || v.make || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-primary">Model:</span> 
                                  <span className="truncate">{v.model || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-primary">Year:</span> 
                                  <span className="truncate">{v.year || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-primary">Plate:</span> 
                                  <span className="truncate">{v.plate_number || v.license_plate || 'N/A'}</span>
                                </div>
                              </div>
                              {v.mileage && (
                                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <span className="font-medium text-primary">Mileage:</span> 
                                  <span>{v.mileage.toLocaleString()} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Selected Vehicles Panel */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      {t('pricing.categories.vehicleDialog.selected')}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({selectedVehicleIds.size} selected)
                      </span>
                    </Label>
                    {selectedVehicleIds.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVehicleIds(new Set())}
                        className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                      >
                        {t('pricing.categories.vehicleDialog.clearAll')}
                      </Button>
                    )}
                  </div>
                  

                  
                  <ScrollArea className="h-[40vh] lg:h-[45vh] border rounded-lg">
                    <div className="p-3 space-y-2">
                      {[...selectedVehicleIds].map(id => {
                        const v = allVehicles.find(av => av.id === id);
                        if (!v) return null;
                        return (
                          <div key={id} className="p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-sm">{v.name || 'Unnamed Vehicle'}</span>
                                  {v.status && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        getStatusBadgeClasses(v.status === 'active' ? 'active' : 'inactive')
                                      )}
                                    >
                                      {v.status}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">Brand:</span> 
                                    <span className="truncate">{v.brand || v.make || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">Model:</span> 
                                    <span className="truncate">{v.model || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">Year:</span> 
                                    <span className="truncate">{v.year || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">Plate:</span> 
                                    <span className="truncate">{v.plate_number || v.license_plate || 'N/A'}</span>
                                  </div>
                                </div>
                                {v.mileage && (
                                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <span className="font-medium text-primary">Mileage:</span> 
                                    <span>{v.mileage.toLocaleString()} km</span>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                  setSelectedVehicleIds(prev => {
                                    const set = new Set(prev);
                                    set.delete(id);
                                    return set;
                                  });
                                }}
                                title="Remove vehicle"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {selectedVehicleIds.size === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Car className="h-16 w-16 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium mb-1">{t('pricing.categories.vehicleDialog.noVehiclesSelected')}</p>
                          <p className="text-xs">{t('pricing.categories.vehicleDialog.selectFromLeft')}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <DialogFooter className="border-t pt-4 px-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    <span>{t('pricing.categories.vehicleDialog.totalVehicles', { count: selectedVehicleIds.size })}</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsVehicleDialogOpen(false)}
                      className="flex-1 sm:flex-none min-h-10"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      onClick={handleSaveVehicles} 
                      disabled={selectedVehicleIds.size === 0}
                      className="flex-1 sm:flex-none min-h-10"
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </>
  );
} 