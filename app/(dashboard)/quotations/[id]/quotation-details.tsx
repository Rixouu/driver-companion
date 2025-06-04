"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeftIcon,
  Calendar,
  CheckIcon, 
  Clock, 
  Mail, 
  MapPinIcon, 
  RefreshCwIcon, 
  XIcon,
  FileText,
  Building,
  User,
  CreditCard,
  Edit,
  Globe,
  Check,
  X
} from 'lucide-react';
import { Quotation, QuotationItem, QuotationStatus } from '@/types/quotations';
import { useQuotationService } from "@/lib/hooks/useQuotationService";
import LoadingSpinner from '@/components/shared/loading-spinner';
import { QuotationPdfButton } from '@/components/quotations/quotation-pdf-button';
import { useQuotationMessages } from '@/lib/hooks/useQuotationMessages';
import { QuotationActivityFeed } from '@/components/quotations/quotation-activity-feed';
import { QuotationMessageBlock } from '@/components/quotations/quotation-message-block';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

// Import the componentized parts
import { QuotationDetailsApprovalPanel } from '@/components/quotations/quotation-details/approval-panel';
import { PriceDetails } from '@/components/quotations/quotation-details/price-details';

interface QuotationDetailsProps {
  quotation: Quotation & {
    quotation_items: QuotationItem[];
    customers?: {
      name: string;
      email: string;
      phone?: string;
    }
  };
  isOrganizationMember?: boolean;
}

