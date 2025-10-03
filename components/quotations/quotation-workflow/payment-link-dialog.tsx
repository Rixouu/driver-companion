"use client"

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, CheckCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'

interface PaymentLinkDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  emailAddress: string
  setEmailAddress: (email: string) => void
  bccEmails: string
  setBccEmails: (emails: string) => void
  emailLanguage: 'en' | 'ja'
  setEmailLanguage: (language: 'en' | 'ja') => void
  customPaymentName: string
  setCustomPaymentName: (name: string) => void
  paymentLink: string
  setPaymentLink: (link: string) => void
  paymentLinkSent: boolean
  paymentLinkSentAt: string | null
  quotationId: string
  setProgressOpen: (open: boolean) => void
  setProgressVariant: (variant: 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice') => void
  setProgressTitle: (title: string) => void
  startProgress: (config: any) => Promise<any>
  onSendPaymentLink: () => Promise<void>
  onSkipPaymentLink: () => Promise<void>
  isSendingPaymentLink: boolean
}

export function PaymentLinkDialog({
  isOpen,
  onOpenChange,
  emailAddress,
  setEmailAddress,
  bccEmails,
  setBccEmails,
  emailLanguage,
  setEmailLanguage,
  customPaymentName,
  setCustomPaymentName,
  paymentLink,
  setPaymentLink,
  paymentLinkSent,
  paymentLinkSentAt,
  quotationId,
  setProgressOpen,
  setProgressVariant,
  setProgressTitle,
  startProgress,
  onSendPaymentLink,
  onSkipPaymentLink,
  isSendingPaymentLink
}: PaymentLinkDialogProps) {
  const { t } = useI18n()

  const handleGeneratePaymentLink = async () => {
    try {
      setProgressOpen(true)
      setProgressVariant('default')
      setProgressTitle('Generating Payment Link')
      
      // Start progress simulation
      const progressPromise = startProgress({
        steps: [
          { label: 'Creating Omise payment link...', value: 50 },
          { label: 'Finalizing...', value: 90 }
        ],
        totalDuration: 1500
      })
      
      const response = await fetch('/api/quotations/generate-omise-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quotation_id: quotationId,
          regenerate: true,
          customName: customPaymentName || undefined
        })
      })
      
      // Wait for progress to complete
      await progressPromise
      
      if (response.ok) {
        const data = await response.json()
        setPaymentLink(data.paymentUrl)
        toast({
          title: "Payment Link Generated",
          description: "New Omise payment link has been created",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate payment link')
      }
    } catch (error) {
      console.error('Error generating payment link:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate payment link",
        variant: "destructive",
      })
    } finally {
      setProgressOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('quotationWorkflow.sendPaymentLinkTitle')}
          </DialogTitle>
          <DialogDescription>
            Send the invoice with payment link to the customer, or skip if using bank transfer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="payment-email">Customer Email</Label>
            <Input
              id="payment-email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="customer@example.com"
              className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email will be sent to the customer's registered email address
            </p>
          </div>
          
          <div>
            <Label htmlFor="bcc-emails">BCC Emails</Label>
            <Input
              id="bcc-emails"
              value={bccEmails}
              onChange={(e) => setBccEmails(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: booking@japandriver.com. Add more emails separated by commas.
            </p>
          </div>
          
          <div>
            <Label>Language</Label>
            <Select value={emailLanguage} onValueChange={(value: 'en' | 'ja') => setEmailLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
              📧 What's included in the email:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Complete invoice details and service information</li>
              <li>• Customer information and billing details</li>
              <li>• Service breakdown and pricing</li>
              <li>• Invoice PDF attachment</li>
              <li>• Secure payment link for online payment</li>
              <li>• Payment instructions and terms</li>
              <li>• Company branding and contact information</li>
            </ul>
          </div>
          
          <div>
            <Label htmlFor="custom-payment-name">Payment Link Name (Optional)</Label>
            <Input
              id="custom-payment-name"
              type="text"
              value={customPaymentName}
              onChange={(e) => setCustomPaymentName(e.target.value)}
              placeholder="e.g., Vehicle Inspection Service - Premium Package"
              className="w-full bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Custom name for the payment link. Leave empty to use default.
            </p>
          </div>

          {paymentLinkSent && (
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Payment link sent on {paymentLinkSentAt ? new Date(paymentLinkSentAt).toLocaleDateString() : 'recently'}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="payment-link-url">Payment Link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="payment-link-url"
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://linksplus.omise.co/..."
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePaymentLink}
                className="whitespace-nowrap"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment link will be generated automatically when sending the email.
            </p>
            
            {paymentLink && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <a 
                  href={paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                >
                  {paymentLink}
                </a>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quotationWorkflow.cancel')}
          </Button>
          
          {/* Skip button for bank transfer */}
          <Button 
            variant="outline" 
            onClick={onSkipPaymentLink}
          >
            Skip (Bank Transfer)
          </Button>
          
          <Button 
            onClick={onSendPaymentLink}
            disabled={isSendingPaymentLink || !emailAddress || !paymentLink}
            className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
          >
            {isSendingPaymentLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('quotationWorkflow.sending')}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t('quotationWorkflow.sendPaymentLink')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
