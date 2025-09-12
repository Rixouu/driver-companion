"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Globe, 
  Timer, 
  Package, 
  Gift, 
  Percent,
  Car
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';

interface PricingBreakdownProps {
  quotationItems: QuotationItem[];
  selectedPackage?: PricingPackage | null;
  selectedPromotion?: PricingPromotion | null;
  discountPercentage?: number;
  taxPercentage?: number;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  formatCurrency: (amount: number | string | undefined, currency?: string) => string;
}

export function PricingBreakdown({
  quotationItems = [],
  selectedPackage,
  selectedPromotion,
  discountPercentage = 0,
  taxPercentage = 0,
  selectedCurrency,
  onCurrencyChange,
  formatCurrency
}: PricingBreakdownProps) {
  const { t } = useI18n();

  // Calculate all totals with detailed time-based adjustments
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustments: Array<{
      itemIndex: number;
      description: string;
      basePrice: number;
      adjustmentPercentage: number;
      adjustmentAmount: number;
      ruleName?: string;
    }> = [];
    
    quotationItems.forEach((item, index) => {
      const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
      serviceBaseTotal += itemBasePrice;
      
      // Track time-based adjustments
      const timeAdjustmentPercentage = (item as any).time_based_adjustment || 0;
      if (timeAdjustmentPercentage !== 0) {
        const adjustmentAmount = itemBasePrice * (timeAdjustmentPercentage / 100);
        serviceTimeAdjustments.push({
          itemIndex: index,
          description: item.description || `${item.service_type_name} - ${item.vehicle_type}`,
          basePrice: itemBasePrice,
          adjustmentPercentage: timeAdjustmentPercentage,
          adjustmentAmount,
          ruleName: (item as any).time_based_rule_name
        });
      }
    });
    
    const totalTimeAdjustment = serviceTimeAdjustments.reduce((sum, adj) => sum + adj.adjustmentAmount, 0);
    const serviceTotal = serviceBaseTotal + totalTimeAdjustment;
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
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
      serviceBaseTotal,
      serviceTimeAdjustments,
      totalTimeAdjustment,
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
      {/* Services Section */}
      {quotationItems.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{t('quotations.details.selectedServices')} ({quotationItems.length})</CardTitle>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {formatCurrency(totals.serviceTotal)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotationItems.map((item, index) => {
              const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
              const timeAdjustment = totals.serviceTimeAdjustments.find(adj => adj.itemIndex === index);
              const finalPrice = itemBasePrice + (timeAdjustment?.adjustmentAmount || 0);
              
              // Determine service type badge
              const getServiceTypeBadge = (serviceTypeName: string = '') => {
                const serviceLower = serviceTypeName.toLowerCase();
                if (serviceLower.includes('transfer')) {
                  return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Transfer</Badge>;
                } else if (serviceLower.includes('charter')) {
                  return <Badge className="bg-green-100 text-green-800 border-green-200">Charter</Badge>;
                } else if (serviceLower.includes('package')) {
                  return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Package</Badge>;
                }
                return <Badge variant="outline">Service</Badge>;
              };
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getServiceTypeBadge(item.service_type_name || '')}
                        <span className="font-semibold text-base">{item.description}</span>
                        <span className="text-xl font-bold ml-auto">{formatCurrency(finalPrice)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><span className="font-medium">{t('quotations.details.vehicle')}:</span> <span className="ml-2">{item.vehicle_type}</span></div>
                    <div><span className="font-medium">{t('quotations.details.duration')}:</span> <span className="ml-2">
                      {item.service_type_name?.toLowerCase().includes('charter') 
                        ? `${item.service_days || 1} ${t('quotations.details.days')} × ${item.hours_per_day || 8}h/day`
                        : `${item.duration_hours || 1} ${t('quotations.details.hours')}`}
                    </span></div>
                                         {item.pickup_date && (
                       <div><span className="font-medium">{t('quotations.details.date')}:</span> <span className="ml-2">{formatDateDDMMYYYY(item.pickup_date)}</span></div>
                     )}
                     {item.pickup_time && (
                       <div><span className="font-medium">{t('quotations.details.time')}:</span> <span className="ml-2">{item.pickup_time}</span></div>
                     )}
                  </div>
                  
                  {/* Time-based adjustment matching pricing-step.tsx */}
                  {timeAdjustment && timeAdjustment.adjustmentAmount !== 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3 border border-orange-200 dark:border-orange-800">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-orange-700 dark:text-orange-300">
                            <div className="font-medium text-sm">Time-based Adjustment</div>
                            <div className="text-xs">
                              ({timeAdjustment.adjustmentPercentage > 0 ? '+' : ''}{timeAdjustment.adjustmentPercentage}%)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-bold text-sm",
                              timeAdjustment.adjustmentAmount > 0 ? "text-orange-600" : "text-green-600"
                            )}>
                              {timeAdjustment.adjustmentAmount > 0 ? '+' : ''}{formatCurrency(Math.abs(timeAdjustment.adjustmentAmount))}
                            </div>
                          </div>
                        </div>
                        {timeAdjustment.ruleName && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded">
                            Rule: {String(timeAdjustment.ruleName)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Package Section - Matching pricing-step.tsx */}
      {selectedPackage && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Package</CardTitle>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {formatCurrency(selectedPackage.base_price)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-base mb-1">{selectedPackage.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{selectedPackage.description}</p>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium">Package Service:</span>
                <span className="font-bold text-lg text-purple-600">{formatCurrency(selectedPackage.base_price)}</span>
              </div>
            </div>
            
            {/* Included Services like in pricing-step.tsx */}
            {selectedPackage.items && selectedPackage.items.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">{t('quotations.details.includedServices')}:</div>
                
                <div className="space-y-2">
                  {selectedPackage.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-purple-50/50 dark:bg-purple-900/10 rounded border border-purple-100 dark:border-purple-800">
                      <div className="flex-1">
                        <div className="font-medium text-sm">• {item.name || item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description && item.name !== item.description ? item.description + ' • ' : ''}{item.vehicle_type}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-purple-600">
                        {formatCurrency(item.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-purple-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Individual Total:</span>
                    <span>{formatCurrency(selectedPackage.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Package Savings:</span>
                    <span>-{formatCurrency(selectedPackage.items.reduce((sum: number, item: any) => sum + (item.price || 0), 0) - selectedPackage.base_price)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Summary */}
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {t('quotations.details.pricingSummary')}
              </CardTitle>
              <CardDescription>
                {t('quotations.details.finalPricingBreakdown')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="THB">THB (฿)</SelectItem>
                  <SelectItem value="CNY">CNY (¥)</SelectItem>
                  <SelectItem value="SGD">SGD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Service Subtotal */}
            {totals.serviceBaseTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>{t('quotations.details.servicesBaseTotal')}</span>
                <span>{formatCurrency(totals.serviceBaseTotal)}</span>
              </div>
            )}
            
            {/* Time-based Service Adjustments */}
            {totals.totalTimeAdjustment !== 0 && (
              <div className="flex justify-between text-sm font-medium text-amber-600">
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {t('quotations.details.timeBasedAdjustments')}
                </span>
                <span>{totals.totalTimeAdjustment > 0 ? '+' : ''}{formatCurrency(totals.totalTimeAdjustment)}</span>
              </div>
            )}
            
            {/* Package Subtotal */}
            {totals.packageTotal > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span>{t('quotations.details.packageTotal')}</span>
                <span>{formatCurrency(totals.packageTotal)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            {/* Base Total */}
            <div className="flex justify-between text-sm font-medium">
              <span>{t('quotations.details.totalAmount')}</span>
              <span>{formatCurrency(totals.baseTotal)}</span>
            </div>
            
            {/* Promotion Discount (if applied) */}
            {totals.promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('quotations.details.promotionDiscount')} ({selectedPromotion?.name})</span>
                <span>-{formatCurrency(totals.promotionDiscount)}</span>
              </div>
            )}
            
            {/* Regular Discount (if applied) */}
            {totals.regularDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>{t('quotations.details.regularDiscount')} ({discountPercentage || 0}%)</span>
                <span>-{formatCurrency(totals.regularDiscount)}</span>
              </div>
            )}
            
            <Separator className="my-1" />
            
            <div className="flex justify-between text-sm font-medium">
              <span>{t('quotations.details.subtotal')}</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            
            {(taxPercentage || 0) > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('quotations.details.tax')} ({taxPercentage || 0}%)</span>
                <span>+{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>{t('quotations.details.total')}</span>
              <span>{formatCurrency(totals.finalTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}