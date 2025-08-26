'use client';

import { useState, useEffect } from "react";
import { PricingPromotion, DiscountType, ServiceTypeInfo } from "@/types/quotations";
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { createBrowserClient } from "@supabase/ssr";
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles";
import { toast } from "@/components/ui/use-toast";
import { PricingTabHeader, StatusBadge } from './pricing-tab-header';
import { PricingResponsiveTable, PricingTableHeader, PricingTableHead, PricingTableRow, PricingTableCell } from './pricing-responsive-table';

// Type definitions
interface TimeBasedRule {
  id?: string;
  name: string;
  category_id: string | null;
  service_type_id: string | null;
  start_time: string;
  end_time: string;
  days_of_week: string[] | null;
  adjustment_percentage: number;
  priority: number;
  is_active: boolean;
  description?: string | null;
}

interface PricingCategory {
  id: string;
  name: string;
  service_type_ids?: string[];
}

// Custom hook to fetch categories and service types
const usePricingData = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('pricing_categories')
          .select('*')
          .order('name');

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
        }

        // Fetch service types
        const { data: serviceTypesData, error: serviceTypesError } = await supabase
          .from('service_types')
          .select('*')
          .order('name');

        if (serviceTypesError) {
          console.error('Error fetching service types:', serviceTypesError);
          setServiceTypes([]);
        } else {
          setServiceTypes(serviceTypesData || []);
        }
      } catch (error) {
        console.error('Error in usePricingData:', error);
        setCategories([]);
        setServiceTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { categories, serviceTypes, loading };
};

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
      name: '',
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      applicable_service_type_ids: [],
      applicable_vehicle_types: [],
      start_date: null,
      end_date: null,
      is_active: true
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditPromotion = (promotion: PricingPromotion) => {
    setCurrentPromotion({ ...promotion });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      const success = await deletePricingPromotion(id);
      if (success) {
        setPromotions(prev => prev.filter(p => p.id !== id));
        toast({
          title: "Success",
          description: "Promotion deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast({
        title: "Error",
        description: "Failed to delete promotion.",
        variant: "destructive",
      });
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{isEditing ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the promotion details below" : "Fill in the details to create a new promotion"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="promo-name">Promotion Name *</Label>
                    <Input 
                      id="promo-name" 
                      placeholder="Enter promotion name" 
                      value={currentPromotion.name || ""} 
                      onChange={(e) => handleInputChange("name", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promo-code">Promo Code *</Label>
                    <Input 
                      id="promo-code" 
                      placeholder="e.g. SUMMER2023" 
                      value={currentPromotion.code || ""} 
                      onChange={(e) => handleInputChange("code", e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-description">Description</Label>
                  <Textarea 
                    id="promo-description" 
                    placeholder="Enter promotion description" 
                    value={currentPromotion.description || ""} 
                    onChange={(e) => handleInputChange("description", e.target.value)} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Configuration Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Discount Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <Select 
                      value={currentPromotion.discount_type || "percentage"} 
                      onValueChange={(value) => handleInputChange("discount_type", value)}
                    >
                      <SelectTrigger id="discount-type">
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-value">Discount Value *</Label>
                    <Input 
                      id="discount-value" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      placeholder={currentPromotion.discount_type === 'percentage' ? "e.g. 15" : "e.g. 1000"} 
                      value={currentPromotion.discount_value || ""} 
                      onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value))} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {currentPromotion.discount_type === 'percentage' ? "Enter percentage (e.g., 15 for 15%)" : "Enter amount in JPY"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validity Period Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Valid Period</Label>
                  <CalendarDateRangePicker date={dateRange} onSelect={setDateRange} />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no date limit
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Applicable Services & Vehicles Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Applicable Services
                  </CardTitle>
                  <CardDescription>
                    Select specific services or leave empty for all services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                                              {allServiceTypes.map(serviceType => (
                          <div key={serviceType.id} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`service-${serviceType.id}`} 
                              checked={(currentPromotion.applicable_service_type_ids || []).includes(serviceType.id)} 
                              onChange={(e) => {
                                const currentSelectedIds = [...(currentPromotion.applicable_service_type_ids || [])];
                                if (e.target.checked) {
                                  if (!currentSelectedIds.includes(serviceType.id)) currentSelectedIds.push(serviceType.id);
                                } else {
                                  const index = currentSelectedIds.indexOf(serviceType.id);
                                  if (index > -1) currentSelectedIds.splice(index, 1);
                                }
                                handleInputChange("applicable_service_type_ids", currentSelectedIds);
                              }} 
                              title={`Select ${serviceType.name} service type`}
                            />
                            <Label htmlFor={`service-${serviceType.id}`} className="text-sm cursor-pointer">
                              {serviceType.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Applicable Vehicles
                  </CardTitle>
                  <CardDescription>
                    Select specific vehicle types or leave empty for all vehicles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                                              {vehicleTypes.map(vehicle => (
                          <div key={vehicle} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`vehicle-${vehicle}`} 
                              checked={(currentPromotion.applicable_vehicle_types || []).includes(vehicle)} 
                              onChange={(e) => {
                                const vehicles = [...(currentPromotion.applicable_vehicle_types || [])];
                                if (e.target.checked) {
                                  if (!vehicles.includes(vehicle)) vehicles.push(vehicle);
                                } else {
                                  const index = vehicles.indexOf(vehicle);
                                  if (index > -1) vehicles.splice(index, 1);
                                }
                                handleInputChange("applicable_vehicle_types", vehicles);
                              }} 
                              title={`Select ${vehicle} vehicle type`}
                            />
                            <Label htmlFor={`vehicle-${vehicle}`} className="text-sm cursor-pointer">
                              {vehicle}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Additional Settings Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Additional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-uses">Maximum Uses</Label>
                    <Input 
                      id="max-uses" 
                      type="number" 
                      min="0" 
                      placeholder="Leave empty for unlimited" 
                      value="" 
                      onChange={(e) => {}} 
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Feature coming soon
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-order-value">Minimum Order Value</Label>
                    <Input 
                      id="min-order-value" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      placeholder="Leave empty for no minimum" 
                      value="" 
                      onChange={(e) => {}} 
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Feature coming soon
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is-featured" 
                    checked={false} 
                    onChange={(e) => {}} 
                    title="Mark as featured promotion"
                    disabled
                  />
                  <Label htmlFor="is-featured">Featured Promotion</Label>
                  <span className="text-xs text-muted-foreground">(Coming soon)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is-active" 
                    checked={currentPromotion.is_active || false} 
                    onChange={(e) => handleInputChange("is_active", e.target.checked)} 
                    title="Set promotion as active"
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (isEditing && currentPromotion.id) {
                  const success = await updatePricingPromotion(currentPromotion.id, currentPromotion);
                  if (success) {
                    toast({
                      title: "Success",
                      description: "Promotion updated successfully.",
                    });
                    setIsDialogOpen(false);
                    // Refresh the list
                    const updatedPromotions = await getPricingPromotions(false);
                    setPromotions(updatedPromotions);
                  }
                } else {
                  const success = await createPricingPromotion(currentPromotion as PricingPromotion);
                  if (success) {
                    toast({
                      title: "Success",
                      description: "Promotion created successfully.",
                    });
                    setIsDialogOpen(false);
                    // Refresh the list
                    const updatedPromotions = await getPricingPromotions(false);
                    setPromotions(updatedPromotions);
                  }
                }
              } catch (error) {
                console.error("Error saving promotion:", error);
                toast({
                  title: "Error",
                  description: "Failed to save promotion.",
                  variant: "destructive",
                });
              }
            }}>
              {isEditing ? "Update Promotion" : "Create Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <PricingTabHeader
          title={t('pricing.promotions.title')}
          description={t('pricing.promotions.description')}
          icon={<Percent className="h-5 w-5" />}
          badges={
            <>
              {!isLoading && promotions.length > 0 && (
                <StatusBadge type="info">⚡ {promotions.length} promotions loaded</StatusBadge>
              )}
            </>
          }
          actions={
            <Button onClick={handleCreatePromotion} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              {t('pricing.promotions.create')}
            </Button>
          }
        />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Loading Promotions</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch your promotions...</p>
                </div>
              </div>
            </div>
          ) : promotions.length === 0 ? (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Percent className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Promotions Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Get started by creating your first promotion to offer discounts and special pricing.
                  </p>
                </div>
                <Button onClick={handleCreatePromotion} variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Promotion
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <PricingResponsiveTable>
                <PricingTableHeader>
                  <PricingTableHead>Promotion</PricingTableHead>
                  <PricingTableHead>Discount</PricingTableHead>
                  <PricingTableHead>Applicable To</PricingTableHead>
                  <PricingTableHead>Validity Period</PricingTableHead>
                  <PricingTableHead className="text-center">Status</PricingTableHead>
                  <PricingTableHead className="text-right">Actions</PricingTableHead>
                </PricingTableHeader>
                <TableBody>
                  {promotions.map((promotion, index) => {
                    const status = getPromotionStatus(promotion);
                    
                    const applicableServices = promotion.applicable_service_type_ids && promotion.applicable_service_type_ids.length > 0
                      ? promotion.applicable_service_type_ids.map(id => allServiceTypes.find(s => s.id === id)?.name || id).join(', ')
                      : 'All Services';
                    
                    const applicableVehicles = promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0
                      ? promotion.applicable_vehicle_types.join(', ')
                      : 'All Vehicles';

                    return (
                      <PricingTableRow key={promotion.id} index={index}>
                        <PricingTableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{promotion.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: <span className="font-mono font-medium">{promotion.code}</span>
                            </div>
                            {promotion.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {promotion.description}
                              </div>
                            )}
                          </div>
                        </PricingTableCell>
                        <PricingTableCell>
                          <div className="flex items-center gap-2">
                            {promotion.discount_type === 'percentage' ? (
                              <Percent className="h-4 w-4 text-primary" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-primary" />
                            )}
                            <div>
                              <div className="font-semibold text-primary">
                                {promotion.discount_type === 'percentage'
                                  ? `${promotion.discount_value}%`
                                  : `${promotion.discount_value} JPY`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {promotion.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                              </div>
                            </div>
                          </div>
                        </PricingTableCell>
                        <PricingTableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-muted-foreground">Services:</span>
                            </div>
                            <div className="text-sm text-foreground">{applicableServices}</div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-muted-foreground">Vehicles:</span>
                            </div>
                            <div className="text-sm text-foreground">{applicableVehicles}</div>
                          </div>
                        </PricingTableCell>
                        <PricingTableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateRange(promotion.start_date, promotion.end_date)}</span>
                          </div>
                        </PricingTableCell>
                        <PricingTableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn('text-xs px-3 py-1.5 font-medium', getStatusBadgeClasses(status))}
                          >
                            {getStatusBadgeLabel(status)}
                          </Badge>
                        </PricingTableCell>
                        <PricingTableCell className="text-right">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleTogglePromotionStatus(promotion.id, !promotion.is_active)}
                              title={promotion.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {promotion.is_active ? <Ban className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                              {promotion.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleEditPromotion(promotion)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive hover:bg-red-50"
                              onClick={() => handleDeletePromotion(promotion.id)}
                              title="Delete"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </PricingTableCell>
                      </PricingTableRow>
                    );
                  })}
                </TableBody>
              </PricingResponsiveTable>
            </div>
          )}
        </CardContent>
      </Card>
      
      {renderPromotionDialog()}
    </div>
  );
} 