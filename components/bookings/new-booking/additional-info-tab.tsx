'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { CheckCircle, User, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react'
import { PaymentOptions } from '@/components/bookings/payment-options'
import { Booking } from '@/types/bookings'
import { Driver } from '@/types/drivers'
import { useDrivers } from '@/lib/hooks/use-drivers'
import { Skeleton } from '@/components/ui/skeleton'

interface AdditionalInfoTabProps {
  formData: Partial<Booking & { 
    flight_number?: string;
    terminal?: string;
    driver_id?: string | null;
    upgradeDowngradeData?: any;
    upgradeDowngradeCouponCode?: string;
    selectedVehicle?: any;
    tax_percentage?: number;
    discount_percentage?: number;
    coupon_code?: string;
    refund_coupon_code?: string;
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
  handleSelectChange: (field: string, value: string) => void
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
  handleSelectChange,
  refundCouponDiscount = 0,
  setRefundCouponDiscount
}: AdditionalInfoTabProps) {
  const { drivers: availableDrivers, isLoading: driversLoading, error: driversError, refetch: refetchDrivers } = useDrivers()
  
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

  return (
    <div className="space-y-6">

      {/* Driver Selection */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                Driver Assignment
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {driversLoading ? 'Loading drivers...' : `Choose from ${availableDrivers.length} available drivers`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchDrivers}
              disabled={driversLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${driversLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {driversError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">{driversError}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Select Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="driver_id">Select Driver (Optional)</Label>
                <Select 
                  value={formData.driver_id || 'none'} 
                  onValueChange={(value) => handleSelectChange('driver_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No driver assigned</SelectItem>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Minimal Drivers Grid */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Drivers ({availableDrivers.length})</Label>
                  {formData.driver_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectChange('driver_id', 'none')}
                      className="text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {driversLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg bg-card">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No drivers available</p>
                    <p className="text-xs mt-1">Add drivers in the Drivers section</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableDrivers.map((driver) => (
                      <div 
                        key={driver.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all group ${
                          formData.driver_id === driver.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' 
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleSelectChange('driver_id', driver.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">{driver.full_name}</h3>
                          {formData.driver_id === driver.id && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        {driver.phone && (
                          <p className="text-xs text-muted-foreground truncate">{driver.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Pricing Configuration */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <h2 className="text-lg font-semibold flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Pricing Configuration
          </h2>
        </div>
        
        <div className="p-6">
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
          
          {/* Coupon Code Field */}
          <div className="mt-4">
            <Label htmlFor="coupon_code">Coupon Code</Label>
            <div className="flex gap-2 mt-2">
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
            <p className="text-xs text-muted-foreground mt-1">Enter a valid coupon code to apply discounts</p>
          </div>

          {/* Refund Coupon Code Field */}
          <div className="mt-4">
            <Label htmlFor="refund_coupon_code">Refund Coupon Code</Label>
            <div className="flex gap-2 mt-2">
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
            <p className="text-xs text-muted-foreground mt-1">Enter a valid refund coupon code to deduct from subtotal</p>
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
