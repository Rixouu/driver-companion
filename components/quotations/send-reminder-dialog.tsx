"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'
import { Quotation } from '@/types/quotations'
import { Loader2 } from 'lucide-react'

interface SendReminderDialogProps {
  quotation: Quotation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendReminderDialog({ quotation, open, onOpenChange }: SendReminderDialogProps) {
  const { t } = useI18n()
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const [includeQuotation, setIncludeQuotation] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendReminder = async () => {
    if (!quotation?.id) return

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/quotations/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: quotation.id,
          language,
          includeQuotation
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }
      
      toast({
        title: t('quotations.notifications.reminderSuccess'),
        variant: 'default',
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error sending reminder:', error)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('quotations.actions.remind')}
          </DialogTitle>
          <DialogDescription>
            {t('quotations.emailDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t('settings.preferences.language.title')}</Label>
            <RadioGroup
              value={language}
              onValueChange={(value) => setLanguage(value as 'en' | 'ja')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en">{t('settings.preferences.language.en')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ja" id="lang-ja" />
                <Label htmlFor="lang-ja">{t('settings.preferences.language.ja')}</Label>
              </div>
            </RadioGroup>
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
  )
} 