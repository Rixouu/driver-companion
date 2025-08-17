"use client";

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { DollarSign, Globe, Gift, Timer, Package, X, CheckCircle, Tag, Percent, Calculator, TrendingUp, Clock, Info } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ServiceItemInput, PricingPackage, PricingPromotion } from '@/types/quotations';
import { ServiceCard } from '@/components/quotations/service-card';

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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(form.watch('display_currency') || 'JPY');
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [promotionError, setPromotionError] = useState<string>('');
  const [timeBasedPricingEnabled, setTimeBasedPricingEnabled] = useState<boolean>(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ JPY: 1 });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const discountPercentage = form.watch('discount_percentage');
  const taxPercentage = form.watch('tax_percentage');

  // Sync currency selection with form
  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    form.setValue('display_currency', newCurrency);
  };

  // Sync with form changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'display_currency' && value.display_currency) {
        setSelectedCurrency(value.display_currency);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const formatCurrency = (amount: number) => {
    if (amount === undefined) return `¥0`;
    const base = exchangeRates['JPY'] || 1;
    const target = exchangeRates[selectedCurrency] || 1;
    const convertedAmount = amount * (target / base);
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

  // Fetch live exchange rates with JPY base
  useEffect(() => {
    let isMounted = true;
    async function fetchRates() {
      try {
        setIsLoadingRates(true);
        setRatesError(null);
        // Free API without key; base JPY for simplicity
        const res = await fetch('https://api.exchangerate.host/latest?base=JPY');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted && data && data.rates) {
          // Pick only currencies we show; keep JPY:1
          const allowed = ['JPY','USD','EUR','THB','CNY','SGD'];
          const nextRates: Record<string, number> = { JPY: 1 };
          for (const code of allowed) {
            if (code === 'JPY') continue;
            if (typeof data.rates[code] === 'number') nextRates[code] = data.rates[code];
          }
          setExchangeRates(nextRates);
          setRatesUpdatedAt(new Date(data.date || Date.now()).toLocaleString());
        }
      } catch (err: any) {
        if (isMounted) {
          setRatesError(err?.message || 'Failed to load rates');
          // Fallback static snapshot to avoid empty UI
          setExchangeRates({ JPY: 1, USD: 0.0067, EUR: 0.0062, THB: 0.22, CNY: 0.048, SGD: 0.0091 });
        }
      } finally {
        if (isMounted) setIsLoadingRates(false);
      }
    }
    fetchRates();
    return () => { isMounted = false };
  }, []);

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
          <div className="space-y-6 sm:space-y-8">
      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
        <DollarSign className="h-5 w-5" /> 
        {t('quotations.form.pricingSection')}
      </h2>
      
      <Tabs value={currentPricingTab} onValueChange={setCurrentPricingTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto p-1 bg-muted">
          <TabsTrigger 
            value="basic" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-muted-foreground/10"
          >
            <DollarSign className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">{t('quotations.form.pricingTabs.basic')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="promotions" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-muted-foreground/10"
          >
            <Gift className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">{t('quotations.form.pricingTabs.promotions')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="timepricing" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-3 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm hover:bg-muted-foreground/10"
          >
            <Timer className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">{t('quotations.form.pricingTabs.timepricing')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Pricing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('quotations.form.currencySettings')}</h3>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={selectedCurrency}
                        onValueChange={handleCurrencyChange}
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

                  {/* Currency info - compact, contained, trust-building */}
                  <div className="rounded-md border bg-muted/20 p-3">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="font-medium text-foreground">{t('quotations.form.currencyInfo.title')}</div>
                        <p className="leading-relaxed">{t('quotations.form.currencyInfo.description')}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {isLoadingRates ? (
                            <span>{t('common.loading')}</span>
                          ) : ratesError ? (
                            <span className="text-red-600">{ratesError}</span>
                          ) : ratesUpdatedAt ? (
                            <span>{t('quotations.form.currencyInfo.lastUpdated', { date: ratesUpdatedAt })}</span>
                          ) : null}
                          <span className="text-[10px]">Source: <a href="https://exchangerate.host" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">exchangerate.host</a></span>
                        </div>
                        <div className="text-[10px]">{t('quotations.form.currencyInfo.disclaimer')}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />
                   
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discount_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <div className="p-1 bg-red-100 dark:bg-red-900/20 rounded">
                              <Tag className="h-3 w-3 text-red-600" />
                            </div>
                            {t('quotations.form.discountPercentage')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="0"
                                className="text-base pr-8"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                value={field.value || '0'}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-muted-foreground text-sm">%</span>
                              </div>
                            </div>
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded">
                              <Percent className="h-3 w-3 text-blue-600" />
                            </div>
                            {t('quotations.form.taxPercentage')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="0"
                                className="text-base pr-8"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                                value={field.value || '0'}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-muted-foreground text-sm">%</span>
                              </div>
                            </div>
                          </FormControl>
                          {/* Tax info and quick actions - compact panel to prevent overflow */}
                          <div className="mt-3 rounded-md border bg-muted/20 p-3">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">{t('quotations.form.taxInfo.title')}</div>
                                <p className="leading-relaxed">{t('quotations.form.taxInfo.japan')}</p>
                                <p className="leading-relaxed">{t('quotations.form.taxInfo.thailand')}</p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(10)}>
                                    {t('quotations.form.taxInfo.applyRecommended', { percent: 10 })}
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(7)}>
                                    {t('quotations.form.taxInfo.applyRecommended', { percent: 7 })}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Display selected package or promotion info */}
              {selectedPackage && (
                <Card className="border-l-4 border-l-purple-500 bg-background">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-600">
                          {t('quotations.form.packages.selected')}: <span className="text-purple-600">{selectedPackage.name}</span>
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
                    
                    {selectedPackage.description && (
                      <p className="text-sm text-purple-600 mt-1">{selectedPackage.description}</p>
                    )}
                    
                    {selectedPackage.items && selectedPackage.items.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-purple-600 mb-1">Included Services:</p>
                        <div className="grid gap-1">
                          {selectedPackage.items.map((item, index) => (
                            <div key={index} className="text-xs text-purple-600">
                              • {item.name} ({item.vehicle_type})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm font-medium text-purple-600 mt-2">
                      {t('quotations.form.packages.packagePrice')}: {formatCurrency(selectedPackage.base_price)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedPromotion && (
                <Card className="border-l-4 border-l-green-500 bg-background">
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
            </div>

            {/* Right Column - Pricing Summary */}
            <div className="space-y-6">
              <Card className="lg:sticky lg:top-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('quotations.form.estimatedPricing')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                                <div className="space-y-4">
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
                            {/* Individual Services Breakdown */}
                            {serviceItems.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-foreground border-b pb-2">
                                  <span>{t('quotations.form.services.selectedServices')} ({serviceItems.length})</span>
                                  <span className="font-semibold">{formatCurrency(serviceTotal)}</span>
                                </div>
                                {serviceItems.map((item, index) => (
                                  <ServiceCard
                                    key={index}
                                    item={item}
                                    index={index}
                                    formatCurrency={formatCurrency}
                                    packages={packages}
                                    selectedPackage={selectedPackage}
                                    showActions={false}
                                    className="bg-muted/30"
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* Package Breakdown */}
                            {selectedPackage && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-purple-600 border-b border-purple-200 pb-2">
                                  <span>{t('quotations.form.packages.title')}: {selectedPackage.name}</span>
                                  <span className="font-semibold">{formatCurrency(packageTotal)}</span>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                  <div className="flex justify-between text-sm text-purple-600 mb-2">
                                    <span>Package Base Price</span>
                                    <span className="font-medium">{formatCurrency(selectedPackage.base_price)}</span>
                                  </div>
                                  {selectedPackage.items && selectedPackage.items.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-purple-600 mb-2">Included Services:</p>
                                      <div className="space-y-1">
                                        {selectedPackage.items.map((item, index) => (
                                          <div key={index} className="text-xs text-purple-600 flex justify-between">
                                            <span>• {item.name} - {item.vehicle_type}</span>
                                            <span>{formatCurrency(item.price)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <Separator className="my-4" />
                            
                            <div className="flex justify-between text-base font-semibold bg-muted/50 p-3 rounded">
                              <span>{t('quotations.pricing.subtotal')}</span>
                              <span>{formatCurrency(baseTotal)}</span>
                            </div>
                            
                            {/* Discount Breakdown */}
                            {(promotionDiscount > 0 || regularDiscountAmount > 0) && (
                              <div className="space-y-2">
                                {promotionDiscount > 0 && (
                                  <div className="flex justify-between text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <span className="flex items-center gap-2">
                                      <Gift className="h-4 w-4" />
                                      {t('quotations.form.promotions.discount')} ({selectedPromotion?.name})
                                    </span>
                                    <span className="font-medium">-{formatCurrency(promotionDiscount)}</span>
                                  </div>
                                )}
                                
                                {regularDiscountAmount > 0 && (
                                  <div className="flex justify-between text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    <span className="flex items-center gap-2">
                                      <Tag className="h-4 w-4" />
                                      {t('quotations.pricing.discount')} ({discountPercentage || 0}%)
                                    </span>
                                    <span className="font-medium">-{formatCurrency(regularDiscountAmount)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {totalDiscountAmount > 0 && (
                              <>
                                <Separator />
                                <div className="flex justify-between text-sm font-medium">
                                  <span>After Discounts</span>
                                  <span>{formatCurrency(subtotal)}</span>
                                </div>
                              </>
                            )}
                            
                            {(taxPercentage || 0) > 0 && (
                              <div className="flex justify-between text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                <span className="flex items-center gap-2">
                                  <Percent className="h-4 w-4" />
                                  {t('quotations.pricing.tax')} ({taxPercentage || 0}%)
                                </span>
                                <span className="font-medium">+{formatCurrency(taxAmount)}</span>
                              </div>
                            )}
                            
                            <Separator className="my-4" />
                            
                            {/* Total Savings Progress */}
                            {totalDiscountAmount > 0 && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Savings</span>
                                  <span className="text-sm font-bold text-green-700 dark:text-green-300">{formatCurrency(totalDiscountAmount)}</span>
                                </div>
                                <Progress 
                                  value={Math.min((totalDiscountAmount / baseTotal) * 100, 100)} 
                                  className="h-2"
                                />
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  {((totalDiscountAmount / baseTotal) * 100).toFixed(1)}% savings
                                </div>
                              </div>
                            )}
                            
                            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">{t('quotations.pricing.total')}</span>
                                <span className="text-2xl font-bold">{formatCurrency(finalTotal)}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">{t('quotations.form.packages.selectToSeePricing')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Promotion Entry */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    {t('quotations.form.promotions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        "flex-1 text-base",
                        promotionError && "border-red-500",
                        selectedPromotion && "border-green-500"
                      )}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => validatePromotionCode(promotionCode)}
                      disabled={!promotionCode.trim()}
                      className="w-full sm:w-auto"
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
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Available Promotions */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    {t('quotations.form.promotions.availablePromotions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {promotions.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">{t('quotations.form.promotions.noPromotions')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promotions.filter(p => p.is_active).map((promotion) => (
                        <Card 
                          key={promotion.id} 
                          className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all hover:scale-[1.02]"
                          onClick={() => {
                            setPromotionCode(promotion.code);
                            validatePromotionCode(promotion.code);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm text-foreground">{promotion.name}</span>
                                  <Badge variant="secondary" className="text-xs">{promotion.code}</Badge>
                                </div>
                                {promotion.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {promotion.description}
                                  </p>
                                )}
                                {promotion.minimum_amount && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Min order: {formatCurrency(promotion.minimum_amount)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-3">
                                <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded text-sm font-medium">
                                  {promotion.discount_type === 'percentage' 
                                    ? `${promotion.discount_value}%` 
                                    : formatCurrency(promotion.discount_value)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timepricing" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Time Pricing Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" />
                      {t('quotations.form.timePricing.title')}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Enable</span>
                      <Switch
                        checked={timeBasedPricingEnabled}
                        onCheckedChange={setTimeBasedPricingEnabled}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      timeBasedPricingEnabled ? "bg-green-600" : "bg-gray-400"
                    )} />
                    <span className="text-sm font-medium">
                      {timeBasedPricingEnabled ? "Time-based pricing is active" : "Time-based pricing is disabled"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {timeBasedPricingEnabled 
                      ? "Pricing will automatically adjust based on pickup time and date according to predefined rules."
                      : "Standard pricing will be applied regardless of pickup time. Time-based adjustments are disabled."
                    }
                  </p>
                  
                  <div className="pt-3 border-t">
                    <div className="text-sm">
                      <strong>Current Status:</strong> {' '}
                      {timeBasedPricingEnabled ? (
                        form.watch('pickup_date') && form.watch('pickup_time') ? (
                          <Badge variant="default" className="bg-green-600">
                            Active - adjustments will be applied
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Ready - awaiting pickup date/time
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary">
                          Disabled - no time adjustments
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing Rules */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Pricing Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeBasedPricingEnabled ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium text-sm">
                          <TrendingUp className="h-4 w-4" />
                          Peak Hour Surcharges
                        </div>
                        <ul className="text-xs text-orange-600 dark:text-orange-400 mt-2 space-y-1">
                          <li>• Morning Rush (07:00-09:00): +20%</li>
                          <li>• Evening Rush (17:00-19:00): +25%</li>
                          <li>• Night Service (22:00-06:00): +25%</li>
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium text-sm">
                          <Tag className="h-4 w-4" />
                          Discount Periods
                        </div>
                        <ul className="text-xs text-green-600 dark:text-green-400 mt-2 space-y-1">
                          <li>• Early Morning (06:00-08:00 weekdays): -25%</li>
                          <li>• Off-peak hours (10:00-16:00): -10%</li>
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-sm">
                          <Package className="h-4 w-4" />
                          Special Adjustments
                        </div>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                          <li>• Weekend pricing adjustments</li>
                          <li>• Holiday special pricing</li>
                          <li>• Seasonal rate variations</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Enable time-based pricing to see active rules</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 bg-background">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Timer className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">How Time-based Pricing Works</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, the system automatically applies pricing adjustments based on your selected pickup time and date. 
                        These adjustments are calculated in real-time and displayed in your service breakdown.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 