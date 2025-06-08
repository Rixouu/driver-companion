"use client";

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { DollarSign, Globe, Gift, Timer, Package, X, CheckCircle, Tag, Percent } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ServiceItemInput, PricingPackage, PricingPromotion } from '@/types/quotations';

interface PricingStepProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  packages: PricingPackage[];
  promotions: PricingPromotion[];
  selectedPackage: PricingPackage | null;
  setSelectedPackage: (pkg: PricingPackage | null) => void;
  selectedPromotion: PricingPromotion | null;
  setSelectedPromotion: (promo: PricingPromotion | null) => void;
}

export function PricingStep({
  form,
  serviceItems,
  packages,
  promotions,
  selectedPackage,
  setSelectedPackage,
  selectedPromotion,
  setSelectedPromotion
}: PricingStepProps) {
  const { t } = useI18n();
  const [currentPricingTab, setCurrentPricingTab] = useState<string>('basic');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('JPY');
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [promotionError, setPromotionError] = useState<string>('');

  const discountPercentage = form.watch('discount_percentage');
  const taxPercentage = form.watch('tax_percentage');

  const formatCurrency = (amount: number) => {
    if (amount === undefined) return `¥0`;
    
    const exchangeRates: Record<string, number> = {
      'JPY': 1,
      'USD': 0.0067,
      'EUR': 0.0062,
      'THB': 0.22,
      'CNY': 0.048,
      'SGD': 0.0091
    };

    const convertedAmount = amount * (exchangeRates[selectedCurrency] / exchangeRates['JPY']);
    
    if (selectedCurrency === 'JPY' || selectedCurrency === 'CNY') {
      return selectedCurrency === 'JPY' 
        ? `¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : `CN¥${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (selectedCurrency === 'THB') {
      return `฿${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    }
  };

  const calculateTotalServiceAmount = () => {
    if (serviceItems.length === 0) return 0;
    
    return serviceItems.reduce((total, item) => {
      const itemTotal = item.total_price || (item.unit_price * (item.quantity || 1) * (item.service_days || 1));
      return total + itemTotal;
    }, 0);
  };

  const validatePromotionCode = async (code: string) => {
    if (!code.trim()) {
      setPromotionError('');
      setSelectedPromotion(null);
      return;
    }

    const promotion = promotions.find(p => 
      p.code.toLowerCase() === code.toLowerCase() && 
      p.is_active
    );

    if (!promotion) {
      setPromotionError(t('quotations.form.promotions.invalid'));
      setSelectedPromotion(null);
      return;
    }

    const now = new Date();
    if (promotion.start_date && new Date(promotion.start_date) > now) {
      setPromotionError(t('quotations.form.promotions.notActive'));
      setSelectedPromotion(null);
      return;
    }

    if (promotion.end_date && new Date(promotion.end_date) < now) {
      setPromotionError(t('quotations.form.promotions.expired'));
      setSelectedPromotion(null);
      return;
    }

    if (promotion.usage_limit && promotion.times_used >= promotion.usage_limit) {
      setPromotionError(t('quotations.form.promotions.usageLimitReached'));
      setSelectedPromotion(null);
      return;
    }

    const baseTotal = calculateTotalServiceAmount();
    if (promotion.minimum_amount && baseTotal < promotion.minimum_amount) {
      setPromotionError(`${t('quotations.form.promotions.minimumAmount')} ${formatCurrency(promotion.minimum_amount)}`);
      setSelectedPromotion(null);
      return;
    }

    setPromotionError('');
    setSelectedPromotion(promotion);
  };

  const calculatePromotionDiscount = (baseAmount: number) => {
    if (!selectedPromotion) return 0;

    if (selectedPromotion.discount_type === 'percentage') {
      let discount = baseAmount * (selectedPromotion.discount_value / 100);
      
      if (selectedPromotion.maximum_discount && discount > selectedPromotion.maximum_discount) {
        discount = selectedPromotion.maximum_discount;
      }
      
      return discount;
    } else {
      return Math.min(selectedPromotion.discount_value, baseAmount);
    }
  };

  const calculateFinalAmounts = () => {
    let serviceTotal = calculateTotalServiceAmount();
    let packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    
    const baseTotal = serviceTotal + packageTotal;
    const discountPercentageValue = discountPercentage || 0;
    const taxPercentageValue = taxPercentage || 0;
    
    const promotionDiscount = calculatePromotionDiscount(baseTotal);
    const regularDiscountAmount = baseTotal * (discountPercentageValue / 100);
    const totalDiscountAmount = promotionDiscount + regularDiscountAmount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscountAmount);
    const taxAmount = subtotal * (taxPercentageValue / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      serviceTotal,
      packageTotal,
      baseTotal,
      promotionDiscount,
      regularDiscountAmount,
      totalDiscountAmount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <DollarSign className="h-5 w-5" /> 
        {t('quotations.form.pricingSection')}
      </h2>
      
      <Tabs value={currentPricingTab} onValueChange={setCurrentPricingTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2 px-3 py-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quotations.form.pricingTabs.basic')}</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2 px-3 py-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quotations.form.pricingTabs.promotions')}</span>
            <span className="sm:hidden">Promos</span>
          </TabsTrigger>
          <TabsTrigger value="timepricing" className="flex items-center gap-2 px-3 py-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quotations.form.pricingTabs.timepricing')}</span>
            <span className="sm:hidden">Time</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 mt-0">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium">{t('quotations.form.currencySettings')}</h3>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              >
                <SelectTrigger className="w-[120px] h-8">
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
           
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-muted-foreground" /> 
                    {t('quotations.form.discountPercentage')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      value={field.value || '0'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-muted-foreground" /> 
                    {t('quotations.form.taxPercentage')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      value={field.value || '0'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Display selected package or promotion info */}
          {selectedPackage && (
            <Card className="border-l-4 border-l-purple-500 bg-background mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-foreground">
                      {t('quotations.form.packages.selected')}: {selectedPackage.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPackage(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selectedPackage.description}</p>
                <p className="text-sm font-medium text-foreground mt-2">
                  {t('quotations.form.packages.packagePrice')}: {formatCurrency(selectedPackage.base_price)}
                </p>
              </CardContent>
            </Card>
          )}

          {selectedPromotion && (
            <Card className="border-l-4 border-l-green-500 bg-background mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-foreground">
                      {t('quotations.form.promotions.applied')}: {selectedPromotion.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedPromotion(null);
                      setPromotionCode('');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{selectedPromotion.description}</p>
                <p className="text-sm font-medium text-foreground mt-2">
                  {t('quotations.form.promotions.discount')}: {selectedPromotion.discount_type === 'percentage' 
                    ? `${selectedPromotion.discount_value}%` 
                    : formatCurrency(selectedPromotion.discount_value)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pricing breakdown */}
          <Card className="bg-muted/40 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{t('quotations.form.estimatedPricing')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {serviceItems.length > 0 || selectedPackage ? (
                  (() => {
                    const { 
                      serviceTotal,
                      packageTotal,
                      baseTotal, 
                      promotionDiscount, 
                      regularDiscountAmount, 
                      totalDiscountAmount, 
                      subtotal, 
                      taxAmount, 
                      finalTotal 
                    } = calculateFinalAmounts();
                    
                    return (
                      <>
                        {serviceItems.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>{t('quotations.form.services.selectedServices')} ({serviceItems.length})</span>
                            <span>{formatCurrency(serviceTotal)}</span>
                          </div>
                        )}
                        
                        {selectedPackage && (
                          <div className="flex justify-between text-sm font-medium text-purple-600">
                            <span>{t('quotations.form.packages.title')}: {selectedPackage.name}</span>
                            <span>{formatCurrency(packageTotal)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between text-sm font-medium">
                          <span>{t('quotations.pricing.subtotal')}</span>
                          <span>{formatCurrency(baseTotal)}</span>
                        </div>
                        
                        {promotionDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>{t('quotations.form.promotions.discount')} ({selectedPromotion?.name})</span>
                            <span>-{formatCurrency(promotionDiscount)}</span>
                          </div>
                        )}
                        
                        {regularDiscountAmount > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>{t('quotations.pricing.discount')} ({discountPercentage || 0}%)</span>
                            <span>-{formatCurrency(regularDiscountAmount)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-1" />
                        
                        <div className="flex justify-between text-sm font-medium">
                          <span>{t('quotations.pricing.subtotal')}</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        
                        {(taxPercentage || 0) > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t('quotations.pricing.tax')} ({taxPercentage || 0}%)</span>
                            <span>+{formatCurrency(taxAmount)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-semibold text-lg">
                          <span>{t('quotations.pricing.total')}</span>
                          <span>{formatCurrency(finalTotal)}</span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>{t('quotations.form.packages.selectToSeePricing')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6 mt-0">
          <div className="space-y-4">
            <h3 className="text-base font-medium">{t('quotations.form.promotions.title')}</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder={t('quotations.form.promotions.enterCode')}
                value={promotionCode}
                onChange={(e) => {
                  setPromotionCode(e.target.value);
                  if (promotionError) {
                    setPromotionError('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    validatePromotionCode(promotionCode);
                  }
                }}
                className={cn(
                  "flex-1",
                  promotionError && "border-red-500",
                  selectedPromotion && "border-green-500"
                )}
              />
              <Button 
                type="button"
                variant="outline"
                onClick={() => validatePromotionCode(promotionCode)}
                disabled={!promotionCode.trim()}
              >
                {t('quotations.form.promotions.apply')}
              </Button>
            </div>
            
            {promotionError && (
              <p className="text-sm text-red-600">{promotionError}</p>
            )}
            
            {selectedPromotion && (
              <Card className="border-l-4 border-l-green-500 bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">{t('quotations.form.promotions.promotionApplied')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedPromotion.description}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-foreground">
                      {t('quotations.form.promotions.discount')}: {selectedPromotion.discount_type === 'percentage' 
                        ? `${selectedPromotion.discount_value}%` 
                        : formatCurrency(selectedPromotion.discount_value)}
                    </span>
                    {selectedPromotion.maximum_discount && selectedPromotion.discount_type === 'percentage' && (
                      <span className="text-muted-foreground">
                        {' '}({t('quotations.form.promotions.maxDiscount', { amount: formatCurrency(selectedPromotion.maximum_discount) })})
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{t('quotations.form.promotions.availablePromotions')}</h4>
              
              {promotions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{t('quotations.form.promotions.noPromotions')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {promotions.filter(p => p.is_active).map((promotion) => (
                    <Card 
                      key={promotion.id} 
                      className="cursor-pointer hover:shadow-sm hover:border-primary/50 transition-all"
                      onClick={() => {
                        setPromotionCode(promotion.code);
                        validatePromotionCode(promotion.code);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground">{promotion.name}</span>
                              <Badge variant="outline" className="text-xs">{promotion.code}</Badge>
                            </div>
                            {promotion.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {promotion.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm text-foreground">
                              {promotion.discount_type === 'percentage' 
                                ? `${promotion.discount_value}%` 
                                : formatCurrency(promotion.discount_value)}
                            </p>
                            {promotion.minimum_amount && (
                              <p className="text-xs text-muted-foreground">
                                Min: {formatCurrency(promotion.minimum_amount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timepricing" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-medium">{t('quotations.form.timePricing.title')}</h3>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('quotations.form.timePricing.automatic')}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {t('quotations.form.timePricing.description')}
                  </p>
                  
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• {t('quotations.form.timePricing.features.peakHours')}</li>
                    <li>• {t('quotations.form.timePricing.features.nightSurcharge')}</li>
                    <li>• {t('quotations.form.timePricing.features.weekendPricing')}</li>
                    <li>• {t('quotations.form.timePricing.features.holidayPricing')}</li>
                  </ul>
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm">
                      <strong>{t('quotations.form.timePricing.status.title')}:</strong> {' '}
                      {form.watch('pickup_date') && form.watch('pickup_time') ? (
                        <span className="text-green-600">
                          {t('quotations.form.timePricing.status.active')}
                        </span>
                      ) : (
                        <span className="text-amber-600">
                          {t('quotations.form.timePricing.status.inactive')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500 bg-background">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Timer className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('quotations.form.timePricing.howItWorks.title')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('quotations.form.timePricing.howItWorks.description')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 