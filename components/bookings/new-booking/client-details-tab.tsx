'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, CreditCard } from 'lucide-react'
import { Booking } from '@/types/bookings'

interface ClientDetailsTabProps {
  formData: Partial<Booking & { 
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  }>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function ClientDetailsTab({ formData, handleInputChange }: ClientDetailsTabProps) {
  return (
    <Card className="border rounded-lg shadow-sm dark:border-gray-800">
      <div className="border-b py-4 px-6">
        <h2 className="text-lg font-semibold flex items-center">
          <User className="mr-2 h-5 w-5" />
          Client Details
        </h2>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Customer Name</h3>
            <Input
              id="customer_name"
              name="customer_name"
              value={formData.customer_name || ''}
              onChange={handleInputChange}
              className="transition-all focus:ring-2 focus:border-primary"
            />
          </div>
      
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Email *</h3>
            <Input
              id="customer_email"
              name="customer_email"
              type="email"
              required
              value={formData.customer_email || ''}
              onChange={handleInputChange}
              className="transition-all focus:ring-2 focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
            <Input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              value={formData.customer_phone || ''}
              onChange={handleInputChange}
              className="transition-all focus:ring-2 focus:border-primary"
            />
          </div>
          
          {/* Billing Information Section */}
          <Separator className="my-6" />
          
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Billing Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                <Input
                  id="billing_company_name"
                  name="billing_company_name"
                  value={formData.billing_company_name || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Tax Number / VAT ID</h3>
                <Input
                  id="billing_tax_number"
                  name="billing_tax_number"
                  value={formData.billing_tax_number || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Street Name</h3>
                <Input
                  id="billing_street_name"
                  name="billing_street_name"
                  value={formData.billing_street_name || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Street Number / Building</h3>
                <Input
                  id="billing_street_number"
                  name="billing_street_number"
                  value={formData.billing_street_number || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">City</h3>
                <Input
                  id="billing_city"
                  name="billing_city"
                  value={formData.billing_city || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">State / Province</h3>
                <Input
                  id="billing_state"
                  name="billing_state"
                  value={formData.billing_state || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Postal / ZIP Code</h3>
                <Input
                  id="billing_postal_code"
                  name="billing_postal_code"
                  value={formData.billing_postal_code || ''}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Country</h3>
              <Input
                id="billing_country"
                name="billing_country"
                value={formData.billing_country || ''}
                onChange={handleInputChange}
                className="transition-all focus:ring-2 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
