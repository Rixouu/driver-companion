"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  Mail, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Send,
  Database,
  User,
  Calendar,
  MapPin,
  Car,
  DollarSign,
  Settings
} from 'lucide-react'

// =============================================================================
// ENHANCED EMAIL TEST COMPONENT - User-Friendly Testing
// =============================================================================

interface Quotation {
  id: string
  quote_number: number
  customer_name: string
  customer_email: string
  service_type: string
  vehicle_type: string
  pickup_location: string
  dropoff_location: string
  date: string
  time: string
  total_amount: number
  currency: string
  status: string
  created_at: string
}

interface Booking {
  id: string
  wp_id: string
  customer_name: string
  customer_email: string
  service_name: string
  vehicle_make: string
  vehicle_model: string
  pickup_location: string
  dropoff_location: string
  date: string
  time: string
  price_amount: number
  price_currency: string
  status: string
  created_at: string
}

interface TestResult {
  success: boolean
  messageId?: string
  error?: string
  duration?: number
  template?: string
  subject?: string
  htmlLength?: number
  textLength?: number
}

export function EnhancedEmailTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [dataLoadStatus, setDataLoadStatus] = useState<{
    quotations: 'loading' | 'success' | 'error' | 'unauthorized'
    bookings: 'loading' | 'success' | 'error' | 'unauthorized'
  }>({
    quotations: 'loading',
    bookings: 'loading'
  })
  
  // Data state
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Quotations state changed:', quotations?.length || 0, 'items')
  }, [quotations])

  useEffect(() => {
    console.log('🔄 Bookings state changed:', bookings?.length || 0, 'items')
  }, [bookings])
  
  // Test configuration
  const [testType, setTestType] = useState<'quotation' | 'booking' | 'template'>('quotation')
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const [testEmail, setTestEmail] = useState('')
  const [bccEmails, setBccEmails] = useState('booking@japandriver.com')
  const [showPreview, setShowPreview] = useState(false)

  // Load data on component mount
  useEffect(() => {
    loadTestData()
  }, [])

  const loadTestData = async () => {
    setIsLoadingData(true)
    try {
      // Load quotations
      console.log('🔄 Loading quotations...')
      const quotationsResponse = await fetch('/api/quotations?limit=10')
      console.log('📊 Quotations response status:', quotationsResponse.status)
      
        if (quotationsResponse.ok) {
          const quotationsData = await quotationsResponse.json()
          console.log('📋 Quotations data:', quotationsData)
          
          // Extract quotations array from the response structure
          const quotationsArray = quotationsData.quotations || quotationsData.data || quotationsData || []
          console.log('📋 Processed quotations array:', quotationsArray.length, 'items')
          
          setQuotations(quotationsArray)
          setDataLoadStatus(prev => ({ ...prev, quotations: 'success' }))
          
          // Set default test email from first quotation
          if (quotationsArray.length > 0) {
            setTestEmail(quotationsArray[0].customer_email || 'test@example.com')
          }
          
          // Force a re-render to ensure state is updated
          setTimeout(() => {
            console.log('🔄 Quotations state after timeout:', quotationsArray.length, 'items')
          }, 100)
      } else {
        console.warn('Failed to load quotations:', quotationsResponse.status)
        const errorText = await quotationsResponse.text()
        console.warn('Quotations error details:', errorText)
        
        if (quotationsResponse.status === 401) {
          setDataLoadStatus(prev => ({ ...prev, quotations: 'unauthorized' }))
          toast({
            title: "Authentication Required",
            description: "Please make sure you are logged in to load real data.",
            variant: "destructive",
          })
        } else {
          setDataLoadStatus(prev => ({ ...prev, quotations: 'error' }))
        }
      }

      // Load bookings
      console.log('🔄 Loading bookings...')
      const bookingsResponse = await fetch('/api/bookings?limit=10')
      console.log('📊 Bookings response status:', bookingsResponse.status)
      
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          console.log('📋 Bookings data:', bookingsData)
          
          // Extract bookings array from the response structure
          const bookingsArray = bookingsData.bookings || bookingsData.data || bookingsData || []
          console.log('📋 Processed bookings array:', bookingsArray.length, 'items')
          
          setBookings(bookingsArray)
          setDataLoadStatus(prev => ({ ...prev, bookings: 'success' }))
          
          // Force a re-render to ensure state is updated
          setTimeout(() => {
            console.log('🔄 Bookings state after timeout:', bookingsArray.length, 'items')
          }, 100)
      } else {
        console.warn('Failed to load bookings:', bookingsResponse.status)
        const errorText = await bookingsResponse.text()
        console.warn('Bookings error details:', errorText)
        
        if (bookingsResponse.status === 401) {
          setDataLoadStatus(prev => ({ ...prev, bookings: 'unauthorized' }))
          toast({
            title: "Authentication Required",
            description: "Please make sure you are logged in to load real data.",
            variant: "destructive",
          })
        } else {
          setDataLoadStatus(prev => ({ ...prev, bookings: 'error' }))
        }
        
        // Fallback to mock data if API fails
        const mockBookings: Booking[] = [
          {
            id: 'mock-booking-1',
            wp_id: 'BOO-000001',
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            service_name: 'Airport Transfer',
            vehicle_make: 'Toyota',
            vehicle_model: 'Alphard',
            pickup_location: 'Narita Airport',
            dropoff_location: 'Tokyo Station',
            date: '2024-01-15',
            time: '14:00',
            price_amount: 15000,
            price_currency: 'JPY',
            status: 'confirmed',
            created_at: new Date().toISOString()
          }
        ]
        setBookings(mockBookings)
      }

    } catch (error) {
      console.error('Error loading test data:', error)
      toast({
        title: "Warning",
        description: "Could not load real data. You can still test with manual input.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    if (testType === 'quotation' && !selectedQuotation) {
      toast({
        title: "Error",
        description: "Please select a quotation to test",
        variant: "destructive",
      })
      return
    }

    if (testType === 'booking' && !selectedBooking) {
      toast({
        title: "Error",
        description: "Please select a booking to test",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      let result: TestResult

      if (testType === 'quotation' && selectedQuotation) {
        result = await testQuotationEmail(selectedQuotation)
      } else if (testType === 'booking' && selectedBooking) {
        result = await testBookingEmail(selectedBooking)
      } else if (testType === 'template') {
        result = await testTemplateRendering()
      } else {
        throw new Error('Please select a quotation or booking to test')
      }

      setTestResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: "Email test completed successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: `Test failed: ${result.error}`,
          variant: "destructive",
        })
      }

    } catch (error) {
      console.error('Test failed:', error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      toast({
        title: "Error",
        description: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testQuotationEmail = async (quotation: Quotation): Promise<TestResult> => {
    const startTime = Date.now()
    
    const formData = new FormData()
    formData.append('email', testEmail)
    formData.append('quotation_id', quotation.id)
    formData.append('language', language)
    formData.append('bcc_emails', bccEmails)

    const response = await fetch('/api/quotations/send-email-unified', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to send quotation email')
    }

    const result = await response.json()
    
    return {
      success: true,
      messageId: result.messageId,
      duration: Date.now() - startTime,
      template: 'Quotation Sent',
      subject: `Your Quotation from Driver - QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`
    }
  }

  const testBookingEmail = async (booking: Booking): Promise<TestResult> => {
    const startTime = Date.now()
    
    const response = await fetch('/api/bookings/send-email-unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: booking.id,
        email_type: 'confirmation',
        language: language,
        bcc_emails: bccEmails,
        payment_data: {
          amount: booking.price_amount,
          currency: booking.price_currency,
          payment_method: 'Credit Card',
          transaction_id: 'TXN123456',
          paid_at: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to send booking email')
    }

    const result = await response.json()
    
    return {
      success: true,
      messageId: result.messageId,
      duration: Date.now() - startTime,
      template: 'Booking Confirmed',
      subject: `Booking Confirmed - ${booking.wp_id || booking.id}`
    }
  }

  const testTemplateRendering = async (): Promise<TestResult> => {
    const startTime = Date.now()
    
    const response = await fetch('/api/admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        templateName: 'Quotation Sent',
        category: 'quotation',
        variables: {
          quotation_id: 'QUO-JPDR-000001',
          customer_name: 'Test Customer',
          service_type: 'Airport Transfer',
          vehicle_type: 'Toyota Alphard',
          duration_hours: 2,
          pickup_location: 'Narita Airport',
          dropoff_location: 'Tokyo Station',
          date: '2024-01-15',
          time: '14:00',
          currency: 'JPY',
          service_total: 15000,
          final_total: 15000,
          language: language
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to test template rendering')
    }

    const result = await response.json()
    
    return {
      success: true,
      duration: Date.now() - startTime,
      template: result.template.name,
      subject: result.rendered.subject,
      htmlLength: result.rendered.html.length,
      textLength: result.rendered.text.length
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'JPY') {
      return `¥${amount.toLocaleString()}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Choose what to test and configure the settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-type">Test Type</Label>
              <Select value={testType} onValueChange={(value: 'quotation' | 'booking' | 'template') => setTestType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">Quotation Email</SelectItem>
                  <SelectItem value="booking">Booking Email</SelectItem>
                  <SelectItem value="template">Template Rendering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(value: 'en' | 'ja') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc-emails">BCC Emails (optional)</Label>
            <Input
              id="bcc-emails"
              value={bccEmails}
              onChange={(e) => setBccEmails(e.target.value)}
              placeholder="booking@japandriver.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Selection */}
      {testType !== 'template' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select {testType === 'quotation' ? 'Quotation' : 'Booking'}
            </CardTitle>
            <CardDescription>
              Choose from your actual {testType === 'quotation' ? 'quotations' : 'bookings'} or refresh to load latest data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button 
                onClick={loadTestData} 
                disabled={isLoadingData}
                variant="outline"
                size="sm"
              >
                {isLoadingData ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Data
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {testType === 'quotation' ? (Array.isArray(quotations) ? quotations.length : 0) : (Array.isArray(bookings) ? bookings.length : 0)} {testType === 'quotation' ? 'quotations' : 'bookings'} loaded
                </Badge>
                
                {/* Debug info */}
                <div className="text-xs text-gray-500">
                  Debug: quotations={Array.isArray(quotations) ? quotations.length : 'not array'}, 
                  bookings={Array.isArray(bookings) ? bookings.length : 'not array'}
                </div>
                
                {/* Data loading status indicators */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Quotations:</span>
                  {dataLoadStatus.quotations === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {dataLoadStatus.quotations === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {dataLoadStatus.quotations === 'unauthorized' && <XCircle className="h-3 w-3 text-red-500" />}
                  {dataLoadStatus.quotations === 'error' && <XCircle className="h-3 w-3 text-orange-500" />}
                  
                  <span className="text-gray-500 ml-2">Bookings:</span>
                  {dataLoadStatus.bookings === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {dataLoadStatus.bookings === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {dataLoadStatus.bookings === 'unauthorized' && <XCircle className="h-3 w-3 text-red-500" />}
                  {dataLoadStatus.bookings === 'error' && <XCircle className="h-3 w-3 text-orange-500" />}
                </div>
              </div>
            </div>

            {testType === 'quotation' ? (
              <div className="space-y-2 max-h-60 overflow-y-auto" key={`quotations-${quotations?.length || 0}`}>
                {Array.isArray(quotations) && quotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuotation?.id === quotation.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedQuotation(quotation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">QUO-{quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}</Badge>
                          <Badge variant={quotation.status === 'sent' ? 'default' : 'secondary'}>
                            {quotation.status}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{quotation.customer_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {quotation.pickup_location} → {quotation.dropoff_location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(quotation.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(quotation.total_amount, quotation.currency)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{quotation.service_type}</div>
                        <div className="text-xs text-gray-500">{quotation.vehicle_type}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {Array.isArray(quotations) && quotations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No quotations found</p>
                    <p className="text-sm">Make sure you're logged in and have quotations in your database</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto" key={`bookings-${bookings?.length || 0}`}>
                {Array.isArray(bookings) && bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBooking?.id === booking.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{booking.wp_id || booking.id}</Badge>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{booking.customer_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.pickup_location} → {booking.dropoff_location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(booking.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(booking.price_amount, booking.price_currency)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{booking.service_name}</div>
                        <div className="text-xs text-gray-500">{booking.vehicle_make} {booking.vehicle_model}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {Array.isArray(bookings) && bookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No bookings found</p>
                    <p className="text-sm">Make sure you're logged in and have bookings in your database</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Run Test
          </CardTitle>
          <CardDescription>
            Execute the email test with your selected configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={handleTestEmail} 
              disabled={isLoading || !testEmail || (testType === 'quotation' && !selectedQuotation) || (testType === 'booking' && !selectedBooking)}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {testType === 'template' ? 'Test Template Rendering' : 'Send Test Email'}
            </Button>
            
            <Button 
              onClick={() => setShowPreview(!showPreview)} 
              variant="outline"
              disabled={!testResult}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">Test completed successfully!</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {testResult.template && (
                    <div>
                      <span className="font-medium">Template:</span> {testResult.template}
                    </div>
                  )}
                  {testResult.subject && (
                    <div>
                      <span className="font-medium">Subject:</span> {testResult.subject}
                    </div>
                  )}
                  {testResult.messageId && (
                    <div>
                      <span className="font-medium">Message ID:</span> {testResult.messageId}
                    </div>
                  )}
                  {testResult.duration && (
                    <div>
                      <span className="font-medium">Duration:</span> {testResult.duration}ms
                    </div>
                  )}
                  {testResult.htmlLength && (
                    <div>
                      <span className="font-medium">HTML Length:</span> {testResult.htmlLength} characters
                    </div>
                  )}
                  {testResult.textLength && (
                    <div>
                      <span className="font-medium">Text Length:</span> {testResult.textLength} characters
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 font-medium">Test failed</span>
                </div>
                {testResult.error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <span className="font-medium">Error:</span> {testResult.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
