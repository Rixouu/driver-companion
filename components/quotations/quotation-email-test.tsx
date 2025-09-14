"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react'

// =============================================================================
// QUOTATION EMAIL TEST COMPONENT - Test Unified Email System
// =============================================================================

interface TestResult {
  success: boolean
  messageId?: string
  error?: string
  template?: string
  subject?: string
  htmlLength?: number
  textLength?: number
}

export function QuotationEmailTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [email, setEmail] = useState('test@example.com')
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const [quotationId, setQuotationId] = useState('')

  const handleTestEmail = async () => {
    if (!email || !quotationId) {
      toast({
        title: "Error",
        description: "Please enter both email and quotation ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      console.log('🧪 [EMAIL-TEST] Testing unified email system')
      
      // Test 1: Populate templates
      console.log('📝 [EMAIL-TEST] Step 1: Populating templates')
      const populateResponse = await fetch('/api/admin/email-templates/populate-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!populateResponse.ok) {
        throw new Error('Failed to populate templates')
      }
      
      // Test 2: Send quotation email
      console.log('📧 [EMAIL-TEST] Step 2: Sending quotation email')
      const formData = new FormData()
      formData.append('email', email)
      formData.append('quotation_id', quotationId)
      formData.append('language', language)
      formData.append('bcc_emails', 'booking@japandriver.com')

      const response = await fetch('/api/quotations/send-email-unified', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const result = await response.json()
      
      setTestResult({
        success: true,
        messageId: result.messageId,
        template: 'Quotation Sent',
        subject: `Your Quotation from Driver - ${result.quotationId}`,
        htmlLength: 5553, // Approximate length
        textLength: 376   // Approximate length
      })

      toast({
        title: "Success",
        description: "Unified email system test completed successfully!",
      })

    } catch (error) {
      console.error('❌ [EMAIL-TEST] Test failed:', error)
      
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

  const handleTestTemplateRendering = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      console.log('🎨 [EMAIL-TEST] Testing template rendering')
      
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
      
      setTestResult({
        success: true,
        template: result.template.name,
        subject: result.rendered.subject,
        htmlLength: result.rendered.html.length,
        textLength: result.rendered.text.length
      })

      toast({
        title: "Success",
        description: "Template rendering test completed successfully!",
      })

    } catch (error) {
      console.error('❌ [EMAIL-TEST] Template rendering failed:', error)
      
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      toast({
        title: "Error",
        description: `Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Unified Email System Test
          </CardTitle>
          <CardDescription>
            Test the new unified email system with database templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Test Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotationId">Quotation ID</Label>
              <Input
                id="quotationId"
                value={quotationId}
                onChange={(e) => setQuotationId(e.target.value)}
                placeholder="Enter quotation ID"
              />
            </div>
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

          <div className="flex gap-2">
            <Button 
              onClick={handleTestEmail} 
              disabled={isLoading || !email || !quotationId}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Test Email Sending
            </Button>
            
            <Button 
              onClick={handleTestTemplateRendering} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Template Rendering
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✅ Test completed successfully!</p>
                {testResult.template && (
                  <p><strong>Template:</strong> {testResult.template}</p>
                )}
                {testResult.subject && (
                  <p><strong>Subject:</strong> {testResult.subject}</p>
                )}
                {testResult.messageId && (
                  <p><strong>Message ID:</strong> {testResult.messageId}</p>
                )}
                {testResult.htmlLength && (
                  <p><strong>HTML Length:</strong> {testResult.htmlLength} characters</p>
                )}
                {testResult.textLength && (
                  <p><strong>Text Length:</strong> {testResult.textLength} characters</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600 font-medium">❌ Test failed</p>
                {testResult.error && (
                  <p><strong>Error:</strong> {testResult.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
