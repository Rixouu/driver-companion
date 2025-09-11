'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Gift, 
  ArrowUp, 
  ArrowDown, 
  Send, 
  Mail
} from 'lucide-react'
import { PaymentModal } from '@/components/bookings/payment-modal'

interface PaymentOptionsProps {
  formData: any
  calculatedPrice: any
  onPaymentAction: (action: 'upgrade-only' | 'full-quote', emailData?: any) => void
  isLoading?: boolean
}

export function PaymentOptions({ 
  formData, 
  calculatedPrice, 
  onPaymentAction, 
  isLoading = false 
}: PaymentOptionsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState<'upgrade-only' | 'full-quote' | null>(null)

  const hasUpgradeDowngrade = formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0
  const upgradeAmount = formData.upgradeDowngradeData?.priceDifference || 0
  
  // Calculate full quote amount correctly
  const fullQuoteAmount = formData.upgradeDowngradeData ? 
    (formData.isFreeUpgrade ? 
      (formData.upgradeDowngradeData.currentPrice + Math.round(formData.upgradeDowngradeData.currentPrice * (formData.tax_percentage || 10) / 100)) :
      (formData.upgradeDowngradeData.newPrice + Math.round(formData.upgradeDowngradeData.newPrice * (formData.tax_percentage || 10) / 100))
    ) :
    calculatedPrice.totalAmount

  const handlePaymentClick = (type: 'upgrade-only' | 'full-quote') => {
    setSelectedPaymentType(type)
    setShowPaymentModal(true)
  }

  const handlePaymentAction = (action: 'upgrade-only' | 'full-quote', emailData?: any) => {
    onPaymentAction(action, emailData)
    setShowPaymentModal(false)
    setSelectedPaymentType(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Options
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Vehicle Upgrade/Downgrade Alert */}
          {hasUpgradeDowngrade && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {upgradeAmount > 0 ? (
                  <ArrowUp className="h-4 w-4 text-orange-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-green-500" />
                )}
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  Vehicle {upgradeAmount > 0 ? 'Upgrade' : 'Downgrade'} Detected
                </span>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {upgradeAmount > 0 
                  ? `Additional payment required: ¥${upgradeAmount.toLocaleString()}`
                  : `Refund amount: ¥${Math.abs(upgradeAmount).toLocaleString()}`
                }
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upgrade/Downgrade Only Payment */}
            {hasUpgradeDowngrade && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {upgradeAmount > 0 ? (
                      <CreditCard className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Gift className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">
                      {upgradeAmount > 0 ? 'Upgrade Payment Only' : 'Downgrade Refund Only'}
                    </span>
                  </div>
                  <Badge variant="outline">
                    ¥{Math.abs(upgradeAmount).toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {upgradeAmount > 0 
                    ? 'Send payment link for the upgrade amount only'
                    : 'Generate refund coupon for the downgrade amount'
                  }
                </p>
                <Button 
                  onClick={() => handlePaymentClick('upgrade-only')}
                  disabled={isLoading}
                  className="w-full"
                  variant={upgradeAmount > 0 ? 'default' : 'secondary'}
                >
                  {upgradeAmount > 0 ? 'Send Upgrade Payment' : 'Generate Refund Coupon'}
                </Button>
              </div>
            )}

            {/* Full Quote Payment */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Full Quote Payment</span>
                </div>
                <Badge variant="outline">
                  ¥{fullQuoteAmount.toLocaleString()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Send complete quote with all pricing including {hasUpgradeDowngrade ? 'upgrade/downgrade' : 'base service'}
              </p>
              <Button 
                onClick={() => handlePaymentClick('full-quote')}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                Send Full Quote
              </Button>
            </div>
          </div>

          {/* Pricing Summary */}
          <Separator />
          <div className="space-y-2 text-sm">
            {/* Previous Service - only show if there's an upgrade/downgrade */}
            {formData.upgradeDowngradeData && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Service</span>
                <span className="text-muted-foreground line-through">¥{formData.upgradeDowngradeData.currentPrice.toLocaleString()}</span>
              </div>
            )}

            {/* New Service */}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {formData.upgradeDowngradeData ? 'New Service' : 'Service'}
              </span>
              <span>¥{formData.upgradeDowngradeData ? 
                (formData.isFreeUpgrade ? formData.upgradeDowngradeData.currentPrice : formData.upgradeDowngradeData.newPrice).toLocaleString() :
                calculatedPrice.baseAmount.toLocaleString()}</span>
            </div>

            {/* Upgrade/Downgrade Amount - only show if there's a price difference */}
            {formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {formData.upgradeDowngradeData.priceDifference > 0 ? 'Upgrade Amount' : 'Downgrade Amount'}
                </span>
                <span className={formData.upgradeDowngradeData.priceDifference > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {formData.upgradeDowngradeData.priceDifference > 0 ? '+' : ''}¥{formData.upgradeDowngradeData.priceDifference.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({formData.tax_percentage || 10}%)</span>
              <span>¥{formData.upgradeDowngradeData ? 
                Math.round((formData.isFreeUpgrade ? formData.upgradeDowngradeData.currentPrice : formData.upgradeDowngradeData.newPrice) * (formData.tax_percentage || 10) / 100).toLocaleString() :
                calculatedPrice.taxAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">¥{fullQuoteAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedPaymentType && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPaymentType(null)
          }}
          paymentType={selectedPaymentType}
          formData={formData}
          calculatedPrice={calculatedPrice}
          onPaymentAction={handlePaymentAction}
          isLoading={isLoading}
        />
      )}
    </>
  )
}