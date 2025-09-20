/**
 * Utility functions for calculating quotation totals
 */

export interface QuotationItem {
  id: string;
  service_type_id: string;
  service_type_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vehicle_type?: string;
  vehicle_category?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  pickup_date?: string;
  pickup_time?: string;
  time_based_adjustment?: string;
  time_based_rule_name?: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  base_price: number;
  description?: string;
}

export interface PricingPromotion {
  id: string;
  name: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description?: string;
}

export interface QuotationTotals {
  serviceBaseTotal: number;
  serviceTimeAdjustment: number;
  serviceTotal: number;
  packageTotal: number;
  baseTotal: number;
  promotionDiscount: number;
  regularDiscount: number;
  totalDiscount: number;
  subtotal: number;
  taxAmount: number;
  finalTotal: number;
}

/**
 * Calculate quotation totals including services, packages, promotions, and tax
 */
export function calculateQuotationTotals(
  quotationItems: QuotationItem[],
  packages: PricingPackage[] = [],
  discountPercentage: number = 0,
  taxPercentage: number = 0,
  promotionDiscount: number = 0,
  serviceType?: string
): QuotationTotals {
  let serviceBaseTotal = 0;
  let serviceTimeAdjustment = 0;
  
  if (quotationItems && quotationItems.length > 0) {
    quotationItems.forEach((item: QuotationItem) => {
      // For Charter Services, calculate as unit_price × service_days
      let itemBasePrice;
      if (item.service_type_name?.toLowerCase().includes('charter')) {
        itemBasePrice = item.unit_price * (item.service_days || 1);
      } else {
        itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
      }
      serviceBaseTotal += itemBasePrice;
      
      if (item.time_based_adjustment) {
        const timeAdjustment = itemBasePrice * (parseFloat(item.time_based_adjustment) / 100);
        serviceTimeAdjustment += timeAdjustment;
      }
    });
  }
  
  const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
  const packageTotal = packages.reduce((total, pkg) => total + pkg.base_price, 0);
  const baseTotal = serviceTotal + packageTotal;
  
  const regularDiscount = baseTotal * (discountPercentage / 100);
  const totalDiscount = promotionDiscount + regularDiscount;
  
  const subtotal = Math.max(0, baseTotal - totalDiscount);
  const taxAmount = subtotal * (taxPercentage / 100);
  const finalTotal = subtotal + taxAmount;
  
  return {
    serviceBaseTotal,
    serviceTimeAdjustment,
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
}
