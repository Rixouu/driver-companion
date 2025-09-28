'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertTriangle, CreditCard, Gift, Mail, FileText } from 'lucide-react'
import LoadingModal from '@/components/ui/loading-modal'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentType: 'upgrade-only' | 'full-quote'
  formData: any
  calculatedPrice: any
  onPaymentAction: (action: 'upgrade-only' | 'full-quote', emailData?: any, bookingId?: string) => void
  isLoading?: boolean
}

export function PaymentModal({
  isOpen,
  onClose,
  paymentType,
  formData,
  calculatedPrice,
  onPaymentAction,
  isLoading = false
}: PaymentModalProps) {
  const [emailData, setEmailData] = useState({
    customerEmail: formData.customer_email || '',
    bccEmails: 'booking@japandriver.com',
    language: 'en' as 'en' | 'ja'
  })
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingTitle, setLoadingTitle] = useState('')
  const [loadingLabel, setLoadingLabel] = useState('')


  const hasUpgradeDowngrade = formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0
  const upgradeAmount = formData.upgradeDowngradeData?.priceDifference || 0
  
  // Calculate full quote amount correctly with time-based adjustment and refund discount
  const baseServicePrice = formData.upgradeDowngradeData ? 
    (formData.isFreeUpgrade ? formData.upgradeDowngradeData.currentPrice : formData.upgradeDowngradeData.newPrice) :
    calculatedPrice.baseAmount
    
  const timeAdjustment = calculatedPrice.timeBasedAdjustment || 0
  const regularDiscount = calculatedPrice.regularDiscountAmount || 0
  const couponDiscount = calculatedPrice.couponDiscountAmount || 0
  const refundDiscount = formData.refundCouponDiscount || 0
  
  // Correct calculation: Service + Time-based adjustment - Discounts = Subtotal
  const subtotal = baseServicePrice + timeAdjustment - regularDiscount - couponDiscount - refundDiscount
  const taxAmount = Math.round(subtotal * (formData.tax_percentage || 10) / 100)
  const fullQuoteAmount = subtotal + taxAmount
  
  // Debug logging
  console.log('Payment calculation debug:', {
    baseServicePrice,
    timeAdjustment,
    subtotal,
    taxAmount,
    fullQuoteAmount
  })


  const handlePaymentSubmit = async () => {
    // Prevent multiple submissions
    if (showLoadingModal) {
      console.log('🚫 [PAYMENT-MODAL] Already processing, ignoring duplicate submission');
      return;
    }
    
    console.log('🚀 [PAYMENT-MODAL] Starting payment submission');
    setShowLoadingModal(true)
    
    // Set initial state
    setLoadingProgress(0)
    setLoadingTitle(
      paymentType === 'upgrade-only' 
        ? (isDowngrade ? 'Processing Downgrade Refund' : 'Processing Upgrade Payment')
        : 'Generating Payment Link'
    )
    setLoadingLabel('Preparing your request...')

    try {
      // Update progress as we start - slower initial progress
      setLoadingProgress(10)
      setLoadingLabel('Validating payment data...')
      await new Promise(resolve => setTimeout(resolve, 800))

      // Create operation first - only for upgrade/downgrade payments
      let operationId = null;
      if (formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== undefined && formData.upgradeDowngradeData.priceDifference !== null) {
        // Validate required fields before creating operation
        if (!formData.vehicle_id) {
          throw new Error('Vehicle ID is required for payment processing');
        }
        
        if (!formData.driver_id) {
          throw new Error('Driver ID is required for payment processing. Please assign a driver first.');
        }

        setLoadingProgress(25)
        setLoadingLabel('Creating operation...')

        try {
          const operationResponse = await fetch(`/api/bookings/${formData.id}/store-assignment-operation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationType: formData.upgradeDowngradeData.priceDifference > 0 ? 'upgrade' : 'downgrade',
              previousVehicleId: formData.originalVehicleId,
              newVehicleId: formData.vehicle_id,
              driverId: formData.driver_id,
              priceDifference: formData.upgradeDowngradeData.priceDifference,
              paymentAmount: formData.upgradeDowngradeData.priceDifference > 0 ? formData.upgradeDowngradeData.priceDifference : 0,
              couponCode: formData.upgradeDowngradeData.priceDifference < 0 ? `REFUND-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
              refundAmount: formData.upgradeDowngradeData.priceDifference < 0 ? Math.abs(formData.upgradeDowngradeData.priceDifference) : 0,
              customerEmail: emailData.customerEmail,
              bccEmail: emailData.bccEmails || undefined
            })
          });
          
          const operationResult = await operationResponse.json();
          
          if (operationResult.success) {
            operationId = operationResult.operationId;
            setLoadingProgress(40)
            setLoadingLabel('Operation created successfully...')
            await new Promise(resolve => setTimeout(resolve, 500))
          } else {
            throw new Error(operationResult.error || 'Failed to create operation');
          }
        } catch (error) {
          throw new Error(`Failed to create operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Use EXACT same API call pattern as smart assignment modal
      if (paymentType === 'upgrade-only' && formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== undefined && formData.upgradeDowngradeData.priceDifference !== null) {
        if (formData.upgradeDowngradeData.priceDifference > 0) {
          // Upgrade payment - EXACT same as smart assignment
          setLoadingProgress(50)
          setLoadingLabel('Preparing payment generation...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          setLoadingProgress(60)
          setLoadingLabel('Generating payment link...')
          
          // Start the API call
          const responsePromise = fetch(`/api/bookings/${formData.id}/generate-upgrade-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: formData.upgradeDowngradeData.priceDifference,
              description: `Vehicle upgrade from ${formData.selectedVehicle?.brand} ${formData.selectedVehicle?.model}`,
              bccEmail: emailData.bccEmails || undefined,
              operationId: operationId
            })
          })
          
          // Update progress while API call is running
          const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev < 85) {
                setLoadingLabel('Processing payment request...')
                return prev + 2
              }
              return prev
            })
          }, 1000)
          
          const response = await responsePromise
          clearInterval(progressInterval)
          
          setLoadingProgress(90)
          setLoadingLabel('Sending email notification...')
          
          const result = await response.json()
          
          if (result.success) {
            setLoadingProgress(100)
            setLoadingTitle('Upgrade payment sent successfully!')
            setLoadingLabel('Payment link generated and sent to customer!')
            
            setTimeout(() => {
              setShowLoadingModal(false)
              onClose()
            }, 2000)
          } else {
            throw new Error(result.error || 'Failed to generate upgrade payment')
          }
        } else {
          // Downgrade coupon - EXACT same as smart assignment
          setLoadingProgress(50)
          setLoadingLabel('Preparing refund generation...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          setLoadingProgress(60)
          setLoadingLabel('Generating refund coupon...')
          
          // Start the API call
          const responsePromise = fetch(`/api/bookings/${formData.id}/send-downgrade-coupon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              couponCode: `REFUND-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              refundAmount: Math.abs(formData.upgradeDowngradeData.priceDifference),
              previousCategory: formData.upgradeDowngradeData.currentCategory,
              newCategory: formData.upgradeDowngradeData.newCategory,
              bccEmail: emailData.bccEmails || undefined,
              operationId: operationId
            })
          })
          
          // Update progress while API call is running
          const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev < 85) {
                setLoadingLabel('Processing refund request...')
                return prev + 2
              }
              return prev
            })
          }, 1000)
          
          const response = await responsePromise
          clearInterval(progressInterval)
          
          setLoadingProgress(90)
          setLoadingLabel('Sending email notification...')
          
          const result = await response.json()
          
          if (result.success) {
            setLoadingProgress(100)
            setLoadingTitle('Downgrade coupon sent successfully!')
            setLoadingLabel('Refund coupon generated and sent to customer!')
            
            setTimeout(() => {
              setShowLoadingModal(false)
              onClose()
            }, 2000)
          } else {
            throw new Error(result.error || 'Failed to generate downgrade coupon')
          }
        }
      } else if (paymentType === 'full-quote') {
        // Full quote - send booking invoice email (which will generate payment link internally)
        setLoadingProgress(50)
        setLoadingLabel('Preparing booking invoice...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setLoadingProgress(60)
        setLoadingLabel('Sending booking invoice email...')
        
        // Send booking invoice email (this will generate payment link internally if needed)
        const emailResponse = await fetch('/api/bookings/send-booking-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: formData.id,
            email: emailData.customerEmail,
            language: emailData.language,
            bcc_emails: emailData.bccEmails
          })
        });
        
        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          setLoadingProgress(100)
          setLoadingTitle('Booking Invoice Email Sent!')
          setLoadingLabel('Complete booking invoice with payment link sent to customer!')
          
          setTimeout(() => {
            setShowLoadingModal(false)
            onPaymentAction(paymentType, emailData, formData.id)
            onClose()
          }, 2000)
        } else {
          throw new Error(emailResult.error || 'Failed to send booking invoice email')
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setLoadingTitle('Error processing payment')
      setLoadingLabel(error instanceof Error ? error.message : 'An error occurred')
      setLoadingProgress(0)
      
      setTimeout(() => {
        setShowLoadingModal(false)
      }, 3000)
    }
  }

  const isUpgrade = paymentType === 'upgrade-only' && hasUpgradeDowngrade && upgradeAmount > 0
  const isDowngrade = paymentType === 'upgrade-only' && hasUpgradeDowngrade && upgradeAmount < 0
  
  // Debug logging
  console.log('Payment Modal Debug:', {
    paymentType,
    hasUpgradeDowngrade,
    upgradeAmount,
    isDowngrade,
    formData: formData.upgradeDowngradeData
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isUpgrade ? (
                <CreditCard className="h-5 w-5 text-orange-500" />
              ) : isDowngrade ? (
                <Gift className="h-5 w-5 text-green-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              {isUpgrade ? 'Upgrade Payment' : isDowngrade ? 'Downgrade Refund' : 'Full Quote Payment'}
            </DialogTitle>
            <DialogDescription>
              {isUpgrade 
                ? 'Send payment link for the upgrade amount only'
                : isDowngrade 
                ? 'Generate refund coupon for the downgrade amount'
                : 'Send complete quote with all pricing including upgrade/downgrade'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Payment Summary</h3>
                  <Badge variant="outline" className="text-lg">
                    ¥{paymentType === 'upgrade-only' ? Math.abs(upgradeAmount).toLocaleString() : fullQuoteAmount.toLocaleString()}
                  </Badge>
                </div>
                
                  <div className="space-y-2 text-sm">
                   {/* For upgrade-only payments, show only the upgrade amount */}
                   {paymentType === 'upgrade-only' && formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0 ? (
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">
                         {formData.upgradeDowngradeData.priceDifference > 0 ? 'Upgrade Amount' : 'Downgrade Amount'}
                       </span>
                       <span className={formData.upgradeDowngradeData.priceDifference > 0 ? 'text-orange-600' : 'text-green-600'}>
                         {formData.upgradeDowngradeData.priceDifference > 0 ? '+' : ''}¥{Math.abs(formData.upgradeDowngradeData.priceDifference).toLocaleString()}
                       </span>
                     </div>
                   ) : (
                     <>
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
                         <span>¥{baseServicePrice.toLocaleString()}</span>
                       </div>
                       
                       {/* Time-based adjustment - only show if > 0 */}
                       {timeAdjustment > 0 && (
                         <div className="flex justify-between text-orange-600">
                           <span className="text-muted-foreground">
                             {calculatedPrice.appliedTimeBasedRule?.name || 'Time-based adjustment'}
                             {calculatedPrice.appliedTimeBasedRule?.start_time && calculatedPrice.appliedTimeBasedRule?.end_time && (
                               <span className="text-xs text-muted-foreground ml-1">
                                 ({calculatedPrice.appliedTimeBasedRule.start_time.split(':').slice(0, 2).join(':')}-{calculatedPrice.appliedTimeBasedRule.end_time.split(':').slice(0, 2).join(':')})
                               </span>
                             )}
                           </span>
                           <span>+¥{timeAdjustment.toLocaleString()}</span>
                         </div>
                       )}
                       
                       {/* Discounts - only show if > 0 */}
                       {regularDiscount > 0 && (
                         <div className="flex justify-between text-green-600">
                           <span className="text-muted-foreground">Discount</span>
                           <span>-¥{regularDiscount.toLocaleString()}</span>
                         </div>
                       )}
                       
                       {couponDiscount > 0 && (
                         <div className="flex justify-between text-blue-600">
                           <span className="text-muted-foreground">Coupon Discount</span>
                           <span>-¥{couponDiscount.toLocaleString()}</span>
                         </div>
                       )}
                       
                       {refundDiscount > 0 && (
                         <div className="flex justify-between text-green-600">
                           <span className="text-muted-foreground">Refund Code</span>
                           <span>-¥{refundDiscount.toLocaleString()}</span>
                         </div>
                       )}
                       
                       {/* Subtotal */}
                       <div className="flex justify-between font-medium">
                         <span className="text-muted-foreground">Subtotal</span>
                         <span>¥{subtotal.toLocaleString()}</span>
                       </div>
                     </>
                   )}

                  {/* For upgrade-only payments, show only the upgrade amount without tax */}
                  {paymentType === 'upgrade-only' && formData.upgradeDowngradeData && formData.upgradeDowngradeData.priceDifference !== 0 ? (
                    <>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">¥{Math.abs(formData.upgradeDowngradeData.priceDifference).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
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
                        <span>¥{taxAmount.toLocaleString()}</span>
                      </div>
                      
                      
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">¥{fullQuoteAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold">Email Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-email">Customer Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={emailData.customerEmail}
                    onChange={(e) => setEmailData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bcc-emails">BCC Emails</Label>
                  <Input
                    id="bcc-emails"
                    type="email"
                    value={emailData.bccEmails}
                    onChange={(e) => setEmailData(prev => ({ ...prev, bccEmails: e.target.value }))}
                    placeholder="admin@japandriver.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: booking@japandriver.com. Add more emails separated by commas.
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Language</Label>
                <Select 
                  value={emailData.language} 
                  onValueChange={(value: 'en' | 'ja') => setEmailData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* What will be sent */}
            <div className={`p-4 rounded-lg ${isUpgrade ? 'bg-orange-50 dark:bg-orange-950/20' : isDowngrade ? 'bg-green-50 dark:bg-green-950/20' : 'bg-blue-50 dark:bg-blue-950/20'}`}>
              <h4 className={`font-medium text-sm mb-2 flex items-center gap-2 ${isUpgrade ? 'text-orange-900 dark:text-orange-100' : isDowngrade ? 'text-green-900 dark:text-green-100' : 'text-blue-900 dark:text-blue-100'}`}>
                <Mail className="h-4 w-4" />
                What will be sent:
              </h4>
              <ul className={`text-sm space-y-1 ${isUpgrade ? 'text-orange-800 dark:text-orange-200' : isDowngrade ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                {isUpgrade && (
                  <>
                    <li>• Payment link for ¥{Math.abs(upgradeAmount).toLocaleString()} upgrade amount</li>
                    <li>• Vehicle upgrade confirmation details</li>
                    <li>• Updated booking information</li>
                  </>
                )}
                {isDowngrade && (
                  <>
                    <li>• Refund coupon for ¥{Math.abs(upgradeAmount).toLocaleString()}</li>
                    <li>• Downgrade confirmation details</li>
                    <li>• Updated booking information</li>
                  </>
                )}
                {paymentType === 'full-quote' && (
                  <>
                    <li>• Complete quote with all pricing details</li>
                    <li>• Payment link for full amount (¥{fullQuoteAmount.toLocaleString()})</li>
                    <li>• Booking confirmation and details</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit} 
              disabled={isLoading || !emailData.customerEmail}
              className={`text-white ${isUpgrade ? 'bg-orange-600 hover:bg-orange-700' : isDowngrade ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Processing...' : isUpgrade ? 'Send Upgrade Payment' : isDowngrade ? 'Generate Refund Coupon' : 'Send Full Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Modal */}
      <LoadingModal
        open={showLoadingModal}
        title={loadingTitle}
        label={loadingLabel}
        value={loadingProgress}
        variant={isUpgrade ? 'upgrade' : isDowngrade ? 'approval' : 'email'}
        showSteps={true}
        steps={[
          { label: 'Validating payment data...', value: 10, completed: loadingProgress >= 10 },
          { label: 'Creating operation...', value: 25, completed: loadingProgress >= 25 },
          { label: 'Generating payment link...', value: 60, completed: loadingProgress >= 60 },
          { label: 'Sending email notification...', value: 90, completed: loadingProgress >= 90 },
          { label: 'Finalizing transaction...', value: 100, completed: loadingProgress >= 100 }
        ]}
      />
    </>
  )
}
