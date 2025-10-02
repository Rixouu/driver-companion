"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'
import { Quotation } from '@/types/quotations'
import { Loader2, RefreshCw } from 'lucide-react'
import { useProgressSteps } from '@/lib/hooks/useProgressSteps'
import { progressConfigs } from '@/lib/config/progressConfigs'
import LoadingModal from '@/components/ui/loading-modal'

interface SendReminderDialogProps {
  quotation: Quotation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendReminderDialog({ quotation, open, onOpenChange }: SendReminderDialogProps) {
  const { t } = useI18n()
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const [bccEmails, setBccEmails] = useState<string>("booking@japandriver.com")
  const [customerEmail, setCustomerEmail] = useState(quotation?.customer_email || '')
  const [isLoading, setIsLoading] = useState(false)
  
  // Progress modal state
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressTitle, setProgressTitle] = useState('Sending Reminder')
  const [progressVariant, setProgressVariant] = useState<'reminder'>('reminder')
  const { progressValue, progressLabel, progressSteps, startProgress, resetProgress } = useProgressSteps()

  const handleSendReminder = async () => {
    if (!quotation?.id) return

    setIsLoading(true)
    
    try {
      // Start API call first
      const apiCall = fetch(`/api/quotations/send-reminder`, {
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
      
      // Start progress modal and animation AFTER API call starts
      setProgressOpen(true)
      setProgressTitle('Sending Reminder')
      setProgressVariant('reminder')
      
      // Start progress simulation synchronized with API call
      const progressPromise = startProgress(progressConfigs.sendReminder, apiCall)
      
      // Wait for both to complete
      const response = await apiCall
      await progressPromise
      
      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }
      
      // Show success toast only after completion
      toast({
        title: t('quotations.notifications.reminderSent') || 'Reminder sent successfully',
        variant: 'default',
      });
      
      setTimeout(() => {
        setProgressOpen(false)
        onOpenChange(false)
      }, 500)
      
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
          
          
          <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100 mb-2">
              📧 What's included in the email:
            </h4>
            <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
              <li>• Reminder about quotation expiration</li>
              <li>• Customer information and contact details</li>
              <li>• Quotation reference and details</li>
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
            className="bg-orange-600 hover:bg-orange-700 text-white"
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
    
    {/* Enhanced Progress Modal */}
    <LoadingModal
      open={progressOpen}
      title={progressTitle}
      label={progressLabel}
      value={progressValue}
      variant={progressVariant}
      showSteps={progressSteps.length > 0}
      steps={progressSteps}
      onOpenChange={setProgressOpen}
    />
    </>
  )
} 