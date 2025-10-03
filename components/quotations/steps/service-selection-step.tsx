"use client";

import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PACKAGE_SERVICE_TYPE_ID } from '@/lib/constants/service-types';
import { Car, Calendar, Settings, Package, Plus, List, Timer, PencilIcon, Copy, Trash, X, ChevronDown, ChevronUp, Eye, EyeOff, Plane } from 'lucide-react';
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
import { useQuotationFormData } from '@/lib/hooks/use-quotation-form-data';
import { useTimeBasedPricing } from '@/lib/hooks/use-time-based-pricing';
import { useServiceTheme } from '@/lib/hooks/use-service-theme';
import { useServiceSelectionData } from '@/lib/hooks/use-service-selection-data';
import { GooglePlaceAutocomplete } from '@/components/bookings/google-place-autocomplete';
import { FlightSearch } from '@/components/bookings/flight-search';
import { useGoogleMaps } from '@/components/providers/google-maps-provider';
import { DateTimePicker } from '@/components/ui/date-time-picker';

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
  formData?: any; // Add formData parameter
  calculateQuotationAmount: (
    serviceType: string,
    selectedVehicle: { id: string; brand: string; model: string; name: string } | null,
    duration: number,
    discount: number,
    tax: number,
    days: number,
    hoursPerDay?: number,
    dateTime?: Date | string,
    vehicleCategory?: string
  ) => Promise<{ baseAmount: number; dailyRate: number; totalAmount: number; currency: string }>;
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
  formData, // Add formData parameter
  calculateQuotationAmount
}: ServiceSelectionStepProps) {
  const { t } = useI18n();
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsError } = useGoogleMaps();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [serviceTimeBasedPricing, setServiceTimeBasedPricing] = useState<boolean>(true);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  // Toggle individual service expansion
  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Optimized onChange handlers to prevent slow execution
  const handlePassengerChange = useCallback((value: string, onChange: (value: number | null) => void) => {
    if (value === '') {
      onChange(null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
        onChange(numValue);
      }
    }
  }, []);

  const handleBagChange = useCallback((value: string, onChange: (value: number | null) => void) => {
    if (value === '') {
      onChange(null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
        onChange(numValue);
      }
    }
  }, []);

  // Use the real time-based pricing hook
  const { 
    rules: timeBasedRules, 
    loading: timeBasedRulesLoading, 
    calculateTimeBasedAdjustment 
  } = useTimeBasedPricing();

  // Debug formData - only log once when formData changes
  useEffect(() => {
    // Form data is available for processing
  }, [formData]);

  // Watch form values
  const serviceType = form.watch('service_type');
  const vehicleCategory = form.watch('vehicle_category');
  const vehicleType = form.watch('vehicle_type');
  const serviceDays = form.watch('service_days');
  const hoursPerDay = form.watch('hours_per_day');
  
  // Use theme hook for dynamic theming
  const { currentTheme, themeColors, getServiceTheme, getThemeColors } = useServiceTheme(serviceType, allServiceTypes);
  
  // Use data selection hook for service/vehicle data
  const { 
    getAvailableServiceTypes, 
    getVehicleCategories, 
    getVehicleTypesForCategory, 
    getDurationsForServiceAndVehicle 
  } = useServiceSelectionData(formData, allServiceTypes, pricingCategories, serviceType, vehicleType, vehicleCategory);

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
      const effectiveVehicleCategory = vehicleCategory || "standard";
      
      // Extract vehicle name from vehicle object for pricing calculation
      const selectedVehicle = typeof vehicleType === 'object' ? vehicleType : null;
      const effectiveVehicleType = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Standard Vehicle";
      
      const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
      // For Charter services, use hours per day (e.g., 6), otherwise use 1 hour
      const effectiveDuration = isCharter ? (hoursPerDay || 1) : 1;
      
      
      const pricingResult = await calculateQuotationAmount(
        effectiveServiceType,
        selectedVehicle, // Pass the actual vehicle object instead of the string
        effectiveDuration,
        0,
        0,
        serviceDays || 1,
        hoursPerDay,
        undefined, // dateTime
        effectiveVehicleCategory // Pass the vehicle category
      );
      
      const pickupDate = form.watch('pickup_date');
      const pickupTime = form.watch('pickup_time');
      
      // Calculate time-based adjustment using actual rules
      const { adjustment: timeBasedAdjustment, ruleName } = serviceTimeBasedPricing 
        ? calculateTimeBasedAdjustment(pickupTime, pickupDate, effectiveVehicleCategory, effectiveServiceType)
        : { adjustment: 0, ruleName: null };
      
      
      // For Charter services, the baseAmount already includes the total duration, so don't multiply by serviceDays again
      const baseServicePrice = isCharter ? pricingResult.baseAmount : pricingResult.baseAmount * (serviceDays || 1);
      // For Charter services, don't apply time-based adjustments to the total amount
      const adjustedPrice = isCharter ? baseServicePrice : baseServicePrice * (1 + timeBasedAdjustment / 100);

      // Get vehicle display information
      const vehicleDisplayName = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : effectiveVehicleType;
      const vehiclePlateNumber = selectedVehicle?.name || '';

      // For Charter services, unit_price should be the daily rate, not the total amount
      const unitPrice = isCharter ? (pricingResult.dailyRate || pricingResult.baseAmount) : pricingResult.baseAmount;

      // Get form values for flight and location information
      const pickupLocation = form.watch('pickup_location');
      const dropoffLocation = form.watch('dropoff_location');
      const flightNumber = form.watch('flight_number');
      const terminal = form.watch('terminal');
      const numberOfPassengers = form.watch('number_of_passengers');
      const numberOfBags = form.watch('number_of_bags');

      const newItem: ServiceItemInput = {
        service_type_id: effectiveServiceType,
        service_type_name: selectedServiceTypeObject?.name || 'Service',
        vehicle_type: vehicleDisplayName,
        vehicle_category: effectiveVehicleCategory,
        duration_hours: effectiveDuration,
        unit_price: unitPrice,
        quantity: 1,
        total_price: adjustedPrice,
        service_days: serviceDays || 1,
        hours_per_day: isCharter ? (hoursPerDay || 1) : effectiveDuration,
        description: `${selectedServiceTypeObject?.name || 'Service'} - ${vehicleDisplayName}${vehiclePlateNumber ? ` (${vehiclePlateNumber})` : ''}`,
        sort_order: serviceItems.length,
        is_service_item: true,
        pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : null,
        pickup_time: pickupTime || null,
        pickup_location: pickupLocation || null,
        dropoff_location: dropoffLocation || null,
        flight_number: flightNumber || null,
        terminal: terminal || null,
        number_of_passengers: numberOfPassengers || null,
        number_of_bags: numberOfBags || null,
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
      
      const existingItem = serviceItems[index];
      const effectiveServiceType = serviceType || existingItem.service_type_id || "placeholder-service";
      const effectiveVehicleCategory = vehicleCategory || existingItem.vehicle_category || "standard";
      
      // Use existing vehicle info if form doesn't have new selection
      const selectedVehicle = typeof vehicleType === 'object' ? vehicleType : null;
      const effectiveVehicleType = selectedVehicle 
        ? `${selectedVehicle.brand} ${selectedVehicle.model}` 
        : existingItem.vehicle_type || "Standard Vehicle";
      
      const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
      // For Charter services, use hours per day (e.g., 6), otherwise use 1 hour
      const effectiveDuration = isCharter ? (hoursPerDay || 1) : 1;
      
      
      const pricingResult = await calculateQuotationAmount(
        effectiveServiceType,
        selectedVehicle, // Pass the actual vehicle object instead of the string
        effectiveDuration,
        0,
        0,
        serviceDays || 1,
        hoursPerDay,
        undefined, // dateTime
        effectiveVehicleCategory // Pass the vehicle category
      );
      
      const pickupDate = form.watch('pickup_date');
      const pickupTime = form.watch('pickup_time');
      
      // Get form values for flight and location information
      const pickupLocation = form.watch('pickup_location');
      const dropoffLocation = form.watch('dropoff_location');
      const flightNumber = form.watch('flight_number');
      const terminal = form.watch('terminal');
      const numberOfPassengers = form.watch('number_of_passengers');
      const numberOfBags = form.watch('number_of_bags');
      
      // Calculate time-based adjustment using actual rules
      const { adjustment: timeBasedAdjustment, ruleName } = serviceTimeBasedPricing 
        ? calculateTimeBasedAdjustment(pickupTime, pickupDate, effectiveVehicleCategory, effectiveServiceType)
        : { adjustment: 0, ruleName: null };
      
      // For Charter services, unit_price should be the daily rate, not the total amount
      const unitPrice = isCharter ? (pricingResult.dailyRate || pricingResult.baseAmount) : pricingResult.baseAmount;
      
      // For Charter services, the baseAmount already includes the total duration, so don't multiply by serviceDays again
      const baseServicePrice = isCharter ? pricingResult.baseAmount : pricingResult.baseAmount * (serviceDays || 1);
      const adjustedPrice = baseServicePrice * (1 + timeBasedAdjustment / 100);

      // Get vehicle display information
      const vehicleDisplayName = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : effectiveVehicleType;
      const vehiclePlateNumber = selectedVehicle?.name || '';

      const updatedItem: ServiceItemInput = {
        service_type_id: effectiveServiceType,
        service_type_name: selectedServiceTypeObject?.name || existingItem.service_type_name || 'Service',
        vehicle_type: vehicleDisplayName,
        vehicle_category: effectiveVehicleCategory,
        duration_hours: effectiveDuration,
        unit_price: unitPrice,
        quantity: 1,
        total_price: adjustedPrice,
        service_days: serviceDays || existingItem.service_days || 1,
        hours_per_day: isCharter ? (hoursPerDay || 1) : effectiveDuration,
        description: `${selectedServiceTypeObject?.name || existingItem.service_type_name || 'Service'} - ${vehicleDisplayName}${vehiclePlateNumber ? ` (${vehiclePlateNumber})` : ''}`,
        sort_order: existingItem.sort_order, // Keep original sort order
        is_service_item: true,
        pickup_date: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : existingItem.pickup_date || null,
        pickup_time: pickupTime || existingItem.pickup_time || null,
        pickup_location: pickupLocation || existingItem.pickup_location || '',
        dropoff_location: dropoffLocation || existingItem.dropoff_location || '',
        number_of_passengers: numberOfPassengers || existingItem.number_of_passengers || null,
        number_of_bags: numberOfBags || existingItem.number_of_bags || null,
        flight_number: flightNumber || existingItem.flight_number || '',
        terminal: terminal || existingItem.terminal || '',
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
        title: t('quotations.form.services.serviceUpdated'),
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
        title: t('quotations.form.services.cannotEditPackages'),
        description: t('quotations.form.services.packageItemsCannotBeEdited'),
        variant: "destructive"
      });
      return;
    }
    
    setEditingIndex(index);
    
    // Pre-fill form with the selected item's values
    form.setValue('service_type', item.service_type_id || '');
    form.setValue('vehicle_category', item.vehicle_category as string || '');
    
    // Find the matching vehicle object from available vehicles
    const vehicleCategory = item.vehicle_category as string;
    const availableVehicles = getVehicleTypesForCategory(vehicleCategory);
    
    const matchingVehicle = availableVehicles.find((vehicle: any) => 
      `${vehicle.brand} ${vehicle.model}` === item.vehicle_type
    );
    
    // Set the vehicle type as the full object if found, otherwise as string
    form.setValue('vehicle_type', matchingVehicle || item.vehicle_type || '');
    form.setValue('service_days', item.service_days || 1);
    form.setValue('hours_per_day', item.hours_per_day || undefined);
    form.setValue('duration_hours', item.duration_hours || 1);
    
    if (item.pickup_date) {
      form.setValue('pickup_date', parseISO(item.pickup_date));
    }
    if (item.pickup_time) {
      form.setValue('pickup_time', item.pickup_time);
    }
    
    // Pre-fill new fields
    form.setValue('pickup_location', item.pickup_location || '');
    form.setValue('dropoff_location', item.dropoff_location || '');
    form.setValue('number_of_passengers', item.number_of_passengers || null);
    form.setValue('number_of_bags', item.number_of_bags || null);
    form.setValue('flight_number', item.flight_number || '');
    
    setIsEditingService(true);
    
    // Scroll to the form section when editing
    setTimeout(() => {
      const serviceSection = document.querySelector('[data-service-config]');
      if (serviceSection) {
        serviceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // This will trigger a re-render of the component
      setServiceTimeBasedPricing(serviceTimeBasedPricing);
    }, 100);
  };

  // Handle removing service
  const handleRemoveServiceItem = (index: number) => {
    const updatedItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(updatedItems);
    
    toast({
      title: t('quotations.form.services.serviceRemoved'),
        description: t('quotations.form.services.removedServiceFromQuotation'),
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
      title: t('quotations.form.services.serviceDuplicated'),
      description: `${t('quotations.form.services.duplicated')} ${itemToDuplicate.description}`,
    });
  };

  // Handle custom price change for service items
  const handleCustomPriceChange = (index: number, newPrice: number) => {
    const updatedItems = [...serviceItems];
    const item = updatedItems[index];
    
    // Update the unit price
    item.unit_price = newPrice;
    
    // Calculate the base service price considering service days for Charter services
    const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false;
    const baseServicePrice = isCharter ? newPrice : newPrice * (item.service_days || 1);
    
    // Apply time-based adjustment if it exists
    let totalPrice = baseServicePrice;
    if (item.time_based_adjustment) {
      totalPrice = baseServicePrice * (1 + item.time_based_adjustment / 100);
    }
    
    // Update the total price
    item.total_price = totalPrice;
    
    setServiceItems(updatedItems);
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

  // Render compact service items list
  const renderCompactServiceItemsList = () => {
    if (serviceItems.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <Car className="mx-auto h-6 w-6 mb-2 opacity-50" />
          <p className="text-sm">{t('quotations.form.services.noServicesAddedYet')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {serviceItems.map((item, index) => {
          const isCharter = item.service_type_name?.toLowerCase().includes('charter') || false;
          const totalPrice = isCharter 
            ? item.unit_price * (item.service_days || 1)
            : (item.total_price || item.unit_price);
          
          // Calculate time-based adjustment display
          const hasTimeAdjustment = item.time_based_adjustment && item.time_based_adjustment !== 0;
          const timeAdjustmentText = hasTimeAdjustment 
            ? `${item.time_based_adjustment! > 0 ? '+' : ''}${item.time_based_adjustment}%`
            : '';
          
          const isExpanded = expandedServices.has(index);
          
          return (
            <div key={index} className="space-y-2">
              {/* Compact Service Card */}
              <div 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-all duration-300 cursor-pointer group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => toggleServiceExpansion(index)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className="flex-shrink-0">
                    {isCharter ? (
                      <Car className="h-4 w-4 text-blue-600" />
                    ) : item.service_type_name?.toLowerCase().includes('airport') ? (
                      <Plane className="h-4 w-4 text-green-600" />
                    ) : (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.service_type_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.vehicle_type}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {item.pickup_date && item.pickup_time && (
                        `${format(parseISO(item.pickup_date), 'MMM dd, yyyy')} at ${item.pickup_time}`
                      )}
                      {isCharter && item.service_days && item.hours_per_day && (
                        ` • ${item.service_days} days × ${item.hours_per_day}h/day`
                      )}
                      {hasTimeAdjustment && (
                        <span className="text-orange-500 dark:text-orange-400 font-medium">
                          {timeAdjustmentText && ` • ${timeAdjustmentText}`}
                          {item.time_based_rule_name && ` ${item.time_based_rule_name}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                  <div className="ml-2 transition-all duration-300 ease-in-out">
                    <div className={cn(
                      "transform transition-all duration-300 ease-in-out",
                      isExpanded ? "rotate-180 scale-110" : "rotate-0 scale-100"
                    )}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Always visible */}
              <div className="flex items-center justify-end gap-1 ml-7">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditServiceItem(index);
                  }}
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateServiceItem(index);
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveServiceItem(index);
                  }}
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
              
              {/* Expanded Service Details with Animation */}
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              )}>
                {isExpanded && (
                  <div className="ml-7 p-4 bg-muted/20 rounded-lg border border-muted/50 transform transition-all duration-500 ease-in-out animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 delay-100">
                    <div className="space-y-3">
                      {/* Service Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Service Type:</span>
                          <p className="font-medium">{item.service_type_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Vehicle:</span>
                          <p className="font-medium">{item.vehicle_type}</p>
                        </div>
                        {item.pickup_date && item.pickup_time && (
                          <div>
                            <span className="font-medium text-muted-foreground">Date & Time:</span>
                            <p className="font-medium">
                              {format(parseISO(item.pickup_date), 'MMM dd, yyyy')} at {item.pickup_time}
                            </p>
                          </div>
                        )}
                        {isCharter && item.service_days && item.hours_per_day && (
                          <div>
                            <span className="font-medium text-muted-foreground">Duration:</span>
                            <p className="font-medium">{item.service_days} days × {item.hours_per_day}h/day</p>
                          </div>
                        )}
                        {item.pickup_location && (
                          <div>
                            <span className="font-medium text-muted-foreground">Pickup Location:</span>
                            <p className="font-medium">{item.pickup_location}</p>
                          </div>
                        )}
                        {item.dropoff_location && (
                          <div>
                            <span className="font-medium text-muted-foreground">Dropoff Location:</span>
                            <p className="font-medium">{item.dropoff_location}</p>
                          </div>
                        )}
                        {item.flight_number && (
                          <div>
                            <span className="font-medium text-muted-foreground">Flight Number:</span>
                            <p className="font-medium">{item.flight_number}</p>
                          </div>
                        )}
                        {item.terminal && (
                          <div>
                            <span className="font-medium text-muted-foreground">Terminal:</span>
                            <p className="font-medium">{item.terminal}</p>
                          </div>
                        )}
                        {item.number_of_passengers && (
                          <div>
                            <span className="font-medium text-muted-foreground">Passengers:</span>
                            <p className="font-medium">{item.number_of_passengers}</p>
                          </div>
                        )}
                        {item.number_of_bags && (
                          <div>
                            <span className="font-medium text-muted-foreground">Bags:</span>
                            <p className="font-medium">{item.number_of_bags}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pricing Details */}
                      <div className="pt-3 border-t border-muted/50 animate-in slide-in-from-bottom-2 fade-in-0 delay-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Unit Price:</span>
                            <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                          </div>
                          {isCharter && item.service_days && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">× {item.service_days} days:</span>
                              <span className="font-medium">{formatCurrency(item.unit_price * item.service_days)}</span>
                            </div>
                          )}
                          {hasTimeAdjustment && (
                            <div className="flex justify-between text-orange-500 dark:text-orange-400">
                              <span>Time Adjustment ({timeAdjustmentText}):</span>
                              <span className="font-medium">
                                {formatCurrency(Math.abs((item.unit_price || 0) * (item.service_days || 1) * ((item.time_based_adjustment || 0) / 100)))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t border-muted/50">
                            <span>Total:</span>
                            <span>{formatCurrency(totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 pb-1 flex justify-between items-center font-medium text-sm border-t">
          <span>{t('quotations.form.services.totalAmountBeforeDiscountTax')}</span>
          <span>{formatCurrency(serviceItems.reduce((total, item) => {
            // For Charter Services, calculate total based on duration (unit_price × service_days)
            if (item.service_type_name?.toLowerCase().includes('charter')) {
              const calculatedTotal = item.unit_price * (item.service_days || 1);
              return total + calculatedTotal;
            }
            // For other services, use existing logic
            return total + (item.total_price || item.unit_price);
          }, 0))}</span>
        </div>
      </div>
    );
  };

  // Render full service items list (for expanded view)
  const renderServiceItemsList = () => {
    if (serviceItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{t('quotations.form.services.noServicesAddedYet')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 sm:space-y-3">
        {serviceItems.map((item, index) => {
          // For now, we'll use the current price as the original price
          // In the future, this can be enhanced to fetch from the database
          const originalPrice = item.unit_price;
          
          return (
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
              onPriceChange={handleCustomPriceChange}
              isEditing={editingIndex === index}
              showActions={true}
              originalPrice={originalPrice}
            />
          );
        })}
        
        <div className="pt-2 pb-3 sm:pb-4 flex justify-between items-center font-medium text-sm">
          <span>{t('quotations.form.services.totalAmountBeforeDiscountTax')}</span>
          <span>{formatCurrency(serviceItems.reduce((total, item) => {
            // For Charter Services, calculate total based on duration (unit_price × service_days)
            if (item.service_type_name?.toLowerCase().includes('charter')) {
              const calculatedTotal = item.unit_price * (item.service_days || 1);
              return total + calculatedTotal;
            }
            // For other services, use existing logic
            return total + (item.total_price || item.unit_price);
          }, 0))}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Car className="h-5 w-5" /> 
        {t('quotations.form.serviceSection')}
      </h2>
        {serviceItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddServiceForm(!showAddServiceForm)}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddServiceForm ? 'Hide Form' : 'Add Service'}
            </Button>
          </div>
        )}
      </div>
       
      {/* Display existing services if any */}
      {serviceItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              {t('quotations.form.services.selectedServices')}
            </h3>
            <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {serviceItems.length} {serviceItems.length === 1 ? t('quotations.form.services.service') : t('quotations.form.services.services')}
            </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                className="h-8 px-2"
              >
                {isServicesExpanded ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Compact
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
          </div>
          </div>
          {isServicesExpanded ? renderServiceItemsList() : renderCompactServiceItemsList()}
        </div>
      )}
       
      {/* Service Selection Form - Show when no services, when explicitly requested, or when editing */}
      {(serviceItems.length === 0 || showAddServiceForm || isEditingService) && (
      <div id="service-form-section" className={cn(
        "space-y-4 rounded-lg border p-3 sm:p-4",
        serviceItems.length > 0 && "bg-muted/20"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">
            {isEditingService 
              ? t('quotations.form.services.editService')
              : serviceItems.length > 0 
                ? t('quotations.form.services.addAnotherService') 
                : t('quotations.form.services.configureService')
            }
          </h3>
            {serviceItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditingService) {
                    setIsEditingService(false);
                    setEditingIndex(null);
                    // Reset form fields
                    form.setValue('service_type', '');
                    form.setValue('vehicle_category', '');
                    form.setValue('vehicle_type', '');
                    form.setValue('service_days', 1);
                    form.setValue('hours_per_day', undefined);
                    form.setValue('pickup_date', undefined);
                    form.setValue('pickup_time', '');
                    form.setValue('pickup_location', '');
                    form.setValue('dropoff_location', '');
                    form.setValue('number_of_passengers', null);
                    form.setValue('number_of_bags', null);
                    form.setValue('flight_number', '');
                  } else {
                    setShowAddServiceForm(false);
                  }
                }}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
        </div>
        
        {/* Service or Package Selection */}
        <div className="space-y-4 sm:space-y-6">
          {/* Individual Services Option */}
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-md border-2",
              !selectedPackage ? `${themeColors.primaryBorder} ${themeColors.primaryBg}` : `border-gray-200 ${themeColors.primaryHover}`
            )}
            onClick={(e) => {
              e.preventDefault();
              setSelectedPackage(null);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg transition-colors duration-300", 
                    currentTheme === 'airport' ? 'bg-green-100 dark:bg-green-900/30' :
                    currentTheme === 'charter' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-gray-100 dark:bg-gray-900/30'
                  )}>
                    <Settings className={cn("h-5 w-5 transition-colors duration-300", themeColors.primaryIcon)} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{t('quotations.form.services.individual')}</h4>
                    <p className="text-sm text-muted-foreground">{t('quotations.form.services.configure')}</p>
                  </div>
                </div>
                {!selectedPackage && (
                  <Badge variant="default" className={cn("text-xs px-3 py-1 transition-colors duration-300", themeColors.primaryBadge)}>
                    {t('quotations.form.services.active')}
                  </Badge>
                )}
              </div>
              
              {!selectedPackage && (
                <div className={cn("space-y-4 p-2 sm:p-3 md:p-4 rounded-lg border transition-all duration-300", 
                  themeColors.primaryCard, themeColors.primaryCardBorder
                )}>
                  {/* Service Configuration */}
                  <div className="space-y-3 sm:space-y-4" data-service-config>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="service_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">{t('quotations.form.services.serviceType')}</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {getAvailableServiceTypes().map((option: any) => {
                                  const isSelected = field.value === option.id;
                                  const serviceTheme = getServiceTheme(option.id);
                                  const serviceColors = getThemeColors(serviceTheme);
                                  
                                  return (
                                    <Button
                                      key={option.id}
                                      type="button"
                                      variant={isSelected ? 'default' : 'outline'}
                                      onClick={() => field.onChange(option.id)}
                                      className={cn(
                                        "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all duration-300 text-sm min-h-[60px] sm:min-h-[70px]",
                                        isSelected 
                                          ? `${serviceColors.primaryButton} text-white shadow-md` 
                                          : `hover:${serviceColors.primaryCard} hover:${serviceColors.primaryCardBorder}`
                                      )}
                                    >
                                      <span className="font-medium break-words leading-tight px-1">{option.name}</span>
                                    </Button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {serviceType && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="vehicle_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{t('quotations.form.services.vehicleCategory')}</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {getVehicleCategories().map((option: any) => (
                                    <Button
                                      key={option.id}
                                      type="button"
                                      variant={field.value === option.id ? 'default' : 'outline'}
                                      onClick={() => field.onChange(option.id)}
                                      className={cn(
                                        "h-auto py-3 px-2 sm:px-3 flex flex-col items-center justify-center text-center transition-all text-sm min-h-[50px] sm:min-h-[60px]",
                                        field.value === option.id ? 'ring-2 ring-primary' : ''
                                      )}
                                    >
                                      <span className="font-medium break-words text-xs sm:text-sm leading-tight">{option.name}</span>
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
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="vehicle_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{t('quotations.form.services.vehicleType')}</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {getVehicleTypesForCategory().map((option: any, index: number) => (
                                    <Button
                                      key={option.id || `vehicle-${index}`}
                                      type="button"
                                      variant={(field.value && typeof field.value === 'object' ? field.value.id === option.id : field.value === option.id) ? 'default' : 'outline'}
                                      onClick={() => field.onChange(option)}
                                      className={cn(
                                        "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm min-h-[70px] sm:min-h-[80px]",
                                        (field.value && typeof field.value === 'object' ? field.value.id === option.id : field.value === option.id) ? 'ring-2 ring-primary' : ''
                                      )}
                                    >
                                      <span className="font-medium break-words text-center px-1">
                                        <div className="font-semibold text-sm sm:text-base leading-tight">{`${option.brand} ${option.model}`}</div>
                                        {option.name && (
                                          <div className="text-xs text-muted-foreground mt-1 leading-tight">{option.name}</div>
                                        )}
                                      </span>
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
                      className={cn("pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Calendar className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                        <Label className="text-sm font-medium">{t('quotations.form.services.serviceDateTime')}</Label>
                      </div>
                      <FormField
                        control={form.control}
                        name="pickup_date"
                        render={({ field: dateField }) => (
                          <FormField
                            control={form.control}
                            name="pickup_time"
                            render={({ field: timeField }) => (
                              <FormItem>
                                <FormControl>
                                  <DateTimePicker
                                    date={dateField.value}
                                    time={timeField.value}
                                    onDateChange={dateField.onChange}
                                    onTimeChange={timeField.onChange}
                                    dateLabel={t('quotations.form.services.date')}
                                    timeLabel={t('quotations.form.services.time')}
                                    datePlaceholder={t('quotations.form.services.pickDate')}
                                    timePlaceholder={t('quotations.form.services.selectTime')}
                                    required
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      />

                                  {/* Duration for Charter Services */}
                                   {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-2 sm:mt-3 items-end">
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
                                                className="text-base h-10"
                                                {...field}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  if (value === '') {
                                                    field.onChange(1);
                                                  } else {
                                                    const numValue = parseInt(value, 10);
                                                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 30) {
                                                      field.onChange(numValue);
                                                    }
                                                  }
                                                }}
                                                value={field.value || ''}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                       <div className="flex flex-col">
                                         <Label className="text-sm font-medium mb-2 block">{t('quotations.form.services.hoursPerDay')}</Label>
                                         {renderHoursPerDayButtons('hours_per_day', getDurationsForServiceAndVehicle())}
                                       </div>
                                    </div>
                                  )}
                                </div>
                              )}

                  {/* Location and Flight Information */}
                  <div className={cn("mt-4 sm:mt-6 pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <Settings className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                      <Label className="text-sm font-medium">{t('quotations.form.services.locationAndFlight')}</Label>
                    </div>
                    
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="pickup_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('quotations.form.services.pickupLocation')}</FormLabel>
                            <FormControl>
                              {isGoogleMapsLoaded && !googleMapsError ? (
                                <GooglePlaceAutocomplete
                                  id="pickup_location"
                                  name="pickup_location"
                                  label=""
                                  value={field.value || ''}
                                  onChange={(name, value) => field.onChange(value)}
                                  placeholder={t('quotations.form.services.enterPickupLocation')}
                                  required={false}
                                />
                              ) : (
                                <Input
                                  placeholder={t('quotations.form.services.enterPickupLocation')}
                                  className="text-base h-10"
                                  {...field}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dropoff_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('quotations.form.services.dropoffLocation')}</FormLabel>
                            <FormControl>
                              {isGoogleMapsLoaded && !googleMapsError ? (
                                <GooglePlaceAutocomplete
                                  id="dropoff_location"
                                  name="dropoff_location"
                                  label=""
                                  value={field.value || ''}
                                  onChange={(name, value) => field.onChange(value)}
                                  placeholder={t('quotations.form.services.enterDropoffLocation')}
                                  required={false}
                                />
                              ) : (
                                <Input
                                  placeholder={t('quotations.form.services.enterDropoffLocation')}
                                  className="text-base h-10"
                                  {...field}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Flight Information - Only show for Airport Transfer services */}
                    {selectedServiceTypeObject?.name.toLowerCase().includes('airport') && (
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-3 sm:mt-4">
                        <FormField
                          control={form.control}
                          name="flight_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('quotations.form.services.flightNumber')}</FormLabel>
                              <FormControl>
                                <FlightSearch
                                  value={field.value || ''}
                                  onSelect={(flight) => {
                                    if (flight) {
                                      field.onChange(flight.flightNumber);
                                    }
                                  }}
                                  onFlightSelect={(flight) => {
                                    if (flight) {
                                      field.onChange(flight.flightNumber);
                                      
                                      // Auto-populate pickup date, time, and terminal
                                      if (flight.pickupDate) {
                                        form.setValue('pickup_date', parseISO(flight.pickupDate));
                                      }
                                      if (flight.pickupTime) {
                                        form.setValue('pickup_time', flight.pickupTime);
                                      }
                                      if (flight.arrival?.terminal) {
                                        form.setValue('terminal', flight.arrival.terminal);
                                      }
                                    }
                                  }}
                                  placeholder={t('quotations.form.services.enterFlightNumber')}
                                  label=""
                                  required={false}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="terminal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('quotations.form.services.terminal')}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t('quotations.form.services.enterTerminal')}
                                  className="text-base h-10"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Passenger and Bag Information */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-3 sm:mt-4">
                      <FormField
                        control={form.control}
                        name="number_of_passengers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('quotations.form.services.numberOfPassengers')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={50}
                                placeholder={t('quotations.form.services.enterPassengerCount')}
                                className="text-base h-10"
                                value={field.value?.toString() || ''}
                                onChange={(e) => handlePassengerChange(e.target.value, field.onChange)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number_of_bags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('quotations.form.services.numberOfBags')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                placeholder={t('quotations.form.services.enterBagCount')}
                                className="text-base h-10"
                                value={field.value?.toString() || ''}
                                onChange={(e) => handleBagChange(e.target.value, field.onChange)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Time-based pricing control */}
                  {serviceType && vehicleCategory && vehicleType && (
                    <div className={cn("pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                          <Label className="text-sm font-medium">{t('quotations.form.services.applyTimeBasedPricing')}</Label>
                          {serviceTimeBasedPricing && (
                            <Badge variant="outline" className="text-xs">
                              {timeBasedRulesLoading ? t('quotations.form.services.loading') : `${timeBasedRules?.length || 0} ${t('quotations.form.services.rulesActive')}`}
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={serviceTimeBasedPricing}
                          onCheckedChange={setServiceTimeBasedPricing}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {serviceTimeBasedPricing 
                          ? t('quotations.form.services.servicePricingWillAdjust')
                          : t('quotations.form.services.standardPricingWillBeApplied')
                        }
                      </p>
                    </div>
                  )}

                  {/* Button to add or update service - INSIDE THE SERVICE BLOCK */}
                  <div className={cn("flex flex-col sm:flex-row justify-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
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
                          {t('quotations.form.services.cancelEdit')}
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
                          {t('quotations.form.services.updateService')}
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
                        className={cn(
                          "w-full text-sm font-medium transition-all duration-300",
                          serviceItems.length === 0 
                            ? `${themeColors.primaryButton} text-white shadow-lg hover:shadow-xl` 
                            : `${themeColors.primaryButton} text-white shadow-md hover:shadow-lg`
                        )}
                      >
                        <Plus className="h-4 w-4 mr-2" /> 
                        {serviceItems.length === 0 ? t('quotations.form.services.addThisService') : t('quotations.form.services.addAnotherService')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OR Separator */}
          {packages.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-4 my-2 sm:my-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium">{t('quotations.form.services.or')}</span>
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
              onClick={(e) => {
                e.preventDefault();
                handlePackageSelect(pkg);
              }}
            >
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
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
                      <Badge variant="default" className="bg-purple-100 text-purple-700 mb-2 text-xs">{t('quotations.form.services.active')}</Badge>
                    )}
                    <p className="font-bold text-lg text-purple-600">{formatCurrency(pkg.base_price)}</p>
                    {pkg.is_featured && <Badge variant="secondary" className="mt-1 text-xs">{t('quotations.form.services.featured')}</Badge>}
                  </div>
                </div>
                
                                  {selectedPackage?.id === pkg.id && (
                    <div className="space-y-4 p-3 sm:p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Package className="h-4 w-4" />
                        <span className="font-medium text-sm">{t('quotations.form.services.packageIncludes')}</span>
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
                            • {t('quotations.form.services.timeBasedPricingAdjustments')}
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-1 text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                          <p>• {t('quotations.form.services.allServicesAtPackageRate')}</p>
                          <p>• {t('quotations.form.services.timeBasedPricingAdjustments')}</p>
                          <p>• {t('quotations.form.services.contactForDetailedBreakdown')}</p>
                        </div>
                      )}

                    {/* PACKAGE DATE & TIME - ONLY FOR SELECTED PACKAGE */}
                    <div 
                      className="pt-3 sm:pt-4 border-t border-purple-200 dark:border-purple-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <Label className="text-sm font-medium">{t('quotations.form.services.packageDateAndTime')}</Label>
                      </div>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 items-end">
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
                                      {field.value ? format(field.value, "PPP") : <span>{t('quotations.form.services.pickDate')}</span>}
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
                              <FormLabel> {t('quotations.form.services.time')}</FormLabel>
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
                        className="w-full mt-2 sm:mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" /> 
                        {t('quotations.form.services.addThisPackage')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
      )}

      {/* Floating Add Service Button - Only show when there are existing services and form is hidden */}
      {serviceItems.length > 0 && !showAddServiceForm && !isEditingService && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            type="button"
            onClick={() => setShowAddServiceForm(true)}
            className={cn("rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 text-white", themeColors.primaryButton)}
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
} 