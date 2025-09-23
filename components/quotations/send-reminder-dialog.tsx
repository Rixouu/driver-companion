"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'
import { Quotation } from '@/types/quotations'
import { Loader2, RefreshCw } from 'lucide-react'

interface SendReminderDialogProps {
  quotation: Quotation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendReminderDialog({ quotation, open, onOpenChange }: SendReminderDialogProps) {
  const { t } = useI18n()
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const [includeQuotation, setIncludeQuotation] = useState(true)
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com")
  const [customerEmail, setCustomerEmail] = useState(quotation?.customer_email || '')
  const [isLoading, setIsLoading] = useState(false)
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressTitle, setProgressTitle] = useState('Processing')
  const [progressLabel, setProgressLabel] = useState('Starting...')

  const handleSendReminder = async () => {
    if (!quotation?.id) return

    setIsLoading(true)
    setProgressOpen(true)
    setProgressTitle('Sending Reminder')
    setProgressLabel('Preparing...')
    setProgressValue(10)
    
    try {
      setProgressLabel('Generating content...')
      setProgressValue(40)
      
      const response = await fetch(`/api/quotations/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          quotation_id: quotation.id,
          email: customerEmail,
          language,
          bcc_emails: bccEmails
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }
      
      setProgressLabel('Sending email...')
      setProgressValue(80)
      
      // Wait for the actual email to be sent
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressValue(100)
      setProgressLabel('Completed')
      
      // Show success toast only after completion
      toast({
        title: t('quotations.notifications.reminderSent') || 'Reminder sent successfully',
        variant: 'default',
      });
      
      setTimeout(() => {
        setProgressOpen(false)
        onOpenChange(false)
      }, 400)
      
    } catch (error) {
      console.error('Error sending reminder:', error)
      setProgressOpen(false)
      toast({
        title: t('quotations.notifications.error'),
        description: 'Failed to send reminder',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Send Reminder
          </DialogTitle>
          <DialogDescription>
            Send a reminder email to the customer about this quotation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reminder-customer-email">Customer Email</Label>
            <Input
              id="reminder-customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email will be sent to the customer's registered email address
            </p>
          </div>
          
          <div>
            <Label htmlFor="reminder-bcc-emails">BCC Emails</Label>
            <Input
              id="reminder-bcc-emails"
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
            <Select value={language} onValueChange={(value: 'en' | 'ja') => setLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-quotation" 
              checked={includeQuotation}
              onCheckedChange={(checked) => setIncludeQuotation(!!checked)}
            />
            <Label htmlFor="include-quotation">
              {t('quotations.includeDetails')}
            </Label>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
              📧 What's included in the email:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Reminder about quotation expiration</li>
              <li>• Customer information and contact details</li>
              <li>• Quotation reference and details</li>
              <li>• Quotation PDF attachment (if enabled)</li>
              <li>• Company branding and contact information</li>
              <li>• Call-to-action for customer response</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSendReminder}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.sending')}
              </>
            ) : t('common.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Progress Modal */}
    <Dialog open={progressOpen}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{progressTitle}</DialogTitle>
          <DialogDescription className="sr-only">Processing</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Progress value={progressValue} />
          <div className="text-sm text-muted-foreground flex items-center justify-between">
            <span>{progressLabel}</span>
            <span className="font-medium text-foreground">{progressValue}%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
} 