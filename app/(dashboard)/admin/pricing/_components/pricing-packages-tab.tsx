"use client";

import { useState, useEffect } from "react";
import { PricingPackage, PackageType, PackageItemType, PricingPackageItem, PricingCategory, PricingItem } from "@/types/quotations";
import { useQuotationService } from "@/hooks/useQuotationService";
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
  Globe
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

export default function PricingPackagesTab() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPackage, setCurrentPackage] = useState<Partial<PricingPackage> | null>(null);
  const [packageItems, setPackageItems] = useState<Partial<PricingPackageItem>[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  
  // Service selection state
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [allItems, setAllItems] = useState<PricingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeVehicleType, setActiveVehicleType] = useState<string>("all");
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([]);
  
  // Period and pricing state
  const [excludeFromPromotions, setExcludeFromPromotions] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("JPY");
  
  const { getPricingPackages, getPricingCategories, getPricingItems, getPricingPackage, createPricingPackage, updatePricingPackage } = useQuotationService();
  const { t } = useI18n();
  
  // Load packages and categories on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPricingPackages(false, true); // Get all packages with items
        setPackages(data);
        
        // Also load pricing categories and items
        const categoriesData = await getPricingCategories();
        setCategories(categoriesData);
        
        const itemsData = await getPricingItems();
        setAllItems(itemsData);
        
        // Extract unique vehicle types
        const uniqueVehicleTypes = Array.from(
          new Set(itemsData.map(item => item.vehicle_type))
        );
        setAvailableVehicleTypes(uniqueVehicleTypes);
        
      } catch (error) {
        console.error("Error loading packages:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  const getPackageTypes = () => {
    return [
      { value: "bundle", label: "Bundle" },
      { value: "tour", label: "Tour Package" },
      { value: "special_event", label: "Special Event" },
      { value: "seasonal", label: "Seasonal Offer" },
    ];
  };
  
  const getItemTypes = () => {
    return [
      { value: "service", label: "Transport Service" },
      { value: "accommodation", label: "Accommodation" },
      { value: "meal", label: "Meal" },
      { value: "attraction", label: "Attraction" },
      { value: "extra", label: "Extra" },
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
  
  const getServiceTypesByCategory = (categoryId: string) => {
    if (categoryId === "all") {
      return Array.from(new Set(allItems.map(item => item.service_type)));
    }
    
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      return category.service_types || [];
    }
    return [];
  };
  
  const getFilteredItems = () => {
    if (allItems.length === 0) return [];
    
    return allItems.filter(item => {
      // Filter by category
      if (activeCategory !== "all") {
        const category = categories.find(cat => cat.id === activeCategory);
        const categoryServices = category?.service_types || [];
        if (!categoryServices.includes(item.service_type)) {
          return false;
        }
      }
      
      // Filter by vehicle type
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
    setPackageItems([]);
    setSelectedItems({});
    setSelectedCurrency("JPY");
    setActiveCategory("all");
    setActiveVehicleType("all");
    setIsEditing(false);
    setIsCreating(true);
  };
  
  const handleEditPackage = (pkg: PricingPackage) => {
    setCurrentPackage({ ...pkg });
    setPackageItems(pkg.items || []);
    
    // Initialize date range if package has valid_from and valid_to
    if (pkg.valid_from && pkg.valid_to) {
      setDateRange({
        from: new Date(pkg.valid_from),
        to: new Date(pkg.valid_to)
      });
    } else {
      setDateRange(undefined);
    }
    
    // Set currency
    setSelectedCurrency(pkg.currency || "JPY");
    setExcludeFromPromotions(!!pkg.exclude_from_promotions);
    
    // Initialize selected items from package items
    const selected: {[key: string]: boolean} = {};
    (pkg.items || []).forEach(item => {
      if (item.pricing_item_id) {
        selected[item.pricing_item_id] = true;
      }
    });
    setSelectedItems(selected);
    
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleCancelEdit = () => {
    setCurrentPackage(null);
    setPackageItems([]);
    setSelectedItems({});
    setDateRange(undefined);
    setExcludeFromPromotions(false);
    setIsEditing(false);
    setIsCreating(false);
  };
  
  const handleSavePackage = async () => {
    if (!currentPackage) return;
    
    setIsLoading(true);
    try {
      let updatedPackage = { ...currentPackage };
      if (dateRange?.from) {
        updatedPackage.valid_from = dateRange.from.toISOString();
        
        if (dateRange.to) {
          updatedPackage.valid_to = dateRange.to.toISOString();
        } else {
          updatedPackage.valid_to = dateRange.from.toISOString();
        }
      } else {
        updatedPackage.valid_from = null;
        updatedPackage.valid_to = null;
      }
      
      updatedPackage.currency = selectedCurrency;
      
      // Create package items from selected items
      const items: Partial<PricingPackageItem>[] = Object.keys(selectedItems)
        .filter(id => selectedItems[id])
        .map(itemId => {
          const pricingItem = allItems.find(item => item.id === itemId);
          if (!pricingItem) return null;
          
          // Check if the item already exists in packageItems
          const existingItem = packageItems.find(item => item.pricing_item_id === itemId);
          if (existingItem) {
            return existingItem;
          }
          
          // Otherwise create a new package item
          return {
            pricing_item_id: itemId,
            item_type: 'service',
            quantity: 1,
            price: pricingItem.price,
            price_override: null,
            is_included_in_base: true,
            is_optional: false,
            sort_order: 1,
            service_type: pricingItem.service_type,
            vehicle_type: pricingItem.vehicle_type,
            name: pricingItem.service_type // Use service_type as name instead of the non-existent name property
          };
        })
        .filter(Boolean) as Partial<PricingPackageItem>[];
      
      if (isEditing && currentPackage.id) {
        // Update existing package
        const result = await updatePricingPackage(currentPackage.id, {
          name: updatedPackage.name || "",
          description: updatedPackage.description,
          package_type: updatedPackage.package_type || "bundle",
          base_price: updatedPackage.base_price || 0,
          currency: updatedPackage.currency || "JPY",
          valid_from: updatedPackage.valid_from,
          valid_to: updatedPackage.valid_to,
          is_featured: updatedPackage.is_featured || false,
          is_active: updatedPackage.is_active || false,
          sort_order: updatedPackage.sort_order || 1,
        }, {
          // Only pass the items that need to be created
          create: items.filter(item => !item.id).map(item => ({
            pricing_item_id: item.pricing_item_id || "",
            item_type: item.item_type || "service",
            quantity: item.quantity || 1,
            price: item.price || 0,
            is_included_in_base: item.is_included_in_base || true,
            is_optional: item.is_optional || false,
            sort_order: item.sort_order || 1,
            service_type: item.service_type || "",
            vehicle_type: item.vehicle_type || "",
            name: item.name || item.service_type || ""
          }))
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
          name: updatedPackage.name || "New Package",
          description: updatedPackage.description || null,
          package_type: updatedPackage.package_type || "bundle",
          base_price: updatedPackage.base_price || 0,
          currency: updatedPackage.currency || "JPY",
          valid_from: updatedPackage.valid_from,
          valid_to: updatedPackage.valid_to,
          is_featured: updatedPackage.is_featured || false,
          is_active: updatedPackage.is_active || true,
          sort_order: updatedPackage.sort_order || 1,
        };
        
        const itemsToCreate = items.map(item => ({
          pricing_item_id: item.pricing_item_id || "",
          item_type: item.item_type || "service",
          quantity: item.quantity || 1,
          price: item.price || 0,
          is_included_in_base: item.is_included_in_base || true,
          is_optional: item.is_optional || false,
          sort_order: item.sort_order || 1,
          service_type: item.service_type || "",
          vehicle_type: item.vehicle_type || "",
          name: item.name || item.service_type || ""
        }));
        
        const result = await createPricingPackage(packageToCreate, itemsToCreate);
        
        if (result) {
          const updatedData = await getPricingPackages(false, true);
          setPackages(updatedData);
          setIsCreating(false);
          setCurrentPackage(null);
        }
      }
    } catch (error) {
      console.error("Error saving package:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePackage = (packageId: string) => {
    // Delete package logic would go here
    console.log("Deleting package:", packageId);
    
    // Placeholder - filter out the deleted package
    setPackages(packages.filter(pkg => pkg.id !== packageId));
  };
  
  const handleTogglePackageStatus = (packageId: string, isActive: boolean) => {
    // Toggle package status logic would go here
    console.log("Toggling package status:", packageId, isActive);
    
    // Placeholder - update the package status
    setPackages(packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, is_active: isActive } : pkg
    ));
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (currentPackage) {
      setCurrentPackage({
        ...currentPackage,
        [field]: value
      });
    }
  };
  
  const handleToggleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItems({
      ...selectedItems,
      [itemId]: checked
    });
  };
  
  const handleToggleExpand = (id: string) => {
    if (expandedPackageId === id) {
      setExpandedPackageId(null);
    } else {
      setExpandedPackageId(id);
    }
  };
  
  const calculateTotalPackagePrice = (pkg: PricingPackage) => {
    // For packages, the total price is just the base price (renamed to New Price)
    return pkg.base_price || 0;
  };
  
  // Calculate the original price of all selected services (without base price)
  const calculateOriginalServicesPrice = () => {
    return Object.keys(selectedItems)
      .filter(id => selectedItems[id])
      .reduce((total, id) => {
        const item = allItems.find(item => item.id === id);
        return total + (item?.price || 0);
      }, 0);
  };
  
  // Calculate the total package value (just the new price)
  const calculateTotalPackageValue = () => {
    return currentPackage?.base_price || 0;
  };
  
  // Calculate the discount amount (difference between original services price and new price)
  const calculateDiscountAmount = () => {
    const originalServicesPrice = calculateOriginalServicesPrice();
    const newPrice = currentPackage?.base_price || 0;
    return originalServicesPrice - newPrice;
  };
  
  // Calculate the discount percentage
  const calculateDiscountPercentage = () => {
    const originalPrice = calculateOriginalServicesPrice();
    const discountAmount = calculateDiscountAmount();
    
    if (originalPrice <= 0) return 0;
    return Math.round((discountAmount / originalPrice) * 100);
  };
  
  // Format currency based on selected currency
  const formatCurrency = (amount: number) => {
    // Exchange rates (simplified for demo)
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    // Convert amount to selected currency
    const originalCurrency = currentPackage?.currency || "JPY";
    const convertedAmount = amount * (exchangeRates[selectedCurrency] / exchangeRates[originalCurrency]);
    
    // Format based on currency
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
        minimumFractionDigits: 2
      }).format(convertedAmount);
    }
  };
  
  const getItemDetails = (itemId: string) => {
    return allItems.find(item => item.id === itemId);
  };
  
  const getDurationText = (item: PricingItem) => {
    if (!item) return "";
    
    // For charter services, show duration
    if (item.service_type.toLowerCase().includes('charter')) {
      return item.duration_hours ? `${item.duration_hours} hour${item.duration_hours !== 1 ? 's' : ''}` : '';
    }
    
    return "";
  };
  
  const renderSelectedItems = () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    
    if (selectedItemIds.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No services selected for this package
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {selectedItemIds.map(itemId => {
          const item = getItemDetails(itemId);
          if (!item) return null;
          
          const durationText = getDurationText(item);
          
          return (
            <div 
              key={itemId} 
              className="flex items-center justify-between border rounded-md p-3"
            >
              <div>
                <div className="font-medium">{item.service_type}</div>
                <div className="text-sm text-muted-foreground">
                  {item.service_type} | {item.vehicle_type}
                  {durationText && (
                    <span className="ml-2 inline-flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {durationText}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="font-medium">{formatCurrency(item.price)}</div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleToggleItemSelection(itemId, false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderPackageForm = () => {
    if (!currentPackage) return null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Package" : "Create New Package"}</CardTitle>
            <CardDescription>
              Fill in the details to create a new service package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Package Details - Reorganized */}
              <div>
                <h3 className="text-lg font-medium mb-4">Package Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column */}
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
                      {!currentPackage.name && 
                        <p className="text-xs text-red-500">Package name is required</p>
                      }
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
                  
                  {/* Right column */}
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
                          checked={currentPackage.is_active}
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
              
              {/* Step 2: Service Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">Select Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left side - filters */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Filter by Category</Label>
                      <Select
                        value={activeCategory}
                        onValueChange={setActiveCategory}
                      >
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
                      <Select
                        value={activeVehicleType}
                        onValueChange={setActiveVehicleType}
                      >
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
                  
                  {/* Middle - available items */}
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
                            const durationText = getDurationText(item);
                            
                            return (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-md border",
                                  selectedItems[item.id] ? "border-primary bg-muted" : ""
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <Checkbox 
                                    id={`select-${item.id}`}
                                    checked={!!selectedItems[item.id]}
                                    onCheckedChange={(checked) => handleToggleItemSelection(item.id, !!checked)}
                                  />
                                  <div>
                                    <Label 
                                      htmlFor={`select-${item.id}`} 
                                      className="font-medium cursor-pointer"
                                    >
                                      {item.service_type}
                                    </Label>
                                    <div className="text-xs text-muted-foreground">
                                      {item.service_type}
                                      {durationText && (
                                        <span className="ml-2 inline-flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {durationText}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs">
                                      <Badge variant="outline" className="mt-1">
                                        {item.vehicle_type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(item.price)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                  
                  {/* Right - selected items */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Selected Services</Label>
                      <Badge variant="outline">
                        {Object.values(selectedItems).filter(Boolean).length} items
                      </Badge>
                    </div>
                    <div className="border rounded-md p-2 h-[300px] overflow-y-auto">
                      {renderSelectedItems()}
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
                    <Select 
                      value={selectedCurrency}
                      onValueChange={setSelectedCurrency}
                    >
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
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="base-price">New Price</Label>
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
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md">
                    <h4 className="font-medium mb-4">Package Summary</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Original Services Price:</span>
                        <span>{formatCurrency(calculateOriginalServicesPrice())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Price:</span>
                        <span>{formatCurrency(currentPackage.base_price || 0)}</span>
                      </div>
                      
                      <div className="flex justify-between text-green-600">
                        <span>Package Discount:</span>
                        <span>- {formatCurrency(calculateDiscountAmount())} ({calculateDiscountPercentage()}%)</span>
                      </div>
                      
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Final Package Value:</span>
                        <span>{formatCurrency(calculateTotalPackageValue())}</span>
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
            <Button onClick={handleSavePackage}>
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
          <p className="text-muted-foreground">No packages found</p>
          {!isCreating && (
            <Button variant="outline" className="mt-4" onClick={handleCreatePackage}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first package
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {packages.map(pkg => {
          const isExpanded = expandedPackageId === pkg.id;
          const totalPrice = calculateTotalPackagePrice(pkg);
          
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
                      {pkg.package_type} {pkg.valid_from && pkg.valid_to ? `• Valid ${formatDateRange(pkg.valid_from, pkg.valid_to)}` : ''}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleExpand(pkg.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditPackage(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePackage(pkg.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePackageStatus(pkg.id, !pkg.is_active)}
                    >
                      {pkg.is_active ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
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
                        <p className="text-sm font-bold">
                          {formatCurrency(totalPrice)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Included Services</h4>
                        {pkg.items && pkg.items.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.items.map(item => {
                              const pricingItem = allItems.find(i => i.id === item.pricing_item_id);
                              
                              return (
                                <div 
                                  key={item.id} 
                                  className="flex justify-between p-2 border rounded-md"
                                >
                                  <div>
                                    <div className="text-sm font-medium">
                                      {pricingItem?.service_type || item.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.service_type} | {item.vehicle_type || pricingItem?.vehicle_type}
                                      {item.is_optional && " (Optional)"}
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium">
                                    {formatCurrency(item.price_override || pricingItem?.price || 0)}
                                    {item.quantity > 1 && ` x ${item.quantity}`}
                                  </div>
                                </div>
                              );
                            })}
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
                      <span className="font-bold">
                        {formatCurrency(totalPrice)}
                      </span>
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
  
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };
  
  return (
    <div className="space-y-4">
      {!isCreating && !isEditing && (
        <div className="flex justify-between items-center">
          <Button onClick={handleCreatePackage} className="ml-auto">
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