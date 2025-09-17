'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, CreditCard, Gift, AlertTriangle, CheckCircle } from 'lucide-react'
import { VehicleWithCategory } from '@/app/actions/services'

interface UpgradeDowngradeModalProps {
  isOpen: boolean
  onClose: () => void
  pricingData: {
    currentPrice: number
    newPrice: number
    priceDifference: number
    currentCategory?: string
    newCategory?: string
    currency: string
    isEstimated?: boolean
  }
  currentVehicle: VehicleWithCategory | null
  newVehicle: VehicleWithCategory | null
  onConfirm: (action: 'upgrade' | 'downgrade', couponCode?: string) => void
  isLoading?: boolean
  bookingId?: string
}

export function UpgradeDowngradeModal({
  isOpen,
  onClose,
  pricingData,
  currentVehicle,
  newVehicle,
  onConfirm,
  isLoading = false,
  bookingId
}: UpgradeDowngradeModalProps) {
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<boolean | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [isFreeUpgrade, setIsFreeUpgrade] = useState(false)

  const isUpgrade = pricingData.priceDifference > 0
  const isDowngrade = pricingData.priceDifference < 0
  const isSamePrice = pricingData.priceDifference === 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: pricingData.currency || 'JPY'
    }).format(amount)
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return

    setValidatingCoupon(true)
    try {
      const response = await fetch('/api/bookings/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          bookingId: bookingId
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.valid) {
        setCouponValid(true);
        console.log('Coupon validation result:', result);
      } else {
        setCouponValid(false);
        console.error('Coupon validation failed:', result.message);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponValid(false);
    } finally {
      setValidatingCoupon(false);
    }
  }

  const handleConfirm = () => {
    if (isUpgrade) {
      onConfirm('upgrade', isFreeUpgrade ? 'free' : undefined)
    } else if (isDowngrade) {
      onConfirm('downgrade', couponCode || undefined)
    } else if (isSamePrice) {
      // For same price changes, we need to call the onConfirm with a special action
      // Since the interface expects 'upgrade' | 'downgrade', we'll use 'upgrade' with a special flag
      onConfirm('upgrade', 'same-price')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade && <ArrowUp className="h-5 w-5 text-orange-500" />}
            {isDowngrade && <ArrowDown className="h-5 w-5 text-green-500" />}
            {isSamePrice && <CheckCircle className="h-5 w-5 text-blue-500" />}
            Vehicle {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'} Required
          </DialogTitle>
          <DialogDescription>
            {isUpgrade 
              ? 'You are upgrading to a higher category vehicle. Additional payment is required.'
              : isDowngrade 
              ? 'You are downgrading to a lower category vehicle. A refund coupon will be generated.'
              : 'You are changing to a vehicle with the same price category.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Vehicle */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Current</Badge>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {pricingData.currentCategory}
                    </Badge>
                  </div>
                  <h4 className="font-semibold">
                    {currentVehicle?.brand} {currentVehicle?.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentVehicle?.name}
                  </p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {formatCurrency(pricingData.currentPrice)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* New Vehicle */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">New</Badge>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {pricingData.newCategory}
                    </Badge>
                  </div>
                  <h4 className="font-semibold">
                    {newVehicle?.brand} {newVehicle?.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {newVehicle?.name}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(pricingData.newPrice)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Difference */}
          <Card className={isUpgrade ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' : isDowngrade ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUpgrade && <CreditCard className="h-5 w-5 text-orange-500 dark:text-orange-400" />}
                  {isDowngrade && <Gift className="h-5 w-5 text-green-500 dark:text-green-400" />}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {isUpgrade ? 'Additional Payment Required:' : isDowngrade ? 'Refund Amount:' : 'Price Difference:'}
                  </span>
                  {pricingData.isEstimated && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Calculating...
                    </span>
                  )}
                </div>
                <span className={`text-xl font-bold ${isUpgrade ? 'text-orange-600 dark:text-orange-400' : isDowngrade ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {pricingData.isEstimated ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      {isUpgrade ? '+' : isDowngrade ? '-' : ''}{formatCurrency(Math.abs(pricingData.priceDifference))}
                    </span>
                  ) : (
                    `${isUpgrade ? '+' : isDowngrade ? '-' : ''}${formatCurrency(Math.abs(pricingData.priceDifference))}`
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Free Upgrade Option for Upgrades */}
          {isUpgrade && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="free-upgrade"
                  checked={isFreeUpgrade}
                  onChange={(e) => setIsFreeUpgrade(e.target.checked)}
                  className="rounded"
                  aria-label="Apply as free upgrade"
                />
                <Label htmlFor="free-upgrade" className="text-sm font-medium">
                  Apply as free upgrade (no additional charge)
                </Label>
              </div>
              {isFreeUpgrade && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>This upgrade will be applied at no additional cost to the customer</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Important Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Important Information:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {isUpgrade && (
                <>
                  <li>• Additional payment will be required to confirm this upgrade</li>
                  <li>• You will receive a payment link via email</li>
                  <li>• The upgrade will be confirmed once payment is completed</li>
                </>
              )}
              {isDowngrade && (
                <>
                  <li>• A refund coupon will be generated for the price difference</li>
                  <li>• The coupon can be used for future bookings</li>
                  <li>• Coupon is valid for 30 days from today</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading || pricingData.isEstimated}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || pricingData.isEstimated}
            className={`text-white ${isUpgrade ? 'bg-orange-600 hover:bg-orange-700' : isDowngrade ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Processing...' : pricingData.isEstimated ? 'Calculating...' : isUpgrade ? 'Proceed with Upgrade' : isDowngrade ? 'Proceed with Downgrade' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
