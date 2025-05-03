'use client'

import { useState, useEffect } from 'react'
import { useI18n } from "@/lib/i18n/context"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Booking } from '@/types/bookings'

interface BookingBillingFormProps {
  booking: Partial<Booking>;
  onDataChange: (data: Partial<Booking>) => void;
  readonly?: boolean;
}

export function BookingBillingForm({ booking, onDataChange, readonly = false }: BookingBillingFormProps) {
  const { t } = useI18n()
  
  const [billingData, setBillingData] = useState({
    billing_company_name: booking.billing_company_name || '',
    billing_tax_number: booking.billing_tax_number || '',
    billing_street_name: booking.billing_street_name || '',
    billing_street_number: booking.billing_street_number || '',
    billing_city: booking.billing_city || '',
    billing_state: booking.billing_state || '',
    billing_postal_code: booking.billing_postal_code || '',
    billing_country: booking.billing_country || '',
  })
  
  // Update parent component when billing data changes
  useEffect(() => {
    onDataChange(billingData)
  }, [billingData, onDataChange])
  
  // Update local state when booking data changes
  useEffect(() => {
    setBillingData({
      billing_company_name: booking.billing_company_name || '',
      billing_tax_number: booking.billing_tax_number || '',
      billing_street_name: booking.billing_street_name || '',
      billing_street_number: booking.billing_street_number || '',
      billing_city: booking.billing_city || '',
      billing_state: booking.billing_state || '',
      billing_postal_code: booking.billing_postal_code || '',
      billing_country: booking.billing_country || '',
    })
  }, [booking])
  
  const handleInputChange = (field: keyof typeof billingData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('bookings.billing.title')}</CardTitle>
        <CardDescription>{t('bookings.billing.details')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="billing_company_name">{t('bookings.billing.companyName')}</Label>
              <Input
                id="billing_company_name"
                placeholder={t('bookings.billing.companyName')}
                value={billingData.billing_company_name}
                onChange={handleInputChange('billing_company_name')}
                readOnly={readonly}
              />
            </div>
            
            {/* Tax Number */}
            <div className="space-y-2">
              <Label htmlFor="billing_tax_number">{t('bookings.billing.taxNumber')}</Label>
              <Input
                id="billing_tax_number"
                placeholder={t('bookings.billing.taxNumber')}
                value={billingData.billing_tax_number}
                onChange={handleInputChange('billing_tax_number')}
                readOnly={readonly}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Street Name */}
            <div className="space-y-2">
              <Label htmlFor="billing_street_name">{t('bookings.billing.streetName')}</Label>
              <Input
                id="billing_street_name"
                placeholder={t('bookings.billing.streetName')}
                value={billingData.billing_street_name}
                onChange={handleInputChange('billing_street_name')}
                readOnly={readonly}
              />
            </div>
            
            {/* Street Number */}
            <div className="space-y-2">
              <Label htmlFor="billing_street_number">{t('bookings.billing.streetNumber')}</Label>
              <Input
                id="billing_street_number"
                placeholder={t('bookings.billing.streetNumber')}
                value={billingData.billing_street_number}
                onChange={handleInputChange('billing_street_number')}
                readOnly={readonly}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="billing_city">{t('bookings.billing.city')}</Label>
              <Input
                id="billing_city"
                placeholder={t('bookings.billing.city')}
                value={billingData.billing_city}
                onChange={handleInputChange('billing_city')}
                readOnly={readonly}
              />
            </div>
            
            {/* State/Province */}
            <div className="space-y-2">
              <Label htmlFor="billing_state">{t('bookings.billing.state')}</Label>
              <Input
                id="billing_state"
                placeholder={t('bookings.billing.state')}
                value={billingData.billing_state}
                onChange={handleInputChange('billing_state')}
                readOnly={readonly}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="billing_postal_code">{t('bookings.billing.postalCode')}</Label>
              <Input
                id="billing_postal_code"
                placeholder={t('bookings.billing.postalCode')}
                value={billingData.billing_postal_code}
                onChange={handleInputChange('billing_postal_code')}
                readOnly={readonly}
              />
            </div>
            
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="billing_country">{t('bookings.billing.country')}</Label>
              <Input
                id="billing_country"
                placeholder={t('bookings.billing.country')}
                value={billingData.billing_country}
                onChange={handleInputChange('billing_country')}
                readOnly={readonly}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 