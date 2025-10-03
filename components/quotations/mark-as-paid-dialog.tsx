"use client"

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Loader2, CreditCard, Receipt, Download } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'

interface Quotation {
  id: string
  receipt_url?: string
}

interface MarkAsPaidDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
  paymentDate: string
  setPaymentDate: (date: string) => void
  paymentAmount: string
  setPaymentAmount: (amount: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  receiptFile: File | null
  setReceiptFile: (file: File | null) => void
  sendPaymentCompleteEmail: boolean
  setSendPaymentCompleteEmail: (send: boolean) => void
  paymentEmailLanguage: 'en' | 'ja'
  setPaymentEmailLanguage: (language: 'en' | 'ja') => void
  paymentEmailBcc: string
  setPaymentEmailBcc: (bcc: string) => void
  isMarkingAsPaid: boolean
  isCheckingPayment: boolean
  receiptInfo: any
  setReceiptInfo: (info: any) => void
  onMarkAsPaid: () => void
  onCheckPaymentStatus: () => void
}

export function MarkAsPaidDialog({
  isOpen,
  onOpenChange,
  quotation,
  paymentDate,
  setPaymentDate,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  receiptFile,
  setReceiptFile,
  sendPaymentCompleteEmail,
  setSendPaymentCompleteEmail,
  paymentEmailLanguage,
  setPaymentEmailLanguage,
  paymentEmailBcc,
  setPaymentEmailBcc,
  isMarkingAsPaid,
  isCheckingPayment,
  receiptInfo,
  setReceiptInfo,
  onMarkAsPaid,
  onCheckPaymentStatus
}: MarkAsPaidDialogProps) {
  const { t } = useI18n()

  const handleDownloadReceipt = async (receiptUrl: string, receiptId: string) => {
    try {
      const downloadResponse = await fetch('/api/quotations/download-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_url: receiptUrl })
      })

      if (downloadResponse.ok) {
        const blob = await downloadResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `receipt-${receiptId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      console.error('Error downloading receipt:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('quotationWorkflow.markAsPaidTitle')}</DialogTitle>
          <DialogDescription>
            {t('quotationWorkflow.markAsPaidDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="receipt-upload">Receipt</Label>
            <div className="space-y-3">
              {/* Check Omise Payment Status */}
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCheckPaymentStatus}
                disabled={isCheckingPayment}
                className="w-full"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Check Omise Payment Status
                  </>
                )}
              </Button>
              
              {/* Receipt Information */}
              {receiptInfo && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">Omise Receipt Available</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Receipt #{receiptInfo.receiptId} - {receiptInfo.currency} {(receiptInfo.total / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-green-500 dark:text-green-400">
                        Issued: {new Date(receiptInfo.issuedOn).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(receiptInfo.receiptUrl, receiptInfo.receiptId)}
                      className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Upload Receipt */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <Input
                  id="receipt-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Accepted formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
              
              {/* Show existing receipt if available */}
              {quotation.receipt_url && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Receipt uploaded</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(quotation.receipt_url, '_blank')}
                    >
                      Download Receipt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Completion Email Configuration */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-payment-email"
                checked={sendPaymentCompleteEmail}
                onCheckedChange={(checked) => setSendPaymentCompleteEmail(checked as boolean)}
              />
              <Label htmlFor="send-payment-email" className="text-sm font-medium">
                Send Payment Completion Email
              </Label>
            </div>
            
            {sendPaymentCompleteEmail && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="payment-email-language">Language</Label>
                  <Select value={paymentEmailLanguage} onValueChange={(value: 'en' | 'ja') => setPaymentEmailLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="payment-email-bcc">BCC Emails</Label>
                  <Input
                    id="payment-email-bcc"
                    value={paymentEmailBcc}
                    onChange={(e) => setPaymentEmailBcc(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: booking@japandriver.com. Add more emails separated by commas.
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                  <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                    📧 What's included in the email:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Payment completion confirmation</li>
                    <li>• Invoice details and service information</li>
                    <li>• Payment method and amount details</li>
                    <li>• Invoice PDF attachment (marked as paid)</li>
                    <li>• Thank you message and next steps</li>
                    <li>• Company branding and contact information</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quotationWorkflow.cancel')}
          </Button>
          <Button onClick={onMarkAsPaid} disabled={isMarkingAsPaid || !paymentAmount || !paymentMethod}>
            {isMarkingAsPaid ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {sendPaymentCompleteEmail ? 'Mark as Paid & Send Email' : 'Mark as Paid'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
