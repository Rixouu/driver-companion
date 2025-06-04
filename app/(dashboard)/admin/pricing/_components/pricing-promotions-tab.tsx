"use client";

import { useState, useEffect } from "react";
import { PricingPromotion, DiscountType, ServiceTypeInfo } from "@/types/quotations";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Ban, 
  Percent, 
  DollarSign,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { format } from "date-fns";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function PricingPromotionsTab() {
  const [promotions, setPromotions] = useState<PricingPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPromotion, setCurrentPromotion] = useState<Partial<PricingPromotion> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [expandedPromotionId, setExpandedPromotionId] = useState<string | null>(null);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  
  const { getPricingPromotions, getPricingItems, createPricingPromotion, updatePricingPromotion, deletePricingPromotion, getServiceTypes } = useQuotationService();
  const { t } = useI18n();
  
  // Load promotions on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPricingPromotions(false); // false to get inactive ones too
        setPromotions(data);

        const serviceTypesData = await getServiceTypes();
        setAllServiceTypes(serviceTypesData);

      } catch (error) {
        console.error("Error loading promotions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Load vehicle types from database
  useEffect(() => {
    async function loadVehicleTypes() {
      try {
        // Fetch items to extract vehicle types
        const allItems = await getPricingItems();
        // Extract unique vehicle types
        const uniqueVehicleTypes = Array.from(
          new Set(allItems.map(item => item.vehicle_type))
        );
        setVehicleTypes(uniqueVehicleTypes);
      } catch (error) {
        console.error("Error loading vehicle types:", error);
        // Fallback to hardcoded vehicle types if there's an error
        setVehicleTypes([
          "Mercedes Benz V Class - Black Suite",
          "Toyota Alphard Executive Lounge",
          "Mercedes Benz V class - Extra Long",
          "Toyota Alphard Z class",
        ]);
      }
    }
    
    loadVehicleTypes();
  }, []);
  
  const getVehicleTypes = () => {
    return vehicleTypes.length > 0 ? vehicleTypes : [
      // Fallback if data isn't loaded yet
      "Mercedes Benz V Class - Black Suite",
      "Toyota Alphard Executive Lounge",
      "Mercedes Benz V class - Extra Long",
      "Toyota Alphard Z class",
    ];
  };
  
  const handleCreatePromotion = () => {
    setCurrentPromotion({
      name: "",
      description: "",
      code: "",
      discount_type: "percentage" as DiscountType,
      discount_value: 0,
      is_active: true,
      applicable_service_type_ids: [],
      applicable_vehicle_types: [],
      times_used: 0
    });
    setIsEditing(false);
    setIsCreating(true);
    setDateRange(undefined);
  };
  
  const handleEditPromotion = (promotion: PricingPromotion) => {
    setCurrentPromotion({ ...promotion });
    setIsEditing(true);
    setIsCreating(false);
    
    if (promotion.start_date && promotion.end_date) {
      setDateRange({
        from: new Date(promotion.start_date),
        to: new Date(promotion.end_date)
      });
    } else {
      setDateRange(undefined);
    }
  };
  
  const handleCancelEdit = () => {
    setCurrentPromotion(null);
    setIsEditing(false);
    setIsCreating(false);
    setDateRange(undefined);
  };
  
  const handleSavePromotion = async () => {
    if (!currentPromotion) return;
    
    // Basic validation
    if (!currentPromotion.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Promotion name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentPromotion.code?.trim()) {
      toast({
        title: "Validation Error",
        description: "Promo code is required",
        variant: "destructive"
      });
      return;
    }
    
    // Update dates from dateRange
    let updatedPromotion = { ...currentPromotion };
    if (dateRange?.from) {
      updatedPromotion.start_date = dateRange.from.toISOString();
      
      if (dateRange.to) {
        updatedPromotion.end_date = dateRange.to.toISOString();
      } else {
        updatedPromotion.end_date = dateRange.from.toISOString();
      }
    } else {
      updatedPromotion.start_date = null;
      updatedPromotion.end_date = null;
    }
    
    console.log("Saving promotion:", updatedPromotion);
    
    setIsLoading(true);
    try {
      let result: PricingPromotion | null = null;
      
      if (isEditing && updatedPromotion.id) {
        // Update existing promotion
        const { id, created_at, updated_at, times_used, ...updateData } = updatedPromotion;
        result = await updatePricingPromotion(id, updateData);
      } else {
        // Create new promotion
        const { id, created_at, updated_at, ...createData } = updatedPromotion;
        result = await createPricingPromotion(createData as any);
      }
      
      if (result) {
        // Reload the promotions list to get the updated data
        const updatedPromotions = await getPricingPromotions(false);
        setPromotions(updatedPromotions);
        
        // Reset state and close form
        setCurrentPromotion(null);
        setIsEditing(false);
        setIsCreating(false);
      } else {
        // If result is null, there was an error that was already displayed via toast
        // Just keep the form open
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save promotion",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePromotion = async (id: string) => {
    setIsLoading(true);
    try {
      // Call the API to delete the promotion
      const success = await deletePricingPromotion(id);
      
      if (success) {
        // If successful, refresh the promotions list
        const updatedPromotions = await getPricingPromotions(false);
        setPromotions(updatedPromotions);
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTogglePromotionStatus = async (id: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      // Call the API to update the promotion status
      const result = await updatePricingPromotion(id, { is_active: isActive });
      
      if (result) {
        // If successful, refresh the promotions list
        const updatedPromotions = await getPricingPromotions(false);
        setPromotions(updatedPromotions);
      }
    } catch (error) {
      console.error("Error toggling promotion status:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    if (currentPromotion) {
      setCurrentPromotion({
        ...currentPromotion,
        [field]: value
      });
    }
  };
  
  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start) return "No date limit";
    
    const startDate = new Date(start);
    if (!end || start === end) {
      return format(startDate, "PPP");
    }
    
    const endDate = new Date(end);
    return `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`;
  };
  
  const isPromotionExpired = (promotion: PricingPromotion) => {
    if (!promotion.end_date) return false;
    
    const endDate = new Date(promotion.end_date);
    return endDate < new Date();
  };
  
  const getPromotionStatus = (promotion: PricingPromotion) => {
    if (!promotion.is_active) return "inactive";
    if (isPromotionExpired(promotion)) return "expired";
    
    const now = new Date();
    if (promotion.start_date && new Date(promotion.start_date) > now) {
      return "scheduled";
    }
    
    return "active";
  };
  
  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case "active":
        return { variant: "success" as const, children: "Active", icon: <Check className="h-3 w-3" /> };
      case "inactive":
        return { variant: "destructive" as const, children: "Inactive", icon: <Ban className="h-3 w-3" /> };
      case "expired":
        return { variant: "outline" as const, children: "Expired", icon: <Clock className="h-3 w-3" /> };
      case "scheduled":
        return { variant: "secondary" as const, children: "Scheduled", icon: <Calendar className="h-3 w-3" /> };
      default:
        return { variant: "outline" as const, children: status };
    }
  };
  
  const getPromotionCover = (promotion: PricingPromotion) => {
    let services = "All services";
    let vehicles = "All vehicles";
    
    if (promotion.applicable_service_type_ids && promotion.applicable_service_type_ids.length > 0) {
      services = promotion.applicable_service_type_ids.join(", ");
    }
    
    if (promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0) {
      vehicles = promotion.applicable_vehicle_types.join(", ");
    }
    
    return `${services} / ${vehicles}`;
  };
  
  const handleToggleExpand = (id: string) => {
    if (expandedPromotionId === id) {
      setExpandedPromotionId(null);
    } else {
      setExpandedPromotionId(id);
    }
  };

  const renderPromotionForm = () => {
    if (!currentPromotion) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Promotion" : "Create New Promotion"}</CardTitle>
          <CardDescription>
            {isEditing ? "Update the promotion details below" : "Fill in the details to create a new promotion"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-name">Promotion Name</Label>
                <Input 
                  id="promo-name"
                  placeholder="Enter promotion name"
                  value={currentPromotion.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promo-code">Promo Code</Label>
                <Input 
                  id="promo-code"
                  placeholder="Enter promo code (e.g. SUMMER2023)"
                  value={currentPromotion.code || ""}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="promo-description">Description</Label>
                <Textarea 
                  id="promo-description"
                  placeholder="Enter promotion description"
                  value={currentPromotion.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Valid Period</Label>
                <CalendarDateRangePicker 
                  date={dateRange}
                  onSelect={setDateRange}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    value={currentPromotion.discount_type || "percentage"}
                    onValueChange={(value) => handleInputChange("discount_type", value)}
                  >
                    <SelectTrigger id="discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 space-y-2">
                  <Label htmlFor="discount-value">Discount Value</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      {currentPromotion.discount_type === "percentage" ? 
                        <Percent className="h-4 w-4 text-gray-400" /> : 
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                    <Input 
                      id="discount-value"
                      type="number"
                      min="0"
                      className="pl-10"
                      value={currentPromotion.discount_value || 0}
                      onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Applicable Services</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-24 overflow-y-auto">
                  {allServiceTypes.map(serviceType => (
                    <div key={serviceType.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`service-${serviceType.id}`}
                        checked={(currentPromotion.applicable_service_type_ids || []).includes(serviceType.id)}
                        onCheckedChange={(checked) => {
                          const currentSelectedIds = [...(currentPromotion.applicable_service_type_ids || [])];
                          if (checked) {
                            if (!currentSelectedIds.includes(serviceType.id)) {
                              currentSelectedIds.push(serviceType.id);
                            }
                          } else {
                            const index = currentSelectedIds.indexOf(serviceType.id);
                            if (index > -1) {
                              currentSelectedIds.splice(index, 1);
                            }
                          }
                          handleInputChange("applicable_service_type_ids", currentSelectedIds);
                        }}
                      />
                      <Label htmlFor={`service-${serviceType.id}`} className="text-sm cursor-pointer">
                        {serviceType.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Applicable Vehicles</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-24 overflow-y-auto">
                  {getVehicleTypes().map(vehicle => (
                    <div key={vehicle} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`vehicle-${vehicle}`}
                        checked={(currentPromotion.applicable_vehicle_types || []).includes(vehicle)}
                        onCheckedChange={(checked) => {
                          const vehicles = [...(currentPromotion.applicable_vehicle_types || [])];
                          if (checked) {
                            if (!vehicles.includes(vehicle)) {
                              vehicles.push(vehicle);
                            }
                          } else {
                            const index = vehicles.indexOf(vehicle);
                            if (index > -1) {
                              vehicles.splice(index, 1);
                            }
                          }
                          handleInputChange("applicable_vehicle_types", vehicles);
                        }}
                      />
                      <Label htmlFor={`vehicle-${vehicle}`} className="text-sm cursor-pointer">
                        {vehicle}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is-active"
                  checked={currentPromotion.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", !!checked)}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button onClick={handleSavePromotion}>
            {isEditing ? "Update Promotion" : "Create Promotion"}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {!isCreating && !isEditing && (
          <Button onClick={handleCreatePromotion} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Promotion
          </Button>
        )}
      </div>
      
      {(isCreating || isEditing) && renderPromotionForm()}
      
      {isLoading ? (
        <div className="text-center py-4">Loading promotions...</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No promotions found</p>
          {!isCreating && (
            <Button variant="outline" className="mt-4" onClick={handleCreatePromotion}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first promotion
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {promotions.map(promotion => {
            const status = getPromotionStatus(promotion);
            const statusProps = getStatusBadgeProps(status);
            const isExpanded = expandedPromotionId === promotion.id;
            
            return (
              <Card key={promotion.id} className={cn(
                "transition-all duration-200",
                isExpanded ? "border-primary" : ""
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {promotion.name}
                        <Badge variant={statusProps.variant as any} className="ml-2">
                          {statusProps.icon}
                          <span className="ml-1">{statusProps.children}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Code: <span className="font-medium">{promotion.code}</span> | 
                        {promotion.discount_type === "percentage" 
                          ? ` ${promotion.discount_value}% off` 
                          : ` ${promotion.discount_value} JPY off`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleExpand(promotion.id)}
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
                        onClick={() => handleEditPromotion(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePromotion(promotion.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePromotionStatus(promotion.id, !promotion.is_active)}
                      >
                        {promotion.is_active ? (
                          <Ban className="h-4 w-4" />
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
                            {promotion.description || "No description provided"}
                          </p>
                          
                          <h4 className="text-sm font-medium mt-4 mb-1">Validity Period</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDateRange(promotion.start_date, promotion.end_date)}
                          </p>
                        </div>
                        
                        <div>
                        <h4 className="text-sm font-medium mb-1">Applicable Services</h4>
                          <div className="flex flex-wrap gap-1">
                            {promotion.applicable_service_type_ids && promotion.applicable_service_type_ids.length > 0 ? (
                              promotion.applicable_service_type_ids.map(serviceId => (
                                <Badge key={serviceId} variant="secondary">
                                  {serviceId} {/* Display ID for now */}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">All Services</Badge>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4 mb-1">Applicable Vehicles</h4>
                          <div className="flex flex-wrap gap-1">
                            {promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0 ? (
                              promotion.applicable_vehicle_types.map(vehicle => (
                                <Badge key={vehicle} variant="secondary">
                                  {vehicle}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">All Vehicles</Badge>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4 mb-1">Usage</h4>
                          <p className="text-sm text-muted-foreground">
                            Used {promotion.times_used || 0} times
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
                
                {!isExpanded && (
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        Valid: {formatDateRange(promotion.start_date, promotion.end_date)}
                      </span>
                      <span>
                        Used: {promotion.times_used || 0} times
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 