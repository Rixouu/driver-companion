"use client";

import { UseFormReturn } from 'react-hook-form';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ServiceItemInput, PricingPackage, PricingPromotion } from '@/types/quotations';

interface PreviewStepProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  selectedPackage: PricingPackage | null;
  selectedPromotion: PricingPromotion | null;
}

export function PreviewStep({ 
  form, 
  serviceItems, 
  selectedPackage, 
  selectedPromotion 
}: PreviewStepProps) {
  const { t } = useI18n();
  const watchedValues = form.watch();

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Eye className="h-5 w-5" /> 
        {t('quotations.form.previewSection')}
      </h2>
      
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <CardContent className="p-4 sm:p-6">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-medium text-base mb-2 border-b pb-1">
                {t('quotations.details.quotationSummary')}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{t('quotations.form.title')}:</span> 
                <span>{watchedValues.title || '-'}</span>
              </div>
              
              <Separator className="my-3" />
              <h3 className="font-medium text-base mb-2 border-b pb-1">
                {t('quotations.form.customerSection')}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{t('quotations.form.customerName')}:</span> 
                <span>{watchedValues.customer_name || '-'}</span>
                <span className="text-muted-foreground">{t('quotations.form.customerEmail')}:</span> 
                <span>{watchedValues.customer_email || '-'}</span>
                <span className="text-muted-foreground">{t('quotations.form.customerPhone')}:</span> 
                <span>{watchedValues.customer_phone || '-'}</span>
              </div>
              
              {(watchedValues.billing_company_name || watchedValues.billing_street_name) && (
                <>
                  <Separator className="my-3" />
                  <h3 className="font-medium text-base mb-2 border-b pb-1">
                    {t('quotations.details.billingAddress')}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">{t('quotations.form.billing.companyName')}:</span> 
                    <span>{watchedValues.billing_company_name || '-'}</span>
                    <span className="text-muted-foreground">{t('quotations.form.billing.taxNumber')}:</span> 
                    <span>{watchedValues.billing_tax_number || '-'}</span>
                    <span className="text-muted-foreground">{t('quotations.details.billingAddress')}:</span> 
                    <span>
                      {watchedValues.billing_street_name || ''} {watchedValues.billing_street_number || ''}<br/>
                      {watchedValues.billing_city || ''}{watchedValues.billing_state ? `, ${watchedValues.billing_state}` : ''} {watchedValues.billing_postal_code || ''}<br/>
                      {watchedValues.billing_country || ''}
                    </span>
                  </div>
                </>
              )}
              
              <Separator className="my-3" />
              <h3 className="font-medium text-base mb-2 border-b pb-1">
                {t('quotations.details.serviceDetails')}
              </h3>
              
              {serviceItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">{t('quotations.details.pickupDate')}:</span> 
                    <span>{watchedValues.pickup_date ? format(watchedValues.pickup_date, 'PPP') : '-'}</span>
                    <span className="text-muted-foreground">{t('quotations.details.pickupTime')}:</span> 
                    <span>{watchedValues.pickup_time || '-'}</span>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="font-medium">{t('quotations.form.services.selectedServices')} ({serviceItems.length}):</h4>
                    <div className="space-y-2 mt-2">
                      {serviceItems.map((item, idx) => (
                        <div key={idx} className="bg-muted/30 p-3 rounded-md">
                          <div className="font-medium">{item.description}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                            {item.service_type_name?.toLowerCase().includes('charter') ? (
                              <>
                                <span className="text-muted-foreground">{t('quotations.form.services.serviceDays')}:</span>
                                <span>{item.service_days || 1}</span>
                                <span className="text-muted-foreground">{t('quotations.form.services.hoursPerDay')}:</span>
                                <span>{item.hours_per_day || '-'}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">{t('quotations.details.duration')}:</span>
                                <span>{item.duration_hours} {t('quotations.details.hours')}</span>
                              </>
                            )}
                            <span className="text-muted-foreground">{t('quotations.pricing.total')}:</span>
                            <span>{formatCurrency(item.total_price || item.unit_price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">{t('quotations.details.serviceType')}:</span> 
                  <span>{watchedValues.service_type || '-'}</span>
                  <span className="text-muted-foreground">{t('quotations.form.services.vehicleCategory')}:</span> 
                  <span>{watchedValues.vehicle_category || '-'}</span>
                  <span className="text-muted-foreground">{t('quotations.details.vehicleType')}:</span> 
                  <span>{watchedValues.vehicle_type || '-'}</span>
                  <span className="text-muted-foreground">{t('quotations.details.pickupDate')}:</span> 
                  <span>{watchedValues.pickup_date ? format(watchedValues.pickup_date, 'PPP') : '-'}</span>
                  <span className="text-muted-foreground">{t('quotations.details.pickupTime')}:</span> 
                  <span>{watchedValues.pickup_time || '-'}</span>
                </div>
              )}
              
              <Separator className="my-3" />
              <h3 className="font-medium text-base mb-2 border-b pb-1">
                {t('quotations.form.pricingSection')}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{t('quotations.pricing.subtotal')}:</span> 
                <span>{formatCurrency(0)}</span>
                <span className="text-muted-foreground">{t('quotations.pricing.discount')}:</span> 
                <span>{watchedValues.discount_percentage || 0}%</span>
                <span className="text-muted-foreground">{t('quotations.pricing.tax')}:</span> 
                <span>{watchedValues.tax_percentage || 0}%</span>
                <span className="text-muted-foreground font-semibold">{t('quotations.pricing.total')}:</span> 
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
              
              <Separator className="my-3" />
              <h3 className="font-medium text-base mb-2 border-b pb-1">
                {t('quotations.form.notesSection')}
              </h3>
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">{t('quotations.form.merchantNotes')}:</span> 
                  {watchedValues.merchant_notes || '-'}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('quotations.form.customerNotes')}:</span> 
                  {watchedValues.customer_notes || '-'}
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <p className="text-sm text-center text-muted-foreground">
        {t('quotations.form.previewDescription')}
      </p>
    </div>
  );
} 