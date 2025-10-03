"use client"

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Quotation {
  customer_email?: string
}

interface SendQuotationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
  emailAddress: string
  setEmailAddress: (email: string) => void
  sendQuotationLanguage: 'en' | 'ja'
  setSendQuotationLanguage: (language: 'en' | 'ja') => void
  sendQuotationBccEmails: string
  setSendQuotationBccEmails: (emails: string) => void
  isSendingQuotation: boolean
  onSendQuotation: () => void
}

export function SendQuotationDialog({
  isOpen,
  onOpenChange,
  quotation,
  emailAddress,
  setEmailAddress,
  sendQuotationLanguage,
  setSendQuotationLanguage,
  sendQuotationBccEmails,
  setSendQuotationBccEmails,
  isSendingQuotation,
  onSendQuotation
}: SendQuotationDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t('quotationWorkflow.sendQuotationTitle')}
          </DialogTitle>
          <DialogDescription>
            Send this quotation to the customer via email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="send-customer-email">Customer Email</Label>
            <Input
              id="send-customer-email"
              type="email"
              value={quotation?.customer_email || ''}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="customer@example.com"
              className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email will be sent to the customer's registered email address
            </p>
          </div>
          
          <div>
            <Label htmlFor="send-bcc-emails">BCC Emails</Label>
            <Input
              id="send-bcc-emails"
              value={sendQuotationBccEmails}
              onChange={(e) => setSendQuotationBccEmails(e.target.value)}
              placeholder="Enter email addresses separated by commas"
              className="font-mono text-sm bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: booking@japandriver.com. Add more emails separated by commas.
            </p>
          </div>
          
          <div>
            <Label>Language</Label>
            <Select value={sendQuotationLanguage} onValueChange={(value: 'en' | 'ja') => setSendQuotationLanguage(value)}>
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
              <li>• Complete quotation details and service information</li>
              <li>• Customer information and contact details</li>
              <li>• Service breakdown and pricing</li>
              <li>• Quotation PDF attachment</li>
              <li>• Magic link for customer access</li>
              <li>• Company branding and contact information</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quotationWorkflow.cancel')}
          </Button>
          <Button 
            onClick={onSendQuotation}
            disabled={isSendingQuotation || !emailAddress}
            className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
          >
            {isSendingQuotation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('quotationWorkflow.sending')}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('quotationWorkflow.sendQuotation')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
