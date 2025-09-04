'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CustomerSegment } from '@/types/customers'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, User, CreditCard, FileText, Check } from 'lucide-react'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  segment_id: z.string().optional(),
  notes: z.string().optional(),
  // Billing address fields
  billing_company_name: z.string().optional(),
  billing_street_number: z.string().optional(),
  billing_street_name: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_postal_code: z.string().optional(),
  billing_country: z.string().optional(),
  billing_tax_number: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: Partial<CustomerFormValues> & { id?: string }
  segments: CustomerSegment[]
  isEditing?: boolean
}

export function CustomerForm({ initialData, segments, isEditing = false }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      segment_id: initialData?.segment_id ? initialData.segment_id : 'none',
      notes: initialData?.notes || '',
      // Billing address fields
      billing_company_name: initialData?.billing_company_name || '',
      billing_street_number: initialData?.billing_street_number || '',
      billing_street_name: initialData?.billing_street_name || '',
      billing_city: initialData?.billing_city || '',
      billing_state: initialData?.billing_state || '',
      billing_postal_code: initialData?.billing_postal_code || '',
      billing_country: initialData?.billing_country || '',
      billing_tax_number: initialData?.billing_tax_number || '',
    },
  })

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEditing) {
      form.reset({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        segment_id: initialData.segment_id ? initialData.segment_id : 'none',
        notes: initialData.notes || '',
        // Billing address fields
        billing_company_name: initialData.billing_company_name || '',
        billing_street_number: initialData.billing_street_number || '',
        billing_street_name: initialData.billing_street_name || '',
        billing_city: initialData.billing_city || '',
        billing_state: initialData.billing_state || '',
        billing_postal_code: initialData.billing_postal_code || '',
        billing_country: initialData.billing_country || '',
        billing_tax_number: initialData.billing_tax_number || '',
      })
    }
  }, [initialData, isEditing, form])

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true)
    
    try {
      const url = isEditing && initialData?.id 
        ? `/api/customers/${initialData.id}` 
        : '/api/customers'
        
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          segment_id: data.segment_id === 'none' ? null : data.segment_id
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save customer')
      }

      const customer = await response.json()
      
      console.log('Customer saved successfully:', customer)
      console.log('Is editing:', isEditing)
      console.log('Initial data ID:', initialData?.id)
      
      toast({
        title: isEditing 
          ? 'Customer updated successfully' 
          : 'Customer created successfully',
        variant: 'default',
      })
      
      if (isEditing && initialData?.id) {
        // Redirect back to customer details page after successful update
        console.log('Redirecting to customer details:', `/customers/${initialData.id}`)
        router.push(`/customers/${initialData.id}`)
      } else {
        // For new customers, redirect to the new customer's details page
        console.log('Redirecting to new customer details:', `/customers/${customer.id}`)
        router.push(`/customers/${customer.id}`)
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: 'Failed to save customer',
        description: error instanceof Error 
          ? error.message 
          : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Container with Subtle Background */}
        <div className="rounded-lg bg-muted/30 p-6 space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Personal Information - Left Column */}
            <Card className="border-0 shadow-sm bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">Basic personal details and contact information</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground mb-2 block">
                        Full Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter customer name" 
                          className="h-10 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email and Phone - Same row on desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="customer@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Customer Segment */}
                <FormField
                  control={form.control}
                  name="segment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Segment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a segment (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Segment</SelectItem>
                          {segments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full bg-gray-400" 
                                  data-segment-color={segment.color}
                                />
                                {segment.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Billing Information - Right Column */}
            <Card className="border-0 shadow-sm bg-background/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <CreditCard className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Billing Information</h3>
                    <p className="text-sm text-muted-foreground">Billing details and company information</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name and Tax Number - Same row on desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name for billing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_tax_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax ID or VAT number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Street Number and Street Name - Same row on desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_street_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Street number or building name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_street_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Street name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* City and State - Same row on desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State or province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Postal Code and Country - Same row on desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billing_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes - Full Width Below */}
          <Card className="border-0 shadow-sm bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Notes</h3>
                  <p className="text-sm text-muted-foreground">Additional information about the customer</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this customer..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>All changes will be saved when you submit the form</span>
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 shadow-lg hover:shadow-xl transition-all duration-200" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Customer' : 'Add Customer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
    )
}

// Export a simpler customer display component for read-only views
export function CustomerDisplay({ customer }: { customer: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {customer.name}
        </CardTitle>
        <CardDescription>
          Customer since {new Date(customer.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Email</Label>
            <p className="text-sm">{customer.email}</p>
          </div>
          
          {customer.phone && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
              <p className="text-sm">{customer.phone}</p>
            </div>
          )}
          
          {customer.address && (
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
              <p className="text-sm">{customer.address}</p>
            </div>
          )}
          
          {customer.notes && (
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
