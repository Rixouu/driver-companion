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
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import { toast } from "@/components/ui/use-toast";

export default function PricingPromotionsTab() {
  const [promotions, setPromotions] = useState<PricingPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Partial<PricingPromotion> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  
  const { getPricingPromotions, getPricingItems, createPricingPromotion, updatePricingPromotion, deletePricingPromotion, getServiceTypes } = useQuotationService();
  const { t } = useI18n();
  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getPricingPromotions(false); // false to get inactive ones too
        const sortedData = data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setPromotions(sortedData);
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
  
  useEffect(() => {
    async function loadVehicleTypes() {
      try {
        const allItems = await getPricingItems();
        const uniqueVehicleTypes = Array.from(
          new Set(allItems.map(item => item.vehicle_type))
        );
        setVehicleTypes(uniqueVehicleTypes);
      } catch (error) {
        console.error("Error loading vehicle types:", error);
        setVehicleTypes([]);
      }
    }
    loadVehicleTypes();
  }, []);
  
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
    setDateRange(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditPromotion = (promotion: PricingPromotion) => {
    setCurrentPromotion({ ...promotion });
    setIsEditing(true);
    if (promotion.start_date && promotion.end_date) {
      setDateRange({
        from: new Date(promotion.start_date),
        to: new Date(promotion.end_date)
      });
    } else {
      setDateRange(undefined);
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setCurrentPromotion(null);
    setIsEditing(false);
    setIsDialogOpen(false);
    setDateRange(undefined);
  };
  
  const handleSavePromotion = async () => {
    if (!currentPromotion) return;
    
    if (!currentPromotion.name?.trim() || !currentPromotion.code?.trim()) {
      toast({
        title: "Validation Error",
        description: "Promotion name and code are required",
        variant: "destructive"
      });
      return;
    }
    
    let updatedPromotion = { ...currentPromotion };
    if (dateRange?.from) {
      updatedPromotion.start_date = dateRange.from.toISOString();
      updatedPromotion.end_date = (dateRange.to || dateRange.from).toISOString();
    } else {
      updatedPromotion.start_date = null;
      updatedPromotion.end_date = null;
    }
    
    setIsLoading(true);
    try {
      let result: PricingPromotion | null = null;
      if (isEditing && updatedPromotion.id) {
        const { id, created_at, updated_at, times_used, ...updateData } = updatedPromotion;
        result = await updatePricingPromotion(id, updateData);
      } else {
        const { id, created_at, updated_at, ...createData } = updatedPromotion;
        result = await createPricingPromotion(createData as any);
      }
      
      if (result) {
        const updatedPromotions = await getPricingPromotions(false);
        setPromotions(updatedPromotions);
        handleCloseDialog();
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
      const success = await deletePricingPromotion(id);
      if (success) {
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
      const result = await updatePricingPromotion(id, { is_active: isActive });
      if (result) {
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
      setCurrentPromotion({ ...currentPromotion, [field]: value });
    }
  };
  
  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start) return "No date limit";
    const startDate = new Date(start);
    if (!end || start === end) return format(startDate, "PPP");
    const endDate = new Date(end);
    return `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`;
  };
  
  const getPromotionStatus = (promotion: PricingPromotion) => {
    if (!promotion.is_active) return "inactive";
    if (promotion.end_date && new Date(promotion.end_date) < new Date()) return "expired";
    if (promotion.start_date && new Date(promotion.start_date) > new Date()) return "scheduled";
    return "active";
  };
  
  const getStatusBadgeLabel = (status: string) => {
    switch (status) {
      case "active":
        return t('common.status.active');
      case "inactive":
        return t('common.status.inactive');
      case "expired":
        return t('pricing.promotions.status.expired',{'default':'Expired'});
      case "scheduled":
        return t('pricing.promotions.status.scheduled',{'default':'Scheduled'});
      default:
        return status;
    }
  };

  const renderPromotionDialog = () => {
    if (!isDialogOpen || !currentPromotion) return null;
    
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the promotion details below" : "Fill in the details to create a new promotion"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-name">Promotion Name</Label>
                <Input id="promo-name" placeholder="Enter promotion name" value={currentPromotion.name || ""} onChange={(e) => handleInputChange("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-code">Promo Code</Label>
                <Input id="promo-code" placeholder="e.g. SUMMER2023" value={currentPromotion.code || ""} onChange={(e) => handleInputChange("code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-description">Description</Label>
                <Textarea id="promo-description" placeholder="Enter promotion description" value={currentPromotion.description || ""} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Valid Period</Label>
                <CalendarDateRangePicker date={dateRange} onSelect={setDateRange} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select value={currentPromotion.discount_type || "percentage"} onValueChange={(value) => handleInputChange("discount_type", value)}>
                    <SelectTrigger id="discount-type"><SelectValue placeholder="Select type" /></SelectTrigger>
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
                      {currentPromotion.discount_type === "percentage" ? <Percent className="h-4 w-4 text-gray-400" /> : <DollarSign className="h-4 w-4 text-gray-400" />}
                    </div>
                    <Input id="discount-value" type="number" min="0" className="pl-10" value={currentPromotion.discount_value || 0} onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Applicable Services</Label>
                <ScrollArea className="h-24 rounded-md border p-2">
                  {allServiceTypes.map(serviceType => (
                    <div key={serviceType.id} className="flex items-center space-x-2">
                      <Checkbox id={`service-${serviceType.id}`} checked={(currentPromotion.applicable_service_type_ids || []).includes(serviceType.id)} onCheckedChange={(checked) => {
                        const currentSelectedIds = [...(currentPromotion.applicable_service_type_ids || [])];
                        if (checked) {
                          if (!currentSelectedIds.includes(serviceType.id)) currentSelectedIds.push(serviceType.id);
                        } else {
                          const index = currentSelectedIds.indexOf(serviceType.id);
                          if (index > -1) currentSelectedIds.splice(index, 1);
                        }
                        handleInputChange("applicable_service_type_ids", currentSelectedIds);
                      }} />
                      <Label htmlFor={`service-${serviceType.id}`} className="text-sm cursor-pointer">{serviceType.name}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>Applicable Vehicles</Label>
                <ScrollArea className="h-24 rounded-md border p-2">
                  {vehicleTypes.map(vehicle => (
                    <div key={vehicle} className="flex items-center space-x-2">
                      <Checkbox id={`vehicle-${vehicle}`} checked={(currentPromotion.applicable_vehicle_types || []).includes(vehicle)} onCheckedChange={(checked) => {
                        const vehicles = [...(currentPromotion.applicable_vehicle_types || [])];
                        if (checked) {
                          if (!vehicles.includes(vehicle)) vehicles.push(vehicle);
                        } else {
                          const index = vehicles.indexOf(vehicle);
                          if (index > -1) vehicles.splice(index, 1);
                        }
                        handleInputChange("applicable_vehicle_types", vehicles);
                      }} />
                      <Label htmlFor={`vehicle-${vehicle}`} className="text-sm cursor-pointer">{vehicle}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="is-active" checked={currentPromotion.is_active} onCheckedChange={(checked) => handleInputChange("is_active", !!checked)} />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSavePromotion}>{isEditing ? "Update Promotion" : "Create Promotion"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-semibold leading-none">{t('pricing.promotions.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('pricing.promotions.description')}</p>
        </div>
        <Button onClick={handleCreatePromotion} className="shrink-0 mt-2">
          <Plus className="h-4 w-4 mr-2" />
          {t('pricing.promotions.create')}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Loading promotions...</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No promotions found</p>
          <Button variant="outline" className="mt-4" onClick={handleCreatePromotion}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first promotion
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">{t('common.actions.default')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map(promotion => {
                const status = getPromotionStatus(promotion);
                
                const applicableServices = promotion.applicable_service_type_ids && promotion.applicable_service_type_ids.length > 0
                  ? promotion.applicable_service_type_ids.map(id => allServiceTypes.find(s => s.id === id)?.name || id).join(', ')
                  : 'All Services';
                
                const applicableVehicles = promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0
                  ? promotion.applicable_vehicle_types.join(', ')
                  : 'All Vehicles';

                return (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="font-medium">{promotion.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {promotion.code}</div>
                    </TableCell>
                    <TableCell>
                      {promotion.discount_type === 'percentage'
                        ? `${promotion.discount_value}%`
                        : `${promotion.discount_value} JPY`}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{applicableServices}</div>
                      <div className="text-xs text-muted-foreground">{applicableVehicles}</div>
                    </TableCell>
                    <TableCell>{formatDateRange(promotion.start_date, promotion.end_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getStatusBadgeClasses(status))}
                      >
                        {getStatusBadgeLabel(status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePromotionStatus(promotion.id, !promotion.is_active)}
                        >
                          {promotion.is_active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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
                          className="text-destructive"
                          onClick={() => handleDeletePromotion(promotion.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {renderPromotionDialog()}
    </div>
  );
} 