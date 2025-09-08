"use client";

import { UseFormReturn } from 'react-hook-form';
import { Eye, User, Mail, Phone, Building, Car, Calendar, Clock, Package, Gift, DollarSign, FileText, CreditCard, Lock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ServiceItemInput, PricingPackage, PricingPromotion } from '@/types/quotations';
import { ServiceCard } from '@/components/quotations/service-card';

interface PreviewStepProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  selectedPackage: PricingPackage | null;
  selectedPromotion: PricingPromotion | null;
  packages?: PricingPackage[];
}

export function PreviewStep({ 
  form, 
  serviceItems, 
  selectedPackage, 
  selectedPromotion,
  packages = []
}: PreviewStepProps) {
  const { t } = useI18n();
  const watchedValues = form.watch();

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const calculateTotals = () => {
    const serviceTotal = serviceItems.reduce((total, item) => total + (item.total_price || item.unit_price), 0);
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentage = watchedValues.discount_percentage || 0;
    const taxPercentage = watchedValues.tax_percentage || 0;
    
    const promotionDiscount = selectedPromotion ? 
      (selectedPromotion.discount_type === 'percentage' ? 
        baseTotal * (selectedPromotion.discount_value / 100) : 
        selectedPromotion.discount_value) : 0;
    
    const regularDiscount = baseTotal * (discountPercentage / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      serviceTotal,
      packageTotal,
      baseTotal,
      promotionDiscount,
      regularDiscount,
      totalDiscount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5" /> 
          {t('quotations.form.previewSection')}
        </h2>
        <Badge variant="outline" className="text-xs">
          {t('quotations.form.preview.finalReview')}
        </Badge>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Customer & Service Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quotation Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('quotations.form.preview.quotationOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground font-medium">{t('quotations.form.preview.title')}</span>
                <span className="font-medium">{watchedValues.title || 'Untitled Quotation'}</span>
                <span className="text-muted-foreground font-medium">{t('quotations.form.preview.status')}</span>
                <Badge variant="secondary" className="w-fit">{t('quotations.form.preview.draft')}</Badge>
                <span className="text-muted-foreground font-medium">{t('quotations.form.preview.totalAmount')}</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(totals.finalTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('quotations.details.customerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{watchedValues.customer_name || 'Not specified'}</p>
                    <p className="text-sm text-muted-foreground">{t('quotations.form.preview.customerName')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{watchedValues.customer_email || 'Not specified'}</p>
                    <p className="text-sm text-muted-foreground">{t('quotations.form.preview.emailAddress')}</p>
                  </div>
                </div>
                
                {watchedValues.customer_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{watchedValues.customer_phone}</p>
                      <p className="text-sm text-muted-foreground">{t('quotations.form.preview.phoneNumber')}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Billing Address */}
              {(watchedValues.billing_company_name || watchedValues.billing_street_name) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {t('quotations.form.preview.billingAddress')}
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {watchedValues.billing_company_name && (
                        <p className="font-medium text-foreground">{watchedValues.billing_company_name}</p>
                      )}
                      {watchedValues.billing_tax_number && (
                        <p>{t('quotations.form.preview.taxId')} {watchedValues.billing_tax_number}</p>
                      )}
                      <div>
                        {watchedValues.billing_street_name && (
                          <p>{watchedValues.billing_street_name} {watchedValues.billing_street_number}</p>
                        )}
                        {(watchedValues.billing_city || watchedValues.billing_state || watchedValues.billing_postal_code) && (
                          <p>
                            {[watchedValues.billing_city, watchedValues.billing_state, watchedValues.billing_postal_code]
                              .filter(Boolean).join(', ')}
                          </p>
                        )}
                        {watchedValues.billing_country && (
                          <p>{watchedValues.billing_country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" />
                {t('quotations.form.preview.serviceDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                        {/* Selected Package */}
          {selectedPackage && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900 dark:text-purple-100">{t('quotations.form.preview.selectedPackage')}</span>
              </div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-base">{selectedPackage.name}</h4>
              {selectedPackage.description && (
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{selectedPackage.description}</p>
              )}
              
              {selectedPackage.items && selectedPackage.items.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">{t('quotations.form.preview.packageIncludes')}</p>
                  <div className="space-y-2">
                    {selectedPackage.items.map((item, index) => (
                      <div key={index} className="bg-white/50 dark:bg-black/20 rounded p-2 border border-purple-100 dark:border-purple-800">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-purple-900 dark:text-purple-100">
                              {item.name}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              {item.vehicle_type}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t border-purple-200 dark:border-purple-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-purple-800 dark:text-purple-200">{t('quotations.form.preview.packageTotal')}</span>
                  <span className="font-bold text-lg text-purple-900 dark:text-purple-100">
                    {formatCurrency(selectedPackage.base_price)}
                  </span>
                </div>
              </div>
            </div>
          )}

              {/* Service Items */}
              {serviceItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t('quotations.form.preview.selectedServices')} ({serviceItems.length})
                  </h4>
                  {serviceItems.map((item, index) => (
                    <ServiceCard
                      key={index}
                      item={item}
                      index={index}
                      formatCurrency={formatCurrency}
                      packages={packages}
                      selectedPackage={selectedPackage}
                      showActions={false}
                      className="p-3 bg-muted/30 border"
                    />
                  ))}
                </div>
              )}

              {/* Pickup Information */}
              {(watchedValues.pickup_date || watchedValues.pickup_time) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {watchedValues.pickup_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{format(watchedValues.pickup_date, 'PPP')}</p>
                          <p className="text-xs text-muted-foreground">{t('quotations.form.preview.pickupDate')}</p>
                        </div>
                      </div>
                    )}
                    
                    {watchedValues.pickup_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{watchedValues.pickup_time}</p>
                          <p className="text-xs text-muted-foreground">{t('quotations.form.preview.pickupTime')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}


            </CardContent>
          </Card>

          {/* Notes */}
          {(watchedValues.merchant_notes || watchedValues.customer_notes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('quotations.form.preview.notes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchedValues.merchant_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-500" />
                      {t('quotations.form.preview.internalNotes')}
                    </h4>
                    <div className="text-sm text-muted-foreground bg-orange-50/30 dark:bg-orange-900/10 p-3 rounded border-l-4 border-l-orange-500 whitespace-pre-line">
                      {watchedValues.merchant_notes}
                    </div>
                  </div>
                )}
                
                {watchedValues.customer_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      {t('quotations.form.preview.customerNotes')}
                    </h4>
                    <div className="text-sm text-muted-foreground bg-blue-50/30 dark:bg-blue-900/10 p-3 rounded border-l-4 border-l-blue-500 whitespace-pre-line">
                      {watchedValues.customer_notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Pricing Summary */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t('quotations.form.preview.pricingSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Applied Promotion */}
              {selectedPromotion && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100 text-sm">{t('quotations.form.preview.appliedPromotion')}</span>
                  </div>
                  <p className="font-semibold text-green-900 dark:text-green-100">{selectedPromotion.name}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedPromotion.discount_type === 'percentage' 
                      ? `${selectedPromotion.discount_value}% off` 
                      : `${formatCurrency(selectedPromotion.discount_value)} off`}
                  </p>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                {/* Services */}
                {serviceItems.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{t('quotations.form.preview.services')} ({serviceItems.length})</span>
                    <span>{formatCurrency(totals.serviceTotal)}</span>
                  </div>
                )}

                {/* Package */}
                {selectedPackage && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>{t('quotations.form.preview.package')}</span>
                    <span>{formatCurrency(totals.packageTotal)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm font-medium">
                  <span>{t('quotations.form.preview.subtotal')}</span>
                  <span>{formatCurrency(totals.baseTotal)}</span>
                </div>

                {/* Discounts */}
                {totals.promotionDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('quotations.form.preview.promotionDiscount')}</span>
                    <span>-{formatCurrency(totals.promotionDiscount)}</span>
                  </div>
                )}

                {totals.regularDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>{t('quotations.form.preview.discount')} ({watchedValues.discount_percentage}%)</span>
                    <span>-{formatCurrency(totals.regularDiscount)}</span>
                  </div>
                )}

                {totals.totalDiscount > 0 && (
                  <>
                    <Separator />
                                    <div className="flex justify-between text-sm font-medium">
                  <span>{t('quotations.form.preview.afterDiscount')}</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                  </>
                )}

                {/* Tax */}
                {watchedValues.tax_percentage > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('quotations.form.preview.tax')} ({watchedValues.tax_percentage}%)</span>
                    <span>+{formatCurrency(totals.taxAmount)}</span>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex justify-between font-bold text-lg bg-primary/5 p-3 rounded">
                  <span>{t('quotations.form.preview.totalAmount')}</span>
                  <span>{formatCurrency(totals.finalTotal)}</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('quotations.form.preview.currency')}:</span>
                  <span>{t('quotations.form.preview.japaneseYen')}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span>{t('quotations.form.preview.totalSavings')}</span>
                    <span className="text-green-600 font-medium">{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{t('quotations.form.preview.readyToSend')}</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('quotations.form.preview.reviewMessage')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 