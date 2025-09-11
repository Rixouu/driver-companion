'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'
import { PaymentOptions } from '@/components/bookings/payment-options'
import { Booking } from '@/types/bookings'

interface AdditionalInfoTabProps {
  formData: Partial<Booking & { 
    flight_number?: string;
    terminal?: string;
    upgradeDowngradeData?: any;
    upgradeDowngradeCouponCode?: string;
    selectedVehicle?: any;
    tax_percentage?: number;
    discount_percentage?: number;
    coupon_code?: string;
    refund_coupon_code?: string;
    isFreeUpgrade?: boolean;
  }>
  calculatedPrice: {
    baseAmount: number
    timeBasedAdjustment: number
    adjustedBaseAmount: number
    appliedTimeBasedRule: {
      name: string
      adjustment_percentage: number
      description?: string | null
      start_time: string
      end_time: string
      days_of_week: string[] | null
    } | null
    discountAmount: number
    regularDiscountAmount?: number
    couponDiscountAmount?: number
    taxAmount: number
    totalAmount: number
  }
  couponDiscount: number
  paymentOptions: {
    requiresPayment: boolean
    paymentMethod: 'client_pay' | 'send_payment_link'
    customPaymentName: string
  }
  setPaymentOptions: React.Dispatch<React.SetStateAction<any>>
  getStatusColor: (status: string) => string
  onPaymentAction?: (action: 'upgrade-only' | 'full-quote', emailData?: any) => void
  isProcessingPayment?: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  refundCouponDiscount?: number
  setRefundCouponDiscount?: (amount: number) => void
}

