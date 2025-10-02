'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, Settings, DollarSign } from 'lucide-react'

interface CreatePaylinkModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreatePaylinkModal({ onClose, onSuccess }: CreatePaylinkModalProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'JPY',
    multiple: false,
    returnUrl: 'https://japandriver.com/'
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.amount) {
      toast({
        title: "Error",
        description: t("paymentLinks.errors.amountRequired"),
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/omise/paylinks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: amount
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: t("paymentLinks.createModal.success"),
        })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: data.error || t("paymentLinks.errors.createFailed"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating paylink:', error)
      toast({
        title: "Error",
        description: t("paymentLinks.errors.createFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t("paymentLinks.createModal.title")}
        </DialogTitle>
        <DialogDescription>
          {t("paymentLinks.createModal.description")}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("paymentLinks.createModal.paymentInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("paymentLinks.createModal.paymentTitle")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t("paymentLinks.createModal.paymentTitlePlaceholder")}
                required
                className="font-medium"
              />
              <p className="text-xs text-muted-foreground">
                {t("paymentLinks.createModal.paymentTitleHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("paymentLinks.createModal.descriptionLabel")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t("paymentLinks.createModal.descriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("paymentLinks.createModal.amount")} *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">{t("paymentLinks.createModal.currency")}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JPY">{t("paymentLinks.createModal.japaneseYen")}</SelectItem>
                    <SelectItem value="THB">THB (Thai Baht)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                    <SelectItem value="MYR">MYR (Malaysian Ringgit)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("paymentLinks.createModal.paymentSettings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="multiple" className="text-base font-medium">{t("paymentLinks.createModal.allowMultiplePayments")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("paymentLinks.createModal.allowMultiplePaymentsDescription")}
                </p>
              </div>
              <Switch
                id="multiple"
                checked={formData.multiple}
                onCheckedChange={(checked) => handleInputChange('multiple', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnUrl">{t("paymentLinks.createModal.returnUrl")}</Label>
              <Input
                id="returnUrl"
                value={formData.returnUrl}
                onChange={(e) => handleInputChange('returnUrl', e.target.value)}
                className="font-mono text-sm bg-muted"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                {t("paymentLinks.createModal.returnUrlDescription")}
              </p>
            </div>
          </CardContent>
        </Card>


        <Separator />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("paymentLinks.createModal.cancel")}
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("paymentLinks.createModal.create")}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
