'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, FileText, Lock, Eye, Users } from 'lucide-react'
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
          
          {/* Additional Information Section */}
          <Separator className="my-6" />
          
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customer_notes" className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    Customer Notes
                  </Label>
                  <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    <Eye className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                </div>
                <div className="relative">
                  <Textarea
                    id="customer_notes"
                    name="customer_notes"
                    value={formData.customer_notes || ''}
                    onChange={handleInputChange}
                    placeholder="Customer requirements, special instructions, or notes..."
                    className="font-mono text-sm leading-relaxed border-l-4 border-l-blue-500 focus:border-l-blue-600 bg-blue-50/30 dark:bg-blue-900/10 min-h-[120px] max-h-[400px] transition-all focus:ring-2 focus:border-primary"
                  />
                  <div className="absolute top-2 right-2">
                    <Eye className="h-4 w-4 text-blue-500/60" />
                  </div>
                </div>
                <p className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                  <Users className="h-3 w-3" />
                  Notes visible to the customer on the quotation.
                </p>
              </div>
              
              {/* Internal Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="merchant_notes" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-500" />
                    Internal Notes
                  </Label>
                  <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                </div>
                <div className="relative">
                  <Textarea
                    id="merchant_notes"
                    name="merchant_notes"
                    value={formData.merchant_notes || ''}
                    onChange={handleInputChange}
                    placeholder="Internal notes, driver instructions, or administrative notes..."
                    className="font-mono text-sm leading-relaxed border-l-4 border-l-orange-500 focus:border-l-orange-600 bg-orange-50/30 dark:bg-orange-900/10 min-h-[120px] max-h-[400px] transition-all focus:ring-2 focus:border-primary"
                  />
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-orange-500/60" />
                  </div>
                </div>
                <p className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
                  <User className="h-3 w-3" />
                  Internal notes, not visible to the customer.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Any other special requirements, pickup instructions, or additional information..."
                className="min-h-[100px] transition-all focus:ring-2 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
