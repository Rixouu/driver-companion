"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { 
  CalendarIcon, 
  User, 
  Car, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Send,
  Save,
  Truck,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Home,
  Building,
  Receipt,
  Tag,
  Percent,
  StickyNote,
  Eye,
  Globe,
  Plus,
  Trash,
  Copy,
  List,
  PlusCircle,
  Loader2,
  PencilIcon
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotationService } from '@/hooks/useQuotationService';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { Separator } from '@/components/ui/separator';
import { 
  CreateQuotationInput, 
  Quotation, 
  PricingCategory,
  PricingItem,
  QuotationStatus,
  QuotationItem,
  ServiceItemInput
} from '@/types/quotations';
import { ServiceTypeInfo } from '@/hooks/useQuotationService';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Define form schema with zod
const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  customer_name: z.string().optional(),
  customer_email: z.string().email({ message: 'Valid email is required' }),
  customer_phone: z.string().optional(),
  billing_company_name: z.string().optional(),
  billing_tax_number: z.string().optional(),
  billing_street_name: z.string().optional(),
  billing_street_number: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_country: z.string().optional(),
  service_type: z.string().optional(), // Remove validation
  vehicle_category: z.string().optional(), // Remove validation
  vehicle_type: z.string().optional(), // Remove validation
  pickup_date: z.date().optional(),
  pickup_time: z.string().optional(),
  duration_hours: z.union([
    z.coerce.number().min(1).max(24),
    z.literal('none').transform(() => 1),
    z.literal('').transform(() => 1)
  ]).optional().default(1),
  service_days: z.union([
    z.coerce.number().min(1).max(30),
    z.literal('none').transform(() => 1),
    z.literal('').transform(() => 1)
  ]).optional().default(1),
  hours_per_day: z.union([
    z.coerce.number().min(1).max(24),
    z.literal('none').transform(() => null),
    z.literal('').transform(() => null)
  ]).optional().nullable(),
  discount_percentage: z.union([
    z.coerce.number().min(0).max(100),
    z.literal('none').transform(() => 0),
    z.literal('').transform(() => 0)
  ]).optional().default(0),
  tax_percentage: z.union([
    z.coerce.number().min(0).max(100),
    z.literal('none').transform(() => 0),
    z.literal('').transform(() => 0)
  ]).optional().default(0),
  merchant_notes: z.string().optional(),
  customer_notes: z.string().optional(),
  passenger_count: z.union([
    z.coerce.number().int().nullable(),
    z.literal('none').transform(() => null),
    z.literal('').transform(() => null),
    z.literal('undefined').transform(() => null)
  ]).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface QuotationFormProps {
  initialData?: Quotation & { quotation_items?: QuotationItem[] };
  mode?: 'create' | 'edit';
  onSuccess?: (quotation: Quotation) => void;
}

// Define steps
const steps = [
  { id: 'customer', name: 'Customer Details', icon: User },
  { id: 'service', name: 'Service & Vehicle', icon: Car },
  { id: 'pricing', name: 'Pricing & Options', icon: DollarSign },
  { id: 'notes', name: 'Notes', icon: FileText },
  { id: 'preview', name: 'Preview & Send', icon: Eye },
];

