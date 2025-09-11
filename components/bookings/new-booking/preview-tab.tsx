'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, User, MapPin, Car, Plane, FileText, DollarSign, RefreshCw
} from 'lucide-react'
import { Booking } from '@/types/bookings'
import { VehicleWithCategory } from '@/app/actions/services'
import { useDrivers } from '@/lib/hooks/use-drivers'
import { PaymentOptions } from '@/components/bookings/payment-options'

interface PreviewTabProps {
  formData: Partial<Booking & { 
    flight_number?: string;
    terminal?: string;
    driver_id?: string | null;
    selectedVehicle?: VehicleWithCategory;
    upgradeDowngradeData?: any;
    upgradeDowngradeConfirmed?: boolean;
    upgradeDowngradeAction?: 'upgrade' | 'downgrade';
    upgradeDowngradeCouponCode?: string;
    tax_percentage?: number;
    discount_percentage?: number;
    coupon_code?: string;
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
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  refundCouponDiscount?: number
  setRefundCouponDiscount?: (amount: number) => void
}

export function PreviewTab({
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
}: PreviewTabProps) {
  const { drivers: availableDrivers } = useDrivers()
  
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
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <h2 className="text-lg font-semibold flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Booking Preview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review all information before creating the booking
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="mr-2 h-5 w-5" />
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-sm">{formData.customer_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{formData.customer_email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                <p className="text-sm">{formData.customer_phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge className={`text-sm px-3 py-1 ${getStatusColor(formData.status || 'pending')}`}>
                  {(formData.status || 'pending').charAt(0).toUpperCase() + (formData.status || 'pending').slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Service Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Service Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Service Name</Label>
                <p className="text-sm">{formData.service_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                <p className="text-sm">
                  {formData.date && formData.time 
                    ? `${new Date(formData.date).toLocaleDateString()} at ${formData.time}`
                    : 'Not provided'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Pickup Location</Label>
                <p className="text-sm">{formData.pickup_location || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Dropoff Location</Label>
                <p className="text-sm">{formData.dropoff_location || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Distance</Label>
                <p className="text-sm">{formData.distance || 'Not calculated'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                <p className="text-sm">{formData.duration || 'Not calculated'}</p>
              </div>
              {formData.number_of_passengers && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Passengers</Label>
                  <p className="text-sm">{formData.number_of_passengers}</p>
                </div>
              )}
              {formData.number_of_bags && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bags</Label>
                  <p className="text-sm">{formData.number_of_bags}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Vehicle & Driver Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Vehicle & Driver
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Selected Vehicle</Label>
                <p className="text-sm">
                  {formData.selectedVehicle 
                    ? `${formData.selectedVehicle.brand} ${formData.selectedVehicle.model} (${formData.selectedVehicle.plate_number})`
                    : 'Not selected'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Driver</Label>
                <p className="text-sm">
                  {formData.driver_id 
                    ? availableDrivers.find(d => d.id === formData.driver_id)?.full_name || 'Selected'
                    : 'Not assigned'
                  }
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Flight Information */}
          {(formData.flight_number || formData.terminal) && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Plane className="mr-2 h-5 w-5" />
                  Flight Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Flight Number</Label>
                    <p className="text-sm">{formData.flight_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Terminal</Label>
                    <p className="text-sm">{formData.terminal || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {formData.notes && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Notes & Instructions
                </h3>
                <p className="text-sm bg-muted p-3 rounded-md">{formData.notes}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Pricing Configuration */}
          {handleInputChange && (
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
          )}

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
      </Card>

    </div>
  )
}
