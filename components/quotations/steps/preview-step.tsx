"use client";

import { UseFormReturn } from 'react-hook-form';
import { Eye, User, Mail, Phone, Building, FileText, DollarSign, Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceItemInput, PricingPackage, PricingPromotion } from '@/types/quotations';

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
    const serviceTotal = serviceItems.reduce((total, item) => {
      // For Charter Services, calculate as unit_price × service_days
      if (item.service_type_name?.toLowerCase().includes('charter')) {
        return total + (item.unit_price * (item.service_days || 1));
      }
      // For other services, use existing logic
      return total + (item.total_price || item.unit_price);
    }, 0);
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
      
      <div className="space-y-6">
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
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Customer Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                </h4>
                <div className="space-y-3">
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
              </div>

              {/* Right Column - Billing Address */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t('quotations.form.preview.billingAddress')}
                </h4>
                {(watchedValues.billing_company_name || watchedValues.billing_street_name) ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground italic">No billing address provided</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('quotations.form.preview.pricingBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Applied Promotion */}
            {selectedPromotion && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900 dark:text-green-100">{t('quotations.form.preview.appliedPromotion')}</span>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-green-900 dark:text-green-100">{selectedPromotion.name}</div>
                  <div className="text-green-700 dark:text-green-300">
                    {selectedPromotion.discount_type === 'percentage' 
                      ? `${selectedPromotion.discount_value}% ${t('quotations.form.preview.discount')}`
                      : `${formatCurrency(selectedPromotion.discount_value)} ${t('quotations.form.preview.discount')}`
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Services Breakdown */}
            <div className="space-y-3">
              {serviceItems.map((item, index) => {
                const itemTotal = item.service_type_name?.toLowerCase().includes('charter') 
                  ? (item.unit_price * (item.service_days || 1))
                  : (item.total_price || item.unit_price);
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.service_type_name || 'Service'}</span>
                      <span className="font-medium">{formatCurrency(itemTotal)}</span>
                    </div>
                    <div className="ml-4 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Unit Price: {formatCurrency(item.unit_price || 0)} × {item.service_days || 1} days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Package */}
              {selectedPackage && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{selectedPackage.name}</span>
                    <span className="font-medium">{formatCurrency(selectedPackage.base_price)}</span>
                  </div>
                </div>
              )}
              
              {/* Services Subtotal */}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Services Subtotal</span>
                <span className="font-semibold">{formatCurrency(totals.baseTotal)}</span>
              </div>

              {/* Discount */}
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Discount ({watchedValues.discount_percentage || 0}%)</span>
                  <span className="font-medium">-{formatCurrency(totals.totalDiscount)}</span>
                </div>
              )}

              {/* Promotion Discount */}
              {selectedPromotion && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Promotion ({selectedPromotion.name})</span>
                  <span className="font-medium">
                    -{formatCurrency(
                      selectedPromotion.discount_type === 'percentage' 
                        ? totals.baseTotal * (selectedPromotion.discount_value / 100)
                        : selectedPromotion.discount_value
                    )}
                  </span>
                </div>
              )}

              {/* After Discounts */}
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">After Discounts</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
              )}

              {/* Tax */}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between items-center text-blue-600">
                  <span className="text-sm">Tax ({watchedValues.tax_percentage || 0}%)</span>
                  <span className="font-medium">+{formatCurrency(totals.taxAmount)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totals.finalTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}