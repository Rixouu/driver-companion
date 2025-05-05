'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Quotation } from '@/types/quotations';
import { formatDate } from '@/lib/utils/date-utils';

interface QuotationDetailProps {
  id: string;
}

export function QuotationDetail({ id }: QuotationDetailProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    async function fetchQuotation() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/quotations/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quotation');
        }
        
        const data = await response.json();
        setQuotation(data);
      } catch (error) {
        console.error('Error loading quotation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quotation details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuotation();
  }, [id, toast]);

  if (isLoading) {
    return <QuotationDetailSkeleton />;
  }

  if (!quotation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4">
            <h2 className="text-xl font-semibold mb-2">Quotation Not Found</h2>
            <p className="text-muted-foreground">
              The quotation you are looking for does not exist or has been deleted.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'sent':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'expired':
        return 'bg-amber-500';
      case 'converted':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            {t('quotations.details.quotationNumber', { id: quotation.quote_number.toString() })}
          </CardTitle>
          <Badge className={getStatusBadgeColor(quotation.status)}>
            {t(`quotations.details.quotationStatus.${quotation.status}`)}
          </Badge>
        </div>
        <p className="text-muted-foreground">{quotation.title}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('quotations.details.customerInfo')}
              </h3>
              <div className="space-y-1">
                <p><span className="font-medium">{t('quotations.details.fields.customerName')}:</span> {quotation.customer_name || 'N/A'}</p>
                <p><span className="font-medium">{t('quotations.details.fields.email')}:</span> {quotation.customer_email}</p>
                {quotation.customer_phone && (
                  <p><span className="font-medium">{t('quotations.details.fields.phone')}:</span> {quotation.customer_phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('quotations.details.dates')}
              </h3>
              <div className="space-y-1">
                <p><span className="font-medium">{t('quotations.details.created')}:</span> {formatDate(quotation.created_at)}</p>
                <p>
                  <span className="font-medium">{t('quotations.details.expiry')}:</span> {formatDate(quotation.expiry_date)}
                  {quotation.status === 'expired' 
                    ? ` (${t('quotations.details.expired', { date: formatDate(quotation.expiry_date) })})` 
                    : ` (${t('quotations.details.validUntil', { date: formatDate(quotation.expiry_date) })})`}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">
              {t('quotations.details.serviceInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p><span className="font-medium">{t('quotations.details.fields.serviceType')}:</span> {quotation.service_type}</p>
                <p><span className="font-medium">{t('quotations.details.fields.vehicleType')}:</span> {quotation.vehicle_type}</p>
                {quotation.pickup_date && (
                  <p><span className="font-medium">{t('quotations.details.fields.pickupDate')}:</span> {formatDate(quotation.pickup_date)}</p>
                )}
                {quotation.pickup_time && (
                  <p><span className="font-medium">{t('quotations.details.fields.pickupTime')}:</span> {quotation.pickup_time}</p>
                )}
              </div>
              <div className="space-y-1">
                {quotation.duration_hours && (
                  <p>
                    <span className="font-medium">{t('quotations.details.fields.duration')}:</span> {quotation.duration_hours} {t('quotations.details.hours')}
                  </p>
                )}
                {quotation.pickup_location && (
                  <p><span className="font-medium">{t('quotations.details.pickup')}:</span> {quotation.pickup_location}</p>
                )}
                {quotation.dropoff_location && (
                  <p><span className="font-medium">{t('quotations.details.dropoff')}:</span> {quotation.dropoff_location}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">
              {t('quotations.details.pricing')}
            </h3>
            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span>{t('quotations.details.fields.amount')}:</span>
                <span>{quotation.currency} {quotation.amount.toFixed(2)}</span>
              </div>
              {quotation.discount_percentage && quotation.discount_percentage > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>{t('quotations.details.fields.discount')} ({quotation.discount_percentage}%):</span>
                  <span>- {quotation.currency} {(quotation.amount * (quotation.discount_percentage / 100)).toFixed(2)}</span>
                </div>
              )}
              {quotation.tax_percentage && quotation.tax_percentage > 0 && (
                <div className="flex justify-between items-center">
                  <span>{t('quotations.details.fields.tax')} ({quotation.tax_percentage}%):</span>
                  <span>{quotation.currency} {(quotation.amount * (1 - (quotation.discount_percentage || 0) / 100) * (quotation.tax_percentage / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
                <span>{t('quotations.details.fields.totalAmount')}:</span>
                <span>{quotation.currency} {quotation.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {(quotation.merchant_notes || quotation.customer_notes) && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('quotations.details.notesAndTerms')}
              </h3>
              {quotation.customer_notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm">{t('quotations.form.customerNotes')}</h4>
                  <p className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{quotation.customer_notes}</p>
                </div>
              )}
              {quotation.merchant_notes && (
                <div>
                  <h4 className="font-medium text-sm">{t('quotations.form.merchantNotes')}</h4>
                  <p className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{quotation.merchant_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuotationDetailSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Customer Info Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
          
          {/* Service Info Skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
          
          {/* Pricing Skeleton */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 