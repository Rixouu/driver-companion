"use client";

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PACKAGE_SERVICE_TYPE_ID } from '@/lib/constants/service-types';
import { Car, Calendar, Settings, Package, Plus, List, Timer, PencilIcon, Copy, Trash, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { ServiceCard } from '@/components/quotations/service-card';

// Import types
import { 
  ServiceItemInput,
  ServiceTypeInfo,
  PricingCategory,
  PricingItem,
  PricingPackage
} from '@/types/quotations';

interface ServiceSelectionStepProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  setServiceItems: (items: ServiceItemInput[]) => void;
  packages: PricingPackage[];
  selectedPackage: PricingPackage | null;
  setSelectedPackage: (pkg: PricingPackage | null) => void;
  allServiceTypes: ServiceTypeInfo[];
  pricingCategories: PricingCategory[];
  pricingItems: PricingItem[];
  calculateQuotationAmount: (
    serviceType: string,
    vehicleType: string,
    duration: number,
    discount: number,
    tax: number,
    days: number,
    hoursPerDay?: number
  ) => Promise<{ baseAmount: number; totalAmount: number; currency: string }>;
}

export function ServiceSelectionStep({
  form,
  serviceItems,
  setServiceItems,
  packages,
  selectedPackage,
  setSelectedPackage,
  allServiceTypes,
  pricingCategories,
  pricingItems,
  calculateQuotationAmount
}: ServiceSelectionStepProps) {
  const { t } = useI18n();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [serviceTimeBasedPricing, setServiceTimeBasedPricing] = useState<boolean>(true);

  // Watch form values
  const serviceType = form.watch('service_type');
  const vehicleCategory = form.watch('vehicle_category');
  const vehicleType = form.watch('vehicle_type');
  const serviceDays = form.watch('service_days');
  const hoursPerDay = form.watch('hours_per_day');

  // Helper functions
  const getAvailableServiceTypes = (): ServiceTypeInfo[] => {
    return allServiceTypes.length > 0 ? allServiceTypes : [
      { id: 'charter', name: 'Charter Services (Hourly)' },
      { id: 'airportTransferHaneda', name: 'Airport Transfer - Haneda' },
      { id: 'airportTransferNarita', name: 'Airport Transfer - Narita' }
    ];
  };

  const getVehicleCategories = () => {
    return [
      { id: 'platinum', name: 'Platinum' },
      { id: 'luxury', name: 'Luxury' },
      { id: 'premium', name: 'Premium' }
    ];
  };

  const getVehicleTypesForCategory = () => {
    if (!vehicleCategory) return [];
    
    switch (vehicleCategory) {
      case 'platinum':
        return [
          'Mercedes Benz V Class - Black Suite',
          'Toyota Alphard Executive Lounge'
        ];
      case 'luxury':
        return [
          'Mercedes Benz V class - Extra Long',
          'Toyota Alphard Z class'
        ];
      case 'premium':
        return [
          'Toyota Hi-Ace Grand Cabin'
        ];
      default:
        return [];
    }
  };

  const getDurationsForServiceAndVehicle = () => {
    if (!serviceType) return [];
    
    if (serviceType.includes('airportTransfer')) {
      return [1];
    }
    
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  const selectedServiceTypeObject = allServiceTypes.find(st => st.id === serviceType);

  // Format currency function
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate time-based adjustment function
  const calculateTimeBasedAdjustment = (pickupTime: string, pickupDate?: Date) => {
    if (!pickupTime) return { adjustment: 0, ruleName: null };
    
    const hour = parseInt(pickupTime.split(':')[0]);
    const minute = parseInt(pickupTime.split(':')[1] || '0');
    const timeInMinutes = hour * 60 + minute;
    
    // Convert pickup date to day of week
    const dayOfWeek = pickupDate ? 
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][pickupDate.getDay()] :
      'monday'; // default to monday if no date
    
    // Check Overtime rule: 22:00-06:00, all days, +25%
    const overtimeStart = 22 * 60; // 22:00 in minutes
    const overtimeEnd = 6 * 60; // 06:00 in minutes
    
    if (timeInMinutes >= overtimeStart || timeInMinutes <= overtimeEnd) {
      return { adjustment: 25, ruleName: 'Overtime' };
    }
    
    // Check Morning Happy Hours: 06:00-08:00, weekdays, -25%
    const morningStart = 6 * 60; // 06:00 in minutes
    const morningEnd = 8 * 60; // 08:00 in minutes
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    if (timeInMinutes >= morningStart && timeInMinutes < morningEnd && weekdays.includes(dayOfWeek)) {
      return { adjustment: -25, ruleName: 'Morning Happy Hours' };
    }
    
    return { adjustment: 0, ruleName: null };
  };

  // Handle package selection
  const handlePackageSelect = (pkg: PricingPackage) => {
    if (selectedPackage?.id === pkg.id) {
      setSelectedPackage(null);
    } else {
      setSelectedPackage(pkg);
    }
  };

  // Handle adding package to services
  const handleAddPackage = async (pkg: PricingPackage) => {
    const pickupDate = form.watch('pickup_date');
    const pickupTime = form.watch('pickup_time');

    if (!pickupDate || !pickupTime) {
      toast({
        title: t('quotations.notifications.error'),
        description: 'Please select pickup date and time for the package',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCalculating(true);

      // No time-based pricing for packages
      const { adjustment: timeBasedAdjustment, ruleName } = { adjustment: 0, ruleName: null };
      const adjustedPackagePrice = pkg.base_price;

      // Create description with included services
      let packageDescription = `Package: ${pkg.name}`;
      if (pkg.items && pkg.items.length > 0) {
        const serviceNames = pkg.items.map(item => item.name).join(', ');
        packageDescription = `${pkg.name} (${serviceNames})`;
      } else if (pkg.description) {
        packageDescription = `${pkg.name} - ${pkg.description}`;
      }

      const newPackageItem: ServiceItemInput = {
        service_type_id: PACKAGE_SERVICE_TYPE_ID,
        service_type_name: pkg.name,
        vehicle_type: 'Package',
        vehicle_category: 'package',
        duration_hours: 1,
        unit_price: pkg.base_price,
        quantity: 1,
        total_price: adjustedPackagePrice,
        service_days: undefined,
        hours_per_day: undefined,
        description: packageDescription,
        sort_order: serviceItems.length,
        is_service_item: false,
        pickup_date: format(pickupDate, 'yyyy-MM-dd'),
        pickup_time: pickupTime,
        time_based_adjustment: timeBasedAdjustment !== 0 ? timeBasedAdjustment : undefined,
        time_based_rule_name: ruleName || undefined,
      };

      setServiceItems([...serviceItems, newPackageItem]);
      form.setValue('pickup_date', undefined);
      form.setValue('pickup_time', '');
      setSelectedPackage(null);

      toast({
        title: t('quotations.notifications.success'),
        description: `Package added${ruleName ? ` with ${ruleName} pricing` : ''} successfully`,
      });
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: t('quotations.form.error'),
        description: 'Failed to add package',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle adding service item
  const handleAddServiceItem = async () => {
    try {
      setIsCalculating(true);
      
      const effectiveServiceType = serviceType || "placeholder-service";
      const effectiveVehicleType = vehicleType || "Standard Vehicle";
      const effectiveVehicleCategory = vehicleCategory || "standard";
      
      const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
      const effectiveDuration = isCharter ? hoursPerDay || 1 : 1;
      
      const pricingResult = await calculateQuotationAmount(
        effectiveServiceType,
        effectiveVehicleType,
        effectiveDuration,
        0,
        0,
        serviceDays || 1,
        hoursPerDay
      );
      
      const pickupDate = form.watch('pickup_date');
      const pickupTime = form.watch('pickup_time');
      
      // Calculate time-based adjustment using actual rules
      const { adjustment: timeBasedAdjustment, ruleName } = serviceTimeBasedPricing 
        ? calculateTimeBasedAdjustment(pickupTime, pickupDate)
        : { adjustment: 0, ruleName: null };
      
      const baseServicePrice = pricingResult.baseAmount * (serviceDays || 1);
      const adjustedPrice = baseServicePrice * (1 + timeBasedAdjustment / 100);

      const newItem: ServiceItemInput = {
        service_type_id: effectiveServiceType,
        service_type_name: selectedServiceTypeObject?.name || 'Service',
        vehicle_type: effectiveVehicleType,
        vehicle_category: effectiveVehicleCategory,
        duration_hours: effectiveDuration,
        unit_price: pricingResult.baseAmount,
        quantity: 1,
        total_price: adjustedPrice,
        service_days: serviceDays || 1,
        hours_per_day: effectiveDuration,
        description: `${selectedServiceTypeObject?.name || 'Service'} - ${effectiveVehicleType}`,
        sort_order: serviceItems.length,
        is_service_item: true,
        pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : null,
        pickup_time: pickupTime || null,
        time_based_adjustment: timeBasedAdjustment !== 0 ? timeBasedAdjustment : undefined,
        time_based_rule_name: ruleName || undefined,
      };
      
      setServiceItems([...serviceItems, newItem]);
      
      // Clear form fields
      form.setValue('service_type', '');
      form.setValue('vehicle_category', '');
      form.setValue('vehicle_type', '');
      form.setValue('service_days', 1);
      form.setValue('hours_per_day', undefined);
      form.setValue('pickup_date', undefined);
      form.setValue('pickup_time', '');
      
      toast({
        title: t('quotations.form.serviceAdded'),
        description: `Service added${ruleName ? ` with ${ruleName} pricing` : ''} successfully`
      });
    } catch (error) {
      console.error('Error adding service item:', error);
      toast({
        title: t('quotations.form.error'),
        description: t('quotations.form.errorAddingService'),
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle updating service item
  const handleUpdateServiceItem = async (index: number) => {
    try {
      setIsCalculating(true);
      
      const effectiveServiceType = serviceType || "placeholder-service";
      const effectiveVehicleType = vehicleType || "Standard Vehicle";
      const effectiveVehicleCategory = vehicleCategory || "standard";
      
      const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
      const effectiveDuration = isCharter ? hoursPerDay || 1 : 1;
      
      const pricingResult = await calculateQuotationAmount(
        effectiveServiceType,
        effectiveVehicleType,
        effectiveDuration,
        0,
        0,
        serviceDays || 1,
        hoursPerDay
      );
      
      const pickupDate = form.watch('pickup_date');
      const pickupTime = form.watch('pickup_time');
      
      // Calculate time-based adjustment using actual rules
      const { adjustment: timeBasedAdjustment, ruleName } = serviceTimeBasedPricing 
        ? calculateTimeBasedAdjustment(pickupTime, pickupDate)
        : { adjustment: 0, ruleName: null };
      
      const baseServicePrice = pricingResult.baseAmount * (serviceDays || 1);
      const adjustedPrice = baseServicePrice * (1 + timeBasedAdjustment / 100);

      const updatedItem: ServiceItemInput = {
        service_type_id: effectiveServiceType,
        service_type_name: selectedServiceTypeObject?.name || 'Service',
        vehicle_type: effectiveVehicleType,
        vehicle_category: effectiveVehicleCategory,
        duration_hours: effectiveDuration,
        unit_price: pricingResult.baseAmount,
        quantity: 1,
        total_price: adjustedPrice,
        service_days: serviceDays || 1,
        hours_per_day: effectiveDuration,
        description: `${selectedServiceTypeObject?.name || 'Service'} - ${effectiveVehicleType}`,
        sort_order: serviceItems[index].sort_order, // Keep original sort order
        is_service_item: true,
        pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : null,
        pickup_time: pickupTime || null,
        time_based_adjustment: timeBasedAdjustment !== 0 ? timeBasedAdjustment : undefined,
        time_based_rule_name: ruleName || undefined,
      };
      
      // Replace the item at the specific index
      const updatedItems = [...serviceItems];
      updatedItems[index] = updatedItem;
      setServiceItems(updatedItems);
      
      // Clear form fields
      form.setValue('service_type', '');
      form.setValue('vehicle_category', '');
      form.setValue('vehicle_type', '');
      form.setValue('service_days', 1);
      form.setValue('hours_per_day', undefined);
      form.setValue('pickup_date', undefined);
      form.setValue('pickup_time', '');
      
      toast({
        title: "Service Updated",
        description: `Service updated${ruleName ? ` with ${ruleName} pricing` : ''} successfully`
      });
    } catch (error) {
      console.error('Error updating service item:', error);
      toast({
        title: t('quotations.form.error'),
        description: 'Failed to update service',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle editing service
  const handleEditServiceItem = (index: number) => {
    const item = serviceItems[index];
    
    // Don't allow editing packages through the service form
    if (item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package')) {
      toast({
        title: "Cannot edit packages",
        description: "Package items cannot be edited. Please remove and add a new package if needed.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingIndex(index);
    
    // Pre-fill form with the selected item's values
    form.setValue('service_type', item.service_type_id || '');
    form.setValue('vehicle_category', item.vehicle_category as string || '');
    form.setValue('vehicle_type', item.vehicle_type || '');
    form.setValue('service_days', item.service_days || 1);
    form.setValue('hours_per_day', item.hours_per_day || undefined);
    form.setValue('duration_hours', item.duration_hours || 1);
    
    if (item.pickup_date) {
      form.setValue('pickup_date', parseISO(item.pickup_date));
    }
    if (item.pickup_time) {
      form.setValue('pickup_time', item.pickup_time);
    }
    
    setIsEditingService(true);
    
    // Force re-render to show pickup date/time and time adjustment immediately
    setTimeout(() => {
      // This will trigger a re-render of the component
      setServiceTimeBasedPricing(serviceTimeBasedPricing);
    }, 100);
  };

  // Handle removing service
  const handleRemoveServiceItem = (index: number) => {
    const updatedItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(updatedItems);
    
    toast({
      title: "Service Removed",
      description: `Removed service from quotation`,
    });
  };

  // Handle duplicating service
  const handleDuplicateServiceItem = (index: number) => {
    const itemToDuplicate = serviceItems[index];
    const duplicate: ServiceItemInput = {
      ...JSON.parse(JSON.stringify(itemToDuplicate)),
      sort_order: serviceItems.length
    };
    
    setServiceItems([...serviceItems, duplicate]);
    
    toast({
      title: "Service Duplicated",
      description: `Duplicated ${itemToDuplicate.description}`,
    });
  };

  // Render button groups without double labels - FIX FOR DOUBLE LABELS ISSUE
  const renderButtonGroup = (
    name: string, 
    options: { id: string; name: string }[], 
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant={field.value === option.id ? 'default' : 'outline'}
                    onClick={() => field.onChange(option.id)}
                    className={cn(
                      "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm",
                      field.value === option.id ? 'ring-2 ring-primary' : ''
                    )}
                    disabled={disabled}
                  >
                    <span className="font-medium break-words">{option.name}</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  const renderVehicleTypeButtons = (
    name: string, 
    options: string[], 
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={field.value === option ? 'default' : 'outline'}
                    onClick={() => field.onChange(option)}
                    className={cn(
                      "h-auto py-3 px-3 flex items-center justify-center text-center transition-all text-sm",
                      field.value === option ? 'ring-2 ring-primary' : ''
                    )}
                    disabled={disabled}
                  >
                    <span className="font-medium break-words">{option}</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  const renderHoursPerDayButtons = (
    name: string,
    options: number[],
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                {options.map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={field.value === duration ? 'default' : 'outline'}
                    onClick={() => field.onChange(duration)}
                    className={cn(
                      "h-auto py-2 px-2 flex flex-col items-center justify-center text-center transition-all text-xs",
                      field.value === duration ? 'ring-2 ring-primary' : ''
                    )}
                    disabled={disabled}
                  >
                    <span className="font-medium">{duration}h</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // Render service items list
  const renderServiceItemsList = () => {
    if (serviceItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No services added yet. Add your first service using the form below.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {serviceItems.map((item, index) => (
          <ServiceCard
            key={index}
            item={item}
            index={index}
            formatCurrency={formatCurrency}
            packages={packages}
            selectedPackage={selectedPackage}
            onEdit={handleEditServiceItem}
            onDuplicate={handleDuplicateServiceItem}
            onRemove={handleRemoveServiceItem}
            isEditing={editingIndex === index}
            showActions={true}
          />
        ))}
        
        <div className="pt-2 pb-4 flex justify-between items-center font-medium text-sm">
          <span>Total Amount (before discount/tax):</span>
          <span>{formatCurrency(serviceItems.reduce((total, item) => total + (item.total_price || item.unit_price), 0))}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Car className="h-5 w-5" /> 
        {t('quotations.form.serviceSection')}
      </h2>
       
      {/* Display existing services if any */}
      {serviceItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              Selected Services
            </h3>
            <Badge variant="outline" className="text-xs">
              {serviceItems.length} {serviceItems.length === 1 ? 'service' : 'services'}
            </Badge>
          </div>
          {renderServiceItemsList()}
        </div>
      )}
       
      {/* Service Selection Form */}
      <div id="service-form-section" className={cn(
        "space-y-4 rounded-lg border p-3 sm:p-4",
        serviceItems.length > 0 && "bg-muted/20"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">
            {isEditingService 
              ? "Edit Service"
              : serviceItems.length > 0 
                ? "Add Another Service" 
                : "Configure Service"
            }
          </h3>
        </div>
        
        {/* Service or Package Selection */}
        <div className="space-y-6">
          {/* Individual Services Option */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              !selectedPackage ? "border-green-500 bg-green-50/30 dark:bg-green-900/10" : "border-gray-200 hover:border-green-300"
            )}
            onClick={() => setSelectedPackage(null)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold">{t('quotations.form.services.individual')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('quotations.form.services.configure')}</p>
                  </div>
                </div>
                {!selectedPackage && (
                  <Badge variant="default" className="bg-green-100 text-green-700 text-xs">{t('quotations.form.services.active')}</Badge>
                )}
              </div>
              
              {!selectedPackage && (
                <div className="space-y-4 p-3 sm:p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  {/* Service Configuration */}
                  <div className="space-y-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="service_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">{t('quotations.form.services.serviceType')}</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {getAvailableServiceTypes().map((option) => (
                                  <Button
                                    key={option.id}
                                    type="button"
                                    variant={field.value === option.id ? 'default' : 'outline'}
                                    onClick={() => field.onChange(option.id)}
                                    className={cn(
                                      "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm",
                                      field.value === option.id ? 'ring-2 ring-primary' : ''
                                    )}
                                  >
                                    <span className="font-medium break-words">{option.name}</span>
                                  </Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {serviceType && (
                      <div>
                        <FormField
                          control={form.control}
                          name="vehicle_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{t('quotations.form.services.vehicleCategory')}</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                  {getVehicleCategories().map((option) => (
                                    <Button
                                      key={option.id}
                                      type="button"
                                      variant={field.value === option.id ? 'default' : 'outline'}
                                      onClick={() => field.onChange(option.id)}
                                      className={cn(
                                        "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm",
                                        field.value === option.id ? 'ring-2 ring-primary' : ''
                                      )}
                                    >
                                      <span className="font-medium break-words">{option.name}</span>
                                    </Button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {vehicleCategory && (
                      <div>
                        <FormField
                          control={form.control}
                          name="vehicle_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{t('quotations.form.services.vehicleType')}</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 gap-2 pt-1">
                                  {getVehicleTypesForCategory().map((option) => (
                                    <Button
                                      key={option}
                                      type="button"
                                      variant={field.value === option ? 'default' : 'outline'}
                                      onClick={() => field.onChange(option)}
                                      className={cn(
                                        "h-auto py-3 px-3 flex items-center justify-center text-center transition-all text-sm",
                                        field.value === option ? 'ring-2 ring-primary' : ''
                                      )}
                                    >
                                      <span className="font-medium break-words">{option}</span>
                                    </Button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                                        {/* SERVICE DATE & TIME - UNDER SERVICES */}
                  {serviceType && vehicleCategory && vehicleType && (
                    <div 
                      className="pt-4 border-t border-green-200 dark:border-green-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <Label className="text-sm font-medium">{t('quotations.form.services.serviceDateTime')}</Label>
                      </div>
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 items-end">
                        <FormField
                          control={form.control}
                          name="pickup_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>{t('quotations.form.services.date')}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pickup_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="w-full"
                                  {...field}
                                  value={field.value || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                                  {/* Duration for Charter Services */}
                                   {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-3 items-end">
                                      <FormField
                                        control={form.control}
                                        name="service_days"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Days</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min={1}
                                                max={30}
                                                placeholder="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                                value={field.value || '1'}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                       <div className="flex flex-col">
                                         <Label className="text-sm font-medium mb-2 block">Hours/Day</Label>
                                         {renderHoursPerDayButtons('hours_per_day', getDurationsForServiceAndVehicle())}
                                       </div>
                                    </div>
                                  )}
                                </div>
                              )}

                  {/* Time-based pricing control */}
                  {serviceType && vehicleCategory && vehicleType && (
                    <div className="pt-3 border-t border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-green-600" />
                          <Label className="text-sm font-medium">Apply time-based pricing</Label>
                        </div>
                        <Switch
                          checked={serviceTimeBasedPricing}
                          onCheckedChange={setServiceTimeBasedPricing}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {serviceTimeBasedPricing 
                          ? "Service pricing will adjust based on pickup time (e.g., overtime surcharges, morning discounts)"
                          : "Standard pricing will be applied regardless of pickup time"
                        }
                      </p>
                    </div>
                  )}

                  {/* Button to add or update service - INSIDE THE SERVICE BLOCK */}
                  <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                    {isEditingService ? (
                      <>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsEditingService(false);
                            setEditingIndex(null);
                            
                            // Reset form fields
                            form.setValue('service_type', '');
                            form.setValue('vehicle_category', '');
                            form.setValue('vehicle_type', '');
                            form.setValue('service_days', 1);
                            form.setValue('hours_per_day', undefined);
                          }}
                          className="w-full sm:w-auto text-sm"
                        >
                          Cancel Edit
                        </Button>
                        <Button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            // Handle update logic - replace existing service instead of adding new one
                            if (editingIndex !== null) {
                              handleUpdateServiceItem(editingIndex);
                            } else {
                              handleAddServiceItem();
                            }
                            setIsEditingService(false);
                            setEditingIndex(null);
                          }}
                          disabled={!serviceType || !vehicleType}
                          className="w-full sm:w-auto text-sm"
                        >
                          Update Service
                        </Button>
                      </>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddServiceItem();
                        }}
                        disabled={!serviceType || !vehicleType}
                        className="w-full sm:w-auto text-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> 
                        {serviceItems.length === 0 ? 'Add This Service' : 'Add Another Service'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OR Separator */}
          {packages.length > 0 && (
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium">OR</span>
              <Separator className="flex-1" />
            </div>
          )}

          {/* Package Options */}
          {packages.length > 0 && packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                selectedPackage?.id === pkg.id ? "border-purple-500 bg-purple-50/30 dark:bg-purple-900/10" : "border-gray-200 hover:border-purple-300"
              )}
              onClick={() => handlePackageSelect(pkg)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-semibold break-words">{pkg.name}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{pkg.description}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    {selectedPackage?.id === pkg.id && (
                      <Badge variant="default" className="bg-purple-100 text-purple-700 mb-2 text-xs">Active</Badge>
                    )}
                    <p className="font-bold text-lg text-purple-600">{formatCurrency(pkg.base_price)}</p>
                    {pkg.is_featured && <Badge variant="secondary" className="mt-1 text-xs">Featured</Badge>}
                  </div>
                </div>
                
                                  {selectedPackage?.id === pkg.id && (
                    <div className="space-y-4 p-3 sm:p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Package className="h-4 w-4" />
                        <span className="font-medium text-sm">Package Includes:</span>
                      </div>
                      
                      {pkg.items && pkg.items.length > 0 ? (
                        <div className="space-y-2">
                          {pkg.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded p-2">
                              <div>
                                <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                                  {item.name}
                                </div>
                                <div className="text-xs text-purple-600 dark:text-purple-400">
                                  {item.vehicle_type} • {formatCurrency(item.price)}
                                </div>
                              </div>
                              {item.quantity > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  x{item.quantity}
                                </Badge>
                              )}
                            </div>
                          ))}
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                            • Time-based pricing adjustments apply
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-1 text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                          <p>• All services at package rate</p>
                          <p>• Time-based pricing adjustments</p>
                          <p>• Contact for detailed service breakdown</p>
                        </div>
                      )}

                    {/* PACKAGE DATE & TIME - ONLY FOR SELECTED PACKAGE */}
                    <div 
                      className="pt-4 border-t border-purple-200 dark:border-purple-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <Label className="text-sm font-medium">Package Date & Time</Label>
                      </div>
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 items-end">
                        <FormField
                          control={form.control}
                          name="pickup_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pickup_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="w-full"
                                  {...field}
                                  value={field.value || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddPackage(pkg);
                        }}
                        disabled={!form.watch('pickup_date') || !form.watch('pickup_time')}
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> 
                        Add This Package
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
} 