"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Globe, Clock, Timer } from 'lucide-react';
import { QuotationItem } from '@/types/quotations';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

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

interface PriceDetailsProps {
  amount: number | string;
  discount_percentage?: number;
  tax_percentage?: number;
  total_amount: number | string;
  vehicle_type?: string;
  hours_per_day?: number;
  duration_hours?: number;
  service_days?: number;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  formatCurrency: (amount: number | string | undefined, currency?: string) => string;
  calculateDiscountAmount: (amount: number | string, discountPercentage: number) => number;
  calculateSubtotalAmount: (amount: number | string, discountPercentage: number) => number;
  calculateTaxAmount: (subtotalAmount: number | string, taxPercentage: number) => number;
  quotation_items?: QuotationItem[];
  time_based_adjustment?: number;
  package_discount?: number;
  promotion_discount?: number;
  selectedPackage?: any;
  selectedPromotion?: any;
  appliedTimeBasedRules?: TimeBasedRule[];
  pickup_date?: string;
  pickup_time?: string;
}

export function PriceDetails({
  amount,
  discount_percentage = 0,
  tax_percentage = 0,
  total_amount,
  selectedCurrency,
  onCurrencyChange,
  formatCurrency,
  quotation_items = [],
  time_based_adjustment = 0,
  package_discount = 0,
  promotion_discount = 0,
  selectedPackage,
  selectedPromotion,
  appliedTimeBasedRules = [],
  pickup_date,
  pickup_time
}: PriceDetailsProps) {
  
  const calculateFinalAmounts = () => {
    let serviceTotal = 0;
    let packageTotal = 0;
    let serviceTimeAdjustment = 0;
    
    // Calculate service total with individual time-based adjustments
    if (quotation_items.length > 0) {
      serviceTotal = quotation_items.reduce((total, item) => {
        const itemBasePrice = item.total_price || item.unit_price || 0;
        
        // Apply time-based adjustment to this specific service item
        let itemTimeAdjustment = 0;
        if (item.pickup_date && item.pickup_time && appliedTimeBasedRules.length > 0) {
          const itemDate = new Date(item.pickup_date);
          const [hours, minutes] = item.pickup_time.split(':').map(Number);
          itemDate.setHours(hours, minutes, 0, 0);
          
          const dayOfWeek = itemDate.getDay();
          const timeOfDay = hours * 60 + minutes;
          
          const applicableRules = appliedTimeBasedRules.filter(rule => {
            if (!rule.is_active) return false;
            
            // Check if rule applies to this day
            const applicableDays = rule.applicable_days || [];
            if (applicableDays.length > 0 && !applicableDays.includes(dayOfWeek)) {
              return false;
            }
            
            // Check if rule applies to this time
            if (rule.start_time && rule.end_time) {
              const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
              const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
              
              const startTime = startHours * 60 + startMinutes;
              const endTime = endHours * 60 + endMinutes;
              
              // Handle overnight time ranges
              if (startTime > endTime) {
                return timeOfDay >= startTime || timeOfDay <= endTime;
              } else {
                return timeOfDay >= startTime && timeOfDay <= endTime;
              }
            }
            
            return true;
          });
          
          itemTimeAdjustment = applicableRules.reduce((adjTotal, rule) => {
            return adjTotal + (itemBasePrice * (rule.adjustment_percentage || 0) / 100);
          }, 0);
        }
        
        serviceTimeAdjustment += itemTimeAdjustment;
        return total + itemBasePrice + itemTimeAdjustment;
      }, 0);
    } else {
      serviceTotal = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      // Apply time-based adjustment to the base service if pickup date/time exists
      if (pickup_date && pickup_time && appliedTimeBasedRules.length > 0) {
        const pickupDate = new Date(pickup_date);
        const [hours, minutes] = pickup_time.split(':').map(Number);
        pickupDate.setHours(hours, minutes, 0, 0);
        
        const dayOfWeek = pickupDate.getDay();
        const timeOfDay = hours * 60 + minutes;
        
        const applicableRules = appliedTimeBasedRules.filter(rule => {
          if (!rule.is_active) return false;
          
          const applicableDays = rule.applicable_days || [];
          if (applicableDays.length > 0 && !applicableDays.includes(dayOfWeek)) {
            return false;
          }
          
          if (rule.start_time && rule.end_time) {
            const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
            const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
            
            const startTime = startHours * 60 + startMinutes;
            const endTime = endHours * 60 + endMinutes;
            
            if (startTime > endTime) {
              return timeOfDay >= startTime || timeOfDay <= endTime;
            } else {
              return timeOfDay >= startTime && timeOfDay <= endTime;
            }
          }
          
          return true;
        });
        
        serviceTimeAdjustment = applicableRules.reduce((adjTotal, rule) => {
          return adjTotal + (serviceTotal * (rule.adjustment_percentage || 0) / 100);
        }, 0);
        
        serviceTotal += serviceTimeAdjustment;
      }
    }
    
    // Add package price separately (packages don't get time-based adjustments)
    if (selectedPackage) {
      packageTotal = selectedPackage.base_price || 0;
    }
    
    const baseTotal = serviceTotal + packageTotal;
    const discountPercentageValue = discount_percentage || 0;
    const taxPercentageValue = tax_percentage || 0;
    
    // Calculate promotion discount
    const promotionDiscountAmount = selectedPromotion 
      ? (selectedPromotion.discount_type === 'percentage' 
          ? baseTotal * (selectedPromotion.discount_value || 0) / 100
          : selectedPromotion.discount_value || 0)
      : 0;
    
    // Calculate regular discount
    const regularDiscountAmount = baseTotal * (discountPercentageValue / 100);
    
    // Total discount is promotion + regular discount
    const totalDiscountAmount = promotionDiscountAmount + regularDiscountAmount;
    
    const subtotal = Math.max(0, baseTotal - totalDiscountAmount);
    const taxAmount = subtotal * (taxPercentageValue / 100);
    const finalTotal = subtotal + taxAmount;
    
    return {
      serviceTotal: serviceTotal - serviceTimeAdjustment, // Services without time adjustment
      serviceTimeAdjustment,
      packageTotal,
      baseTotal,
      promotionDiscount: promotionDiscountAmount,
      regularDiscountAmount,
      totalDiscountAmount,
      subtotal,
      taxAmount,
      finalTotal
    };
  };

  const { 
    serviceTotal,
    serviceTimeAdjustment,
    packageTotal,
    baseTotal, 
    promotionDiscount, 
    regularDiscountAmount, 
    subtotal, 
    taxAmount, 
    finalTotal 
  } = calculateFinalAmounts();

  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Price Details</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Detailed breakdown of your quotation
            </CardDescription>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {quotation_items.length > 0 || selectedPackage ? (
            <>
              {/* Services */}
              {quotation_items.length > 0 && (
                <>
                  <div className="text-sm font-medium mb-2">Services:</div>
                  {quotation_items.map((item, index) => {
                    // Calculate time-based adjustment for this specific item
                    const baseItemPrice = (item.unit_price || 0) * (item.service_days || 1);
                    
                    // Check if this item has time-based adjustments
                    let itemTimeAdjustment = 0;
                    if (item.pickup_date && item.pickup_time && appliedTimeBasedRules.length > 0) {
                      // Calculate adjustment for this specific item's date/time
                      const itemDate = new Date(item.pickup_date);
                      const [hours, minutes] = item.pickup_time.split(':').map(Number);
                      itemDate.setHours(hours, minutes, 0, 0);
                      
                      const dayOfWeek = itemDate.getDay();
                      const timeOfDay = hours * 60 + minutes;
                      
                      const applicableRules = appliedTimeBasedRules.filter(rule => {
                        if (!rule.is_active) return false;
                        
                        // Check if rule applies to this day
                        const applicableDays = rule.applicable_days || [];
                        if (applicableDays.length > 0 && !applicableDays.includes(dayOfWeek)) {
                          return false;
                        }
                        
                        // Check if rule applies to this time
                        if (rule.start_time && rule.end_time) {
                          const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
                          const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
                          
                          const startTime = startHours * 60 + startMinutes;
                          const endTime = endHours * 60 + endMinutes;
                          
                          // Handle overnight time ranges
                          if (startTime > endTime) {
                            return timeOfDay >= startTime || timeOfDay <= endTime;
                          } else {
                            return timeOfDay >= startTime && timeOfDay <= endTime;
                          }
                        }
                        
                        return true;
                      });
                      
                      itemTimeAdjustment = applicableRules.reduce((total, rule) => {
                        return total + (baseItemPrice * (rule.adjustment_percentage || 0) / 100);
                      }, 0);
                    }
                    
                    return (
                      <div key={index} className="pl-4 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate max-w-[60%]">{item.description}</span>
                          <span>{formatCurrency(item.total_price || item.unit_price)}</span>
                        </div>
                        
                        {/* Show time-based adjustment for this item */}
                        {itemTimeAdjustment !== 0 && (
                          <div className="flex justify-between text-xs pl-4">
                            <span className={cn(
                              "flex items-center gap-1",
                              itemTimeAdjustment > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              <Timer className="h-3 w-3" />
                              Time adjustment
                            </span>
                            <span className={cn(
                              itemTimeAdjustment > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              {itemTimeAdjustment > 0 ? '+' : ''}{formatCurrency(itemTimeAdjustment)}
                            </span>
                          </div>
                        )}
                        
                        {/* Show pickup date/time for this item */}
                        {(item.pickup_date || item.pickup_time) && (
                          <div className="text-xs text-muted-foreground pl-4">
                            {item.pickup_date && format(parseISO(item.pickup_date), 'MMM d, yyyy')}
                            {item.pickup_date && item.pickup_time && ' at '}
                            {item.pickup_time}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              
              {/* Package (if selected) */}
              {selectedPackage && (
                <div className="flex justify-between text-sm font-medium text-purple-600">
                  <span>Package: {selectedPackage.name}</span>
                  <span>{formatCurrency(selectedPackage.base_price)}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              {/* Service Subtotal */}
              {serviceTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Services Subtotal</span>
                  <span>{formatCurrency(serviceTotal)}</span>
                </div>
              )}
              
              {/* Package Subtotal */}
              {packageTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Package Subtotal</span>
                  <span>{formatCurrency(packageTotal)}</span>
                </div>
              )}
              
              {/* Base Total */}
              <div className="flex justify-between text-sm font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(baseTotal)}</span>
              </div>
              
              {/* Time-based Service Adjustments */}
              {serviceTimeAdjustment !== 0 && (
                <div className="flex justify-between text-sm font-medium text-amber-600">
                  <span>Service Time Adjustments</span>
                  <span>{serviceTimeAdjustment > 0 ? '+' : ''}{formatCurrency(serviceTimeAdjustment)}</span>
                </div>
              )}
              
              {/* Promotion Discount (if applied) */}
              {promotionDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promotion Discount ({selectedPromotion?.name})</span>
                  <span>-{formatCurrency(promotionDiscount)}</span>
                </div>
              )}
              
              {/* Regular Discount (if applied) */}
              {regularDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Regular Discount ({discount_percentage || 0}%)</span>
                  <span>-{formatCurrency(regularDiscountAmount)}</span>
                </div>
              )}
              
              <Separator className="my-1" />
              
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {(tax_percentage || 0) > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax ({tax_percentage || 0}%)</span>
                  <span>+{formatCurrency(taxAmount)}</span>
                </div>
              )}
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </>
          ) : (
            // Show message when no services or packages selected
            <div className="text-center py-4 text-muted-foreground">
              <p>No services or packages to display pricing</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 