"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  formatCurrency: (amount: number | string | undefined, currency?: string) => string;
}

export function PricingSummary({
  quotationItems = [],
  selectedPackage,
  selectedPromotion,
  discountPercentage = 0,
  taxPercentage = 0,
  formatCurrency
}: PricingSummaryProps) {

  // Calculate totals exactly like the PDF generator
  const calculateTotals = () => {
    let serviceBaseTotal = 0;
    let serviceTimeAdjustment = 0;
    
    if (quotationItems.length > 0) {
      quotationItems.forEach((item: QuotationItem) => {
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (item.service_type_name?.toLowerCase().includes('charter')) {
          itemBasePrice = item.unit_price * (item.service_days || 1);
        } else {
          itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
        }
        serviceBaseTotal += itemBasePrice;
        
        if ((item as any).time_based_adjustment) {
          const timeAdjustment = itemBasePrice * ((item as any).time_based_adjustment / 100);
          serviceTimeAdjustment += timeAdjustment;
        }
      });
    }
    
    const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
    // Only include package total if selectedPackage is actually selected (not null)
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
      {/* Pricing Details Card - Clean design like quote-access page */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header Row */}
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-medium text-sm text-muted-foreground">Description</span>
              <span className="font-medium text-sm text-muted-foreground">Price</span>
            </div>
            
            {/* Service Items */}
            {quotationItems.map((item, index) => {
              const isPackage = item.service_type_name?.toLowerCase().includes('package');
              return (
                <div key={index} className="flex justify-between items-start py-2 border-b border-border last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">
                      {item.service_type_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.service_days && item.service_days > 1 ? (
                        <span>
                          {item.service_days} day(s) × {formatCurrency(item.unit_price)} = {formatCurrency(item.unit_price * item.service_days)}
                        </span>
                      ) : (
                        <span>
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      )}
                    </div>
                    {parseFloat((item as any).time_based_adjustment || '0') > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                        <span>+{(item as any).time_based_adjustment}% {(item as any).time_based_rule_name ? ` ${(item as any).time_based_rule_name}` : ''}: +{formatCurrency((item.unit_price * parseFloat((item as any).time_based_adjustment || '0')) / 100)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{formatCurrency(item.total_price || item.unit_price)}</div>
                  </div>
                </div>
              );
            })}
            
            {/* Summary Section */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Services Subtotal</span>
                  <span>{formatCurrency(totals.serviceTotal)}</span>
                </div>
                
                {totals.promotionDiscount > 0 && selectedPromotion && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promotion ({selectedPromotion.discount_type === 'percentage' ? `-${selectedPromotion.discount_value}%` : `-${formatCurrency(selectedPromotion.discount_value)}`}): {selectedPromotion.name}</span>
                    <span>-{formatCurrency(totals.promotionDiscount)}</span>
                  </div>
                )}
                
                {totals.regularDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discountPercentage || 0}%)</span>
                    <span>-{formatCurrency(totals.regularDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                
                {(taxPercentage || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax ({taxPercentage || 0}%)</span>
                    <span>+{formatCurrency(totals.taxAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount Due</span>
                  <span className="text-primary">{formatCurrency(totals.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 