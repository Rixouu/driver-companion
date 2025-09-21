"use client";

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { DollarSign, Globe, Gift, Timer, Package, X, CheckCircle, Tag, Percent, Calculator, TrendingUp, Clock, Info, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/services/currency-service';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(form.watch('display_currency') || 'JPY');
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [promotionError, setPromotionError] = useState<string>('');
  const [timeBasedPricingEnabled, setTimeBasedPricingEnabled] = useState<boolean>(true);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isTimeRulesModalOpen, setIsTimeRulesModalOpen] = useState(false);
  
  // Use the same currency service as quotation-details.tsx
  const { currencyData, isLoading: currencyLoading, formatCurrency: dynamicFormatCurrency, convertCurrency } = useCurrency(selectedCurrency);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    form.setValue('display_currency', currency);
  };

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotionError('Please enter a promotion code');
      return;
    }

    // Find promotion by code
    const promotion = promotions.find(p => p.code.toLowerCase() === promotionCode.toLowerCase());
    if (promotion) {
      setSelectedPromotion(promotion);
      setPromotionError('');
      setPromotionCode('');
    } else {
      setPromotionError('Invalid promotion code');
    }
  };

  const handleRemovePromotion = () => {
    setSelectedPromotion(null);
    setPromotionCode('');
    setPromotionError('');
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined) return dynamicFormatCurrency(0, selectedCurrency);
    
    // Use dynamic currency service if available, fallback to static rates
    if (currencyData && !currencyLoading) {
      const convertedAmount = convertCurrency(amount, 'JPY', selectedCurrency);
      return dynamicFormatCurrency(convertedAmount, selectedCurrency);
    }
    
    // Fallback to static rates (same as before)
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

  const calculateTotal = () => {
    return serviceItems.reduce((total, item) => {
      const basePrice = (item.unit_price || 0) * (item.service_days || 1);
      const timeAdjustment = item.time_based_adjustment ? basePrice * (item.time_based_adjustment / 100) : 0;
      return total + basePrice + timeAdjustment;
    }, 0);
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="w-full space-y-8">
        {/* Pricing Configuration & Promotions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Pricing & Promotions</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('quotations.form.timePricing.title')}</span>
              <Switch
                checked={timeBasedPricingEnabled}
                onCheckedChange={setTimeBasedPricingEnabled}
              />
              <Dialog open={isTimeRulesModalOpen} onOpenChange={setIsTimeRulesModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Time-based Pricing Rules</DialogTitle>
                    <DialogDescription>
                      View the complete list of time-based pricing rules and how they affect your quotation pricing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Peak Hour Surcharges</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Morning Rush (07:00-09:00)</span>
                            <span className="font-medium text-orange-600">+20%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Evening Rush (17:00-19:00)</span>
                            <span className="font-medium text-orange-600">+15%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Discount Periods</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Early Morning (05:00-07:00)</span>
                            <span className="font-medium text-green-600">-25%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Late Night (22:00-06:00)</span>
                            <span className="font-medium text-green-600">+25%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Special Adjustments</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Weekend Pricing</span>
                            <span className="font-medium text-blue-600">+10%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Holiday Pricing</span>
                            <span className="font-medium text-blue-600">+30%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <h4 className="font-semibold mb-2">How Time-based Pricing Works</h4>
                      <p className="text-sm text-muted-foreground">
                        Pricing automatically adjusts based on pickup time and date according to predefined rules. 
                        The system calculates the appropriate adjustment percentage and applies it to the base service price.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    {t('quotations.form.pricing.configuration')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Currency Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('quotations.form.currencySettings')}</h3>
                  </div>

                    {/* Exchange Rate Status with Tooltip and Currency Dropdown */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t('quotations.form.pricing.liveExchangeRates')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 p-0 cursor-help flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                            <Info className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-auto">
                          <div className="space-y-3 max-w-xs">
                            <div>
                              <p className="font-medium">Exchange Rate Information</p>
                              {selectedCurrency !== 'JPY' && currencyData?.rates[selectedCurrency] && (
                                <div className="space-y-1 mt-2">
                                  <p className="text-sm font-medium text-blue-600">
                                    1 JPY = {currencyData.rates[selectedCurrency].toFixed(selectedCurrency === 'JPY' ? 0 : 4)} {selectedCurrency}
                                  </p>
                                  <p className="text-sm font-medium text-blue-600">
                                    1 {selectedCurrency} = {(1 / currencyData.rates[selectedCurrency]).toFixed(4)} JPY
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Source:</span>
                                <span className="font-medium text-green-600">
                                  {currencyData?.source || 'exchangerate.host'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Updated:</span>
                                <span className="font-medium text-green-600">
                                  {currencyData?.lastUpdated ? format(currencyData.lastUpdated, 'MMM dd, HH:mm') : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Base:</span>
                                <span className="font-medium">JPY</span>
                              </div>
                            </div>

                            {/* Show all available exchange rates */}
                            {currencyData?.rates && Object.keys(currencyData.rates).length > 1 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">All Rates (1 JPY):</p>
                                <div className="space-y-1">
                                  {Object.entries(currencyData.rates)
                                    .filter(([code]) => code !== 'JPY')
                                    .map(([code, rate]) => (
                                      <div key={code} className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{code}:</span>
                                        <span className="font-mono font-medium">
                                          {rate.toFixed(code === 'JPY' ? 0 : 4)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Rates are for reference only and may not reflect real-time market conditions.
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

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

                  {/* Discount and Tax */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discount_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">{t('quotations.form.discountPercentage')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="pr-8"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-muted-foreground text-sm font-medium">%</span>
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
                          <FormLabel className="text-sm">{t('quotations.form.taxPercentage')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="pr-8"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-muted-foreground text-sm font-medium">%</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                                    </div>

                  {/* Tax Guidelines Modal */}
                  <Dialog open={isTaxModalOpen} onOpenChange={setIsTaxModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Info className="h-4 w-4 mr-2" />
                        Tax Guidelines & Quick Apply
                      </Button>
                    </DialogTrigger>
                     <DialogContent className="max-w-2xl">
                       <DialogHeader>
                         <DialogTitle>Tax Guidelines & Quick Apply</DialogTitle>
                         <DialogDescription>
                           Select the appropriate tax rate based on your service location and apply it quickly to your quotation.
                         </DialogDescription>
                       </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-l-blue-500">
                            <p className="font-medium">🇯🇵 Japan Consumption Tax</p>
                            <p className="text-sm">Standard Rate: <span className="font-semibold">10%</span> (Reduced Rate: 8%)</p>
                            <p className="text-sm">Transportation Services: <span className="font-semibold">10%</span></p>
                                    </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-l-green-500">
                            <p className="font-medium">🇹🇭 Thailand VAT</p>
                            <p className="text-sm">Standard Rate: <span className="font-semibold">7%</span></p>
                            <p className="text-sm">Tourism Services: <span className="font-semibold">7%</span></p>
                                    </div>
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded border-l-4 border-l-purple-500">
                            <p className="font-medium">🌍 International Services</p>
                            <p className="text-sm">Cross-border tax implications may apply. Consult with tax professionals for specific cases.</p>
                                  </div>
                                </div>
                        <div className="flex gap-2 pt-4">
                                    <Button 
                            onClick={() => {
                              form.setValue('tax_percentage', 10);
                              setIsTaxModalOpen(false);
                            }}
                                      size="sm" 
                                    >
                            Apply 10% (Japan)
                                    </Button>
                                    <Button 
                            onClick={() => {
                              form.setValue('tax_percentage', 7);
                              setIsTaxModalOpen(false);
                            }}
                                      size="sm" 
                                      variant="outline" 
                                    >
                            Apply 7% (Thailand)
                                    </Button>
                      <Button 
                        onClick={() => {
                              form.setValue('tax_percentage', 0);
                              setIsTaxModalOpen(false);
                        }}
                            size="sm"
                            variant="outline"
                      >
                            No Tax (0%)
                      </Button>
                    </div>
            </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Promotions */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    {t('quotations.form.promotions.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Promotion Code Entry */}
                  <div className="flex gap-2">
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
                          handleApplyPromotion();
                        }
                      }}
                    />
                    <Button onClick={handleApplyPromotion} size="sm">
                      Apply
                    </Button>
                  </div>
                  
                  {promotionError && (
                    <p className="text-sm text-red-500">{promotionError}</p>
                  )}

                  {/* Tier Buttons */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Quick Apply Tiers:</p>
                    <div className="grid grid-cols-3 gap-2">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           const tierAPromo = promotions.find(p => p.code === 'TIERA');
                           if (tierAPromo) {
                             setSelectedPromotion(tierAPromo);
                             setPromotionCode('');
                             setPromotionError('');
                           }
                         }}
                         className="text-xs"
                       >
                         Tier A
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           const tierBPromo = promotions.find(p => p.code === 'TIERB');
                           if (tierBPromo) {
                             setSelectedPromotion(tierBPromo);
                             setPromotionCode('');
                             setPromotionError('');
                           }
                         }}
                         className="text-xs"
                       >
                         Tier B
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           const tierCPromo = promotions.find(p => p.code === 'TIERC');
                           if (tierCPromo) {
                             setSelectedPromotion(tierCPromo);
                             setPromotionCode('');
                             setPromotionError('');
                           }
                         }}
                         className="text-xs"
                       >
                         Tier C
                       </Button>
                                </div>
                  </div>

                  {/* Applied Promotion */}
                  {selectedPromotion && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            {selectedPromotion.name}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {selectedPromotion.discount_type === 'percentage' 
                              ? `${selectedPromotion.discount_value}% Discount`
                              : `${formatCurrency(selectedPromotion.discount_value)} Discount`}
                          </p>
                              </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromotion}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                                </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Simplified Price Breakdown */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Price Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Services Breakdown */}
                {serviceItems.map((item, index) => {
                  const basePrice = (item.unit_price || 0) * (item.service_days || 1);
                  const timeAdjustment = item.time_based_adjustment ? basePrice * (item.time_based_adjustment / 100) : 0;
                  const itemTotal = basePrice + timeAdjustment;
                  
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
                        {timeAdjustment > 0 && (
                          <div className="flex justify-between text-orange-400">
                            <span>Time Adjustment: +{item.time_based_adjustment}%</span>
                            <span>+{formatCurrency(timeAdjustment)}</span>
            </div>
                        )}
                        </div>
                      </div>
                  );
                })}
                
                {/* Services Subtotal */}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">Services Subtotal</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                        </div>

                {/* Discount */}
                {form.watch('discount_percentage') > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount ({form.watch('discount_percentage')}%)</span>
                    <span className="font-medium">
                      -{formatCurrency(totalAmount * (form.watch('discount_percentage') / 100))}
                    </span>
                      </div>
                )}

                {/* Promotion Discount */}
                {selectedPromotion && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Promotion ({selectedPromotion.name})</span>
                    <span className="font-medium">
                      -{formatCurrency(
                        selectedPromotion.discount_type === 'percentage' 
                          ? totalAmount * (selectedPromotion.discount_value / 100)
                          : selectedPromotion.discount_value
                      )}
                    </span>
                        </div>
                )}

                {/* After Discounts */}
                {(form.watch('discount_percentage') > 0 || selectedPromotion) && (
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">After Discounts</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        totalAmount - 
                        (form.watch('discount_percentage') > 0 ? totalAmount * (form.watch('discount_percentage') / 100) : 0) -
                        (selectedPromotion ? (
                          selectedPromotion.discount_type === 'percentage' 
                            ? totalAmount * (selectedPromotion.discount_value / 100)
                            : selectedPromotion.discount_value
                        ) : 0)
                      )}
                    </span>
                      </div>
                )}

                {/* Tax */}
                {form.watch('tax_percentage') > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="text-sm">Tax ({form.watch('tax_percentage')}%)</span>
                    <span className="font-medium">
                      +{formatCurrency(
                        (totalAmount - 
                          (form.watch('discount_percentage') > 0 ? totalAmount * (form.watch('discount_percentage') / 100) : 0) -
                          (selectedPromotion ? (
                            selectedPromotion.discount_type === 'percentage' 
                              ? totalAmount * (selectedPromotion.discount_value / 100)
                              : selectedPromotion.discount_value
                          ) : 0)
                        ) * (form.watch('tax_percentage') / 100)
                      )}
                    </span>
                    </div>
                  )}

                {/* Total */}
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(
                      (totalAmount - 
                        (form.watch('discount_percentage') > 0 ? totalAmount * (form.watch('discount_percentage') / 100) : 0) -
                        (selectedPromotion ? (
                          selectedPromotion.discount_type === 'percentage' 
                            ? totalAmount * (selectedPromotion.discount_value / 100)
                            : selectedPromotion.discount_value
                        ) : 0)
                      ) * (1 + (form.watch('tax_percentage') || 0) / 100)
                    )}
                  </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>
    </div>
  );
} 
