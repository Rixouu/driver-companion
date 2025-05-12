"use client";

import { useI18n } from '@/lib/i18n/context';
import { CreditCard, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuotationItem } from '@/types/quotations';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  calculateTaxAmount,
  quotation_items = []
}: PriceDetailsProps) {
  const { t } = useI18n();
  
  console.log('[PRICE DETAILS] Rendering with items:', quotation_items?.length || 0);
  if (quotation_items && quotation_items.length > 0) {
    console.log('[PRICE DETAILS] First item:', quotation_items[0]);
  }
  
  const hasMultipleItems = quotation_items && quotation_items.length > 0;
  
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
        <div className="flex justify-between font-medium mb-2">
          <div>Description</div>
          <div>Price</div>
        </div>
        
        {hasMultipleItems ? (
          <>
            {quotation_items.map((item, index) => (
              <div key={item.id || index} className={`flex justify-between py-2 px-2 mb-2 ${index !== quotation_items.length - 1 ? 'border-b' : ''} rounded-sm hover:bg-muted/20 transition-colors`}>
                <div className="text-sm flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "text-xs py-0.5 px-1.5 rounded-sm font-medium",
                      item.service_type_name?.toLowerCase().includes('charter') 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    )}>
                      {item.service_type_name?.toLowerCase().includes('charter') ? 'Charter' : 'Transfer'}
                    </div>
                    <span className="font-medium">{item.description}</span>
                  </div>
                  
                  {item.is_service_item && (
                    <div className="text-xs text-muted-foreground mt-1 grid grid-cols-[70px_1fr] gap-y-1">
                      <span>Vehicle:</span>
                      <span>{item.vehicle_type}</span>
                      
                      {item.service_type_name?.toLowerCase().includes('charter') ? (
                        <>
                          <span>Service:</span>
                          <span>{item.service_days || 1} day(s) × {item.hours_per_day || 1} hour(s)/day</span>
                        </>
                      ) : (
                        <>
                          <span>Service:</span>
                          <span>{item.duration_hours || 1} hour(s)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="font-medium text-right">
                  {formatCurrency(item.total_price || item.unit_price)}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <div className="text-sm grid grid-cols-[100px_1fr]">
                <span>Vehicle:</span>
                <span>{vehicle_type}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-sm">
                Hourly Rate ({hours_per_day || duration_hours || 8} hours / day)
              </div>
              <div className="font-medium">
                {formatCurrency(typeof amount === 'string' ? parseFloat(amount) / service_days : amount / service_days)}
              </div>
            </div>
            
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
          </>
        )}
        
        <div className="flex justify-between pt-2 border-t">
          <div className="font-medium">
            Base Amount
          </div>
          <div className="font-medium">
            {formatCurrency(amount)}
          </div>
        </div>
        
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
        
        <div className="flex justify-between font-semibold pt-2 border-t">
          <div>
            Total Amount
          </div>
          <div>
            {formatCurrency(total_amount)}
          </div>
        </div>
      </div>
    </div>
  );
} 