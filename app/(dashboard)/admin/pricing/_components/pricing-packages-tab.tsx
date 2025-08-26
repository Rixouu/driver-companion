"use client";

import { useState, useEffect } from "react";
import { PricingPackage, PackageType, PackageItemType, PricingPackageItem, PricingCategory, PricingItem } from "@/types/quotations";
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell } from './pricing-responsive-table';
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash, 
  Check, 
  X, 
  Package, 
  DollarSign, 
  CalendarRange, 
  ChevronDown, 
  ChevronUp,
  ShoppingCart,
  Tag,
  Clock,
  Globe,
  Save,
  ArrowLeft
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/context";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface ServiceTypeInfo {
  id: string;
  name: string;
}

interface EnrichedPricingItem extends PricingItem {
  service_type_name?: string;
}

interface PackageServiceItem {
  id?: string;
  pricing_item_id: string;
  service_type_id: string;
  service_type_name: string;
  vehicle_type: string;
  duration_hours: number;
  price: number;
  quantity: number;
  is_optional: boolean;
}

export default function PricingPackagesTab() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<Partial<PricingPackage> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [allItems, setAllItems] = useState<EnrichedPricingItem[]>([]);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: PackageServiceItem}>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeVehicleType, setActiveVehicleType] = useState<string>("all");
  const [activeServiceType, setActiveServiceType] = useState<string>("all");
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([]);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("JPY");
  
  const { 
    getPricingPackages, 
    getPricingCategories, 
    getPricingItems, 
    getServiceTypes: getAllServiceTypesFromHook,
    createPricingPackage, 
    updatePricingPackage, 
    deletePricingPackage 
  } = useQuotationService();
  
  const { t } = useI18n();
  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPricingPackages(false, true);
        setPackages(data);
        
        const categoriesData = await getPricingCategories();
        setCategories(categoriesData);
        
        const itemsData = await getPricingItems() as EnrichedPricingItem[];
        setAllItems(itemsData);

        const serviceTypesData = await getAllServiceTypesFromHook();
        setAllServiceTypes(serviceTypesData);
        
        const uniqueVehicleTypes = Array.from(
          new Set(itemsData.map(item => item.vehicle_type))
        );
        setAvailableVehicleTypes(uniqueVehicleTypes);
        
      } catch (error) {
        console.error("Error loading packages:", error);
        toast({
          title: "Error",
          description: "Failed to load pricing packages",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);
  
  const getPackageTypes = (): { value: PackageType; label: string }[] => {
    return [
      { value: "bundle", label: "Bundle" },
      { value: "tour", label: "Tour Package" },
      { value: "special_event", label: "Special Event" },
      { value: "seasonal", label: "Seasonal Offer" },
    ];
  };
  
  const getCurrencies = () => {
    return [
      { value: "JPY", label: "JPY (¥)" },
    ];
  };
  
  const getServiceTypeIdsForCategory = (categoryId: string): string[] => {
    if (categoryId === "all") {
      return Array.from(new Set(allItems.map(item => item.service_type_id).filter(Boolean))) as string[];
    }
    const category = categories.find(cat => cat.id === categoryId);
    return category?.service_type_ids || [];
  };

  const getServiceTypeName = (serviceTypeId: string | null | undefined): string => {
    if (!serviceTypeId) return "N/A";
    const serviceType = allServiceTypes.find(st => st.id === serviceTypeId);
    return serviceType?.name || serviceTypeId;
  };
  
  const getFilteredItems = (): EnrichedPricingItem[] => {
    if (allItems.length === 0) return [];
    
    return allItems.filter(item => {
      if (activeCategory !== "all") {
        const categoryServiceTypeIds = getServiceTypeIdsForCategory(activeCategory);
        if (item.service_type_id && !categoryServiceTypeIds.includes(item.service_type_id)) {
          return false;
        }
        if (item.service_type_id === null) {
          return false;
        }
      }
      
      if (activeVehicleType !== "all" && item.vehicle_type !== activeVehicleType) {
        return false;
      }
      
      if (activeServiceType !== "all" && item.service_type_id !== activeServiceType) {
        return false;
      }
      
      return true;
    });
  };
  
  const handleCreatePackage = () => {
    setCurrentPackage({
      name: "",
      description: "",
      package_type: "bundle",
      base_price: 0,
      currency: "JPY",
      is_featured: false,
      is_active: true,
      sort_order: packages.length + 1,
      valid_from: null,
      valid_to: null
    });
    setDateRange(undefined);
    setSelectedItems({});
    setSelectedCurrency("JPY");
    setActiveCategory("all");
    setActiveVehicleType("all");
    setActiveServiceType("all");
    setIsEditing(false);
    setIsDialogOpen(true);
  };
  
  const handleEditPackage = (pkg: PricingPackage) => {
    setCurrentPackage({ ...pkg });
    
    if (pkg.valid_from && pkg.valid_to) {
      setDateRange({
        from: new Date(pkg.valid_from),
        to: new Date(pkg.valid_to)
      });
    } else {
      setDateRange(undefined);
    }
    
    setSelectedCurrency(pkg.currency || "JPY");
    
    const selected: {[key: string]: PackageServiceItem} = {};
    (pkg.items || []).forEach(item => {
      if (item.pricing_item_id) {
        selected[item.pricing_item_id] = {
          id: item.id,
          pricing_item_id: item.pricing_item_id,
          service_type_id: item.service_type_id || '',
          service_type_name: item.name,
          vehicle_type: item.vehicle_type || '',
          duration_hours: 1,
          price: item.price,
          quantity: item.quantity,
          is_optional: item.is_optional
        };
      }
    });
    setSelectedItems(selected);
    
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setCurrentPackage(null);
    setSelectedItems({});
    setDateRange(undefined);
    setIsEditing(false);
    setIsDialogOpen(false);
  };
  
  const handleSavePackage = async () => {
    if (!currentPackage || !currentPackage.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Package name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      let updatedPackage = { ...currentPackage };
      if (dateRange?.from) {
        updatedPackage.valid_from = dateRange.from.toISOString();
        updatedPackage.valid_to = dateRange.to?.toISOString() || dateRange.from.toISOString();
      } else {
        updatedPackage.valid_from = null;
        updatedPackage.valid_to = null;
      }
      
      updatedPackage.currency = selectedCurrency;
      
      const items = Object.values(selectedItems).map(serviceItem => ({
        item_type: 'service' as PackageItemType,
        name: serviceItem.service_type_name,
        description: `${serviceItem.service_type_name} - ${serviceItem.vehicle_type}`,
        quantity: serviceItem.quantity,
        price: serviceItem.price,
        price_override: null,
        is_included_in_base: true,
        is_optional: serviceItem.is_optional,
        sort_order: 1,
        pricing_item_id: serviceItem.pricing_item_id,
        service_type_id: serviceItem.service_type_id,
        vehicle_type: serviceItem.vehicle_type
      }));
      
      if (isEditing && currentPackage.id) {
        const result = await updatePricingPackage(currentPackage.id, {
          name: updatedPackage.name,
          description: updatedPackage.description,
          package_type: updatedPackage.package_type || "bundle",
          base_price: updatedPackage.base_price || 0,
          currency: updatedPackage.currency || "JPY",
          valid_from: updatedPackage.valid_from,
          valid_to: updatedPackage.valid_to,
          is_featured: updatedPackage.is_featured || false,
          is_active: updatedPackage.is_active !== false,
          sort_order: updatedPackage.sort_order || 1,
        }, { create: items });
        
        if (result) {
          const updatedData = await getPricingPackages(false, true);
          setPackages(updatedData);
          handleCloseDialog();
        }
      } else {
        const packageToCreate = {
          name: updatedPackage.name!,
          description: updatedPackage.description || null,
          package_type: updatedPackage.package_type || "bundle",
          base_price: updatedPackage.base_price || 0,
          currency: updatedPackage.currency || "JPY",
          valid_from: updatedPackage.valid_from,
          valid_to: updatedPackage.valid_to,
          is_featured: updatedPackage.is_featured || false,
          is_active: updatedPackage.is_active !== false,
          sort_order: updatedPackage.sort_order || 1,
        };
        
        const result = await createPricingPackage(packageToCreate, items);
        
        if (result) {
          const updatedData = await getPricingPackages(false, true);
          setPackages(updatedData);
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error("Error saving package:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} package`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePackage = async (packageId: string) => {
    try {
      setIsLoading(true);
      const success = await deletePricingPackage(packageId);
      
      if (success) {
        const updatedData = await getPricingPackages(false, true);
        setPackages(updatedData);
        toast({
          title: "Package Deleted",
          description: "The package has been deleted successfully."
        });
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTogglePackageStatus = async (packageId: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      const result = await updatePricingPackage(packageId, { is_active: isActive });
      
      if (result) {
        const updatedData = await getPricingPackages(false, true);
        setPackages(updatedData);
        toast({
          title: isActive ? "Package Activated" : "Package Deactivated",
          description: `The package has been ${isActive ? 'activated' : 'deactivated'} successfully.`
        });
      }
    } catch (error) {
      console.error("Error toggling package status:", error);
      toast({
        title: "Error",
        description: "Failed to update package status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (currentPackage) {
      setCurrentPackage({ ...currentPackage, [field]: value });
    }
  };
  
  const handleToggleItemSelection = (item: EnrichedPricingItem, checked: boolean) => {
    const newSelectedItems = { ...selectedItems };
    
    if (checked) {
      newSelectedItems[item.id] = {
        pricing_item_id: item.id,
        service_type_id: item.service_type_id || '',
        service_type_name: item.service_type_name || getServiceTypeName(item.service_type_id),
        vehicle_type: item.vehicle_type,
        duration_hours: item.duration_hours,
        price: item.price,
        quantity: 1,
        is_optional: false
      };
    } else {
      delete newSelectedItems[item.id];
    }
    setSelectedItems(newSelectedItems);
  };

  const formatCurrency = (amount: number | undefined | null, currency: string = 'JPY') => {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency }).format(amount);
  };
  
  const calculateTotalServicePrice = () => {
    return Object.values(selectedItems).reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateDiscountAmount = () => {
    const originalServicesPrice = calculateTotalServicePrice();
    const newPrice = currentPackage?.base_price || 0;
    return Math.max(0, originalServicesPrice - newPrice);
  };
  
  const calculateDiscountPercentage = () => {
    const originalPrice = calculateTotalServicePrice();
    const discountAmount = calculateDiscountAmount();
    if (originalPrice <= 0) return 0;
    return Math.round((discountAmount / originalPrice) * 100);
  };
  
  const getPackageStatus = (isActive: boolean) => {
    return isActive ? 'active' : 'inactive';
  };
  
  const renderPackageDialog = () => {
    if (!isDialogOpen || !currentPackage) return null;
    
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{isEditing ? "Edit Package" : "Create New Package"}</DialogTitle>
            <DialogDescription>{isEditing ? "Update package details and services" : "Create a new service package"}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Package Details Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pkg-name">Package Name *</Label>
                      <Input 
                        id="pkg-name" 
                        placeholder="Enter package name" 
                        value={currentPackage.name || ""} 
                        onChange={(e) => handleInputChange("name", e.target.value)} 
                        className={!currentPackage.name ? "border-red-500" : ""} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pkg-type">Package Type</Label>
                      <Select value={currentPackage.package_type || "bundle"} onValueChange={(value) => handleInputChange("package_type", value)}>
                        <SelectTrigger id="pkg-type">
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPackageTypes().map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display-order">Display Order</Label>
                      <Input 
                        id="display-order" 
                        type="number" 
                        min="1" 
                        value={currentPackage.sort_order || 1} 
                        onChange={(e) => handleInputChange("sort_order", parseInt(e.target.value))} 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Valid Period (Optional)</Label>
                      <CalendarDateRangePicker date={dateRange} onSelect={setDateRange} />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no date limit
                      </p>
                    </div>
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is-active" 
                          checked={currentPackage.is_active !== false} 
                          onCheckedChange={(checked) => handleInputChange("is_active", !!checked)} 
                        />
                        <Label htmlFor="is-active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="is-featured" 
                          checked={currentPackage.is_featured} 
                          onCheckedChange={(checked) => handleInputChange("is_featured", !!checked)} 
                        />
                        <Label htmlFor="is-featured">Featured</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-description">Description</Label>
                  <Textarea 
                    id="pkg-description" 
                    placeholder="Enter package description" 
                    value={currentPackage.description || ""} 
                    onChange={(e) => handleInputChange("description", e.target.value)} 
                    rows={3} 
                  />
                </div>
              </CardContent>
            </Card>
            {/* Services Selection Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Select Services
                </CardTitle>
                <CardDescription>
                  Choose services to include in this package. Use filters to find specific services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Filter by Category</Label>
                    <Select value={activeCategory} onValueChange={setActiveCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter by Service Type</Label>
                    <Select value={activeServiceType} onValueChange={setActiveServiceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Service Types</SelectItem>
                        {allServiceTypes.map(serviceType => (
                          <SelectItem key={serviceType.id} value={serviceType.id}>{serviceType.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter by Vehicle Type</Label>
                    <Select value={activeVehicleType} onValueChange={setActiveVehicleType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {availableVehicleTypes.map(vehicle => (
                          <SelectItem key={vehicle} value={vehicle}>{vehicle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Services */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Available Services</Label>
                      <Badge variant="outline">
                        {getFilteredItems().length} services available
                      </Badge>
                    </div>
                    <ScrollArea className="h-[400px] border rounded-md p-3">
                      {getFilteredItems().length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No services match your filters</p>
                          <p className="text-xs">Try adjusting the filters above</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {getFilteredItems().map(item => {
                            const serviceTypeName = item.service_type_name || getServiceTypeName(item.service_type_id);
                            const isSelected = !!selectedItems[item.id];
                            return (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                                  isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                                )}
                                onClick={() => handleToggleItemSelection(item, !isSelected)}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <Checkbox 
                                    id={`select-${item.id}`} 
                                    checked={isSelected} 
                                    onCheckedChange={(checked) => handleToggleItemSelection(item, !!checked)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label htmlFor={`select-${item.id}`} className="font-medium cursor-pointer text-sm">
                                      {serviceTypeName}
                                    </Label>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.duration_hours}h • {item.vehicle_type}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="font-semibold text-primary">
                                    {formatCurrency(item.price, item.currency)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Selected Services */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Selected Services</Label>
                      <Badge variant="secondary">
                        {Object.keys(selectedItems).length} items selected
                      </Badge>
                    </div>
                    <div className="border rounded-md p-3 h-[400px] overflow-y-auto">
                      {Object.keys(selectedItems).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No services selected</p>
                          <p className="text-xs">Select services from the left panel</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {Object.values(selectedItems).map(item => (
                            <div 
                              key={item.pricing_item_id} 
                              className="flex items-center justify-between border rounded-lg p-3 bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{item.service_type_name}</div>
                                <div className="text-xs text-muted-foreground">{item.vehicle_type}</div>
                              </div>
                              <div className="flex items-center space-x-3 ml-4">
                                <div className="font-semibold text-primary">
                                  {formatCurrency(item.price)}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                                  onClick={() => { 
                                    const newItems = { ...selectedItems }; 
                                    delete newItems[item.pricing_item_id]; 
                                    setSelectedItems(newItems); 
                                  }}
                                  title="Remove service"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Pricing Configuration Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Configuration
                </CardTitle>
                <CardDescription>
                  Set the package price and view pricing summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Package Price Input */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="base-price">Package Price *</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input 
                          id="base-price" 
                          type="number" 
                          min="0" 
                          className="pl-10" 
                          value={currentPackage.base_price || 0} 
                          onChange={(e) => handleInputChange("base_price", parseFloat(e.target.value))} 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Set the final price customers will pay for this package
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Currency: {selectedCurrency}</Label>
                    </div>
                  </div>

                  {/* Package Summary */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-4 text-base">Package Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Individual Services Total:</span>
                        <span className="font-medium">{formatCurrency(calculateTotalServicePrice())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Package Price:</span>
                        <span className="font-semibold text-primary">{formatCurrency(currentPackage.base_price || 0)}</span>
                      </div>
                      {calculateDiscountAmount() > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Package Savings:</span>
                          <span className="font-semibold">- {formatCurrency(calculateDiscountAmount())} ({calculateDiscountPercentage()}%)</span>
                        </div>
                      )}
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center font-bold text-base">
                        <span>Final Price:</span>
                        <span className="text-lg text-primary">{formatCurrency(currentPackage.base_price || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSavePackage} disabled={!currentPackage.name?.trim()}><Save className="h-4 w-4 mr-2" />{isEditing ? "Update Package" : "Create Package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <PricingTabHeader
          title={t('pricing.packages.title')}
          description={t('pricing.packages.description')}
          icon={<Package className="h-5 w-5" />}
          badges={
            <>
              {!isLoading && packages.length > 0 && (
                <StatusBadge type="info">⚡ {packages.length} packages loaded</StatusBadge>
              )}
            </>
          }
          actions={
            <Button onClick={handleCreatePackage} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              {t('pricing.packages.addPackage')}
            </Button>
          }
        />
        <CardContent className="pt-6">
      
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Loading Packages</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your packages...</p>
                </div>
              </div>
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Packages Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get started by creating your first package to offer bundled services and special pricing.
                  </p>
                </div>
                <Button onClick={handleCreatePackage} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Package
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <PricingResponsiveTable>
                <PricingTableHeader>
                  <PricingTableHead>Package</PricingTableHead>
                  <PricingTableHead>Type</PricingTableHead>
                  <PricingTableHead>Price</PricingTableHead>
                  <PricingTableHead>Validity</PricingTableHead>
                  <PricingTableHead>Status</PricingTableHead>
                  <PricingTableHead className="text-right">Actions</PricingTableHead>
                </PricingTableHeader>
                <TableBody>
                  {packages.map((pkg, index) => (
                    <PricingTableRow key={pkg.id} index={index}>
                      <PricingTableCell>
                        <div className="font-medium text-foreground">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{pkg.description}</div>
                      </PricingTableCell>
                      <PricingTableCell>
                        <Badge variant="outline">{pkg.package_type}</Badge>
                      </PricingTableCell>
                      <PricingTableCell>{formatCurrency(pkg.base_price, pkg.currency)}</PricingTableCell>
                      <PricingTableCell>
                        {pkg.valid_from && pkg.valid_to ? 
                          `${format(new Date(pkg.valid_from), 'MMM d, yyyy')} - ${format(new Date(pkg.valid_to), 'MMM d, yyyy')}` : 
                          'Always valid'}
                      </PricingTableCell>
                      <PricingTableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusBadgeClasses(getPackageStatus(pkg.is_active))}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {pkg.is_featured && <Badge variant="secondary"><Tag className="h-3 w-3 mr-1" />Featured</Badge>}
                        </div>
                      </PricingTableCell>
                      <PricingTableCell className="text-right">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleEditPackage(pkg)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeletePackage(pkg.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleTogglePackageStatus(pkg.id, !pkg.is_active)}
                          >
                            {pkg.is_active ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                            {pkg.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </PricingTableCell>
                    </PricingTableRow>
                  ))}
                </TableBody>
              </PricingResponsiveTable>
            </div>
          )}
        </CardContent>
      </Card>

      {renderPackageDialog()}
    </div>
  );
} 