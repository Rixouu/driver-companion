"use client";

import { UseFormReturn } from 'react-hook-form';
import { Eye, User, Mail, Phone, Building, Car, Calendar, Clock, Package, Gift, DollarSign, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
                <span className="text-muted-foreground font-medium">Title:</span>
                <span className="font-medium">{watchedValues.title || 'Untitled Quotation'}</span>
                <span className="text-muted-foreground font-medium">Status:</span>
                <Badge variant="secondary" className="w-fit">Draft</Badge>
                <span className="text-muted-foreground font-medium">Total Amount:</span>
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
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{watchedValues.customer_email || 'Not specified'}</p>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                  </div>
                </div>
                
                {watchedValues.customer_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{watchedValues.customer_phone}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
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
                      Billing Address
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {watchedValues.billing_company_name && (
                        <p className="font-medium text-foreground">{watchedValues.billing_company_name}</p>
                      )}
                      {watchedValues.billing_tax_number && (
                        <p>Tax ID: {watchedValues.billing_tax_number}</p>
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
                Service Details
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
                    Selected Services ({serviceItems.length})
                  </h4>
                  {serviceItems.map((item, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package') ? "secondary" :
                              item.service_type_name?.toLowerCase().includes('charter') ? "default" : "outline"
                            } className={cn(
                              "text-xs",
                              (item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package')) && "bg-purple-100 text-purple-700 border-purple-200"
                            )}>
                              {item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package') ? 'Package' :
                               item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                            </Badge>
                            <span className="font-medium text-sm">{item.description}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">Vehicle:</span>
                            <span>{item.vehicle_type}</span>
                            
                            {item.service_type_name?.toLowerCase().includes('charter') ? (
                              <>
                                <span className="text-muted-foreground">Service Duration:</span>
                                <span className="font-medium">
                                  {item.service_days} day{item.service_days !== 1 ? 's' : ''} × {item.hours_per_day}h/day
                                </span>
                                <span className="text-muted-foreground">Total Hours:</span>
                                <span className="font-medium text-blue-600">
                                  {(item.service_days || 1) * (item.hours_per_day || 1)}h total
                                </span>
                              </>
                            ) : (item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package')) ? (
                              <>
                                <span className="text-muted-foreground">Package Service:</span>
                                <span className="text-purple-600 font-medium">Included Services</span>
                                <span className="text-muted-foreground">Services Included:</span>
                                <div className="col-span-1 sm:col-span-2 text-xs space-y-1">
                                  {/* Find the corresponding package for this item */}
                                  {(() => {
                                    const correspondingPackage = packages.find((pkg: PricingPackage) => pkg.id === item.service_type_id) || selectedPackage;
                                    return correspondingPackage && correspondingPackage.items && correspondingPackage.items.length > 0 ? (
                                      correspondingPackage.items.map((pkgItem: any, pkgIndex: number) => (
                                        <div key={pkgIndex} className="text-purple-600">
                                          • {pkgItem.name}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-purple-600">• Package services included</div>
                                    );
                                  })()}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">Duration:</span>
                                <span>{item.duration_hours} hour(s)</span>
                              </>
                            )}
                            
                            {item.pickup_date && (
                              <>
                                <span className="text-muted-foreground">Date:</span>
                                <span>{format(new Date(item.pickup_date), 'MMM d, yyyy')}</span>
                              </>
                            )}
                            
                            {item.pickup_time && (
                              <>
                                <span className="text-muted-foreground">Time:</span>
                                <span>{item.pickup_time}</span>
                              </>
                            )}
                            
                            {item.time_based_adjustment && (
                              <>
                                <span className="text-muted-foreground">Time Adjustment:</span>
                                <div className="space-y-1">
                                  <div className={cn(
                                    "font-bold text-sm",
                                    item.time_based_adjustment > 0 ? "text-orange-600" : "text-green-600"
                                  )}>
                                    {item.time_based_adjustment > 0 ? '+' : ''}{formatCurrency(Math.abs((item.unit_price * (item.service_days || 1)) * (item.time_based_adjustment / 100)))}
                                  </div>
                                  <div className={cn(
                                    "text-xs font-medium",
                                    item.time_based_adjustment > 0 ? "text-orange-600" : "text-green-600"
                                  )}>
                                    ({item.time_based_adjustment > 0 ? '+' : ''}{item.time_based_adjustment}%)
                                    {item.time_based_rule_name && (
                                      <span className="text-muted-foreground ml-1">
                                        - {item.time_based_rule_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.service_type_name?.toLowerCase().includes('charter') && (item.service_days && item.service_days > 1) ? (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.unit_price)} × {item.service_days} days
                              </p>
                              <p className="font-semibold text-blue-600">{formatCurrency(item.total_price || item.unit_price)}</p>
                            </div>
                          ) : (
                            <p className="font-semibold">{formatCurrency(item.total_price || item.unit_price)}</p>
                          )}
                        </div>
                      </div>
                    </div>
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
                          <p className="text-xs text-muted-foreground">Pickup Date</p>
                        </div>
                      </div>
                    )}
                    
                    {watchedValues.pickup_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{watchedValues.pickup_time}</p>
                          <p className="text-xs text-muted-foreground">Pickup Time</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Time-based Pricing Features */}
              {serviceItems.some(item => item.time_based_adjustment !== undefined && item.time_based_adjustment !== 0) && (
                <>
                  <Separator />
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">{t('quotations.form.preview.timeBasedAdjustments')}</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Pricing automatically adjusted based on pickup times, service duration, and special rules:
                    </p>
                    <div className="space-y-3">
                      {serviceItems
                        .filter(item => item.time_based_adjustment !== undefined && item.time_based_adjustment !== 0)
                        .map((item, index) => (
                          <div key={index} className="bg-white/60 dark:bg-black/20 rounded-md p-3 border border-blue-100 dark:border-blue-800">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                  {item.description}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      (item.time_based_adjustment || 0) > 0 
                                        ? "border-orange-200 bg-orange-50 text-orange-700" 
                                        : "border-green-200 bg-green-50 text-green-700"
                                    )}
                                  >
                                    {item.time_based_rule_name}
                                  </Badge>
                                  <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded",
                                    (item.time_based_adjustment || 0) > 0 
                                      ? "bg-orange-100 text-orange-700" 
                                      : "bg-green-100 text-green-700"
                                  )}>
                                    {(item.time_based_adjustment || 0) > 0 ? '+' : ''}{item.time_based_adjustment}%
                                  </span>
                                </div>
                                
                                {/* Service Duration and Overtime Details */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                                  <div>
                                    <span className="font-medium">{t('quotations.form.preview.baseDuration')}:</span>
                                    <div>{item.duration_hours || (item.hours_per_day && item.service_days ? `${item.hours_per_day}h × ${item.service_days} days` : '1h')}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">{t('quotations.form.preview.basePrice')}:</span>
                                    <div>{formatCurrency(item.unit_price)}</div>
                                  </div>
                                  
                                  {/* Show overtime details if applicable */}
                                  {item.time_based_rule_name?.toLowerCase().includes('overtime') && (
                                    <>
                                      <div>
                                        <span className="font-medium">{t('quotations.form.preview.totalHours')}:</span>
                                        <div className="text-orange-600">
                                          {(item.service_days || 1) * (item.hours_per_day || item.duration_hours || 1)}h
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-medium">{t('quotations.form.preview.overtimeHours')}:</span>
                                        <div className="text-orange-600">
                                          {Math.max(0, ((item.service_days || 1) * (item.hours_per_day || item.duration_hours || 1)) - 8)}h
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">{t('quotations.form.preview.adjustment')}</div>
                                <div className={cn(
                                  "font-semibold text-sm",
                                  (item.time_based_adjustment || 0) > 0 ? "text-orange-600" : "text-green-600"
                                )}>
                                  {(item.time_based_adjustment || 0) > 0 ? '+' : ''}{formatCurrency((item.unit_price * (item.service_days || 1)) * Math.abs(item.time_based_adjustment || 0) / 100)}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {t('quotations.form.preview.finalPrice')} {formatCurrency(item.total_price || item.unit_price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-100/50 dark:bg-blue-800/20 rounded border border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('quotations.form.preview.totalTimeBasedAdjustment')}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">{t('quotations.form.preview.appliedToServices', { count: serviceItems.filter(item => item.time_based_adjustment !== undefined && item.time_based_adjustment !== 0).length })}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-base text-blue-900 dark:text-blue-100">
                            {(() => {
                              const totalAdjustment = serviceItems
                                .filter(item => item.time_based_adjustment !== undefined && item.time_based_adjustment !== 0)
                                .reduce((total, item) => total + ((item.unit_price * (item.service_days || 1)) * (item.time_based_adjustment || 0) / 100), 0);
                              return totalAdjustment > 0 ? `+${formatCurrency(totalAdjustment)}` : formatCurrency(totalAdjustment);
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
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
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchedValues.merchant_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Internal Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {watchedValues.merchant_notes}
                    </p>
                  </div>
                )}
                
                {watchedValues.customer_notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Customer Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {watchedValues.customer_notes}
                    </p>
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
                    <span>Services ({serviceItems.length})</span>
                    <span>{formatCurrency(totals.serviceTotal)}</span>
                  </div>
                )}

                {/* Package */}
                {selectedPackage && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Package</span>
                    <span>{formatCurrency(totals.packageTotal)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.baseTotal)}</span>
                </div>

                {/* Discounts */}
                {totals.promotionDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promotion Discount</span>
                    <span>-{formatCurrency(totals.promotionDiscount)}</span>
                  </div>
                )}

                {totals.regularDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount ({watchedValues.discount_percentage}%)</span>
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
                    <span>Tax ({watchedValues.tax_percentage}%)</span>
                    <span>+{formatCurrency(totals.taxAmount)}</span>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex justify-between font-bold text-lg bg-primary/5 p-3 rounded">
                  <span>Total Amount</span>
                  <span>{formatCurrency(totals.finalTotal)}</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('quotations.form.preview.currency')}:</span>
                  <span>Japanese Yen (JPY)</span>
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