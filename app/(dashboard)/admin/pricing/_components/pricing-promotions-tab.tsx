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
  const [vehicleCategories, setVehicleCategories] = useState<string[]>([]);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  
  const { getPricingPromotions, getPricingItems, createPricingPromotion, updatePricingPromotion, deletePricingPromotion, getServiceTypes } = useQuotationService();
  const { categories, serviceTypes } = usePricingData();
  const { t } = useI18n();
  
  // Check mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
    async function loadVehicleData() {
      try {
        // Fetch actual vehicles from the database
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('brand, model, name')
          .order('brand')
          .order('model');

        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
          setVehicleTypes([]);
        } else {
          // Create unique vehicle type identifiers
          const uniqueVehicleTypes = Array.from(
            new Set(vehiclesData?.map(v => `${v.brand} ${v.model}`.trim()).filter(Boolean) || [])
          );
          setVehicleTypes(uniqueVehicleTypes);
          console.log('Loaded vehicle types from database:', uniqueVehicleTypes);
        }
        
        // Get vehicle categories from categories
        const uniqueVehicleCategories = Array.from(
          new Set(categories.map(cat => cat.name).filter(Boolean))
        );
        setVehicleCategories(uniqueVehicleCategories);
        console.log('Loaded vehicle categories from categories:', uniqueVehicleCategories);
      } catch (error) {
        console.error("Error loading vehicle data:", error);
        setVehicleTypes([]);
        setVehicleCategories([]);
      }
    }
    
    loadVehicleData();
  }, [categories]);
  
  const handleCreatePromotion = () => {
    setCurrentPromotion({
      name: '',
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      applicable_service_type_ids: [],
      applicable_vehicle_types: [],
      applicable_vehicle_categories: [],
      max_uses: null,
      min_order_value: null,
      is_featured: false,
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

  // Mobile card component
  const PromotionMobileCard = ({ promotion, index }: { promotion: PricingPromotion; index: number }) => {
    const status = getPromotionStatus(promotion);
    
    const applicableServices = promotion.applicable_service_type_ids && promotion.applicable_service_type_ids.length > 0
      ? promotion.applicable_service_type_ids.map(id => allServiceTypes.find(s => s.id === id)?.name || id).join(', ')
      : 'All Services';
    
    const applicableCategories = promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0
      ? promotion.applicable_vehicle_types.join(', ')
      : 'All Categories';
    
    const applicableVehicles = promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0
      ? promotion.applicable_vehicle_types.join(', ')
      : 'All Vehicles';

    return (
      <Card className="hover:shadow-md transition-all duration-200 border-border/50">
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header with name and code */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg leading-tight">{promotion.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                    {promotion.code}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-xs px-3 py-1.5 font-medium ml-2', getStatusBadgeClasses(status))}
                >
                  {getStatusBadgeLabel(status)}
                </Badge>
              </div>
              {promotion.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {promotion.description}
                </p>
              )}
            </div>

            {/* Discount - Enhanced */}
            <div className="bg-gradient-to-br from-green-900/90 via-green-800/70 to-green-700/50 rounded-lg p-4 border border-green-500/60 shadow-md">
              <div className="text-xs font-medium text-green-300 uppercase tracking-wide mb-3 font-semibold">
                Discount
              </div>
              <div className="flex items-center gap-4">
                {promotion.discount_type === 'percentage' ? (
                  <div className="w-12 h-12 bg-green-700/80 rounded-full flex items-center justify-center shadow-inner border border-green-500/60">
                    <Percent className="h-6 w-6 text-green-200" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-green-700/80 rounded-full flex items-center justify-center shadow-inner border border-green-500/60">
                    <DollarSign className="h-6 w-6 text-green-200" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-3xl text-green-100">
                    {promotion.discount_type === 'percentage'
                      ? `${promotion.discount_value}%`
                      : `${promotion.discount_value} JPY`}
                  </div>
                  <div className="text-sm text-green-200 font-medium">
                    {promotion.discount_type === 'percentage' ? 'Percentage Discount' : 'Fixed Amount Discount'}
                  </div>
                </div>
              </div>
            </div>

            {/* Applicable To - Enhanced */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Applicable Services
                </div>
                <div className="text-sm text-foreground bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
                  {applicableServices}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Applicable Categories
                </div>
                <div className="text-sm text-foreground bg-purple-50 dark:bg-purple-950/20 px-3 py-2 rounded border border-purple-200 dark:border-purple-800">
                  {applicableCategories}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Applicable Vehicles
                </div>
                <div className="text-sm text-foreground bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded border border-green-200 dark:border-green-800">
                  {applicableVehicles}
                </div>
              </div>
            </div>

            {/* Validity Period - Enhanced */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Validity Period
              </div>
              <div className="text-sm text-foreground bg-muted/30 px-3 py-2 rounded border">
                {formatDateRange(promotion.start_date, promotion.end_date)}
              </div>
            </div>

            {/* Additional Settings - Enhanced */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Additional Settings
              </div>
              
              {/* Max Uses & Min Order Value */}
              <div className="grid grid-cols-2 gap-3">
                {promotion.max_uses && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded border border-orange-200 dark:border-orange-800">
                    <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Max Uses</div>
                    <div className="text-sm text-foreground">{promotion.max_uses}</div>
                  </div>
                )}
                {promotion.min_order_value && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Min Order Value</div>
                    <div className="text-sm text-foreground">¥{promotion.min_order_value.toLocaleString()}</div>
                  </div>
                )}
              </div>
              
              {/* Featured Badge */}
              {promotion.is_featured && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Featured Promotion
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Enhanced */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-10 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => handleTogglePromotionStatus(promotion.id, !promotion.is_active)}
                title={promotion.is_active ? 'Deactivate' : 'Activate'}
              >
                {promotion.is_active ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Deactivate</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Activate</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-10 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => handleEditPromotion(promotion)}
                title="Edit"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                onClick={() => handleDeletePromotion(promotion.id)}
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Applicable Services, Categories & Vehicles Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <div key={`service-${serviceType.id}`} className="flex items-center space-x-2">
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Applicable Categories
                  </CardTitle>
                  <CardDescription>
                    Select specific vehicle categories or leave empty for all categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-2">
                      {vehicleCategories.length > 0 ? (
                        vehicleCategories.map(category => (
                          <div key={`category-${category}`} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`category-${category}`} 
                              checked={(currentPromotion.applicable_vehicle_types || []).includes(category)} 
                              onChange={(e) => {
                                const categories = [...(currentPromotion.applicable_vehicle_types || [])];
                                if (e.target.checked) {
                                  if (!categories.includes(category)) categories.push(category);
                                } else {
                                  const index = categories.indexOf(category);
                                  if (index > -1) categories.splice(index, 1);
                                }
                                handleInputChange("applicable_vehicle_types", categories);
                              }} 
                              title={`Select ${category} vehicle category`}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                              {category}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          No vehicle categories found
                        </div>
                      )}
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
                      {vehicleTypes.length > 0 ? (
                        vehicleTypes.map(vehicle => (
                          <div key={`vehicle-${vehicle}`} className="flex items-center space-x-2">
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
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          No vehicle types found
                        </div>
                      )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-uses">Maximum Uses</Label>
                    <Input 
                      id="max-uses" 
                      type="number" 
                      min="0" 
                      placeholder="Leave empty for unlimited" 
                      value={currentPromotion.max_uses || ""} 
                      onChange={(e) => handleInputChange("max_uses", e.target.value ? parseInt(e.target.value, 10) : null)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Set maximum number of times this promotion can be used. Leave empty for unlimited.
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
                      value={currentPromotion.min_order_value || ""} 
                      onChange={(e) => handleInputChange("min_order_value", e.target.value ? parseFloat(e.target.value) : null)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Set minimum order value required to use this promotion. Leave empty for no minimum.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is-featured" 
                    checked={currentPromotion.is_featured || false} 
                    onChange={(e) => handleInputChange("is_featured", e.target.checked)} 
                    title="Mark as featured promotion"
                  />
                  <Label htmlFor="is-featured">Featured Promotion</Label>
                  <span className="text-xs text-muted-foreground">(Will be highlighted in customer interface)</span>
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
            <Button onClick={handleCreatePromotion} variant="default" className="h-10 px-4">
              <Plus className="mr-2 h-4 w-4" /> 
              <span className="hidden sm:inline">{t('pricing.promotions.create')}</span>
              <span className="sm:hidden">Create</span>
            </Button>
          }
        />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/40 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-semibold text-foreground">Loading Promotions</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Please wait while we fetch your promotional offers and discounts...</p>
                </div>
              </div>
            </div>
          ) : promotions.length === 0 ? (
            <div className="bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 border border-muted rounded-xl p-16 text-center">
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Percent className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">No Promotions Found</h3>
                  <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
                    Start building your promotional strategy by creating your first discount offer. 
                    Attract customers with special pricing and boost your sales.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleCreatePromotion} variant="default" size="lg" className="h-12 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Promotion
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-6">
                    <Percent className="h-5 w-5 mr-2" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              {isMobileView ? (
                // Mobile Cards View
                <div className="space-y-4">
                  {promotions.map((promotion, index) => (
                    <PromotionMobileCard key={promotion.id} promotion={promotion} index={index} />
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <PricingResponsiveTable>
                  <PricingTableHeader>
                    <PricingTableHead>Promotion</PricingTableHead>
                    <PricingTableHead>Discount</PricingTableHead>
                    <PricingTableHead>Applicable To</PricingTableHead>
                    <PricingTableHead>Additional Settings</PricingTableHead>
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
                      
                      const applicableCategories = promotion.applicable_vehicle_types && promotion.applicable_vehicle_types.length > 0
                        ? promotion.applicable_vehicle_types.join(', ')
                        : 'All Categories';
                      
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
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Categories:</span>
                              </div>
                              <div className="text-sm text-foreground">{applicableCategories}</div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Vehicles:</span>
                              </div>
                              <div className="text-sm text-foreground">{applicableVehicles}</div>
                            </div>
                          </PricingTableCell>
                          <PricingTableCell>
                            <div className="space-y-2">
                              {promotion.max_uses && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="text-xs text-muted-foreground">Max Uses:</span>
                                  <span className="text-sm font-medium">{promotion.max_uses}</span>
                                </div>
                              )}
                              {promotion.min_order_value && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-xs text-muted-foreground">Min Order:</span>
                                  <span className="text-sm font-medium">¥{promotion.min_order_value.toLocaleString()}</span>
                                </div>
                              )}
                              {promotion.is_featured && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-xs text-yellow-600 font-medium">Featured</span>
                                </div>
                              )}
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {renderPromotionDialog()}
    </div>
  );
}