export default function QuotationForm({ initialData, mode, onSuccess }: QuotationFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [pricingCategories, setPricingCategories] = useState<PricingCategory[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>([]);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>(initialData?.currency || 'JPY');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialData?.display_currency || initialData?.currency || 'JPY');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submittingAndSending, setSubmittingAndSending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Add new state for service items
  const [serviceItems, setServiceItems] = useState<ServiceItemInput[]>([]);
  const [selectedItem, setSelectedItem] = useState<ServiceItemInput | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isRemovingService, setIsRemovingService] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  // Add new state for editing a service
  const [isEditingService, setIsEditingService] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Debug: Log initialData at component mount
  useEffect(() => {
    console.log('QuotationForm received initialData:', initialData);
    
    if (initialData?.quotation_items) {
      console.log('initialData includes quotation_items:', initialData.quotation_items);
      console.log('Number of items:', initialData.quotation_items.length);
    } else {
      console.warn('No quotation_items in initialData');
      console.log('initialData keys:', initialData ? Object.keys(initialData) : 'initialData is undefined');
    }
  }, [initialData]);
  
  const {
    createQuotation,
    updateQuotation,
    loading: apiLoading,
    calculateQuotationAmount,
    getPricingCategories,
    getPricingItems,
    sendQuotation,
    getServiceTypes
  } = useQuotationService();

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      customer_name: initialData?.customer_name || '',
      customer_email: initialData?.customer_email || '',
      customer_phone: initialData?.customer_phone || '',
      billing_company_name: initialData?.billing_company_name || '',
      billing_tax_number: initialData?.billing_tax_number || '',
      billing_street_name: initialData?.billing_street_name || '',
      billing_street_number: initialData?.billing_street_number || '',
      billing_city: initialData?.billing_city || '',
      billing_state: initialData?.billing_state || '',
      billing_postal_code: initialData?.billing_postal_code || '',
      billing_country: initialData?.billing_country || 'Thailand',
      service_type: initialData?.service_type_id || '',
      vehicle_category: '',
      vehicle_type: initialData?.vehicle_type || '',
      pickup_date: initialData?.pickup_date ? new Date(initialData.pickup_date) : undefined,
      pickup_time: initialData?.pickup_time || '',
      duration_hours: initialData?.duration_hours || 1,
      service_days: initialData?.service_days || 1,
      hours_per_day: initialData?.hours_per_day || 1,
      discount_percentage: initialData?.discount_percentage || 0,
      tax_percentage: initialData?.tax_percentage || 0,
      merchant_notes: initialData?.merchant_notes || '',
      customer_notes: initialData?.customer_notes || '',
      passenger_count: initialData?.passenger_count || null,
    },
  });

  // Watch form values for pricing calculations and preview
  const watchedValues = useWatch({ control: form.control });

  const serviceType = form.watch('service_type');
  const vehicleCategory = form.watch('vehicle_category');
  const vehicleType = form.watch('vehicle_type');
  const durationHours = form.watch('duration_hours');
  const discountPercentage = form.watch('discount_percentage');
  const taxPercentage = form.watch('tax_percentage');
  const serviceDays = form.watch('service_days');
  const hoursPerDay = form.watch('hours_per_day');

  // Find the selected service type object (name and id)
  const selectedServiceTypeObject = useMemo(() => {
    return allServiceTypes.find(st => st.id === serviceType);
  }, [allServiceTypes, serviceType]);

  // Load pricing categories on mount
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const categories = await getPricingCategories();
        setPricingCategories(categories);
        
        if (categories.length > 0) {
          const firstCategory = categories[0];
          setSelectedCategory(firstCategory.id);
          
          // If we have a quotation with existing values, try to find the matching category
          if (initialData?.service_type_id) {
            const matchingCategory = categories.find(c => 
              c.service_type_ids && c.service_type_ids.includes(initialData.service_type_id)
            );
            if (matchingCategory) {
              setSelectedCategory(matchingCategory.id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load pricing categories:', error);
        // Continue with empty categories rather than breaking the form
      }
    };
    
    loadPricingData();
  }, [initialData, getPricingCategories]);

  // Load all service types on mount
  useEffect(() => {
    async function loadAllServiceTypes() {
      try {
        const serviceTypesData = await getServiceTypes();
        setAllServiceTypes(serviceTypesData);
      } catch (error) {
        console.error("Failed to load all service types:", error);
      }
    }
    loadAllServiceTypes();
  }, [getServiceTypes]);

  // Load pricing items when category changes
  useEffect(() => {
    const loadPricingItems = async () => {
      if (selectedCategory) {
        try {
          const items = await getPricingItems(selectedCategory);
          setPricingItems(items);
        } catch (error) {
          console.error('Failed to load pricing items:', error);
          // Continue with empty items rather than breaking the form
        }
      }
    };
    
    loadPricingItems();
  }, [selectedCategory, getPricingItems]);

  // Calculate pricing when relevant fields change
  useEffect(() => {
    const updatePricing = async () => {
      if (serviceType && vehicleType && (durationHours || hoursPerDay)) {
        try {
          // For charter services, use hoursPerDay as the duration
          const isCharter = selectedServiceTypeObject?.name.toLowerCase().includes('charter');
          const effectiveDuration = isCharter ? hoursPerDay || durationHours : durationHours;
          
          const { baseAmount: amount, totalAmount: total, currency: curr } = 
            await calculateQuotationAmount(
              serviceType,
              vehicleType,
              effectiveDuration || 1,
              discountPercentage || 0,
              taxPercentage || 0,
              serviceDays || 1
            );
          
          setBaseAmount(amount);
          setTotalAmount(total);
          setCurrency(curr);
        } catch (error) {
          console.error('Error calculating price:', error);
          setBaseAmount(0);
          setTotalAmount(0);
        }
      }
    };
    
    updatePricing();
  }, [
    serviceType, 
    vehicleType, 
    durationHours,
    hoursPerDay, 
    serviceDays,
    discountPercentage, 
    taxPercentage, 
    calculateQuotationAmount,
    selectedServiceTypeObject
  ]);

  // Format currency with exchange rates
  const formatCurrency = (amount: number) => {
    if (amount === undefined) return `¥0`;
    
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
    const convertedAmount = amount * (exchangeRates[selectedCurrency] / exchangeRates['JPY']);
    
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    }
  };

  // Get service types for the selected category
  const getServiceTypesForCategory = () => {
    if (selectedCategory) {
      const category = pricingCategories.find(cat => cat.id === selectedCategory);
      return category ? category.service_type_ids || [] : [];
    }
    
    // Fallback service types if no categories are available
    if (pricingCategories.length === 0) {
      return ['charter', 'airportTransferHaneda', 'airportTransferNarita'];
    }
    
    return [];
  };

  // Get vehicle types for the selected service type
  const getVehicleTypesForService = () => {
    if (!serviceType) return [];
    
    // Get unique vehicle types from pricing items for this service type
    const vehicleTypes = pricingItems
      .filter(item => item.service_type_id === serviceType)
      .map(item => item.vehicle_type);
    
    // Return unique vehicle types
    return Array.from(new Set(vehicleTypes));
  };

  // If no vehicle types are available from pricing items, provide fallbacks
  const getAvailableVehicleTypes = () => {
    const types = getVehicleTypesForService();
    
    if (types.length === 0) {
      // Fallback vehicle types
      return [
        'Standard Vehicle',
        'Premium Vehicle',
        'Luxury Vehicle',
        'Mercedes Benz V Class - Black Suite',
        'Toyota Alphard Executive Lounge',
        'Toyota Hi-Ace Grand Cabin'
      ];
    }
    
    return types;
  };

  // Get durations for the selected service and vehicle type
  const getDurationsForServiceAndVehicle = () => {
    if (!serviceType) return [];
    
    // For airport transfers, usually just 1 hour
    if (serviceType.includes('airportTransfer')) {
      return [1];
    }
    
    // For charter services, provide durations 1-12h
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  // Add helper functions for service types
  const getAvailableServiceTypes = (): ServiceTypeInfo[] => {
    return allServiceTypes.length > 0 ? allServiceTypes : [
      // Basic fallback if allServiceTypes is empty, ideally should not happen
      { id: 'charter', name: 'Charter Services (Hourly)' },
      { id: 'airportTransferHaneda', name: 'Airport Transfer - Haneda' },
      { id: 'airportTransferNarita', name: 'Airport Transfer - Narita' }
    ];
  };

  // Add helper function for vehicle categories
  const getVehicleCategories = () => {
    return [
      { id: 'platinum', name: 'Platinum' },
      { id: 'luxury', name: 'Luxury' },
      { id: 'premium', name: 'Premium' }
    ];
  };

  // Update getVehicleTypesForService to use vehicle category
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

  // Initialize serviceItems if initialData has quotation_items
  useEffect(() => {
    if (initialData?.quotation_items && Array.isArray(initialData.quotation_items)) {
      // Filter only items marked as service items
      const existingServiceItems = initialData.quotation_items
        .filter(item => item.is_service_item)
        .map(item => ({
          description: item.description,
          service_type_id: item.service_type_id || '',
          service_type_name: item.service_type_name || '',
          vehicle_category: item.vehicle_category || undefined,
          vehicle_type: item.vehicle_type || '',
          duration_hours: item.duration_hours || undefined,
          service_days: item.service_days || undefined,
          hours_per_day: item.hours_per_day || undefined,
          unit_price: item.unit_price,
          total_price: item.total_price,
          quantity: item.quantity,
          sort_order: item.sort_order,
          is_service_item: true
        }));
      
      if (existingServiceItems.length > 0) {
        setServiceItems(existingServiceItems);
      }
    }
  }, [initialData]);

  // Add a new function to better handle tax and discount calculations
  const calculateFinalAmounts = () => {
    const baseTotal = calculateTotalServiceAmount() || 0;
    const discountPercentageValue = discountPercentage || 0;
    const discountAmount = baseTotal * discountPercentageValue / 100;
    const subtotal = baseTotal - discountAmount;
    const taxPercentageValue = taxPercentage || 0;
    const taxAmount = subtotal * taxPercentageValue / 100;
    const finalTotal = subtotal + taxAmount;
    
    console.log("Calculating final amounts:", {
      serviceItems: serviceItems.length,
      baseTotal,
      discountPercentage: discountPercentageValue,
      discountAmount,
      subtotal,
      taxPercentage: taxPercentageValue,
      taxAmount,
      finalTotal
    });
    
    return {
      baseTotal,
      discountAmount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  // Calculate total amount for all service items
  const calculateTotalServiceAmount = () => {
    if (serviceItems.length === 0) {
      // If no service items, fall back to basic calculation
      return baseAmount;
    }
    
    const total = serviceItems.reduce((total, item) => {
      const itemTotal = item.total_price || (item.unit_price * (item.quantity || 1) * (item.service_days || 1));
      console.log(`Service item ${item.description} total: ${itemTotal}`);
      return total + itemTotal;
    }, 0);
    
    console.log(`Total service amount: ${total} from ${serviceItems.length} items`);
    return total;
  };

  // Add a function to recalculate and update all totals
  const updateTotals = () => {
    // Calculate the total amount from all service items
    const baseTotal = calculateTotalServiceAmount();
    const discountAmount = baseTotal * (discountPercentage || 0) / 100;
    const subtotal = baseTotal - discountAmount;
    const taxAmount = subtotal * (taxPercentage || 0) / 100;
    const finalTotal = subtotal + taxAmount;
    
    console.log('UPDATE TOTALS - Recalculating all totals:', {
      serviceItems: serviceItems.length,
      baseTotal,
      discountPercentage,
      discountAmount,
      subtotal,
      taxPercentage,
      taxAmount,
      finalTotal
    });
    
    // Update form field values with the appropriate field names from the schema
    form.setValue('discount_percentage', discountPercentage || 0);
    form.setValue('tax_percentage', taxPercentage || 0);
    
    // These might be handled differently in the form submission logic
    setFormData(prev => ({
      ...prev,
      amount: baseTotal,
      discount_amount: discountAmount,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: finalTotal
    }));
  };

  // Function to create the effective hours_per_day value with proper type handling
  const getEffectiveHoursPerDay = (hoursPerDay?: number, fallbackHours?: number | null): number | undefined => {
    if (typeof hoursPerDay === 'number') {
      return hoursPerDay;
    }
    if (typeof fallbackHours === 'number') {
      return fallbackHours;
    }
    return undefined;
  };

  // Handle adding a new service item
  const handleAddServiceItem = async () => {
    // Prevent potential form submission by wrapping in a timeout
    setTimeout(async () => {
      try {
        setIsCalculating(true);
        
        // If no service type or vehicle type is selected, use defaults
        const effectiveServiceType = serviceType || "placeholder-service";
        const effectiveVehicleType = vehicleType || "Standard Vehicle";
        const effectiveVehicleCategory = vehicleCategory || "standard";
        
        console.log('ADD SERVICE - Input values:', {
          serviceType: effectiveServiceType,
          serviceTypeObject: selectedServiceTypeObject,
          vehicleType: effectiveVehicleType,
          vehicleCategory: effectiveVehicleCategory,
          serviceDays: serviceDays || 1,
          hoursPerDay
        });
        
        // Calculate if this is a charter service
        const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
        // Define effectiveDuration based on service type
        const effectiveDuration = isCharter ? hoursPerDay || 1 : 1;
        
        // Calculate pricing for this service item
        const pricingResult = await calculateQuotationAmount(
          effectiveServiceType,
          effectiveVehicleType,
          effectiveDuration,
          0, // No discount at the service item level
          0, // No tax at the service item level
          serviceDays || 1,
          hoursPerDay
        );
        
        console.log('ADD SERVICE - Price calculation result:', pricingResult);
        
        // Prepare the new service item
        const newItem: ServiceItemInput = {
          service_type_id: effectiveServiceType,
          service_type_name: selectedServiceTypeObject?.name || 'Service',
          vehicle_type: effectiveVehicleType,
          vehicle_category: effectiveVehicleCategory,
          duration_hours: effectiveDuration,
          unit_price: pricingResult.baseAmount,
          quantity: 1,
          total_price: pricingResult.baseAmount * (serviceDays || 1),
          service_days: serviceDays || 1,
          hours_per_day: effectiveDuration,
          description: `${selectedServiceTypeObject?.name || 'Service'} - ${effectiveVehicleType}`,
          sort_order: serviceItems.length,
          is_service_item: true
        };
        
        console.log('ADD SERVICE - New service item:', newItem);
        
        // Add the new item to the list
        setServiceItems(prev => [...prev, newItem]);
        
        // Clear/reset form fields for the next service
        form.setValue('service_type', '');
        form.setValue('vehicle_category', '');
        form.setValue('vehicle_type', '');
        form.setValue('service_days', 1);
        form.setValue('hours_per_day', undefined);
        
        // Recalculate the total amount
        const newTotal = calculateTotalServiceAmount();
        console.log('ADD SERVICE - New total amount:', newTotal);
        
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
    }, 0);
  };
  
  // Handle removing a service item
  const handleRemoveServiceItem = (index: number) => {
    // Prevent form submission with a callback
    setTimeout(() => {
      setSelectedItem(serviceItems[index]);
      setIsRemovingService(true);
    }, 0);
  };
  
  const confirmRemoveServiceItem = () => {
    if (selectedItem) {
      const updatedItems = serviceItems.filter(item => item !== selectedItem);
      setServiceItems(updatedItems);
      setSelectedItem(null);
      setIsRemovingService(false);
      
      toast({
        title: "Service Removed",
        description: `Removed ${selectedItem.description} from quotation`,
      });
    }
  };
  
  // Duplicate a service item
  const handleDuplicateServiceItem = (index: number) => {
    // Prevent form submission with a callback
    setTimeout(() => {
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
    }, 0);
  };

  // Add a function to handle editing a service item
  const handleEditServiceItem = (index: number) => {
    // Prevent form submission with a callback
    setTimeout(() => {
      setSelectedItem(serviceItems[index]);
      setEditingIndex(index);
      
      // Pre-fill form with the selected item's values
      const item = serviceItems[index];
      form.setValue('service_type', item.service_type_id || '');
      form.setValue('vehicle_category', item.vehicle_category as string || '');
      form.setValue('vehicle_type', item.vehicle_type || '');
      form.setValue('service_days', item.service_days || 1);
      form.setValue('hours_per_day', item.hours_per_day || undefined);
      form.setValue('duration_hours', item.duration_hours || 1);
      
      // Set pickup date and time if available in the item
      if (item.pickup_date) {
        form.setValue('pickup_date', parseISO(item.pickup_date));
      }
      if (item.pickup_time) {
        form.setValue('pickup_time', item.pickup_time);
      }
      
      // Scroll to the service form section
      const serviceFormElement = document.getElementById('service-form-section');
      if (serviceFormElement) {
        serviceFormElement.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Update UI to show we're in edit mode instead of using a modal
      setIsEditingService(true);
    }, 0);
  };

  // Add a function to update a service item
  const handleUpdateServiceItem = async () => {
    // Prevent potential form submission by wrapping in a timeout
    setTimeout(async () => {
      try {
        setIsCalculating(true);
        
        if (editingIndex === null || !selectedItem) {
          setIsCalculating(false);
          return;
        }
        
        // Similar logic to handleAddServiceItem but for updating
        const effectiveServiceType = serviceType || selectedItem.service_type_id || "placeholder-service";
        const effectiveVehicleType = vehicleType || selectedItem.vehicle_type || "Standard Vehicle";
        const effectiveVehicleCategory = vehicleCategory || (selectedItem.vehicle_category as string) || "standard";
        
        console.log('UPDATE SERVICE - Input values:', {
          serviceType: effectiveServiceType,
          serviceTypeObject: selectedServiceTypeObject,
          vehicleType: effectiveVehicleType,
          vehicleCategory: effectiveVehicleCategory,
          serviceDays: serviceDays || selectedItem.service_days || 1,
          hoursPerDay: hoursPerDay || selectedItem.hours_per_day || 1,
          editingIndex,
          originalItem: selectedItem
        });
        
        const isCharter = selectedServiceTypeObject?.name?.toLowerCase().includes('charter') || false;
        const effectiveDuration = isCharter 
          ? hoursPerDay || selectedItem.hours_per_day || 1 
          : 1;
        const effectiveServiceDays = serviceDays || selectedItem.service_days || 1;
        
        // Use the helper function for proper type handling
        const effectiveHoursPerDay = getEffectiveHoursPerDay(hoursPerDay, selectedItem.hours_per_day);
        
        // Calculate pricing for this service item
        const pricingResult = await calculateQuotationAmount(
          effectiveServiceType,
          effectiveVehicleType,
          effectiveDuration,
          0, // No discount at the service item level
          0, // No tax at the service item level
          effectiveServiceDays,
          effectiveHoursPerDay
        );
        
        console.log('UPDATE SERVICE - Price calculation result:', pricingResult);
        
        // Create the updated item
        const updatedItem: ServiceItemInput = {
          ...selectedItem,
          service_type_id: effectiveServiceType,
          service_type_name: selectedServiceTypeObject?.name || selectedItem.service_type_name || 'Service',
          vehicle_type: effectiveVehicleType,
          vehicle_category: effectiveVehicleCategory,
          duration_hours: effectiveDuration,
          unit_price: pricingResult.baseAmount,
          quantity: 1,
          total_price: pricingResult.baseAmount * effectiveServiceDays,
          service_days: effectiveServiceDays,
          hours_per_day: effectiveDuration,
          description: `${selectedServiceTypeObject?.name || selectedItem.service_type_name || 'Service'} - ${effectiveVehicleType}`,
          is_service_item: true,
          pickup_date: watchedValues.pickup_date ? format(watchedValues.pickup_date, 'yyyy-MM-dd') : selectedItem.pickup_date,
          pickup_time: watchedValues.pickup_time || selectedItem.pickup_time
        };
        
        console.log('UPDATE SERVICE - Updated service item:', {
          before: selectedItem,
          after: updatedItem,
          priceDifference: updatedItem.unit_price - selectedItem.unit_price,
          totalDifference: updatedItem.total_price - selectedItem.total_price
        });
        
        // Update the item in the list
        const updatedItems = [...serviceItems];
        updatedItems[editingIndex] = updatedItem;
        setServiceItems(updatedItems);
        
        // Reset the editing state
        setIsEditingService(false);
        setEditingIndex(null);
        setSelectedItem(null);
        
        // Clear form fields
        form.setValue('service_type', '');
        form.setValue('vehicle_category', '');
        form.setValue('vehicle_type', '');
        form.setValue('service_days', 1);
        form.setValue('hours_per_day', undefined);
        
        // Recalculate the total amount
        const newTotal = calculateTotalServiceAmount();
        console.log('UPDATE SERVICE - New total amount:', newTotal);
        
        toast({
          title: t('quotations.form.serviceUpdated'),
          description: t('quotations.form.serviceUpdatedDescription')
        });
      } catch (error) {
        console.error('Error updating service item:', error);
        toast({
          title: t('quotations.form.error'),
          description: t('quotations.form.errorUpdatingService'),
          variant: 'destructive'
        });
      } finally {
        setIsCalculating(false);
      }
    }, 0);
  };

  // Render the service items list
  const renderServiceItemsList = () => {
    if (serviceItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No services added yet. Add your first service using the button below.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {serviceItems.map((item, index) => (
          <Card key={index} className={`relative overflow-hidden ${editingIndex === index ? 'ring-2 ring-primary' : ''}`}>
            <div className={`absolute top-0 left-0 h-full w-1 ${item.service_type_name?.toLowerCase().includes('charter') ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-base flex items-center">
                    <Badge variant={item.service_type_name?.toLowerCase().includes('charter') ? "default" : "secondary"} className="mr-2">
                      {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                    </Badge>
                    {item.description}
                    {editingIndex === index && <Badge variant="outline" className="ml-2">Editing</Badge>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="text-muted-foreground">Vehicle:</div>
                    <div>{item.vehicle_type}</div>
                    
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
                    
                    <div className="text-muted-foreground">Total:</div>
                    <div className="font-semibold">{formatCurrency(item.total_price || item.unit_price)}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant={editingIndex === index ? "default" : "ghost"}
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event bubbling
                      handleEditServiceItem(index);
                    }}
                    title="Edit Service"
                    type="button" // Explicitly set button type to prevent form submission
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event bubbling
                      handleDuplicateServiceItem(index);
                    }}
                    title="Duplicate Service"
                    disabled={isEditingService}
                    type="button" // Explicitly set button type to prevent form submission
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      e.stopPropagation(); // Stop event bubbling
                      handleRemoveServiceItem(index);
                    }}
                    title="Remove Service"
                    disabled={isEditingService}
                    type="button" // Explicitly set button type to prevent form submission
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="pt-2 pb-4 flex justify-between items-center font-medium">
          <span>Total Amount (before discount/tax):</span>
          <span>{formatCurrency(calculateTotalServiceAmount())}</span>
        </div>
      </div>
    );
  };

  // Submit the form
  const onSubmit = async (data: FormData, sendToCustomer = false) => {
    try {
      setSubmittingAndSending(sendToCustomer);
      
      // For charter services, set duration_hours from hours_per_day
      if (data.service_type === 'charter' && data.hours_per_day) {
        data.duration_hours = data.hours_per_day;
      }
      
      // Rely on Zod coercion from form.handleSubmit, just apply defaults if necessary
      const formData = {
        ...data,
        // Ensure service type has a default value if undefined
        service_type: data.service_type || '',
        // Ensure vehicle category has a default value if undefined  
        vehicle_category: data.vehicle_category || '',
        // Ensure vehicle type has a default value if undefined
        vehicle_type: data.vehicle_type || '',
        duration_hours: typeof data.duration_hours === 'number' && !isNaN(data.duration_hours) ? data.duration_hours : 1,
        hours_per_day: typeof data.hours_per_day === 'number' && !isNaN(data.hours_per_day) ? data.hours_per_day : undefined, // Keep undefined if not applicable/invalid
        service_days: typeof data.service_days === 'number' && !isNaN(data.service_days) ? data.service_days : 1,
        discount_percentage: typeof data.discount_percentage === 'number' && !isNaN(data.discount_percentage) ? data.discount_percentage : 0,
        tax_percentage: typeof data.tax_percentage === 'number' && !isNaN(data.tax_percentage) ? data.tax_percentage : 0
      };
      
      // Debug log for form submission - keep this one for diagnosing issues
      console.log('SAVE & SEND DEBUG - Form submission data:', { 
        ...formData,
        sendToCustomer,
        // Special debug for service_days conversion
        raw_service_days: data.service_days,
        raw_service_days_type: typeof data.service_days,
        converted_service_days: formData.service_days,
        converted_service_days_type: typeof formData.service_days,
      });

      // Handle problematic values directly in the input object
      const input: {
        title: string;
        customer_email: string;
        customer_name: string | undefined;
        customer_phone: string | undefined;
        billing_company_name: string | undefined;
        billing_tax_number: string | undefined;
        billing_street_name: string | undefined;
        billing_street_number: string | undefined;
        billing_city: string | undefined;
        billing_state: string | undefined;
        billing_postal_code: string | undefined;
        billing_country: string | undefined;
        service_type_id: string;
        vehicle_category: string | undefined;
        vehicle_type: string;
        pickup_date: string | undefined;
        pickup_time: string | undefined;
        duration_hours: number;
        service_days: number;
        hours_per_day: number | undefined;
        merchant_notes: string | undefined;
        discount_percentage: number;
        tax_percentage: number;
        status: QuotationStatus;
        passenger_count: number | null;
        currency: string;
        display_currency: string;
        amount?: number;
        total_amount?: number;
      } = {
        title: formData.title || '',
        customer_email: formData.customer_email,
        customer_name: formData.customer_name || undefined,
        customer_phone: formData.customer_phone || undefined,
        billing_company_name: formData.billing_company_name || undefined,
        billing_tax_number: formData.billing_tax_number || undefined,
        billing_street_name: formData.billing_street_name || undefined,
        billing_street_number: formData.billing_street_number || undefined,
        billing_city: formData.billing_city || undefined,
        billing_state: formData.billing_state || undefined,
        billing_postal_code: formData.billing_postal_code || undefined,
        billing_country: formData.billing_country || undefined,
        service_type_id: formData.service_type,
        vehicle_category: formData.vehicle_category || undefined,
        vehicle_type: formData.vehicle_type,
        pickup_date: formData.pickup_date ? format(formData.pickup_date, 'yyyy-MM-dd') : undefined,
        pickup_time: formData.pickup_time || undefined,
        duration_hours: typeof formData.duration_hours === 'number' ? formData.duration_hours : 1,
        service_days: typeof formData.service_days === 'number' ? formData.service_days : 1,
        hours_per_day: (selectedServiceTypeObject?.name.toLowerCase().includes('charter') && typeof formData.hours_per_day === 'number') ? formData.hours_per_day : undefined,
        merchant_notes: formData.merchant_notes || undefined,
        discount_percentage: typeof formData.discount_percentage === 'number' ? formData.discount_percentage : 0,
        tax_percentage: typeof formData.tax_percentage === 'number' ? formData.tax_percentage : 0,
        status: sendToCustomer ? 'sent' as QuotationStatus : 'draft' as QuotationStatus,
        // Improved sanitization of passenger_count field
        passenger_count: 
          // Handle string values specifically
          typeof data.passenger_count === 'string' 
            ? (data.passenger_count === 'none' || data.passenger_count === '' || data.passenger_count === 'undefined')
                ? null  // Convert none/empty/undefined strings to null
                : (parseInt(data.passenger_count, 10) || null) // Parse to integer or null if NaN
            : typeof data.passenger_count === 'number' 
                ? data.passenger_count // Keep numeric values as is
                : null, // Default to null for undefined/null/other values

        // Store the actual calculation currency and display currency
        currency: currency || 'JPY',
        display_currency: selectedCurrency || 'JPY'
      };
      
      // If we have multiple services, calculate the actual amount here
      if (serviceItems.length > 0) {
        const { baseTotal, finalTotal } = calculateFinalAmounts();
        input.amount = baseTotal;
        input.total_amount = finalTotal;
        console.log('SAVE & SEND DEBUG - Multiple services calculation:', {
          serviceItemsCount: serviceItems.length,
          baseTotal,
          finalTotal
        });
      }
      
      // Create input object for the API
      const createInput: CreateQuotationInput = {
        ...input,
        // Don't use a default string for service_type_id, it needs to be a valid UUID
        service_type_id: (input.service_type_id && input.service_type_id !== "default-service-type") 
          ? input.service_type_id 
          : (serviceItems.length > 0 && serviceItems[0].service_type_id) 
            ? serviceItems[0].service_type_id 
            : "", // Use empty string as a fallback to avoid undefined
        // Ensure vehicle_type is never empty
        vehicle_type: input.vehicle_type || "Standard Vehicle",
        // Rest of the fields remain the same
        passenger_count: input.passenger_count,
        pickup_date: input.pickup_date as string,
        ...(serviceItems.length > 0 ? {
          amount: input.amount,
          total_amount: input.total_amount
        } : {})
      };
      
      // Debug log for API input - important for diagnosing issues
      console.log('SAVE & SEND DEBUG - API input:', createInput);

      let result: Quotation | null = null;

      try {
        // Handle multiple services
        if (serviceItems.length > 0) {
          console.log('SAVE & SEND DEBUG - Using multiple services mode:', serviceItems.length, 'services');
          
          // Calculate total amount for all service items - let the backend handle this though
          // Ensure each service item has the right values
          const processedServiceItems = serviceItems.map(item => ({
            ...item,
            total_price: item.total_price || (item.unit_price * (item.quantity || 1))
          }));
          
          // Use the updated createQuotation method that supports service items
          if (initialData?.id) {
            // For existing quotations, send the updated quotation data with explicit amounts
            const updateInput = {
              ...input,
              amount: input.amount,  // Ensure these are explicitly set for the update
              total_amount: input.total_amount
            };
            
            console.log('SAVE & SEND DEBUG - Update input with explicit amounts:', {
              amount: updateInput.amount,
              total_amount: updateInput.total_amount
            });
            
            // For existing quotations, send the updated quotation data first
            result = await updateQuotation(initialData.id, updateInput);
            
            // Then, delete existing service items and create new ones
            if (result) {
              try {
                // Delete existing items
                const deleteResponse = await fetch(`/api/quotations/${initialData.id}/items/delete-all`, {
                  method: 'DELETE'
                });
                
                if (!deleteResponse.ok) {
                  console.error('Failed to clear existing items:', await deleteResponse.text());
                }
                
                // Create new items
                const createResponse = await fetch('/api/quotations/items/bulk-create', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    quotation_id: initialData.id,
                    items: processedServiceItems
                  })
                });
                
                if (!createResponse.ok) {
                  throw new Error(`Failed to create service items: ${await createResponse.text()}`);
                }
                
                // After creating items, update the quotation again to ensure the amount is correct
                const finalAmounts = calculateFinalAmounts();
                const finalUpdateResponse = await fetch(`/api/quotations/${initialData.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount: finalAmounts.baseTotal,
                    total_amount: finalAmounts.finalTotal
                  })
                });
                
                if (!finalUpdateResponse.ok) {
                  console.error('Failed to update final amounts:', await finalUpdateResponse.text());
                } else {
                  const updatedQuotation = await finalUpdateResponse.json();
                  console.log('SAVE & SEND DEBUG - Final quotation update result:', updatedQuotation);
                  result = updatedQuotation;
                }
              } catch (error) {
                console.error('Error updating service items:', error);
                // Continue with the process even if service items failed
              }
            }
            
            // If sending to customer, send email via the API endpoint
            if (sendToCustomer && result) {
              console.log('SAVE & SEND DEBUG - Sending email for ID:', initialData.id);
              // Use the sendQuotation function which takes care of updating status and sending email
              await sendQuotation(initialData.id);
              console.log('SUBMIT DEBUG - Sent to customer (Update)');
              
              // Show appropriate toast based on mode (edit vs create)
              toast({
                title: t('quotations.notifications.updateAndSendSuccess') || 'Your Updated Quotation has been sent',
              });
            }
          } else {
            // For new quotations, use our enhanced createQuotation with service items
            result = await createQuotation(createInput, processedServiceItems);
            
            // If sending to customer, send email via the API endpoint
            if (sendToCustomer && result?.id) {
              console.log('SAVE & SEND DEBUG - Sending email for new quotation ID:', result.id);
              // Use the sendQuotation function which takes care of updating status and sending email
              await sendQuotation(result.id);
              console.log('SUBMIT DEBUG - Sent to customer (Create)');
              
              toast({
                title: t('quotations.notifications.sendSuccess') || 'Your Quotation has been sent',
              });
            }
          }
        } else {
          // Fallback to single service mode if no service items were added
          console.log('SAVE & SEND DEBUG - Using single service mode');
          
          if (initialData?.id) {
            // Update existing quotation
            console.log('SAVE & SEND DEBUG - Updating existing quotation ID:', initialData.id);
            result = await updateQuotation(initialData.id, input);
          
            // If sending to customer, send email via the API endpoint
            if (sendToCustomer && result) {
              console.log('SAVE & SEND DEBUG - Sending email for ID:', initialData.id);
              // Use the sendQuotation function which takes care of updating status and sending email
              await sendQuotation(initialData.id);
              console.log('SUBMIT DEBUG - Sent to customer (Update)');
              
              // Show appropriate toast based on mode (edit vs create)
              toast({
                title: t('quotations.notifications.updateAndSendSuccess') || 'Your Updated Quotation has been sent',
              });
            }
          } else {
            // Create new quotation
            console.log('SAVE & SEND DEBUG - Creating new quotation');
            
            // Create the quotation first
            result = await createQuotation(createInput);
            
            // Check if we have quotation items to duplicate and the result was successful
            if (result && initialData && initialData.quotation_items && 
                Array.isArray(initialData.quotation_items) && initialData.quotation_items.length > 0) {
              
              const quotationItems = initialData.quotation_items;
              console.log('SAVE & SEND DEBUG - Including quotation items in creation:', quotationItems.length);
              
              try {
                // We need to use the browser's fetch API instead of the server component
                const items = quotationItems.map(item => ({
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                  sort_order: item.sort_order || 0,
                  quotation_id: result?.id
                }));
                
                console.log('SAVE & SEND DEBUG - Adding items to new quotation:', items);
                
                // Use the fetch API to create the line items
                if (result?.id) {
                  const response = await fetch('/api/quotations/items/bulk-create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      quotation_id: result.id,
                      items: items
                    }),
                  });
                  
                  if (!response.ok) {
                    console.error('SAVE & SEND DEBUG - Error creating line items:', await response.text());
                  } else {
                    console.log('SAVE & SEND DEBUG - Successfully added all items to quotation');
                  }
                }
              } catch (itemsError) {
                console.error('SAVE & SEND DEBUG - Error during items creation:', itemsError);
              }
            }
            
            // If sending to customer, send email via the API endpoint
            if (sendToCustomer && result?.id) {
              console.log('SAVE & SEND DEBUG - Sending email for new quotation ID:', result.id);
              // Use the sendQuotation function which takes care of updating status and sending email
              await sendQuotation(result.id);
              console.log('SUBMIT DEBUG - Sent to customer (Create)');
              
              // Show appropriate toast based on mode
              toast({
                title: t('quotations.notifications.sendSuccess') || 'Your Quotation has been sent',
              });
            }
          }
        }
      } catch (apiError) {
        console.error('SAVE & SEND DEBUG - API error:', apiError);
        console.error('SAVE & SEND DEBUG - API error details:', 
          typeof apiError === 'object' && apiError !== null 
            ? (apiError as any).message || JSON.stringify(apiError)
            : 'Unknown API error');
        throw apiError;
      }

      // Debug log for API result
      console.log('SAVE & SEND DEBUG - API result:', result);
      
      if (result && onSuccess) {
        onSuccess(result);
      } else if (result) {
        router.push(`/quotations/${result.id}` as any);
      } else {
        console.error('SUBMIT DEBUG - No result returned from API');
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('SUBMIT DEBUG - Error in form submission:', error);
      console.error('SUBMIT DEBUG - Error type:', typeof error);
      console.error('SUBMIT DEBUG - Error details:', 
        typeof error === 'object' && error !== null 
          ? (error as any).message || (error as any).details || JSON.stringify(error)
          : 'Unknown error');
      // TODO: Show error message to user
    } finally {
      setSubmittingAndSending(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    // Always allow proceeding from step 1 (service config) regardless of validation
    if (currentStep === 1) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // If we have services added already, also allow proceeding
    if (serviceItems.length > 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }
    
    // Otherwise, optionally trigger validation for the current step before proceeding
    // form.trigger([...fields_in_current_step]).then(isValid => { if(isValid) ... });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render button groups for select fields
  const renderButtonGroup = (
    name: keyof FormData, 
    options: { id: string; name: string }[], 
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="capitalize">{name.replace('_', ' ')}</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant={field.value === option.id ? 'secondary' : 'outline'}
                    onClick={() => field.onChange(option.id)}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all ${
                      field.value === option.id ? 'ring-2 ring-primary' : ''
                    }`}
                    disabled={disabled}
                  >
                    <span className="text-sm font-medium">{option.name}</span>
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
    name: keyof FormData, 
    options: string[], 
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle Type</FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={field.value === option ? 'secondary' : 'outline'}
                    onClick={() => field.onChange(option)}
                     className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all ${field.value === option ? 'ring-2 ring-primary' : ''}`}
                    disabled={disabled}
                  >
                    <span className="text-sm font-medium">{option}</span>
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
    name: keyof FormData,
    options: number[],
    disabled?: boolean
  ) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hours Per Day</FormLabel>
            <FormControl>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {options.map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={field.value === duration ? 'secondary' : 'outline'}
                    onClick={() => field.onChange(duration)}
                    className={`h-auto py-3 px-4 flex flex-col items-center justify-center text-center transition-all ${
                      field.value === duration ? 'ring-2 ring-primary' : ''
                    }`}
                    disabled={disabled}
                  >
                    <span className="text-sm font-medium">{duration} hour{duration !== 1 ? 's' : ''}</span>
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

  // Add a function to handle form submission with explicit control
  const handleExplicitSubmit = (e: React.FormEvent, sendToCustomer = false) => {
    e.preventDefault();
    form.handleSubmit((data) => onSubmit(data, sendToCustomer))(e);
  };

  return (
    <Card className="w-full border shadow-md dark:border-gray-800 relative pb-16 md:pb-0">
       <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 sm:px-6 py-4">
         <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
           {initialData ? <FileText className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
           {initialData ? t('quotations.form.update') : t('quotations.form.create')}
         </CardTitle>
         {!isMobile && (
           <CardDescription>
             Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
           </CardDescription>
         )}
       </CardHeader>

      {/* Wrap both desktop and mobile tab lists inside a Tabs component */}
      <Tabs value={steps[currentStep].id} className="w-full">
        {/* Desktop Tabs */}
        <div className="hidden md:block w-full border-b">
          <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-muted/30 dark:bg-muted/10">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index > currentStep}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2",
                  "text-foreground dark:text-foreground whitespace-nowrap data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                  currentStep === index 
                    ? "border-primary data-[state=active]:border-primary" 
                    : "border-transparent hover:border-gray-600",
                  index > currentStep ? "text-muted-foreground dark:text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <step.icon className="h-4 w-4" />
                <span>{step.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Bottom Fixed Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-muted/30 dark:bg-muted/10 border-t z-50">
          <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-transparent">
             {steps.map((step, index) => (
               <TabsTrigger
                 key={step.id}
                 value={step.id}
                 disabled={index > currentStep}
                 onClick={() => setCurrentStep(index)}
                 className={cn(
                   "flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2",
                   "text-foreground dark:text-foreground data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                   currentStep === index 
                     ? "border-primary data-[state=active]:border-primary" 
                     : "border-transparent",
                   index > currentStep ? "text-muted-foreground dark:text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                 )}
              >
                <step.icon className="h-5 w-5" />
                <span className="text-xs">{step.name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Add empty TabsContent to satisfy the Tabs component's requirement */}
        {steps.map(step => (
          <TabsContent key={step.id} value={step.id} className="hidden">
            {/* Content is controlled by our manual state */}
          </TabsContent>
        ))}
      </Tabs>

      <Form {...form}>
        <form 
          onSubmit={(e) => handleExplicitSubmit(e, true)}
          className="p-3 sm:p-6 pb-20 md:pb-6 space-y-8"
        >
          {currentStep === 0 && (
             <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> {t('quotations.form.customerSection')}</h2>
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quotations.form.title')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('quotations.form.placeholders.title')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" /> {t('quotations.form.customerName')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('quotations.form.placeholders.customerName')}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />{t('quotations.form.customerEmail')}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t('quotations.form.placeholders.customerEmail')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground" />{t('quotations.form.customerPhone')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('quotations.form.placeholders.customerPhone')}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium flex items-center gap-2"><Home className="h-5 w-5" /> Billing Information (Optional)</h3>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="billing_company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Building className="h-4 w-4 text-muted-foreground" />Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                     <FormField
                      control={form.control}
                      name="billing_tax_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Receipt className="h-4 w-4 text-muted-foreground" />Tax Number / VAT ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter tax number or VAT ID"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="billing_street_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter street name"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billing_street_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Number / Building</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter street number or building"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="billing_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter city"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billing_state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter state or province"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={form.control}
                        name="billing_postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal / ZIP Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter postal or ZIP code"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  
                   <FormField
                      control={form.control}
                      name="billing_country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter country"
                              {...field}
                              value={field.value || 'Thailand'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
              </div>
          )}

          {currentStep === 1 && (
             <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Car className="h-5 w-5" /> {t('quotations.form.serviceSection')}</h2>
                 
                {/* Display existing services if any */}
                {serviceItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium flex items-center gap-2">
                        <List className="h-4 w-4 text-muted-foreground" />
                        Selected Services
                      </h3>
                      <Badge variant="outline">{serviceItems.length} {serviceItems.length === 1 ? 'service' : 'services'}</Badge>
                    </div>
                    {renderServiceItemsList()}
                  </div>
                )}
                 
                {/* Service Selection Form - with clear visual separation */}
                <div id="service-form-section" className={cn(
                  "space-y-4 rounded-lg border p-4",
                  serviceItems.length > 0 && "bg-muted/20"
                )}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">
                      {isEditingService 
                        ? `Edit Service: ${selectedItem?.description}`
                        : serviceItems.length > 0 
                          ? "Add Another Service" 
                          : "Configure Service"
                      }
                    </h3>
                  </div>
                  
                  {renderButtonGroup('service_type', getAvailableServiceTypes())}

                  {renderButtonGroup('vehicle_category', getVehicleCategories(), !serviceType)}
                 
                  {renderVehicleTypeButtons('vehicle_type', getVehicleTypesForCategory(), !vehicleCategory)}

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium flex items-center gap-2"><Clock className="h-5 w-5" /> Date, Time & Duration</h3>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="pickup_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Pickup Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
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
                          <FormLabel>Pickup Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              className="w-full"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                    <>
                      <FormField
                        control={form.control}
                        name="service_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Days</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                placeholder="e.g. 1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                value={field.value || '1'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {renderHoursPerDayButtons('hours_per_day', getDurationsForServiceAndVehicle())}
                    </>
                  )}

                  {selectedServiceTypeObject?.name.toLowerCase().includes('airporttransfer') && (
                     <FormField
                       control={form.control}
                       name="duration_hours"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Duration (Hours)</FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               disabled
                               value={1}
                               readOnly
                             />
                           </FormControl>
                           <FormDescription>
                             Airport transfers have a fixed duration of 1 hour.
                           </FormDescription>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                  )}
                  
                  {/* Button to add or update service */}
                  <div className="flex justify-center gap-2 mt-6">
                    {isEditingService ? (
                      <>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={(e) => {
                            // Reset editing state
                            e.preventDefault();
                            setIsEditingService(false);
                            setEditingIndex(null);
                            setSelectedItem(null);
                            
                            // Reset form fields
                            form.setValue('service_type', '');
                            form.setValue('vehicle_category', '');
                            form.setValue('vehicle_type', '');
                            form.setValue('service_days', 1);
                            form.setValue('hours_per_day', undefined);
                          }}
                          className="w-full sm:w-auto"
                        >
                          Cancel Edit
                        </Button>
                        <Button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateServiceItem();
                          }}
                          disabled={!serviceType || !vehicleType}
                          className="w-full sm:w-auto"
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
                        disabled={!serviceType || !vehicleType} // Require at least service type and vehicle type
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" /> 
                        {serviceItems.length === 0 ? 'Add This Service' : 'Add Another Service'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
          )}
          
          {currentStep === 2 && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> {t('quotations.form.pricingSection')}</h2>
                 
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">Currency Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Select 
                      value={selectedCurrency}
                      onValueChange={setSelectedCurrency}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="THB">THB (฿)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
                        <SelectItem value="SGD">SGD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                 
                 <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discount_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Tag className="h-4 w-4 text-muted-foreground" /> {t('quotations.form.discountPercentage')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                              value={field.value || '0'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tax_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1"><Percent className="h-4 w-4 text-muted-foreground" /> {t('quotations.form.taxPercentage')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                              value={field.value || '0'}
                            />
                          </FormControl>
                           <FormDescription>e.g., 7 for 7% VAT</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Card className="bg-muted/40">
                     <CardHeader className="pb-2">
                       <CardTitle className="text-base font-medium">Estimated Pricing</CardTitle>
                       <CardDescription className="text-xs text-muted-foreground">
                         Values stored in {currency}. Displayed as: {selectedCurrency} format
                       </CardDescription>
                     </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {serviceItems.length > 0 ? (
                          // Display multiple services pricing with improved breakdown
                          <>
                            <div className="text-sm font-medium mb-2">Services:</div>
                            {serviceItems.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm pl-4">
                                <span className="truncate max-w-[70%]">{item.description}</span>
                                <span>{formatCurrency(item.total_price || item.unit_price)}</span>
                              </div>
                            ))}
                            <Separator className="my-2" />
                            {(() => {
                              const { baseTotal, discountAmount, subtotal, taxAmount, finalTotal } = calculateFinalAmounts();
                              return (
                                <>
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>Base Amount</span>
                                    <span>{formatCurrency(baseTotal)}</span>
                                  </div>
                                  {(discountPercentage || 0) > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                      <span>Discount ({discountPercentage || 0}%)</span>
                                      <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                  )}
                                  <Separator className="my-1" />
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                  </div>
                                  {(taxPercentage || 0) > 0 && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>Tax ({taxPercentage || 0}%)</span>
                                      <span>+{formatCurrency(taxAmount)}</span>
                                    </div>
                                  )}
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-semibold text-lg">
                                    <span>{t('quotations.pricing.total')}</span>
                                    <span>{formatCurrency(finalTotal)}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          // Traditional single service view remains unchanged
                          <>
                            {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Hourly Rate ({hoursPerDay || 1} hour{(hoursPerDay || 1) !== 1 ? 's' : ''} / day)</span>
                                  <span>{formatCurrency(baseAmount / (serviceDays || 1))}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Number of Days</span>
                                  <span>× {serviceDays || 1}</span>
                                </div>
                                 <Separator className="my-1" />
                                <div className="flex justify-between text-sm font-medium">
                                  <span>Base Amount</span>
                                  <span>{formatCurrency(baseAmount)}</span>
                                </div>
                              </>
                            )}
                            
                            {selectedServiceTypeObject?.name.toLowerCase().includes('airporttransfer') && (
                              <div className="flex justify-between text-sm font-medium">
                                <span>Base Amount</span>
                                <span>{formatCurrency(baseAmount)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
             </div>
          )}
          
          {currentStep === 3 && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> {t('quotations.form.notesSection')}</h2>
                  <FormField
                    control={form.control}
                    name="merchant_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><StickyNote className="h-4 w-4 text-muted-foreground" /> {t('quotations.form.merchantNotes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('quotations.form.placeholders.merchantNotes')}
                            className="min-h-[120px] resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Internal notes, not visible to the customer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><StickyNote className="h-4 w-4 text-muted-foreground" /> {t('quotations.form.customerNotes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('quotations.form.placeholders.customerNotes')}
                            className="min-h-[120px] resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Notes visible to the customer on the quotation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
          )}
          
           {currentStep === 4 && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold flex items-center gap-2"><Eye className="h-5 w-5" /> {t('quotations.form.previewSection')}</h2>
               <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                 <CardContent className="p-4 sm:p-6">
                   <ScrollArea className="h-[400px] pr-4">
                     <div className="space-y-4 text-sm">
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Quotation Summary</h3>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                         <span className="text-muted-foreground">Title:</span> <span>{watchedValues.title || '-'}</span>
                       </div>
                       
                       <Separator className="my-3" />
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Customer Details</h3>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-muted-foreground">Name:</span> <span>{watchedValues.customer_name || '-'}</span>
                          <span className="text-muted-foreground">Email:</span> <span>{watchedValues.customer_email || '-'}</span>
                          <span className="text-muted-foreground">Phone:</span> <span>{watchedValues.customer_phone || '-'}</span>
                       </div>
                       
                       { (watchedValues.billing_company_name || watchedValues.billing_street_name) && (
                         <>
                           <Separator className="my-3" />
                           <h3 className="font-medium text-base mb-2 border-b pb-1">Billing Address</h3>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <span className="text-muted-foreground">Company:</span> <span>{watchedValues.billing_company_name || '-'}</span>
                              <span className="text-muted-foreground">Tax ID:</span> <span>{watchedValues.billing_tax_number || '-'}</span>
                              {/* Wrap Address Label and Value in a Fragment for clarity/linter */}
                              <>
                                <span className="text-muted-foreground">Address:</span> 
                                <span>
                                  {watchedValues.billing_street_name || ''} {watchedValues.billing_street_number || ''}<br/>
                                  {watchedValues.billing_city || ''}{watchedValues.billing_state ? `, ${watchedValues.billing_state}` : ''} {watchedValues.billing_postal_code || ''}<br/>
                                  {watchedValues.billing_country || ''}
                                </span>
                              </>
                           </div>
                         </>
                       )}
                       
                       <Separator className="my-3" />
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Service Details</h3>
                       
                       {serviceItems.length > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <span className="text-muted-foreground">Pickup Date:</span> 
                              <span>{watchedValues.pickup_date ? format(watchedValues.pickup_date, 'PPP') : '-'}</span>
                              <span className="text-muted-foreground">Pickup Time:</span> 
                              <span>{watchedValues.pickup_time || '-'}</span>
                            </div>
                            
                            <div className="pt-2">
                              <h4 className="font-medium">Services ({serviceItems.length}):</h4>
                              <div className="space-y-2 mt-2">
                                {serviceItems.map((item, idx) => (
                                  <div key={idx} className="bg-muted/30 p-3 rounded-md">
                                    <div className="font-medium">{item.description}</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                                      {item.service_type_name?.toLowerCase().includes('charter') ? (
                                        <>
                                          <span className="text-muted-foreground">Days:</span>
                                          <span>{item.service_days || 1}</span>
                                          <span className="text-muted-foreground">Hours per day:</span>
                                          <span>{item.hours_per_day || '-'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-muted-foreground">Duration:</span>
                                          <span>{item.duration_hours} hour(s)</span>
                                        </>
                                      )}
                                      <span className="text-muted-foreground">Price:</span>
                                      <span>{formatCurrency(item.total_price || item.unit_price)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="text-muted-foreground">Service Type:</span> <span>{selectedServiceTypeObject?.name || watchedValues.service_type || '-'}</span>
                            <span className="text-muted-foreground">Vehicle Category:</span> <span>{getVehicleCategories().find(c => c.id === watchedValues.vehicle_category)?.name || '-'}</span>
                            <span className="text-muted-foreground">Vehicle Type:</span> <span>{watchedValues.vehicle_type || '-'}</span>
                            <span className="text-muted-foreground">Pickup Date:</span> <span>{watchedValues.pickup_date ? format(watchedValues.pickup_date, 'PPP') : '-'}</span>
                             <span className="text-muted-foreground">Pickup Time:</span> <span>{watchedValues.pickup_time || '-'}</span>
                            {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                              <>
                                <span className="text-muted-foreground">Service Days:</span> <span>{watchedValues.service_days || 1}</span>
                                <span className="text-muted-foreground">Hours per Day:</span> <span>{watchedValues.hours_per_day || '-'}</span>
                              </>
                            )}
                            {selectedServiceTypeObject?.name.toLowerCase().includes('airporttransfer') && (
                               <>
                                 <span className="text-muted-foreground">Duration:</span> <span>1 Hour</span>
                               </>
                            )}
                          </div>
                        )}
                       
                       <Separator className="my-3" />
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Pricing</h3>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-muted-foreground">Base Amount:</span> 
                          <span>{formatCurrency(serviceItems.length > 0 ? calculateTotalServiceAmount() : baseAmount)}</span>
                          <span className="text-muted-foreground">Discount:</span> <span>{watchedValues.discount_percentage || 0}%</span>
                          <span className="text-muted-foreground">Tax:</span> <span>{watchedValues.tax_percentage || 0}%</span>
                          <span className="text-muted-foreground font-semibold">Total Amount:</span> 
                          <span className="font-semibold">
                            {serviceItems.length > 0 
                              ? formatCurrency(calculateFinalAmounts().finalTotal) 
                              : formatCurrency(totalAmount)}
                          </span>
                       </div>
                       
                       <Separator className="my-3" />
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Notes</h3>
                       <div className="space-y-1">
                         <p><span className="text-muted-foreground">Merchant Notes (Internal):</span> {watchedValues.merchant_notes || '-'}</p>
                         <p><span className="text-muted-foreground">Customer Notes (Visible):</span> {watchedValues.customer_notes || '-'}</p>
                       </div>
                       
                     </div>
                   </ScrollArea>
                 </CardContent>
               </Card>
               <p className="text-sm text-center text-muted-foreground">
                 Please review all details carefully before sending the quotation to the customer.
               </p>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || apiLoading || submittingAndSending}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.previous')}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={nextStep} 
                disabled={apiLoading || submittingAndSending}
                className="gap-2"
              >
                {t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="space-x-2">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={(e) => {
                     e.preventDefault();
                     handleExplicitSubmit(e, false);
                   }}
                   disabled={apiLoading || submittingAndSending}
                   className="gap-2"
                 >
                   {apiLoading && !submittingAndSending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                   <Save className="h-4 w-4"/>
                   {t('quotations.form.saveAsDraft')}
                 </Button>
                 <Button
                   type="submit"
                   disabled={apiLoading || submittingAndSending}
                   className="gap-2"
                 >
                   {(apiLoading || submittingAndSending) && <LoadingSpinner className="mr-2 h-4 w-4" />}
                   <Send className="h-4 w-4"/>
                   {initialData?.id ? t('common.updateAndSend') : t('quotations.form.sendToCustomer')}
                 </Button>
              </div>
            )}
          </div>
        </form>
      </Form>

      {/* Add Service Dialog */}
      <AlertDialog open={isAddingService} onOpenChange={setIsAddingService}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Service</AlertDialogTitle>
            <AlertDialogDescription>
              Add the currently configured service to this quotation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold">Service Type:</div>
                <div>{selectedServiceTypeObject?.name || '-'}</div>
                
                <div className="font-semibold">Vehicle Category:</div>
                <div>{getVehicleCategories().find(c => c.id === vehicleCategory)?.name || '-'}</div>
                
                <div className="font-semibold">Vehicle Type:</div>
                <div>{vehicleType || '-'}</div>
                
                {selectedServiceTypeObject?.name.toLowerCase().includes('charter') && (
                  <>
                    <div className="font-semibold">Days:</div>
                    <div>{serviceDays || 1}</div>
                    
                    <div className="font-semibold">Hours Per Day:</div>
                    <div>{hoursPerDay || '-'}</div>
                  </>
                )}
                
                {selectedServiceTypeObject?.name.toLowerCase().includes('airporttransfer') && (
                  <>
                    <div className="font-semibold">Duration:</div>
                    <div>1 Hour</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddServiceItem}>Add Service</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Remove Service Dialog */}
      <AlertDialog open={isRemovingService} onOpenChange={setIsRemovingService}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this service from the quotation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {selectedItem && (
              <p className="text-sm">
                <span className="font-medium">{selectedItem.description}</span>
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmRemoveServiceItem();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 