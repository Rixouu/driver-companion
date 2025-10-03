"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseISO } from 'date-fns';
import { FileText, User, Car, DollarSign, Eye, ArrowLeft, ArrowRight, Send, Save } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuotationService } from '@/lib/hooks/use-quotation-service';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { TeamSwitcher } from '@/components/team-switcher';
import LoadingModal from '@/components/ui/loading-modal';
import { CountdownToast } from '@/components/ui/countdown-toast';

// Import step components
import { CustomerDetailsStep } from './steps/customer-details-step';
import { ServiceSelectionStep } from './steps/service-selection-step';
import { PricingStep } from './steps/pricing-step';
import { PreviewStep } from './steps/preview-step';
import { QuotationSummary } from './quotation-summary';

// Import dialogs
import { BccDialog } from './dialogs/bcc-dialog';

// Import hooks
import { useQuotationFormData } from '@/lib/hooks/use-quotation-form-data';
import { useQuotationFormState } from '@/lib/hooks/use-quotation-form-state';
import { useQuotationFormSubmission } from '@/lib/hooks/use-quotation-form-submission';
import { useQuotationEmailSettings } from '@/lib/hooks/use-quotation-email-settings';

// Import types and schema
import { 
  Quotation, 
  PricingCategory,
  PricingItem,
  QuotationItem,
  ServiceTypeInfo
} from '@/types/quotations';
import { quotationFormSchema, QuotationFormData } from '@/lib/validations/quotation-form-schema';

// Use the extracted form schema

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
  { id: 'routes', nameKey: 'quotations.form.stepTitles.routesServices', icon: Car },
  { id: 'customer', nameKey: 'quotations.form.stepTitles.customerDetails', icon: User },
  { id: 'pricing', nameKey: 'quotations.form.stepTitles.pricingOptions', icon: DollarSign },
  { id: 'preview', nameKey: 'quotations.form.stepTitles.previewSend', icon: Eye },
];

