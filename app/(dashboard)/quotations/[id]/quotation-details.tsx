"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  CreditCard
} from 'lucide-react';
import { Quotation, QuotationItem, QuotationStatus } from '@/types/quotations';
import { useQuotationService } from '@/hooks/useQuotationService';
import LoadingSpinner from '@/components/shared/loading-spinner';
import { QuotationPdfButton } from '@/components/quotations/quotation-pdf-button';

interface QuotationDetailsProps {
  quotation: Quotation & {
    quotation_items: QuotationItem[];
    customers?: {
      name: string;
      email: string;
      phone?: string;
    }
  };
}

export function QuotationDetails({ quotation }: QuotationDetailsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { approveQuotation, rejectQuotation, sendQuotation } = useQuotationService();

  // Format quotation number with JPDR prefix and padding
  const formattedQuoteNumber = `JPDR-${quotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}`;

  // Format currency with the appropriate locale and symbol
  const formatCurrency = (amount: number | string | undefined, currency: string = 'JPY') => {
    if (amount === undefined) return `¥0`;
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // For JPY, use ¥ symbol and no decimal places
    if (currency === 'JPY') {
      return `¥${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(numericAmount);
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
      console.error('Error sending quotation:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quotation.title || t('quotations.details.untitled')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('quotations.details.quotationNumber')}: {formattedQuoteNumber}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          
          <QuotationPdfButton quotation={quotation} onSuccess={() => router.refresh()} />
          
          {quotation.status === 'draft' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSend}
              disabled={isLoading}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('quotations.actions.send')}
            </Button>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="md:col-span-3">
          <Card>
            <CardContent className="pt-6">
              {/* Customer Information */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.customerInfo')}</h2>
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
                    quotation.billing_country) && (
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
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Service Information */}
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.serviceInfo')}</h2>
                </div>
                
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
                      
                      {quotation.passenger_count && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.passengers')}</span>
                          <span className="font-medium">{quotation.passenger_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {t('quotations.details.schedule')}
                    </h3>
                    <div className="space-y-3">
                      {quotation.pickup_date && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.pickupDate')}</span>
                          <span className="font-medium">{quotation.pickup_date}</span>
                        </div>
                      )}
                      
                      {quotation.pickup_time && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm text-muted-foreground">{t('quotations.details.pickupTime')}</span>
                          <span className="font-medium">{quotation.pickup_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {(quotation.pickup_location || quotation.dropoff_location) && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      {t('quotations.details.locations')}
                    </h3>
                    <div className="space-y-4">
                      {quotation.pickup_location && (
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('quotations.details.pickup')}</p>
                            <p className="text-sm">{quotation.pickup_location}</p>
                          </div>
                        </div>
                      )}
                      
                      {quotation.dropoff_location && (
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('quotations.details.dropoff')}</p>
                            <p className="text-sm">{quotation.dropoff_location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              {/* Price Details */}
              <div>
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quotations.details.priceDetails') || 'Price Details'}</h2>
                </div>
                
                <div className="rounded-md bg-muted/30 border p-4 space-y-3">
                  {/* Headers */}
                  <div className="flex justify-between font-medium mb-2">
                    <div>Description</div>
                    <div>Price</div>
                  </div>
                  
                  {/* Vehicle Type */}
                  <div className="flex justify-between">
                    <div className="text-sm">
                      {quotation.vehicle_type || 'Mercedes Benz V Class'}
                    </div>
                    <div></div>
                  </div>
                  
                  {/* Hourly Rate */}
                  <div className="flex justify-between">
                    <div className="text-sm">
                      Hourly Rate ({quotation.hours_per_day || quotation.duration_hours || 8} hours / day)
                    </div>
                    <div className="font-medium">
                      {formatCurrency(quotation.amount / (quotation.service_days || 1), 'JPY')}
                    </div>
                  </div>
                  
                  {/* Number of Days */}
                  {quotation.service_days && quotation.service_days > 1 && (
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Number of Days
                      </div>
                      <div>
                        × {quotation.service_days}
                      </div>
                    </div>
                  )}
                  
                  {/* Base Amount */}
                  <div className="flex justify-between pt-2 border-t">
                    <div className="font-medium">
                      Base Amount
                    </div>
                    <div className="font-medium">
                      {formatCurrency(quotation.amount, 'JPY')}
                    </div>
                  </div>
                  
                  {/* Discount if available */}
                  {Number(quotation.discount_percentage) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <div>
                        Discount ({quotation.discount_percentage}%)
                      </div>
                      <div>
                        -{formatCurrency(calculateDiscountAmount(quotation.amount, quotation.discount_percentage || 0), 'JPY')}
                      </div>
                    </div>
                  )}
                  
                  {/* Subtotal if we have discount or tax */}
                  {(Number(quotation.discount_percentage) > 0 || Number(quotation.tax_percentage) > 0) && (
                    <div className="flex justify-between pt-2 border-t">
                      <div className="font-medium">
                        Subtotal
                      </div>
                      <div className="font-medium">
                        {formatCurrency(calculateSubtotalAmount(quotation.amount, quotation.discount_percentage || 0), 'JPY')}
                      </div>
                    </div>
                  )}
                  
                  {/* Tax if available */}
                  {Number(quotation.tax_percentage) > 0 && (
                    <div className="flex justify-between">
                      <div className="text-muted-foreground">
                        Tax ({quotation.tax_percentage}%)
                      </div>
                      <div>
                        +{formatCurrency(calculateTaxAmount(calculateSubtotalAmount(quotation.amount, quotation.discount_percentage || 0), quotation.tax_percentage || 0), 'JPY')}
                      </div>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between pt-2 border-t text-lg">
                    <div className="font-bold">
                      Total
                    </div>
                    <div className="font-bold">
                      {formatCurrency(quotation.total_amount, 'JPY')}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notes & Terms */}
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
        </div>
        
        {/* Status & Dates Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className="text-base">Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl mb-1">{getStatusBadge(quotation.status, quotation.expiry_date)}</div>
              <p className="text-sm text-muted-foreground">
                {t('quotations.details.validFor')}: 48 {t('quotations.details.hours')}
              </p>
            </CardContent>
          </Card>
          
          {/* Date Information */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className="text-base">{t('quotations.details.dates')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-1">{t('quotations.details.created')}:</span>
                <span>{format(parseISO(quotation.created_at), 'PPP')}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-1">{t('quotations.details.expiry')}:</span>
                <span>{format(parseISO(quotation.expiry_date), 'PPP')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 