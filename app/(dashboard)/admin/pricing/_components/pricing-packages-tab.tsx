"use client";

import { useState, useEffect } from "react";
import { PricingPackage, PackageType, PackageItemType, PricingPackageItem, PricingCategory, PricingItem } from "@/types/quotations";
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
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
  const [currentPackage, setCurrentPackage] = useState<Partial<PricingPackage> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  
  // Service selection state
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [allItems, setAllItems] = useState<EnrichedPricingItem[]>([]);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: PackageServiceItem}>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeVehicleType, setActiveVehicleType] = useState<string>("all");
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([]);
  
  // Period and pricing state
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
  
  // Load packages and categories on mount
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
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
      { value: "THB", label: "THB (฿)" },
      { value: "CNY", label: "CNY (¥)" },
      { value: "SGD", label: "SGD ($)" }
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
    setIsEditing(false);
    setIsCreating(true);
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
    
    // Initialize selected items from package items
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
    setIsCreating(false);
  };
  
  const handleCancelEdit = () => {
    setCurrentPackage(null);
    setSelectedItems({});
    setDateRange(undefined);
    setIsEditing(false);
    setIsCreating(false);
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
      
      // Create package items from selected items
      const items = Object.values(selectedItems).map(serviceItem => {
        const pricingItem = allItems.find(item => item.id === serviceItem.pricing_item_id);
        return {
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
        };
      });
      
      if (isEditing && currentPackage.id) {
        // Update existing package
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
        }, {
          create: items
        });
        
        if (result) {
          const updatedData = await getPricingPackages(false, true);
          setPackages(updatedData);
          setIsEditing(false);
          setCurrentPackage(null);
        }
      } else {
        // Create new package
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
          setIsCreating(false);
          setCurrentPackage(null);
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
      setCurrentPackage({
        ...currentPackage,
        [field]: value
      });
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
  
  const handleToggleExpand = (id: string) => {
    setExpandedPackageId(expandedPackageId === id ? null : id);
  };
  
  const formatCurrency = (amount: number) => {
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    const convertedAmount = amount * (exchangeRates[selectedCurrency] / exchangeRates['JPY']);
    
    if (selectedCurrency === 'JPY' || selectedCurrency === 'CNY') {
      return selectedCurrency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (selectedCurrency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    }
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
  
  const renderPackageForm = () => {
    if (!currentPackage) return null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{isEditing ? "Edit Package" : "Create New Package"}</CardTitle>
              <CardDescription>
                {isEditing ? "Update package details and services" : "Create a new service package"}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleCancelEdit} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Package Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Package Details</h3>
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
                      <Select
                        value={currentPackage.package_type || "bundle"}
                        onValueChange={(value) => handleInputChange("package_type", value)}
                      >
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
                      <CalendarDateRangePicker
                        date={dateRange}
                        onSelect={setDateRange}
                      />
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
                
                <div className="mt-4">
                  <Label htmlFor="pkg-description">Description</Label>
                  <Textarea 
                    id="pkg-description"
                    placeholder="Enter package description"
                    value={currentPackage.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Service Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">Select Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filters */}
                  <div className="space-y-4">
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
                  
                  {/* Available Items */}
                  <div className="space-y-2">
                    <Label>Available Services</Label>
                    <ScrollArea className="h-[300px] border rounded-md p-2">
                      {getFilteredItems().length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No services match your filters
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
                                  "flex items-center justify-between p-2 rounded-md border",
                                  isSelected ? "border-primary bg-muted" : ""
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <Checkbox 
                                    id={`select-${item.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleToggleItemSelection(item, !!checked)}
                                  />
                                  <div>
                                    <Label 
                                      htmlFor={`select-${item.id}`} 
                                      className="font-medium cursor-pointer"
                                    >
                                      {serviceTypeName}
                                    </Label>
                                    <div className="text-xs text-muted-foreground">
                                      {item.duration_hours}h • {item.vehicle_type}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(item.price)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                  
                  {/* Selected Items */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Selected Services</Label>
                      <Badge variant="outline">
                        {Object.keys(selectedItems).length} items
                      </Badge>
                    </div>
                    <div className="border rounded-md p-2 h-[300px] overflow-y-auto">
                      {Object.keys(selectedItems).length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No services selected
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.values(selectedItems).map(item => (
                            <div 
                              key={item.pricing_item_id}
                              className="flex items-center justify-between border rounded-md p-3"
                            >
                              <div>
                                <div className="font-medium text-sm">{item.service_type_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.vehicle_type}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="font-medium">{formatCurrency(item.price)}</div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    const newItems = { ...selectedItems };
                                    delete newItems[item.pricing_item_id];
                                    setSelectedItems(newItems);
                                  }}
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
              </div>
              
              <Separator />
              
              {/* Pricing Configuration */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex justify-between items-center">
                  <span>Pricing Configuration</span>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrencies().map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="base-price">Package Price</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
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
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h4 className="font-medium mb-4">Package Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Individual Services Total:</span>
                        <span>{formatCurrency(calculateTotalServicePrice())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Package Price:</span>
                        <span>{formatCurrency(currentPackage.base_price || 0)}</span>
                      </div>
                      
                      {calculateDiscountAmount() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Package Savings:</span>
                          <span>- {formatCurrency(calculateDiscountAmount())} ({calculateDiscountPercentage()}%)</span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Final Price:</span>
                        <span>{formatCurrency(currentPackage.base_price || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage} disabled={!currentPackage.name?.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update Package" : "Create Package"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  const renderPackageList = () => {
    if (isLoading) {
      return <div className="text-center py-4">Loading packages...</div>;
    }
    
    if (packages.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No packages found</p>
          <Button onClick={handleCreatePackage}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first package
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {packages.map(pkg => {
          const isExpanded = expandedPackageId === pkg.id;
          
          return (
            <Card key={pkg.id} className={cn(
              "transition-all duration-200",
              isExpanded ? "border-primary" : ""
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {pkg.name}
                      {pkg.is_featured && (
                        <Badge variant="secondary" className="ml-2">
                          <Tag className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {!pkg.is_active && (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {pkg.package_type} {pkg.valid_from && pkg.valid_to ? 
                        `• Valid ${format(new Date(pkg.valid_from), 'MMM d')} - ${format(new Date(pkg.valid_to), 'MMM d, yyyy')}` : ''
                      }
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleExpand(pkg.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditPackage(pkg)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePackageStatus(pkg.id, !pkg.is_active)}
                    >
                      {pkg.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description || "No description provided"}
                        </p>
                        
                        <h4 className="text-sm font-medium mt-4 mb-1">Package Price</h4>
                        <p className="text-sm font-bold">{formatCurrency(pkg.base_price)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Included Services</h4>
                        {pkg.items && pkg.items.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.items.map(item => (
                              <div 
                                key={item.id} 
                                className="flex justify-between p-2 border rounded-md"
                              >
                                <div>
                                  <div className="text-sm font-medium">{item.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.vehicle_type}{item.is_optional && " (Optional)"}
                                  </div>
                                </div>
                                <div className="text-sm font-medium">
                                  {formatCurrency(item.price_override || item.price)}
                                  {item.quantity > 1 && ` x ${item.quantity}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No services included in this package
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
              
              {!isExpanded && (
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {pkg.items?.length || 0} service{pkg.items?.length !== 1 ? 's' : ''} included
                      </span>
                      <span className="font-bold">{formatCurrency(pkg.base_price)}</span>
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{pkg.description}</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {!isCreating && !isEditing && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Pricing Packages</h2>
            <p className="text-muted-foreground">Manage service packages and bundles</p>
          </div>
          <Button onClick={handleCreatePackage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      )}
      
      {(isCreating || isEditing) && renderPackageForm()}
      
      {!isCreating && !isEditing && renderPackageList()}
    </div>
  );
} 