export default function QuotationForm({ 
  initialData, 
  mode, 
  onSuccess, 
  serviceTypes: initialServiceTypes,
  pricingCategories: initialPricingCategories,
  pricingItems: initialPricingItems 
}: QuotationFormProps) {
  const { t } = useI18n();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Initialize form
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
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
      billing_country: initialData?.billing_country || '',
      service_type: initialData?.service_type_id || '',
      vehicle_category: initialData?.vehicle_category || '',
      vehicle_type: initialData?.vehicle_type || '',
      pickup_date: initialData?.pickup_date ? parseISO(initialData.pickup_date) : undefined,
      pickup_time: initialData?.pickup_time || '',
      pickup_location: initialData?.pickup_location || '',
      dropoff_location: initialData?.dropoff_location || '',
      flight_number: initialData?.flight_number || '',
      terminal: initialData?.terminal || '',
      number_of_passengers: initialData?.number_of_passengers || null,
      number_of_bags: initialData?.number_of_bags || null,
      duration_hours: initialData?.duration_hours || 1,
      service_days: initialData?.service_days || 1,
      hours_per_day: initialData?.hours_per_day || null,
      discount_percentage: initialData?.discount_percentage || 0,
      tax_percentage: initialData?.tax_percentage || 0,
      merchant_notes: initialData?.merchant_notes || '',
      customer_notes: initialData?.customer_notes || '',
      internal_notes: initialData?.merchant_notes || '',
      general_notes: initialData?.general_notes || '',
      passenger_count: initialData?.passenger_count || null,
      display_currency: initialData?.display_currency || 'JPY',
      team_location: initialData?.team_location || 'thailand',
    },
  });

  // Use the new dynamic data hook
  const { 
    data: quotationFormData, 
    loading: formDataLoading, 
    error: formDataError,
    getVehiclesForCategory,
    getPricingForServiceAndVehicle,
    getBasePrice,
    getAvailableDurations
  } = useQuotationFormData();
  
  // Hooks
  const {
    calculateQuotationAmount,
    getPricingPackages,
    getPricingPromotions
  } = useQuotationService();

  // Use form state management hook
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    serviceItems,
    setServiceItems,
    packages,
    setPackages,
    promotions,
    setPromotions,
    selectedPackage,
    setSelectedPackage,
    selectedPromotion,
    setSelectedPromotion,
    pricingCategories,
    setPricingCategories,
    pricingItems,
    setPricingItems,
    allServiceTypes,
    setAllServiceTypes,
    currentTeam,
    setCurrentTeam
  } = useQuotationFormState({
    form,
    initialData,
    initialServiceTypes,
    initialPricingCategories,
    initialPricingItems,
    getPricingPackages: () => getPricingPackages(true, true),
    getPricingPromotions: () => getPricingPromotions(true)
  });

  // Use form submission hook
  const {
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
  } = useQuotationFormSubmission({
    form,
    serviceItems,
    selectedPackage,
    selectedPromotion,
    currentTeam,
    initialData,
    onSuccess
  });

  // Use email settings hook
  const {
    isBccDialogOpen,
    emailSettings,
    updateEmailSettings,
    openBccDialog,
    closeBccDialog
  } = useQuotationEmailSettings(form);

  // Handle form submission with explicit control
  const handleExplicitSubmit = (e: React.FormEvent, sendToCustomer = false) => {
    e.preventDefault();
    if (sendToCustomer) {
      openBccDialog();
    } else {
      form.handleSubmit((data) => submitForm(data, false))();
    }
  };

  // Handle BCC dialog submission
  const handleBccSubmit = () => {
    closeBccDialog();
    form.handleSubmit((data) => submitForm(data, true, emailSettings))();
  };


  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full mx-auto">
      {/* Main Form Content */}
      <div className="flex-1 space-y-6">
        <Card className="w-full border shadow-md dark:border-gray-800 relative pb-16 md:pb-0">
      <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              {initialData ? <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> : <FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
              {initialData ? t('quotations.form.update') : t('quotations.form.create')}
            </CardTitle>
            {!isMobile && (
              <CardDescription className="text-sm sm:text-base mt-1">
                Step {currentStep + 1} of {steps.length}: {t(steps[currentStep].nameKey)}
              </CardDescription>
            )}
          </div>
          <TeamSwitcher
            currentTeam={currentTeam}
            onTeamChange={setCurrentTeam}
            className="ml-4"
          />
        </div>
      </CardHeader>

      {/* Wrap both desktop and mobile tab lists inside a Tabs component */}
      <Tabs value={steps[currentStep].id} className="w-full">
        {/* Desktop/Tablet Tabs */}
        <div className="hidden md:block w-full border-b">
          <TabsList className="w-full grid grid-cols-4 p-0 h-auto bg-muted/30 dark:bg-muted/10">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-2",
                  "text-foreground dark:text-foreground text-sm whitespace-nowrap data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                  currentStep === index 
                    ? "border-primary data-[state=active]:border-primary" 
                    : "border-transparent hover:border-gray-600",
                  "cursor-pointer"
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
          <TabsList className="w-full grid grid-cols-4 p-0 h-auto bg-transparent">
            {steps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-none border-t-2",
                  "text-foreground dark:text-foreground data-[state=active]:bg-muted/50 dark:data-[state=active]:bg-muted/20",
                  currentStep === index 
                    ? "border-primary data-[state=active]:border-primary" 
                    : "border-transparent",
                  "cursor-pointer"
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
          className="p-4 sm:p-6 md:p-8 pb-20 md:pb-8 space-y-8 sm:space-y-10"
        >
          {/* Step Content */}
          {currentStep === 0 && (
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
              formData={quotationFormData}
              calculateQuotationAmount={calculateQuotationAmount}
            />
          )}

          {currentStep === 1 && (
            <CustomerDetailsStep form={form} />
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
            <PreviewStep 
              form={form}
              serviceItems={serviceItems}
              selectedPackage={selectedPackage}
              selectedPromotion={selectedPromotion}
              packages={packages}
            />
          )}

          {/* Navigation - Optimized for mobile/tablet */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 sm:mt-10 pt-6 border-t gap-4 sm:gap-6 relative">
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
                  onClick={(e) => handleExplicitSubmit(e, false)}
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
                <div className="h-1 bg-primary animate-[progress_1.2s_ease_infinite] w-2/5" />
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* Enhanced Progress Modal */}
      <LoadingModal
        open={progressOpen}
        title={progressTitle}
        label={progressLabel}
        value={progressValue}
        variant={progressVariant}
        showSteps={progressSteps.length > 0}
        steps={progressSteps}
        onOpenChange={setProgressOpen}
      />

      {/* Countdown Toast for Redirection */}
      <CountdownToast
        isVisible={isCountdownVisible}
        onComplete={handleCountdownComplete}
        message={toastConfig.message}
        redirectUrl={toastConfig.redirectUrl}
        duration={toastConfig.duration}
      />

      {/* BCC Dialog */}
      <BccDialog
        open={isBccDialogOpen}
        onOpenChange={closeBccDialog}
        emailSettings={emailSettings}
        onEmailSettingsChange={updateEmailSettings}
        onSubmit={handleBccSubmit}
        loading={apiLoading || submittingAndSending}
      />
        </Card>
      </div>

      {/* Quotation Summary Sidebar */}
      <div className="lg:w-80 w-full">
        <QuotationSummary
          formData={form.watch()}
          serviceItems={serviceItems}
          calculatedPrice={(() => {
            const totals = calculateFormTotals();
            return {
              baseAmount: totals.baseAmount,
              discountAmount: 0, // Will be calculated by the summary component
              taxAmount: 0, // Will be calculated by the summary component
              totalAmount: totals.totalAmount,
              currency: 'JPY'
            };
          })()}
          selectedPackage={selectedPackage}
          selectedPromotion={selectedPromotion}
          setActiveTab={(tab) => {
            // Map tab names to step indices
            const tabMap: { [key: string]: number } = {
              'routes': 0,
              'customer': 1,
              'pricing': 2,
              'preview': 3
            };
            const stepIndex = tabMap[tab];
            if (stepIndex !== undefined) {
              goToStep(stepIndex);
            }
          }}
          selectedCurrency={form.watch('display_currency') || 'JPY'}
        />
      </div>
    </div>
  );
} 