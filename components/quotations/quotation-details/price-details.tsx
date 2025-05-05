"use client";

import { useI18n } from '@/lib/i18n/context';
import { CreditCard, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export function PriceDetails({
  amount,
  discount_percentage = 0,
  tax_percentage = 0,
  total_amount,
  vehicle_type = 'Mercedes Benz V Class',
  hours_per_day,
  duration_hours,
  service_days = 1,
  selectedCurrency,
  onCurrencyChange,
  formatCurrency,
  calculateDiscountAmount,
  calculateSubtotalAmount,
  calculateTaxAmount
}: PriceDetailsProps) {
  const { t } = useI18n();
  
  return (
    <div data-price-details>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">{t('quotations.details.priceDetails') || 'Price Details'}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={selectedCurrency}
            onValueChange={onCurrencyChange}
          >
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
      
      <div className="rounded-md bg-muted/30 border p-4 space-y-3">
        {/* Headers */}
        <div className="flex justify-between font-medium mb-2">
          <div>Description</div>
          <div>Price</div>
        </div>
        
        {/* Vehicle Type */}
        <div className="flex justify-between">
          <div className="text-sm">
            {vehicle_type}
          </div>
          <div></div>
        </div>
        
        {/* Hourly Rate */}
        <div className="flex justify-between">
          <div className="text-sm">
            Hourly Rate ({hours_per_day || duration_hours || 8} hours / day)
          </div>
          <div className="font-medium">
            {formatCurrency(typeof amount === 'string' ? parseFloat(amount) / service_days : amount / service_days)}
          </div>
        </div>
        
        {/* Number of Days */}
        {service_days > 1 && (
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Number of Days
            </div>
            <div>
              × {service_days}
            </div>
          </div>
        )}
        
        {/* Base Amount */}
        <div className="flex justify-between pt-2 border-t">
          <div className="font-medium">
            Base Amount
          </div>
          <div className="font-medium">
            {formatCurrency(amount)}
          </div>
        </div>
        
        {/* Discount if available */}
        {Number(discount_percentage) > 0 && (
          <div className="flex justify-between text-red-500">
            <div>
              Discount ({discount_percentage}%)
            </div>
            <div>
              -{formatCurrency(calculateDiscountAmount(amount, discount_percentage))}
            </div>
          </div>
        )}
        
        {/* Subtotal if we have discount or tax */}
        {(Number(discount_percentage) > 0 || Number(tax_percentage) > 0) && (
          <div className="flex justify-between pt-2 border-t">
            <div className="font-medium">
              Subtotal
            </div>
            <div className="font-medium">
              {formatCurrency(calculateSubtotalAmount(amount, discount_percentage))}
            </div>
          </div>
        )}
        
        {/* Tax if available */}
        {Number(tax_percentage) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <div>
              Tax ({tax_percentage}%)
            </div>
            <div>
              +{formatCurrency(calculateTaxAmount(
                calculateSubtotalAmount(amount, discount_percentage),
                tax_percentage
              ))}
            </div>
          </div>
        )}
        
        {/* Total Amount */}
        <div className="flex justify-between pt-2 border-t">
          <div className="font-semibold">
            Total Amount
          </div>
          <div className="font-semibold">
            {formatCurrency(total_amount)}
          </div>
        </div>
      </div>
    </div>
  );
} 