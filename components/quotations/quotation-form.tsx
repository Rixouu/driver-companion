"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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
  Eye
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
  QuotationStatus
} from '@/types/quotations';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

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
  service_type: z.string().min(1, { message: 'Service type is required' }),
  vehicle_category: z.string().min(1, { message: 'Vehicle category is required' }),
  vehicle_type: z.string().min(1, { message: 'Vehicle type is required' }),
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
  initialData?: Quotation & { quotation_items?: any[] };
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
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('THB');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submittingAndSending, setSubmittingAndSending] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    createQuotation,
    updateQuotation,
    loading: apiLoading,
    calculateQuotationAmount,
    getPricingCategories,
    getPricingItems,
    sendQuotation
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
      service_type: initialData?.service_type || '',
      vehicle_category: '',
      vehicle_type: initialData?.vehicle_type || '',
      pickup_date: initialData?.pickup_date ? new Date(initialData.pickup_date) : undefined,
      pickup_time: initialData?.pickup_time || '',
      duration_hours: initialData?.duration_hours || 1,
      service_days: initialData?.service_days || 1,
      hours_per_day: initialData?.hours_per_day || (initialData?.service_type === 'charter' ? initialData?.duration_hours : 1) || 1,
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
          if (initialData?.service_type) {
            const matchingCategory = categories.find(c => 
              c.service_types.includes(initialData.service_type)
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
          const effectiveDuration = serviceType === 'charter' ? hoursPerDay || durationHours : durationHours;
          
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
    calculateQuotationAmount
  ]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get service types for the selected category
  const getServiceTypesForCategory = () => {
    if (selectedCategory) {
      const category = pricingCategories.find(cat => cat.id === selectedCategory);
      return category ? category.service_types : [];
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
      .filter(item => item.service_type === serviceType)
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
  const getAvailableServiceTypes = () => {
    return [
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
      const inputData = {
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
        service_type: formData.service_type,
        vehicle_category: formData.vehicle_category || undefined,
        vehicle_type: formData.vehicle_type,
        pickup_date: formData.pickup_date ? format(formData.pickup_date, 'yyyy-MM-dd') : undefined,
        pickup_time: formData.pickup_time || undefined,
        duration_hours: typeof formData.duration_hours === 'number' ? formData.duration_hours : 1,
        service_days: typeof formData.service_days === 'number' ? formData.service_days : 1,
        hours_per_day: (formData.service_type === 'charter' && typeof formData.hours_per_day === 'number') ? formData.hours_per_day : undefined,
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
                : null // Default to null for undefined/null/other values
      };
      
      // Additional numeric field sanitization to ensure no 'none' values slip through
      ['duration_hours', 'service_days', 'hours_per_day', 'discount_percentage', 'tax_percentage'].forEach(field => {
        if ((inputData as any)[field] === 'none' || (inputData as any)[field] === 'undefined') {
          console.log(`SAVE & SEND DEBUG - Replaced "none" value in ${field}`);
          
          if (['service_days', 'duration_hours'].includes(field)) {
            (inputData as any)[field] = 1;
          } else if (['discount_percentage', 'tax_percentage'].includes(field)) {
            (inputData as any)[field] = 0;
          } else if (field === 'hours_per_day') {
            (inputData as any)[field] = null;
          }
        }
      });
      
      // Create input object for the API
      const input: CreateQuotationInput = {
        ...inputData,
        // Fix for passenger_count specifically
        passenger_count: inputData.passenger_count,
        // Convert pickup_date from Date to string if needed
        pickup_date: inputData.pickup_date as string
      };
      
      // Debug log for API input - important for diagnosing issues
      console.log('SAVE & SEND DEBUG - API input:', input);

      let result: Quotation | null;

      try {
        if (initialData) {
          // Update existing quotation
          console.log('SAVE & SEND DEBUG - Updating existing quotation ID:', initialData.id);
          result = await updateQuotation(initialData.id, input);
        
          // If sending to customer, send email via the API endpoint
          if (sendToCustomer && result) {
            console.log('SAVE & SEND DEBUG - Sending email for ID:', initialData.id);
            // Use the sendQuotation function which takes care of updating status and sending email
            await sendQuotation(initialData.id);
            console.log('SUBMIT DEBUG - Sent to customer (Update)');
          }
        } else {
          // Create new quotation
          console.log('SAVE & SEND DEBUG - Creating new quotation');
          result = await createQuotation(input);
          
          // If sending to customer, send email via the API endpoint
          if (sendToCustomer && result) {
            console.log('SAVE & SEND DEBUG - Sending email for new quotation ID:', result.id);
            // Use the sendQuotation function which takes care of updating status and sending email
            await sendQuotation(result.id);
            console.log('SUBMIT DEBUG - Sent to customer (Create)');
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
    // Optionally trigger validation for the current step before proceeding
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
          onSubmit={form.handleSubmit((data) => onSubmit(data, true))}
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

                  {serviceType === 'charter' && (
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

                  {serviceType && serviceType.includes('airportTransfer') && (
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
              </div>
          )}
          
          {currentStep === 2 && (
             <div className="space-y-6">
               <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> {t('quotations.form.pricingSection')}</h2>
                 
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
                     </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {serviceType === 'charter' && (
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
                        
                        {serviceType && !serviceType.includes('charter') && (
                          <div className="flex justify-between text-sm font-medium">
                            <span>Base Amount</span>
                            <span>{formatCurrency(baseAmount)}</span>
                          </div>
                        )}
                        
                        {(discountPercentage || 0) > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Discount ({discountPercentage || 0}%)</span>
                            <span>-{formatCurrency((baseAmount * (discountPercentage || 0)) / 100)}</span>
                          </div>
                        )}
                         <Separator className="my-1" />
                         <div className="flex justify-between text-sm font-medium">
                            <span>Subtotal</span>
                            <span>{formatCurrency(baseAmount * (1 - (discountPercentage || 0) / 100))}</span>
                          </div>

                        {(taxPercentage || 0) > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Tax ({taxPercentage || 0}%)</span>
                            <span>+{formatCurrency((baseAmount * (1 - (discountPercentage || 0) / 100) * (taxPercentage || 0)) / 100)}</span>
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>{t('quotations.pricing.total')}</span>
                          <span>{formatCurrency(totalAmount)}</span>
                        </div>
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
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-muted-foreground">Service Type:</span> <span>{getAvailableServiceTypes().find(s => s.id === watchedValues.service_type)?.name || '-'}</span>
                          <span className="text-muted-foreground">Vehicle Category:</span> <span>{getVehicleCategories().find(c => c.id === watchedValues.vehicle_category)?.name || '-'}</span>
                          <span className="text-muted-foreground">Vehicle Type:</span> <span>{watchedValues.vehicle_type || '-'}</span>
                          <span className="text-muted-foreground">Pickup Date:</span> <span>{watchedValues.pickup_date ? format(watchedValues.pickup_date, 'PPP') : '-'}</span>
                           <span className="text-muted-foreground">Pickup Time:</span> <span>{watchedValues.pickup_time || '-'}</span>
                          {watchedValues.service_type === 'charter' && (
                            <>
                              <span className="text-muted-foreground">Service Days:</span> <span>{watchedValues.service_days || 1}</span>
                              <span className="text-muted-foreground">Hours per Day:</span> <span>{watchedValues.hours_per_day || '-'}</span>
                            </>
                          )}
                          {watchedValues.service_type?.includes('airportTransfer') && (
                             <>
                               <span className="text-muted-foreground">Duration:</span> <span>1 Hour</span>
                             </>
                          )}
                       </div>
                       
                       <Separator className="my-3" />
                       <h3 className="font-medium text-base mb-2 border-b pb-1">Pricing</h3>
                       <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-muted-foreground">Base Amount:</span> <span>{formatCurrency(baseAmount)}</span>
                          <span className="text-muted-foreground">Discount:</span> <span>{watchedValues.discount_percentage || 0}%</span>
                          <span className="text-muted-foreground">Tax:</span> <span>{watchedValues.tax_percentage || 0}%</span>
                          <span className="text-muted-foreground font-semibold">Total Amount:</span> <span className="font-semibold">{formatCurrency(totalAmount)}</span>
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
                 {!initialData && (
                   <Button
                     type="button"
                     variant="outline"
                     onClick={form.handleSubmit((data) => onSubmit(data, false))}
                     disabled={apiLoading || submittingAndSending}
                     className="gap-2"
                   >
                     {apiLoading && !submittingAndSending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                     <Save className="h-4 w-4"/>
                     {t('quotations.form.saveAsDraft')}
                   </Button>
                 )}
                 <Button
                   type="submit"
                   disabled={apiLoading || submittingAndSending}
                   className="gap-2"
                 >
                   {(apiLoading || submittingAndSending) && <LoadingSpinner className="mr-2 h-4 w-4" />}
                   <Send className="h-4 w-4"/>
                   {initialData ? t('common.updateAndSend') : t('quotations.form.sendToCustomer')}
                 </Button>
              </div>
            )}
          </div>
        </form>
      </Form>
    </Card>
  );
} 