"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { FileText, User, Car, DollarSign, Eye, ArrowLeft, ArrowRight, Send, Save } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { PACKAGE_SERVICE_TYPE_ID } from '@/lib/constants/service-types';
import { cn } from '@/lib/utils';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotationService } from '@/lib/hooks/useQuotationService';
import { toast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import LoadingSpinner from '@/components/shared/loading-spinner';

// Import step components
import { CustomerDetailsStep } from './steps/customer-details-step';
import { ServiceSelectionStep } from './steps/service-selection-step';
import { PricingStep } from './steps/pricing-step';
import { NotesStep } from './steps/notes-step';
import { PreviewStep } from './steps/preview-step';

// Import types
import { 
  CreateQuotationInput, 
  Quotation, 
  PricingCategory,
  PricingItem,
  QuotationStatus,
  QuotationItem,
  ServiceItemInput,
  ServiceTypeInfo,
  PricingPackage,
  PricingPromotion
} from '@/types/quotations';

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
  service_type: z.string().optional(),
  vehicle_category: z.string().optional(),
  vehicle_type: z.string().optional(),
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
  serviceTypes: ServiceTypeInfo[];
  pricingCategories: PricingCategory[];
  pricingItems: PricingItem[];
}

// Define steps (names will be translated in the component)
const steps = [
  { id: 'customer', nameKey: 'quotations.form.stepTitles.customerDetails', icon: User },
  { id: 'service', nameKey: 'quotations.form.stepTitles.serviceVehicle', icon: Car },
  { id: 'pricing', nameKey: 'quotations.form.stepTitles.pricingOptions', icon: DollarSign },
  { id: 'notes', nameKey: 'quotations.form.stepTitles.notes', icon: FileText },
  { id: 'preview', nameKey: 'quotations.form.stepTitles.previewSend', icon: Eye },
];

