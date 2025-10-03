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
import { ServiceItemsList } from '@/components/quotations/service-items-list';
import { ServiceConfigForm } from '@/components/quotations/service-config-form';
import { PackageSelectionCard } from '@/components/quotations/package-selection-card';
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

  // Render via extracted list component
  const renderCompactServiceItemsList = () => (
    <ServiceItemsList
      items={serviceItems}
      mode="compact"
      t={t}
      expandedServices={expandedServices}
      onToggleExpanded={toggleServiceExpansion}
      formatCurrency={formatCurrency}
      onEdit={handleEditServiceItem}
      onDuplicate={handleDuplicateServiceItem}
      onRemove={handleRemoveServiceItem}
      onPriceChange={(index, price) => handleCustomPriceChange(index, price)}
      packages={packages}
      selectedPackage={selectedPackage}
      editingIndex={editingIndex}
    />
  );

  const renderServiceItemsList = () => (
    <ServiceItemsList
      items={serviceItems}
      mode="expanded"
      t={t}
      formatCurrency={formatCurrency}
      onEdit={handleEditServiceItem}
      onDuplicate={handleDuplicateServiceItem}
      onRemove={handleRemoveServiceItem}
      onPriceChange={(index, price) => handleCustomPriceChange(index, price)}
      packages={packages}
      selectedPackage={selectedPackage}
      editingIndex={editingIndex}
    />
  );

  return (
    <div className="space-y-6">
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

      {/* Service Configuration Form */}
      <ServiceConfigForm
        form={form}
        serviceItems={serviceItems}
        setServiceItems={setServiceItems}
        packages={packages}
        selectedPackage={selectedPackage}
        setSelectedPackage={setSelectedPackage}
        allServiceTypes={allServiceTypes}
        pricingCategories={pricingCategories}
        pricingItems={pricingItems}
        formData={formData}
        calculateQuotationAmount={calculateQuotationAmount}
        isEditingService={isEditingService}
        setIsEditingService={setIsEditingService}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        showAddServiceForm={showAddServiceForm}
        setShowAddServiceForm={setShowAddServiceForm}
        serviceTimeBasedPricing={serviceTimeBasedPricing}
        setServiceTimeBasedPricing={setServiceTimeBasedPricing}
        isCalculating={isCalculating}
        setIsCalculating={setIsCalculating}
        onEditServiceItem={handleEditServiceItem}
        onDuplicateServiceItem={handleDuplicateServiceItem}
        onRemoveServiceItem={handleRemoveServiceItem}
        onCustomPriceChange={handleCustomPriceChange}
        onAddServiceItem={handleAddServiceItem}
        onUpdateServiceItem={handleUpdateServiceItem}
        onAddPackage={handleAddPackage}
        onPackageSelect={handlePackageSelect}
        onPassengerChange={handlePassengerChange}
        onBagChange={handleBagChange}
      />

      {/* Package Selection */}
      <PackageSelectionCard
        form={form}
        packages={packages}
        selectedPackage={selectedPackage}
        onPackageSelect={handlePackageSelect}
        onAddPackage={handleAddPackage}
        formatCurrency={formatCurrency}
      />
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
