"use client";

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
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
import { toast } from '@/components/ui/use-toast';

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

      const newPackageItem: ServiceItemInput = {
        service_type_id: pkg.id,
        service_type_name: pkg.name,
        vehicle_type: 'Package',
        vehicle_category: 'package',
        duration_hours: 1,
        unit_price: pkg.base_price,
        quantity: 1,
        total_price: pkg.base_price,
        service_days: 1,
        hours_per_day: 1,
        description: `Package: ${pkg.name}`,
        sort_order: serviceItems.length,
        is_service_item: false,
        pickup_date: format(pickupDate, 'yyyy-MM-dd'),
        pickup_time: pickupTime,
      };

      setServiceItems([...serviceItems, newPackageItem]);
      form.setValue('pickup_date', undefined);
      form.setValue('pickup_time', '');
      setSelectedPackage(null);

      toast({
        title: t('quotations.notifications.success'),
        description: 'Package added successfully',
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
      const baseServicePrice = pricingResult.baseAmount * (serviceDays || 1);

      const newItem: ServiceItemInput = {
        service_type_id: effectiveServiceType,
        service_type_name: selectedServiceTypeObject?.name || 'Service',
        vehicle_type: effectiveVehicleType,
        vehicle_category: effectiveVehicleCategory,
        duration_hours: effectiveDuration,
        unit_price: pricingResult.baseAmount,
        quantity: 1,
        total_price: baseServicePrice,
        service_days: serviceDays || 1,
        hours_per_day: effectiveDuration,
        description: `${selectedServiceTypeObject?.name || 'Service'} - ${effectiveVehicleType}`,
        sort_order: serviceItems.length,
        is_service_item: true,
        pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : null,
        pickup_time: pickupTime || null,
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
        description: t('quotations.form.serviceAddedDescription')
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

  // Handle editing service
  const handleEditServiceItem = (index: number) => {
    const item = serviceItems[index];
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
          <Card key={index} className={cn(
            "relative overflow-hidden transition-all",
            editingIndex === index ? 'ring-2 ring-primary' : ''
          )}>
            <div className={cn(
              "absolute top-0 left-0 h-full w-1",
              item.service_type_name?.toLowerCase().includes('package') ? 'bg-purple-500' :
              item.service_type_name?.toLowerCase().includes('charter') ? 'bg-blue-500' : 'bg-green-500'
            )} />
            <CardContent className="pt-4 pl-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base flex items-center flex-wrap gap-2">
                    <Badge variant={
                      item.service_type_name?.toLowerCase().includes('package') ? "secondary" :
                      item.service_type_name?.toLowerCase().includes('charter') ? "default" : "outline"
                    } className="text-xs">
                      {item.service_type_name?.toLowerCase().includes('package') ? 'Package' :
                       item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                    </Badge>
                    <span className="break-words">{item.description}</span>
                    {editingIndex === index && <Badge variant="outline" className="text-xs">Editing</Badge>}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs sm:text-sm">
                    <div className="text-muted-foreground">Vehicle:</div>
                    <div className="break-words">{item.vehicle_type}</div>
                    
                    {item.service_type_name?.toLowerCase().includes('charter') ? (
                      <>
                        <div className="text-muted-foreground">Days:</div>
                        <div>{item.service_days || 1}</div>
                        <div className="text-muted-foreground">Hours per day:</div>
                        <div>{item.hours_per_day || 'N/A'}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-muted-foreground">Duration:</div>
                        <div>{item.duration_hours} hour(s)</div>
                      </>
                    )}
                    
                    <div className="text-muted-foreground">Unit Price:</div>
                    <div>{formatCurrency(item.unit_price)}</div>
                    
                    {(item.pickup_date || item.pickup_time) && (
                      <>
                        <div className="text-muted-foreground">Pickup Date:</div>
                        <div>{item.pickup_date ? format(parseISO(item.pickup_date), 'MMM d, yyyy') : 'N/A'}</div>
                        <div className="text-muted-foreground">Pickup Time:</div>
                        <div>{item.pickup_time || 'N/A'}</div>
                      </>
                    )}
                    
                    <div className="text-muted-foreground font-medium">Total:</div>
                    <div className="font-semibold">{formatCurrency(item.total_price || item.unit_price)}</div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant={editingIndex === index ? "default" : "ghost"}
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditServiceItem(index);
                    }}
                    title="Edit Service"
                    type="button"
                    className="h-8 w-8"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDuplicateServiceItem(index);
                    }}
                    title="Duplicate Service"
                    disabled={isEditingService}
                    type="button"
                    className="h-8 w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveServiceItem(index);
                    }}
                    title="Remove Service"
                    disabled={isEditingService}
                    type="button"
                    className="h-8 w-8"
                  >
                    <Trash className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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
                                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-3">
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
                                      
                                      <div>
                                        <Label className="text-sm font-medium mb-2 block">Hours/Day</Label>
                                        {renderHoursPerDayButtons('hours_per_day', getDurationsForServiceAndVehicle())}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
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
                    <div className="grid gap-1 text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                      <p>• All services at package rate</p>
                      <p>• Time-based pricing adjustments</p>
                      {pkg.items && pkg.items.length > 0 && (
                        <p>• {pkg.items.length} service{pkg.items.length > 1 ? 's' : ''} included</p>
                      )}
                    </div>

                    {/* PACKAGE DATE & TIME - ONLY FOR SELECTED PACKAGE */}
                    <div 
                      className="pt-4 border-t border-purple-200 dark:border-purple-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <Label className="text-sm font-medium">Package Date & Time</Label>
                      </div>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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
        
        {/* Button to add or update service - ONLY FOR INDIVIDUAL SERVICES */}
        {!selectedPackage && (
          <div className="flex justify-center gap-2 mt-6">
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
                    // Handle update logic here
                    handleAddServiceItem(); // For now, treat as add
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
        )}
      </div>
    </div>
  );
} 