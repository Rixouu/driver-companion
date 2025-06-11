"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Globe, Calculator, Package, Gift } from 'lucide-react';
import { QuotationItem, PricingPackage, PricingPromotion } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';

interface TimeBasedRule {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  adjustment_percentage: number;
  applicable_days: number[];
  priority: number;
  is_active: boolean;
  category_id?: string;
  service_type_id?: string;
}

interface PricingSummaryProps {
  quotationItems: QuotationItem[];
  selectedPackage?: PricingPackage | null;
  selectedPromotion?: PricingPromotion | null;
  discountPercentage?: number;
  taxPercentage?: number;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  formatCurrency: (amount: number | string | undefined, currency?: string) => string;
  appliedTimeBasedRules?: TimeBasedRule[];
}

export function PricingSummary({
  quotationItems = [],
  selectedPackage,
  selectedPromotion,
  discountPercentage = 0,
  taxPercentage = 0,
  selectedCurrency,
  onCurrencyChange,
  formatCurrency,
  appliedTimeBasedRules = []
}: PricingSummaryProps) {
  const { t } = useI18n();

  // Calculate totals exactly like the PDF generator
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotationItems.length > 0) {
      quotationItems.forEach((item: QuotationItem) => {
        const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
    const baseTotal = serviceTotal + packageTotal;
    
    const discountPercentageValue = discountPercentage || 0;
    const taxPercentageValue = taxPercentage || 0;
    
    const promotionDiscount = selectedPromotion ? 
      (selectedPromotion.discount_type === 'percentage' ? 
        baseTotal * (selectedPromotion.discount_value / 100) : 
        selectedPromotion.discount_value) : 0;
    
    const regularDiscount = baseTotal * (discountPercentageValue / 100);
    const totalDiscount = promotionDiscount + regularDiscount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscount);
    const taxAmount = subtotal * (taxPercentageValue / 100);
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
      {/* Pricing Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Calculator className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Price Details</h2>
            <p className="text-sm text-muted-foreground">Complete cost breakdown</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
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

      {/* Pricing Details Card - Matching PDF exactly */}
      <Card className="bg-muted/40">
        <CardContent>
          <div className="space-y-3 mt-6">
            {/* Header Row - matching PDF */}
            <div className="flex justify-between items-center border-b border-muted pb-2">
              <span className="font-medium text-sm text-muted-foreground">Description</span>
              <span className="font-medium text-sm text-muted-foreground">Price</span>
            </div>
            
            {/* Service Items */}
            {quotationItems.map((item, index) => {
              const isPackage = item.service_type_name?.toLowerCase().includes('package');
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.description || `${item.service_type_name || 'Service'} - ${item.vehicle_type || 'Standard Vehicle'}`}
                      </div>
                      {!isPackage && item.service_type_name?.toLowerCase().includes('charter') && (
                        <div className="text-xs text-muted-foreground">
                          {item.service_days || 1} day(s) × {item.hours_per_day || 8}h
                        </div>
                      )}
                      {!isPackage && item.pickup_date && (
                        <div className="text-xs text-muted-foreground">
                          Pickup Date: {new Date(item.pickup_date).toLocaleDateString()}
                          {item.pickup_time && `, Pickup Time: ${item.pickup_time}`}
                        </div>
                      )}
                      {selectedPackage && isPackage && (
                        <div className="text-xs text-muted-foreground mt-1 pl-2">
                          <strong>Services Included:</strong>
                          {selectedPackage.items && selectedPackage.items.length > 0 ? (
                            selectedPackage.items.map((pkgItem, idx) => (
                              <div key={idx} className="text-purple-600 text-xs font-medium">
                                • {pkgItem.name}
                                {pkgItem.vehicle_type && (
                                  <span className="text-muted-foreground ml-1">({pkgItem.vehicle_type})</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-purple-600 text-xs font-medium">• All package services included</div>
                          )}
                        </div>
                      )}
                      {(item as any).time_based_adjustment && (
                        <div className="text-xs mt-1 p-1 bg-orange-50 rounded text-orange-700">
                          Base Price: {formatCurrency(item.unit_price * (item.quantity || 1) * (item.service_days || 1))}
                          <br />
                          Time Adjustment ({(item as any).time_based_adjustment}%): {(item as any).time_based_adjustment > 0 ? '+' : ''}{formatCurrency(Math.abs((item.unit_price * (item.quantity || 1) * (item.service_days || 1)) * ((item as any).time_based_adjustment / 100)))}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-sm ml-4">
                      {formatCurrency(item.total_price || (item.unit_price * (item.quantity || 1)))}
                    </div>
                  </div>
                  {index < quotationItems.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              );
            })}
            
            <Separator className="my-3" />
            
            {/* Services Subtotal */}
            <div className="flex justify-between text-sm font-medium">
              <span>Services Subtotal</span>
              <span>{formatCurrency(totals.serviceTotal)}</span>
            </div>
            
            {/* Package Total */}
            {selectedPackage && totals.packageTotal > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-purple-600 font-medium">
                  <div>
                    <div>Package: {selectedPackage.name}</div>
                    {selectedPackage && (
                      <div className="text-xs text-muted-foreground mt-1 pl-2">
                        <strong>Services Included:</strong>
                        {selectedPackage.items && selectedPackage.items.length > 0 ? (
                          selectedPackage.items.map((pkgItem, idx) => (
                            <div key={idx} className="text-purple-600 text-xs font-medium">
                              • {pkgItem.name}
                              {pkgItem.vehicle_type && (
                                <span className="text-muted-foreground ml-1">({pkgItem.vehicle_type})</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-purple-600 text-xs font-medium">• All package services included</div>
                        )}
                      </div>
                    )}
                  </div>
                  <span>{formatCurrency(totals.packageTotal)}</span>
                </div>
              </div>
            )}
            
            <Separator className="my-2" />
            
            {/* Subtotal */}
            <div className="flex justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.baseTotal)}</span>
            </div>
            
            {/* Promotion Discount (if applied) */}
            {totals.promotionDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promotion: {selectedPromotion?.name}</span>
                <span>-{formatCurrency(totals.promotionDiscount)}</span>
              </div>
            )}
            
            {/* Regular Discount (if applied) */}
            {totals.regularDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount ({discountPercentage || 0}%)</span>
                <span>-{formatCurrency(totals.regularDiscount)}</span>
              </div>
            )}
            
            {(totals.promotionDiscount > 0 || totals.regularDiscount > 0) && (
              <>
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
              </>
            )}
            
            {(taxPercentage || 0) > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax ({taxPercentage || 0}%)</span>
                <span>+{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
            
            <Separator className="my-2 border-2" />
            
            <div className="flex justify-between font-bold text-base">
              <span>Total Amount</span>
              <span>{formatCurrency(totals.finalTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 