export function AdditionalInfoTab({ 
  formData, 
  calculatedPrice,
  couponDiscount,
  paymentOptions,
  setPaymentOptions,
  getStatusColor,
  onPaymentAction,
  isProcessingPayment = false,
  handleInputChange, 
  refundCouponDiscount = 0,
  setRefundCouponDiscount
}: AdditionalInfoTabProps) {
  
  const handleRefundCouponValidation = async () => {
    if (!formData.refund_coupon_code || !setRefundCouponDiscount) return

    try {
      const response = await fetch('/api/bookings/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: formData.refund_coupon_code,
          bookingId: formData.id
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        // Set the refund amount to deduct from subtotal
        setRefundCouponDiscount(Math.abs(formData.upgradeDowngradeData?.priceDifference || 0));
        console.log('Refund coupon validated:', result);
      } else {
        console.error('Refund coupon validation failed:', result.message);
        setRefundCouponDiscount(0);
      }
    } catch (error) {
      console.error('Error validating refund coupon:', error);
      setRefundCouponDiscount(0);
    }
  }

  // Calculate pricing breakdown similar to Ride Summary
  const calculatePricingBreakdown = () => {
    const baseAmount = formData.upgradeDowngradeData ? 
      (formData.isFreeUpgrade ? 
        formData.upgradeDowngradeData.currentPrice : 
        formData.upgradeDowngradeData.newPrice
      ) :
      (calculatedPrice.adjustedBaseAmount || calculatedPrice.baseAmount);
    
    const timeAdjustment = calculatedPrice.timeBasedAdjustment || 0;
    const regularDiscount = calculatedPrice.regularDiscountAmount || 0;
    const couponDiscount = calculatedPrice.couponDiscountAmount || 0;
    const refundDiscount = refundCouponDiscount || 0;
    
    const subtotal = baseAmount + timeAdjustment - regularDiscount - couponDiscount - refundDiscount;
    const taxAmount = Math.round(subtotal * (formData.tax_percentage || 10) / 100);
    const total = subtotal + taxAmount;
    
    return {
      baseAmount,
      timeAdjustment,
      regularDiscount,
      couponDiscount,
      refundDiscount,
      subtotal: Math.max(0, subtotal),
      taxAmount,
      total: Math.max(0, total)
    };
  };

  const pricing = calculatePricingBreakdown();

  return (
    <div className="space-y-6">
      {/* Pricing Configuration & Breakdown */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <h2 className="text-lg font-semibold flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Pricing Configuration & Breakdown
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
              <Input
                id="tax_percentage"
                name="tax_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.tax_percentage || 10}
                onChange={handleInputChange}
                placeholder="10"
                className="transition-all focus:ring-2 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">Default: 10% (Japanese tax rate)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
              <Input
                id="discount_percentage"
                name="discount_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discount_percentage || 0}
                onChange={handleInputChange}
                placeholder="0"
                className="transition-all focus:ring-2 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">Optional discount to apply</p>
            </div>
          </div>
          
          {/* Coupon Code Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon_code"
                  name="coupon_code"
                  value={formData.coupon_code || ''}
                  onChange={handleInputChange}
                  placeholder="Enter coupon code"
                  className="flex-1 transition-all focus:ring-2 focus:border-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement coupon validation
                    console.log('Validate coupon:', formData.coupon_code);
                  }}
                  disabled={!formData.coupon_code}
                  className="px-4"
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter a valid coupon code to apply discounts</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund_coupon_code">Refund Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  id="refund_coupon_code"
                  name="refund_coupon_code"
                  value={formData.refund_coupon_code || ''}
                  onChange={handleInputChange}
                  placeholder="Enter refund coupon code"
                  className="flex-1 transition-all focus:ring-2 focus:border-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefundCouponValidation}
                  disabled={!formData.refund_coupon_code}
                  className="px-4"
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter a valid refund coupon code to deduct from subtotal</p>
            </div>
          </div>

          <Separator />

          {/* Live Price Breakdown */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Live Price Breakdown</h3>
            
            <div className="space-y-2 text-sm">
              {/* Previous Service - only show if there's an upgrade/downgrade */}
              {formData.upgradeDowngradeData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previous Service</span>
                  <span className="text-muted-foreground line-through">¥{formData.upgradeDowngradeData.currentPrice.toLocaleString()}</span>
                </div>
              )}

              {/* Upgrade/Downgrade Amount - only show if there's an upgrade/downgrade */}
              {formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formData.upgradeDowngradeData.priceDifference > 0 ? 'Upgrade Amount' : 'Downgrade Amount'}
                  </span>
                  <span className={formData.upgradeDowngradeData.priceDifference > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {formData.isFreeUpgrade ? 'FREE' : 
                      `${formData.upgradeDowngradeData.priceDifference > 0 ? '+' : ''}¥${formData.upgradeDowngradeData.priceDifference.toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* New Service Price */}
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">New Service Price</span>
                <span>¥{pricing.baseAmount.toLocaleString()}</span>
              </div>

              {/* Time-based adjustment - only show if > 0 */}
              {pricing.timeAdjustment > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span className="text-muted-foreground">
                    {calculatedPrice.appliedTimeBasedRule?.name || 'Time-based adjustment'}
                    {calculatedPrice.appliedTimeBasedRule?.start_time && calculatedPrice.appliedTimeBasedRule?.end_time && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({calculatedPrice.appliedTimeBasedRule.start_time.split(':').slice(0, 2).join(':')}-{calculatedPrice.appliedTimeBasedRule.end_time.split(':').slice(0, 2).join(':')})
                      </span>
                    )}
                  </span>
                  <span>+¥{pricing.timeAdjustment.toLocaleString()}</span>
                </div>
              )}
              
              {/* Discount (30%) - only show if > 0 */}
              {pricing.regularDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-muted-foreground">Discount (30%)</span>
                  <span>-¥{pricing.regularDiscount.toLocaleString()}</span>
                </div>
              )}
              
              {/* Coupon Discount - only show if > 0 */}
              {pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span className="text-muted-foreground">Coupon Discount</span>
                  <span>-¥{pricing.couponDiscount.toLocaleString()}</span>
                </div>
              )}

              {/* Refund Code - only show if > 0 */}
              {pricing.refundDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Code</span>
                  <span className="text-green-600">-¥{pricing.refundDiscount.toLocaleString()}</span>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Subtotal</span>
                <span>¥{pricing.subtotal.toLocaleString()}</span>
              </div>
              
              {/* Tax - only show if > 0 */}
              {pricing.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({formData.tax_percentage || 10}%)</span>
                  <span>¥{pricing.taxAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">¥{pricing.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Options */}
      {onPaymentAction && (
        <PaymentOptions
          formData={formData}
          calculatedPrice={calculatedPrice}
          onPaymentAction={onPaymentAction}
          isLoading={isProcessingPayment}
        />
      )}

    </div>
  )
}