export default function QuotationFormRefactored({ 
  initialData, 
  mode, 
  onSuccess, 
  serviceTypes: initialServiceTypes,
  pricingCategories: initialPricingCategories,
  pricingItems: initialPricingItems 
}: QuotationFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [submittingAndSending, setSubmittingAndSending] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItemInput[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [promotions, setPromotions] = useState<PricingPromotion[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PricingPromotion | null>(null);
  const initializedRef = useRef(false);
  
  // Data state
  const [pricingCategories, setPricingCategories] = useState<PricingCategory[]>(initialPricingCategories || []);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>(initialPricingItems || []);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>(initialServiceTypes || []);
  
  // Hooks
  const {
    createQuotation,
    updateQuotation,
    loading: apiLoading,
    calculateQuotationAmount,
    sendQuotation,
    getPricingPackages,
    getPricingPromotions
  } = useQuotationService();

  // Load packages and promotions
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [packagesData, promotionsData] = await Promise.all([
          getPricingPackages(true, true),
          getPricingPromotions(true)
        ]);
        
        setPackages(packagesData);
        setPromotions(promotionsData);
        
        // Initialize selectedPackage and selectedPromotion if editing existing quotation (only once)
        if (initialData && !initializedRef.current) {
          // Initialize selected package
          const packageId = (initialData as any).selected_package_id;
          if (packageId) {
            const foundPackage = packagesData.find(pkg => pkg.id === packageId);
            if (foundPackage) {
              setSelectedPackage(foundPackage);
            }
          }
          
          // Initialize selected promotion
          const promotionCode = (initialData as any).selected_promotion_code;
          if (promotionCode) {
            const foundPromotion = promotionsData.find(promo => promo.code === promotionCode);
            if (foundPromotion) {
              setSelectedPromotion(foundPromotion);
            }
          } else if ((initialData as any).selected_promotion_name) {
            // Create a temporary promotion object from stored data
            setSelectedPromotion({
              id: (initialData as any).selected_promotion_id || 'stored-promotion',
              name: (initialData as any).selected_promotion_name,
              code: (initialData as any).selected_promotion_code || 'APPLIED',
              description: (initialData as any).selected_promotion_description || '',
              discount_type: 'percentage',
              discount_value: (initialData as any).promotion_discount || 0,
              is_active: true,
              created_at: '',
              updated_at: ''
            } as any);
          }
          
          initializedRef.current = true; // Mark as initialized
        }
      } catch (error) {
        console.error('Error loading pricing data:', error);
      }
    };
    
    loadPricingData();
  }, [getPricingPackages, getPricingPromotions, initialData]);

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

  // Initialize serviceItems if initialData has quotation_items
  useEffect(() => {
    if (initialData?.quotation_items && initialData.quotation_items.length > 0) {
      const items = initialData.quotation_items.map(item => ({
        description: item.description,
        service_type_id: item.service_type_id || '',
        service_type_name: item.service_type_name || '',
        vehicle_category: item.vehicle_category || '',
        vehicle_type: item.vehicle_type || '',
        duration_hours: item.duration_hours || undefined,
        service_days: item.service_days || undefined,
        hours_per_day: item.hours_per_day || undefined,
        unit_price: item.unit_price,
        total_price: item.total_price,
        quantity: item.quantity,
        sort_order: item.sort_order,
        is_service_item: item.is_service_item ?? true,
        pickup_date: item.pickup_date || undefined,
        pickup_time: item.pickup_time || undefined,
        time_based_adjustment: (item as any).time_based_adjustment || undefined,
        time_based_rule_name: (item as any).time_based_rule_name || undefined,
      }));
      setServiceItems(items);
    }
  }, [initialData]);

  // Submit the form
  const onSubmit = async (data: FormData, sendToCustomer = false) => {
    // Guard: require a valid service type when there are no service items
    // For packages, use Charter Services as the fallback service type since packages don't have service_type_id in the service_types table
    const effectiveServiceType = (
      serviceItems[0]?.service_type_id || 
      data.service_type || 
      (selectedPackage ? PACKAGE_SERVICE_TYPE_ID : '') || 
      ''
    ).toString().trim();
    
    if (!effectiveServiceType) {
      toast({
        title: t('quotations.form.error') || 'Error',
        description: t('quotations.form.errors.serviceTypeRequired') || 'Please select a service type before saving',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSubmittingAndSending(sendToCustomer);
      // Progress overlay setup
      setProgressOpen(true);
      setProgressTitle(sendToCustomer ? (initialData?.id ? 'Updating & Sending' : 'Sending Quotation') : (initialData?.id ? 'Updating Draft' : 'Saving Draft'));
      setProgressLabel('Preparing data...');
      setProgressValue(5);
      
      const formData = {
        ...data,
        service_type: data.service_type || '',
        vehicle_category: data.vehicle_category || '',
        vehicle_type: data.vehicle_type || '',
        duration_hours: typeof data.duration_hours === 'number' && !isNaN(data.duration_hours) ? data.duration_hours : 1,
        hours_per_day: typeof data.hours_per_day === 'number' && !isNaN(data.hours_per_day) ? data.hours_per_day : undefined,
        service_days: typeof data.service_days === 'number' && !isNaN(data.service_days) ? data.service_days : 1,
        discount_percentage: typeof data.discount_percentage === 'number' && !isNaN(data.discount_percentage) ? data.discount_percentage : 0,
        tax_percentage: typeof data.tax_percentage === 'number' && !isNaN(data.tax_percentage) ? data.tax_percentage : 0
      };

      // Use data from service items if available, otherwise use form data
      const primaryServiceItem = serviceItems.length > 0 ? serviceItems[0] : null;
      
      const input: CreateQuotationInput = {
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
        // Use the effectiveServiceType which includes the packageFallbackServiceType for packages
        service_type_id: primaryServiceItem?.service_type_id || formData.service_type || effectiveServiceType,
        vehicle_category: primaryServiceItem?.vehicle_category || formData.vehicle_category || undefined,
        vehicle_type: primaryServiceItem?.vehicle_type || formData.vehicle_type || 'Standard Vehicle',
        pickup_date: primaryServiceItem?.pickup_date || (formData.pickup_date ? format(formData.pickup_date, 'yyyy-MM-dd') : undefined),
        pickup_time: primaryServiceItem?.pickup_time || formData.pickup_time || undefined,
        duration_hours: primaryServiceItem?.duration_hours || formData.duration_hours,
        service_days: primaryServiceItem?.service_days || formData.service_days,
        hours_per_day: primaryServiceItem?.hours_per_day || formData.hours_per_day,
        merchant_notes: formData.merchant_notes || undefined,
        discount_percentage: formData.discount_percentage,
        tax_percentage: formData.tax_percentage,
        status: sendToCustomer ? 'sent' as QuotationStatus : 'draft' as QuotationStatus,
        passenger_count: formData.passenger_count,
        currency: 'JPY',
        display_currency: 'JPY',
        // Package fields
        selected_package_id: selectedPackage?.id || undefined,
        selected_package_name: selectedPackage?.name || undefined,
        selected_package_description: selectedPackage?.description || undefined,
        package_discount: 0, // Packages provide value through bundled pricing, not direct discounts
        // Promotion fields
        selected_promotion_id: selectedPromotion?.id || undefined,
        selected_promotion_name: selectedPromotion?.name || undefined,
        selected_promotion_description: selectedPromotion?.description || undefined,
        selected_promotion_code: selectedPromotion?.code || undefined,
        promotion_discount: selectedPromotion?.discount_value || undefined,
      };

      let result: Quotation | null = null;
      // Calculate steps for progress
      let totalSteps = 1; // create/update quotation
      if ((serviceItems.length > 0 || selectedPackage) && initialData?.id) totalSteps += 2; // delete-all + bulk-create
      if (sendToCustomer) totalSteps += 1; // send email
      let completedSteps = 0;
      const advance = (label: string) => {
        completedSteps += 1;
        const pct = Math.min(95, Math.round((completedSteps / totalSteps) * 100));
        setProgressValue(pct);
        setProgressLabel(label);
      };

      if (serviceItems.length > 0) {
        const processedServiceItems = serviceItems.map(item => ({
          ...item,
          total_price: item.total_price || (item.unit_price * (item.quantity || 1))
        }));

        if (initialData?.id) {
          result = await updateQuotation(initialData.id, input);
          advance('Quotation record saved');
          
           if (result) {
            // Update service items
            await fetch(`/api/quotations/${initialData.id}/items/delete-all`, { method: 'DELETE' });
            advance('Removing previous items');
             await fetch('/api/quotations/items/bulk-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quotation_id: initialData.id,
                 items: processedServiceItems
              })
            });
            advance('Saving items');
          }
          
          if (sendToCustomer && result) {
            await sendQuotation(initialData.id);
            advance('Emailing customer');
            toast({ title: t('quotations.notifications.updateAndSendSuccess') || 'Updated and sent successfully' });
          }
        } else {
          // If only a package is selected and no serviceItems, still create with empty array
          result = await createQuotation(input, processedServiceItems);
          advance(serviceItems.length > 0 ? 'Saving quotation and items' : 'Saving quotation');
          
          if (sendToCustomer && result?.id) {
            await sendQuotation(result.id);
            advance('Emailing customer');
            toast({ title: t('quotations.notifications.sendSuccess') || 'Quotation sent successfully' });
          }
        }
      } else {
        if (initialData?.id) {
          result = await updateQuotation(initialData.id, input);
          advance('Quotation record saved');
          if (sendToCustomer && result) {
            await sendQuotation(initialData.id);
            advance('Emailing customer');
            toast({ title: t('quotations.notifications.updateAndSendSuccess') || 'Updated and sent successfully' });
          }
        } else {
          result = await createQuotation(input);
          advance('Saving quotation');
          if (sendToCustomer && result?.id) {
            await sendQuotation(result.id);
            advance('Emailing customer');
            toast({ title: t('quotations.notifications.sendSuccess') || 'Quotation sent successfully' });
          }
        }
      }

      if (result && onSuccess) {
        onSuccess(result);
      } else if (result) {
        router.push(`/quotations/${result.id}` as any);
      }
      setProgressValue(100);
      setProgressLabel('Completed');
      setTimeout(() => setProgressOpen(false), 600);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: t('quotations.form.error') || 'Error',
        description: 'Failed to process quotation',
        variant: 'destructive'
      });
      setProgressLabel('Failed');
      setProgressValue(100);
      setTimeout(() => setProgressOpen(false), 1200);
    } finally {
      setSubmittingAndSending(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission with explicit control
  const handleExplicitSubmit = (e: React.FormEvent, sendToCustomer = false) => {
    e.preventDefault();
    form.handleSubmit((data) => onSubmit(data, sendToCustomer))(e);
  };

  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressTitle, setProgressTitle] = useState('Saving');
  const [progressLabel, setProgressLabel] = useState('Starting...');

  return (
    <Card className="w-full border shadow-md dark:border-gray-800 relative pb-16 md:pb-0">
      <CardHeader className="bg-muted/30 rounded-t-lg border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          {initialData ? <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> : <FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
          {initialData ? t('quotations.form.update') : t('quotations.form.create')}
        </CardTitle>
        {!isMobile && (
          <CardDescription className="text-xs sm:text-sm">
            Step {currentStep + 1} of {steps.length}: {t(steps[currentStep].nameKey)}
          </CardDescription>
        )}
      </CardHeader>

      {/* Wrap both desktop and mobile tab lists inside a Tabs component */}
      <Tabs value={steps[currentStep].id} className="w-full">
        {/* Desktop/Tablet Tabs */}
        <div className="hidden md:block w-full border-b">
          <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-muted/30 dark:bg-muted/10">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index > currentStep}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 md:py-4 px-1 sm:px-2 md:px-3 rounded-none border-b-2",
                  "text-foreground dark:text-foreground text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                  currentStep === index 
                    ? "border-primary data-[state=active]:border-primary" 
                    : "border-transparent hover:border-gray-600",
                  index > currentStep ? "text-muted-foreground dark:text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <step.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t(step.nameKey)}</span>
                <span className="sm:hidden">{t(step.nameKey).split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Bottom Fixed Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-muted/95 dark:bg-muted/95 backdrop-blur-sm border-t z-50">
          <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-transparent">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index > currentStep}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-none border-t-2",
                  "text-foreground dark:text-foreground data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                  currentStep === index 
                    ? "border-primary data-[state=active]:border-primary" 
                    : "border-transparent",
                  index > currentStep ? "text-muted-foreground dark:text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <step.icon className="h-4 w-4" />
                <span className="text-xs leading-tight">{t(step.nameKey).split(' ')[0]}</span>
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
          className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6 space-y-6 sm:space-y-8"
        >
          {/* Step Content */}
          {currentStep === 0 && (
            <CustomerDetailsStep form={form} />
          )}

          {currentStep === 1 && (
            <ServiceSelectionStep 
              form={form}
              serviceItems={serviceItems}
              setServiceItems={setServiceItems}
              packages={packages}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              allServiceTypes={allServiceTypes}
              pricingCategories={pricingCategories}
              pricingItems={pricingItems}
              calculateQuotationAmount={calculateQuotationAmount}
            />
          )}

          {currentStep === 2 && (
            <PricingStep 
              form={form}
              serviceItems={serviceItems}
              packages={packages}
              promotions={promotions}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              selectedPromotion={selectedPromotion}
              setSelectedPromotion={setSelectedPromotion}
            />
          )}

          {currentStep === 3 && (
            <NotesStep form={form} />
          )}

          {currentStep === 4 && (
            <PreviewStep 
              form={form}
              serviceItems={serviceItems}
              selectedPackage={selectedPackage}
              selectedPromotion={selectedPromotion}
              packages={packages}
            />
          )}

          {/* Navigation - Optimized for mobile/tablet */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 border-t gap-3 sm:gap-4 relative">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || apiLoading || submittingAndSending}
              className="w-full sm:w-auto order-2 sm:order-1 gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.previous')}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button 
                type="button" 
                onClick={nextStep} 
                disabled={apiLoading || submittingAndSending}
                className="w-full sm:w-auto order-1 sm:order-2 gap-2 text-sm"
              >
                {t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleExplicitSubmit(e, false);
                  }}
                  disabled={apiLoading || submittingAndSending}
                  className="w-full sm:w-auto gap-2 text-sm"
                >
                  {apiLoading && !submittingAndSending && <LoadingSpinner className="mr-2 h-4 w-4" />}
                  <Save className="h-4 w-4"/>
                  {t('quotations.form.saveAsDraft')}
                </Button>
                <Button
                  type="submit"
                  disabled={apiLoading || submittingAndSending}
                  className="w-full sm:w-auto gap-2 text-sm"
                >
                  {(apiLoading || submittingAndSending) && <LoadingSpinner className="mr-2 h-4 w-4" />}
                  <Send className="h-4 w-4"/>
                  {initialData?.id ? t('common.updateAndSend') : t('quotations.form.sendToCustomer')}
                </Button>
              </div>
            )}
          </div>
          {(apiLoading || submittingAndSending) && (
            <div className="absolute inset-x-0 -bottom-0.5 md:bottom-auto md:top-[52px]">
              <div className="h-1 w-full bg-muted/40">
                <div className="h-1 bg-primary animate-[progress_1.2s_ease_infinite]" style={{width: '40%'}} />
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* Progress Modal */}
      <Dialog open={progressOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{progressTitle}</DialogTitle>
            <DialogDescription className="sr-only">Saving quotation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress value={progressValue} />
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{progressLabel}</span>
              <span className="font-medium text-foreground">{progressValue}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 