"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Globe, Clock, Timer, Package, Car } from 'lucide-react';
import { QuotationItem } from '@/types/quotations';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';

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
  selectedCurrency,
  onCurrencyChange,
  formatCurrency,
  quotation_items = [],

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
        // For Charter Services, calculate as unit_price × service_days
        let itemBasePrice;
        if (item.service_type_name?.toLowerCase().includes('charter')) {
          itemBasePrice = (item.unit_price || 0) * (item.service_days || 1);
        } else {
          itemBasePrice = item.total_price || item.unit_price || 0;
        }
        
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
    <div className="space-y-6">
      {/* Selected Services Section */}
      {quotation_items.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Selected Services ({quotation_items.length})</CardTitle>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {formatCurrency(serviceTotal + serviceTimeAdjustment)}
              </Badge>
            </div>
            <CardDescription>Detailed breakdown of your services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotation_items.map((item, index) => {
              // Calculate time-based adjustment for this specific item
              // For Charter Services, calculate as unit_price × service_days
              let baseItemPrice;
              if (item.service_type_name?.toLowerCase().includes('charter')) {
                baseItemPrice = (item.unit_price || 0) * (item.service_days || 1);
              } else {
                baseItemPrice = (item.unit_price || 0) * (item.quantity || 1) * (item.service_days || 1);
              }
              
              // Check if this item has time-based adjustments
              let itemTimeAdjustment = 0;
              let applicableRules: TimeBasedRule[] = [];
              
              if (item.pickup_date && item.pickup_time && appliedTimeBasedRules.length > 0) {
                const itemDate = new Date(item.pickup_date);
                const [hours, minutes] = item.pickup_time.split(':').map(Number);
                itemDate.setHours(hours, minutes, 0, 0);
                
                const dayOfWeek = itemDate.getDay();
                const timeOfDay = hours * 60 + minutes;
                
                applicableRules = appliedTimeBasedRules.filter(rule => {
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
                <Card key={index} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            item.service_type_name?.toLowerCase().includes('package') ? "secondary" : 
                            item.service_type_name?.toLowerCase().includes('charter') ? "default" : "outline"
                          } className="text-xs">
                            {item.service_type_name?.toLowerCase().includes('package') ? 'Package' : 
                             item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                          </Badge>
                          <span className="font-medium">{item.description}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                          <span><strong>Vehicle:</strong> {item.vehicle_type}</span>
                          {!item.service_type_name?.toLowerCase().includes('package') && (
                            <span>
                              <strong>Duration:</strong> {
                                item.service_type_name?.toLowerCase().includes('charter') 
                                  ? `${item.service_days || 1} day(s) × ${item.hours_per_day || 8}h`
                                  : `${item.duration_hours || 1} hour(s)`
                              }
                            </span>
                          )}
                          {item.pickup_date && (
                            <span><strong>Date:</strong> {formatDateDDMMYYYY(item.pickup_date)}</span>
                          )}
                          {item.pickup_time && (
                            <span><strong>Time:</strong> {item.pickup_time}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(item.total_price || item.unit_price)}</div>
                      </div>
                    </div>
                    
                    {/* Time-based adjustments matching pricing-step.tsx */}
                    {itemTimeAdjustment !== 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-orange-700 dark:text-orange-300">
                            Time-based adjustment ({applicableRules.length > 0 ? (applicableRules[0].adjustment_percentage > 0 ? '+' : '') + applicableRules[0].adjustment_percentage : '0'}%)
                            {applicableRules.length > 0 && applicableRules[0].name && (
                              <span className="text-muted-foreground ml-1">- {applicableRules[0].name}</span>
                            )}
                          </span>
                          <div className="text-right">
                            <div className={cn(
                              "font-bold text-sm",
                              itemTimeAdjustment > 0 ? "text-orange-600" : "text-green-600"
                            )}>
                              {itemTimeAdjustment > 0 ? '+' : ''}{formatCurrency(Math.abs(itemTimeAdjustment))}
                            </div>
                            <div className={cn(
                              "text-xs font-medium",
                              itemTimeAdjustment > 0 ? "text-orange-600" : "text-green-600"
                            )}>
                              ({applicableRules.length > 0 ? (applicableRules[0].adjustment_percentage > 0 ? '+' : '') + applicableRules[0].adjustment_percentage : '0'}%) - {itemTimeAdjustment > 0 ? 'Overtime' : 'Discount'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Package Section - Matching pricing-step.tsx */}
      {selectedPackage && (
        <Card className="border border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Package</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                {selectedPackage.package_type || 'Bundle'}
              </Badge>
            </div>
            <CardDescription>Special package offer</CardDescription>
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
            
            {/* Package included services matching pricing-step.tsx */}
            {selectedPackage.items && selectedPackage.items.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Included Services:</div>
                
                <div className="space-y-2">
                  {selectedPackage.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-purple-50/50 dark:bg-purple-900/10 rounded border border-purple-100 dark:border-purple-800">
                      <div className="flex-1">
                        <div className="font-medium text-sm">• {item.name}</div>
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
              <CardTitle className="text-base font-medium">Pricing Summary</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Detailed breakdown
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
            {/* Service Subtotal */}
            {serviceTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Services Base Total</span>
                <span>{formatCurrency(serviceTotal)}</span>
              </div>
            )}
            
            {/* Time-based Service Adjustments */}
            {serviceTimeAdjustment !== 0 && (
              <div className="flex justify-between text-sm font-medium text-amber-600">
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Time-based Adjustments
                </span>
                <span>{serviceTimeAdjustment > 0 ? '+' : ''}{formatCurrency(serviceTimeAdjustment)}</span>
              </div>
            )}
            
            {/* Package Subtotal */}
            {packageTotal > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span>Package Total</span>
                <span>{formatCurrency(packageTotal)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            {/* Base Total */}
            <div className="flex justify-between text-sm font-medium">
              <span>Total Amount</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
            
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 