export function QuotationDetails({ quotation, isOrganizationMember = true }: QuotationDetailsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(quotation?.display_currency || quotation?.currency || 'JPY');
  const [isApprovalSticky, setIsApprovalSticky] = useState(false);
  const [shouldMoveToMainContent, setShouldMoveToMainContent] = useState(false);
  const approvalPanelRef = useRef<HTMLDivElement>(null);
  const priceDetailsRef = useRef<HTMLDivElement>(null);
  const { approveQuotation, rejectQuotation, sendQuotation, updateQuotation } = useQuotationService();

  // Add the messages hook
  const {
    activities,
    messages,
    isLoadingActivities,
    isLoadingMessages,
    sendMessage,
    refreshActivities,
    refreshMessages
  } = useQuotationMessages(quotation.id);

  // Format quotation number with JPDR prefix and padding
  const formattedQuoteNumber = `JPDR-${quotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}`;

  // Format currency with the appropriate locale and symbol
  const formatCurrency = (amount: number | string | undefined, currency: string = selectedCurrency) => {
    if (amount === undefined) return `¥0`;
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
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
    const convertedAmount = numericAmount * (exchangeRates[currency] / exchangeRates['JPY']);
    
    // Format based on currency
    if (currency === 'JPY' || currency === 'CNY') {
      return currency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    // Use locale and currency code for others
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(convertedAmount);
  };

  // Check if the quotation is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // Get status badge based on the quotation status
  const getStatusBadge = (status: QuotationStatus, expiryDate: string) => {
    // If status is draft or sent and the quotation is expired, show expired badge
    if ((status === 'draft' || status === 'sent') && isExpired(expiryDate)) {
      return (
        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20">
          {t('quotations.status.expired')}
        </Badge>
      );
    }

    // Otherwise, show the actual status
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-900/20">
            {t('quotations.status.draft')}
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            {t('quotations.status.sent')}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20">
            {t('quotations.status.approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20">
            {t('quotations.status.rejected')}
          </Badge>
        );
      case 'converted':
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
            {t('quotations.status.converted')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            {status}
          </Badge>
        );
    }
  };

  // Go back to quotations list
  const handleBack = () => {
    router.push('/quotations');
  };

  // Send the quotation to the customer
  const handleSend = async () => {
    setIsLoading(true);
    try {
      const success = await sendQuotation(quotation.id);
      if (success) {
        toast({
          title: t('quotations.notifications.sendSuccess'),
          variant: 'default',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to send quotation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fix helper functions for calculating amounts
  const calculateDiscountAmount = (amount: number | string, discountPercentage: number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numericAmount * (discountPercentage / 100);
  };

  const calculateSubtotalAmount = (amount: number | string, discountPercentage: number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const discountAmount = calculateDiscountAmount(numericAmount, discountPercentage);
    return numericAmount - discountAmount;
  };

  const calculateTaxAmount = (subtotalAmount: number | string, taxPercentage: number) => {
    const numericSubtotal = typeof subtotalAmount === 'string' ? parseFloat(subtotalAmount) : subtotalAmount;
    return numericSubtotal * (taxPercentage / 100);
  };

  // Function to handle both refreshing activities and messages
  const handleRefreshActivityFeed = () => {
    refreshActivities();
    refreshMessages();
  };

  // Add scroll handler for approval positioning
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight / 2) {
        setShouldMoveToMainContent(true);
      } else {
        setShouldMoveToMainContent(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [quotation.id]);

  // Handler for currency change that updates the database
  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    
    // Save the selected currency to the database
    try {
      await updateQuotation(quotation.id, {
        display_currency: newCurrency
      });
    } catch (error) {
      console.error('Error updating display currency:', error);
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to update currency preference',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {quotation.title || t('quotations.details.untitled')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('quotations.details.quotationNumber', { defaultValue: 'Quotation Number #{id}' }).replace('{id}', formattedQuoteNumber)}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
          <QuotationPdfButton quotation={quotation} onSuccess={() => router.refresh()} />
          
          {isOrganizationMember && quotation.status === 'draft' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSend} 
              disabled={isLoading}
              className="mr-2"
            >
              <Mail className="mr-2 h-4 w-4" />
              {t('quotations.actions.send')}
            </Button>
          )}
          
          {isOrganizationMember && (
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href={`/quotations/${quotation.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('quotations.actions.edit')}
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Customer Information */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold">{t('quotations.details.customerInfo')}</h2>
                  </div>
                  <div className="flex-shrink-0">
                    <Image 
                      src="/img/driver-quotation-logo.png" 
                      alt="Driver Quotation Logo" 
                      height={48}
                      width={48}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {t('quotations.details.contactInfo')}
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium">{quotation.customer_name}</p>
                      <p className="text-sm">{quotation.customer_email}</p>
                      {quotation.customer_phone && <p className="text-sm">{quotation.customer_phone}</p>}
                    </div>
                  </div>
                  
                  {/* Billing Address if available */}
                  {(quotation.billing_company_name || 
                    quotation.billing_tax_number || 
                    quotation.billing_street_name || 
                    quotation.billing_city ||
                    quotation.billing_country) &&
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          {t('quotations.details.billingAddress') || 'Billing Address'}
                        </div>
                      </h3>
                      <div className="space-y-1 text-sm">
                        {quotation.billing_company_name && (
                          <p className="font-medium">{quotation.billing_company_name}</p>
                        )}
                        {quotation.billing_tax_number && (
                          <p>{t('quotations.details.taxId') || 'Tax ID'}: {quotation.billing_tax_number}</p>
                        )}
                        {quotation.billing_street_name && (
                          <p>{quotation.billing_street_name} {quotation.billing_street_number || ''}</p>
                        )}
                        {(quotation.billing_city || quotation.billing_state || quotation.billing_postal_code) && (
                          <p>
                            {quotation.billing_city}
                            {quotation.billing_state && quotation.billing_city ? `, ${quotation.billing_state}` : quotation.billing_state}
                            {quotation.billing_postal_code && (quotation.billing_city || quotation.billing_state) ? ' ' : ''}
                            {quotation.billing_postal_code}
                          </p>
                        )}
                        {quotation.billing_country && <p>{quotation.billing_country}</p>}
                      </div>
                    </div>
                  }
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Service Information */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.serviceInfo')}</h2>
                </div>
                
                {quotation.quotation_items && quotation.quotation_items.length > 0 ? (
                  <div className="space-y-6">
                    {quotation.quotation_items.length === 1 ? (
                      // Single service display
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            {t('quotations.details.serviceDetails')}
                          </h3>
                          <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-sm text-muted-foreground">{t('quotations.details.serviceType')}</span>
                            <span className="font-medium">
                              {quotation.quotation_items[0].service_type_name || quotation.service_type || 'N/A'}
                            </span>
                            
                            <span className="text-sm text-muted-foreground">{t('quotations.details.vehicleType')}</span>
                            <span className="font-medium">
                              {quotation.quotation_items[0].vehicle_type || quotation.vehicle_type || 'N/A'}
                            </span>
                            
                            <span className="text-sm text-muted-foreground">{t('quotations.details.duration')}</span>
                            <span className="font-medium">
                              {quotation.quotation_items[0].hours_per_day || quotation.quotation_items[0].duration_hours || 1} {t('quotations.details.hours')}
                              {' × '}
                              {quotation.quotation_items[0].service_days || 1} {t('quotations.details.days')}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            {t('quotations.details.schedule')}
                          </h3>
                          <div className="grid grid-cols-[120px_1fr] gap-2">
                            <span className="text-sm text-muted-foreground">{t('quotations.details.pickupDate')}</span>
                            <span className="font-medium">
                              {quotation.pickup_date ? format(parseISO(quotation.pickup_date), 'yyyy-MM-dd') : 'N/A'}
                            </span>
                            
                            <span className="text-sm text-muted-foreground">{t('quotations.details.pickupTime')}</span>
                            <span className="font-medium">
                              {quotation.pickup_time || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Multiple services display
                      <div>
                        {quotation.quotation_items.map((item, index) => (
                          <div key={item.id || index} className="border rounded-md p-4 mb-4 bg-muted/10">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={cn(
                                "text-xs py-0.5 px-1.5 rounded-sm font-medium",
                                item.service_type_name?.toLowerCase().includes('charter') 
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              )}>
                                {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                              </div>
                              <h3 className="font-semibold text-base">{item.description}</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                              <div>
                                <div className="flex gap-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[120px]">{t('quotations.details.vehicleType')}:</span>
                                  <span className="text-sm">{item.vehicle_type || 'N/A'}</span>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[120px]">{t('quotations.details.duration')}:</span>
                                  <span className="text-sm">
                                    {item.service_type_name?.toLowerCase().includes('charter')
                                      ? `${item.service_days || 1} ${t('quotations.details.days')} × ${item.hours_per_day || 8} ${t('quotations.details.hoursPerDay')}`
                                      : `${item.duration_hours || 1} ${t('quotations.details.hours')}`
                                    }
                                  </span>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex gap-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[120px]">{t('quotations.details.pickupDate')}:</span>
                                  <span className="text-sm">
                                    {item.pickup_date 
                                      ? format(parseISO(item.pickup_date), 'yyyy-MM-dd') 
                                      : quotation.pickup_date 
                                        ? format(parseISO(quotation.pickup_date), 'yyyy-MM-dd') 
                                        : 'N/A'}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[120px]">{t('quotations.details.pickupTime')}:</span>
                                  <span className="text-sm">
                                    {item.pickup_time || quotation.pickup_time || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback display if no items (legacy format)
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {t('quotations.details.serviceDetails')}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.serviceType')}</span>
                          <span className="font-medium">
                            {quotation.service_type || 'Charter Services (Hourly)'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.vehicleType')}</span>
                          <span className="font-medium">
                            {quotation.vehicle_type || 'Mercedes Benz V Class'}
                          </span>
                        </div>
                        
                        {(quotation.duration_hours || quotation.service_days) && (
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm text-muted-foreground">{t('quotations.details.duration')}</span>
                            <span className="font-medium">
                              {quotation.duration_hours && `${quotation.duration_hours} ${t('quotations.details.hours')}`}
                              {quotation.duration_hours && quotation.service_days && ' × '}
                              {quotation.service_days && `${quotation.service_days} ${t('quotations.details.days')}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {t('quotations.details.schedule')}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.pickupDate')}</span>
                          <span className="font-medium">
                            {quotation.pickup_date ? format(parseISO(quotation.pickup_date), 'yyyy-MM-dd') : 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.pickupTime')}</span>
                          <span className="font-medium">
                            {quotation.pickup_time || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              {/* Price Details */}
              <div ref={priceDetailsRef}>
                <PriceDetails 
                  amount={quotation.amount}
                  discount_percentage={quotation.discount_percentage}
                  tax_percentage={quotation.tax_percentage}
                  total_amount={quotation.total_amount}
                  vehicle_type={quotation.vehicle_type}
                  hours_per_day={quotation.hours_per_day}
                  duration_hours={quotation.duration_hours}
                  service_days={quotation.service_days}
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={handleCurrencyChange}
                  formatCurrency={formatCurrency}
                  calculateDiscountAmount={calculateDiscountAmount}
                  calculateSubtotalAmount={calculateSubtotalAmount}
                  calculateTaxAmount={calculateTaxAmount}
                  quotation_items={quotation.quotation_items}
                />
              </div>
              
              {/* Conditional Approval Panel placement - under price details when scrolled */}
              {shouldMoveToMainContent && ['draft', 'sent'].includes(quotation.status) && (
                <div className="mt-6" ref={approvalPanelRef}>
                  <QuotationDetailsApprovalPanel 
                    quotationId={quotation.id}
                    isProcessing={isLoading}
                    onApprove={async (notes) => {
                      setIsLoading(true);
                      try {
                        const success = await approveQuotation({
                          quotation_id: quotation.id,
                          notes: notes
                        });
                        if (success) {
                          toast({
                            title: t('quotations.notifications.approveSuccess'),
                            variant: 'default',
                          });
                          router.refresh();
                        }
                      } catch (error) {
                        console.error('Error approving quotation:', error);
                        toast({
                          title: t('quotations.notifications.error'),
                          description: 'Failed to approve quotation',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onReject={async (reason) => {
                      setIsLoading(true);
                      try {
                        const success = await rejectQuotation({
                          quotation_id: quotation.id,
                          rejected_reason: reason
                        });
                        if (success) {
                          toast({
                            title: t('quotations.notifications.rejectSuccess'),
                            variant: 'default',
                          });
                          router.refresh();
                        }
                      } catch (error) {
                        console.error('Error rejecting quotation:', error);
                        toast({
                          title: t('quotations.notifications.error'),
                          description: 'Failed to reject quotation',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Customer Notes and Merchant Notes sections */}
              {(quotation.customer_notes || quotation.merchant_notes) && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <div className="flex items-center mb-4">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">{t('quotations.details.notesAndTerms')}</h2>
                    </div>
                    <div className="space-y-6">
                      {quotation.customer_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            {t('quotations.details.notes') || 'Notes'}
                          </h3>
                          <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                            {quotation.customer_notes}
                          </div>
                        </div>
                      )}
                      
                      {quotation.merchant_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            {t('quotations.details.termsAndConditions') || 'Terms and Conditions'}
                          </h3>
                          <div className="text-sm whitespace-pre-wrap">
                            {quotation.merchant_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Message Block */}
          {quotation.status !== 'approved' && (
            <Card className="mt-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  {t('quotations.messageBlock.title') || 'Conversation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuotationMessageBlock 
                  messages={messages}
                  isLoading={isLoadingMessages}
                  onSendMessage={sendMessage}
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar - Wider with 1 column */}
        <div className="lg:col-span-1">
          {/* Quotation Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-medium">
                {t('quotations.details.info') || 'Quotation Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('quotations.details.status')}</span>
                {getStatusBadge(quotation.status, quotation.expiry_date)}
              </div>
              
              {quotation.status === 'sent' && (
                <p className="text-sm text-muted-foreground mt-2">
                  {isExpired(quotation.expiry_date)
                    ? (t('quotations.details.expired') || "Expired on {date}").replace('{date}', format(new Date(quotation.expiry_date), 'PPP'))
                    : (t('quotations.details.validUntil') || "Valid until {date}").replace('{date}', format(new Date(quotation.expiry_date), 'PPP'))}
                </p>
              )}
              
              <div className="grid gap-2 mt-4 w-full">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t('quotations.details.created')}</span>
                  <span className="text-sm">{format(parseISO(quotation.created_at), 'PPP')}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t('quotations.details.expiry')}</span>
                  <span className="text-sm">{format(parseISO(quotation.expiry_date), 'PPP')}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t('quotations.details.validFor')}</span>
                  <span className="text-sm">
                    {Math.ceil((new Date(quotation.expiry_date).getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24))} {t('quotations.details.days')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          

          {/* Default Approval Panel placement - in sidebar above activity feed */}
          {!shouldMoveToMainContent && ['draft', 'sent'].includes(quotation.status) && (
            <div className="mb-6 mt-6">
              <QuotationDetailsApprovalPanel 
                quotationId={quotation.id}
                isProcessing={isLoading}
                onApprove={async (notes) => {
                  setIsLoading(true);
                  try {
                    const success = await approveQuotation({
                      quotation_id: quotation.id,
                      notes: notes
                    });
                    if (success) {
                      toast({
                        title: t('quotations.notifications.approveSuccess'),
                        variant: 'default',
                      });
                      router.refresh();
                    }
                  } catch (error) {
                    console.error('Error approving quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to approve quotation',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onReject={async (reason) => {
                  setIsLoading(true);
                  try {
                    const success = await rejectQuotation({
                      quotation_id: quotation.id,
                      rejected_reason: reason
                    });
                    if (success) {
                      toast({
                        title: t('quotations.notifications.rejectSuccess'),
                        variant: 'default',
                      });
                      router.refresh();
                    }
                  } catch (error) {
                    console.error('Error rejecting quotation:', error);
                    toast({
                      title: t('quotations.notifications.error'),
                      description: 'Failed to reject quotation',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </div>
          )}


          {/* Activity Feed */}
          <div className="mt-6">
            <QuotationActivityFeed 
              activities={activities} 
              isLoading={isLoadingActivities}
              onRefresh={handleRefreshActivityFeed}
            />
          </div>

         
        </div>
      </div>
    </div>
  );
} 