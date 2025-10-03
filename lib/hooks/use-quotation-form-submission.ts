import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { PACKAGE_SERVICE_TYPE_ID } from '@/lib/constants/service-types';
import { useQuotationService } from './use-quotation-service';
import { useProgressSteps } from './use-progress-steps';
import { useCountdownToast } from './use-countdown-toast';
import { progressConfigs } from '@/lib/config/progressConfigs';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { 
  CreateQuotationInput, 
  Quotation, 
  ServiceItemInput,
  PricingPackage,
  PricingPromotion,
  QuotationStatus
} from '@/types/quotations';

interface UseQuotationFormSubmissionProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  selectedPackage: PricingPackage | null;
  selectedPromotion: PricingPromotion | null;
  currentTeam: 'japan' | 'thailand';
  initialData?: Quotation & { quotation_items?: any[] };
  onSuccess?: (quotation: Quotation) => void;
}

export function useQuotationFormSubmission({
  form,
  serviceItems,
  selectedPackage,
  selectedPromotion,
  currentTeam,
  initialData,
  onSuccess
}: UseQuotationFormSubmissionProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [submittingAndSending, setSubmittingAndSending] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState('Saving');
  const [progressVariant, setProgressVariant] = useState<'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default');
  
  const {
    createQuotation,
    updateQuotation,
    loading: apiLoading
  } = useQuotationService();

  const { 
    progressValue, 
    progressLabel, 
    progressSteps, 
    setProgressSteps, 
    startProgress, 
    resetProgress 
  } = useProgressSteps();
  
  const { 
    isVisible: isCountdownVisible, 
    toastConfig, 
    showCountdownToast, 
    handleComplete: handleCountdownComplete 
  } = useCountdownToast();

  // Calculate promotion discount amount
  const calculatePromotionDiscount = useCallback((baseAmount: number) => {
    if (!selectedPromotion) return 0;
    
    if (selectedPromotion.discount_type === 'percentage') {
      const discount = baseAmount * (selectedPromotion.discount_value / 100);
      return selectedPromotion.maximum_discount 
        ? Math.min(discount, selectedPromotion.maximum_discount)
        : discount;
    } else {
      return Math.min(selectedPromotion.discount_value, baseAmount);
    }
  }, [selectedPromotion]);

  // Calculate form totals
  const calculateFormTotals = useCallback(() => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (serviceItems.length > 0) {
      serviceItems.forEach((item) => {
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (item.service_type_name?.toLowerCase().includes('charter')) {
          itemBasePrice = item.unit_price * (item.service_days || 1);
        } else {
          itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        }
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const formData = form.getValues();
    const discountPercentage = formData.discount_percentage || 0;
    const taxPercentage = formData.tax_percentage || 0;
    
    const promotionDiscount = calculatePromotionDiscount(baseTotal);
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      baseAmount: baseTotal,
      totalAmount: finalTotal
    };
  }, [serviceItems, selectedPackage, form, calculatePromotionDiscount]);

  // Prepare form data for submission
  const prepareFormData = useCallback((data: any) => {
    const primaryServiceItem = serviceItems.length > 0 ? serviceItems[0] : null;
    const computedTotals = calculateFormTotals();
    const promotionDiscountAmount = calculatePromotionDiscount(computedTotals.baseAmount);

    return {
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
  }, [serviceItems, calculateFormTotals, calculatePromotionDiscount]);

  // Create quotation input
  const createQuotationInput = useCallback((formData: any): CreateQuotationInput => {
    const primaryServiceItem = serviceItems.length > 0 ? serviceItems[0] : null;
    const computedTotals = calculateFormTotals();
    const promotionDiscountAmount = calculatePromotionDiscount(computedTotals.baseAmount);

    return {
      title: formData.title || '',
      customer_name: formData.customer_name || undefined,
      customer_email: formData.customer_email || '',
      customer_phone: formData.customer_phone || undefined,
      billing_company_name: formData.billing_company_name || undefined,
      billing_tax_number: formData.billing_tax_number || undefined,
      billing_street_name: formData.billing_street_name || undefined,
      billing_street_number: formData.billing_street_number || undefined,
      billing_city: formData.billing_city || undefined,
      billing_state: formData.billing_state || undefined,
      billing_postal_code: formData.billing_postal_code || undefined,
      billing_country: formData.billing_country || undefined,
      service_type_id: primaryServiceItem?.service_type_id || formData.service_type || '',
      vehicle_category: primaryServiceItem?.vehicle_category || formData.vehicle_category || undefined,
      vehicle_type: (() => {
        const vehicleType = primaryServiceItem?.vehicle_type || formData.vehicle_type || '';
        if (typeof vehicleType === 'object' && vehicleType !== null) {
          return `${vehicleType.brand} ${vehicleType.model}`;
        }
        return vehicleType as string;
      })(),
      pickup_date: primaryServiceItem?.pickup_date || (formData.pickup_date ? format(formData.pickup_date, 'yyyy-MM-dd') : undefined),
      pickup_time: primaryServiceItem?.pickup_time || formData.pickup_time || undefined,
      duration_hours: primaryServiceItem?.duration_hours || formData.duration_hours,
      service_days: primaryServiceItem?.service_days || formData.service_days,
      hours_per_day: primaryServiceItem?.hours_per_day || formData.hours_per_day || undefined,
      passenger_count: formData.passenger_count || undefined,
      merchant_notes: formData.internal_notes || formData.merchant_notes || undefined,
      customer_notes: formData.customer_notes || undefined,
      general_notes: formData.general_notes || undefined,
      discount_percentage: formData.discount_percentage,
      tax_percentage: formData.tax_percentage,
      status: 'draft' as QuotationStatus, // Will be updated to 'sent' if sending
      currency: 'JPY',
      display_currency: formData.display_currency || 'JPY',
      // Package fields
      selected_package_id: selectedPackage?.id || undefined,
      selected_package_name: selectedPackage?.name || undefined,
      selected_package_description: selectedPackage?.description || undefined,
      package_discount: 0,
      // Promotion fields
      selected_promotion_id: selectedPromotion?.id || undefined,
      selected_promotion_name: selectedPromotion?.name || undefined,
      selected_promotion_description: selectedPromotion?.description || undefined,
      selected_promotion_code: selectedPromotion?.code || undefined,
      promotion_discount: promotionDiscountAmount || undefined,
      // Team tracking fields
      team_location: currentTeam,
      // Add computed totals for database storage
      __computedTotals: computedTotals,
    };
  }, [serviceItems, selectedPackage, selectedPromotion, currentTeam, form, calculateFormTotals, calculatePromotionDiscount]);

  // Send quotation email
  const sendQuotationEmail = useCallback(async (quotationId: string, email: string, language: string, bccEmails: string) => {
    const emailResponsePromise = fetch('/api/quotations/send-email-unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotation_id: quotationId,
        email,
        language,
        bcc_emails: bccEmails
      }),
    });
    
    // Start progress simulation with API promise
    const progressPromise = startProgress(progressConfigs.sendEmail, emailResponsePromise);
    
    // Wait for both to complete
    const [emailResponse] = await Promise.all([emailResponsePromise, progressPromise]);
    
    if (!emailResponse.ok) {
      throw new Error('Failed to send quotation email');
    }
    
    return emailResponse;
  }, [startProgress]);

  // Main submission function
  const submitForm = useCallback(async (data: any, sendToCustomer = false, emailSettings?: { email: string; language: string; bccEmails: string }) => {
    // Guard against duplicate submissions
    if (submittingAndSending) {
      return;
    }

    // Set submitting state immediately to prevent duplicates
    setSubmittingAndSending(sendToCustomer);

    // Guard: require a valid service type when there are no service items
    const effectiveServiceType = (
      serviceItems[0]?.service_type_id || 
      data.service_type || 
      (selectedPackage ? PACKAGE_SERVICE_TYPE_ID : '') || 
      ''
    ).toString().trim();
    
    if (!effectiveServiceType) {
      setSubmittingAndSending(false);
      toast({
        title: t('quotations.form.error') || 'Error',
        description: t('quotations.form.errors.serviceTypeRequired') || 'Please select a service type before saving',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Progress overlay setup
      setProgressOpen(true);
      setProgressTitle(sendToCustomer ? (initialData?.id ? 'Updating & Sending' : 'Sending Quotation') : (initialData?.id ? 'Updating Draft' : 'Saving Draft'));
      
      const formData = prepareFormData(data);
      const input = createQuotationInput(formData);
      
      // Update status if sending to customer
      if (sendToCustomer) {
        input.status = 'sent' as QuotationStatus;
      }

      let result: Quotation | null = null;
      let progressPromise: Promise<void> | null = null;

      if (serviceItems.length > 0) {
        const processedServiceItems = serviceItems.map(item => ({
          ...item,
          total_price: item.total_price || (item.unit_price * (item.quantity || 1))
        }));

        // Start progress animation for save as draft
        if (!sendToCustomer) {
          const progressConfig = initialData?.id ? progressConfigs.updateDraft : progressConfigs.saveDraft;
          setProgressSteps(progressConfig.steps);
          progressPromise = startProgress(progressConfig);
        }

        if (initialData?.id) {
          result = await updateQuotation(initialData.id, input);
          
          if (result) {
            // Update service items
            await fetch(`/api/quotations/${initialData.id}/items/delete-all`, { method: 'DELETE' });
            await fetch('/api/quotations/items/bulk-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quotation_id: initialData.id,
                items: processedServiceItems
              })
            });
          }
        } else {
          result = await createQuotation(input, processedServiceItems);
        }
      } else {
        // Start progress animation for save as draft (no service items)
        if (!sendToCustomer) {
          const progressConfig = initialData?.id ? progressConfigs.updateDraft : progressConfigs.saveDraft;
          setProgressSteps(progressConfig.steps);
          progressPromise = startProgress(progressConfig);
        }

        if (initialData?.id) {
          result = await updateQuotation(initialData.id, input);
        } else {
          result = await createQuotation(input);
        }
      }

      // Handle email sending if requested
      if (sendToCustomer && result?.id && emailSettings) {
        setProgressVariant('email');
        setProgressTitle('Sending Quotation');
        setProgressSteps(progressConfigs.sendEmail.steps);
        
        await sendQuotationEmail(result.id, emailSettings.email, emailSettings.language, emailSettings.bccEmails);
        
        // Show countdown toast for redirection
        const beautifulUrl = result.quote_number 
          ? `/quotations/QUO-JPDR-${result.quote_number.toString().padStart(6, '0')}`
          : `/quotations/${result.id}`;
        
        showCountdownToast({
          message: "Quotation sent successfully!",
          redirectUrl: beautifulUrl,
          duration: 3
        });
        
        if (onSuccess) {
          onSuccess(result);
        }
      }

      // Handle redirection for save as draft
      if (!sendToCustomer && result?.id) {
        // Wait for progress animation to complete
        if (progressPromise) {
          await progressPromise;
        }
        
        setTimeout(() => {
          setProgressOpen(false);
          router.push('/quotations');
        }, 200);
      } else {
        // Wait for progress animation to complete
        if (progressPromise) {
          await progressPromise;
        }
        
        setTimeout(() => setProgressOpen(false), 200);
      }

    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: t('quotations.form.error') || 'Error',
        description: 'Failed to process quotation',
        variant: 'destructive'
      });
      setTimeout(() => setProgressOpen(false), 500);
    } finally {
      setSubmittingAndSending(false);
    }
  }, [
    submittingAndSending,
    serviceItems,
    selectedPackage,
    initialData,
    form,
    prepareFormData,
    createQuotationInput,
    updateQuotation,
    createQuotation,
    sendQuotationEmail,
    showCountdownToast,
    onSuccess,
    router,
    t
  ]);

  return {
    submittingAndSending,
    apiLoading,
    progressOpen,
    setProgressOpen,
    progressTitle,
    setProgressTitle,
    progressVariant,
    setProgressVariant,
    progressValue,
    progressLabel,
    progressSteps,
    setProgressSteps,
    isCountdownVisible,
    toastConfig,
    handleCountdownComplete,
    submitForm,
    calculateFormTotals
  };
}
