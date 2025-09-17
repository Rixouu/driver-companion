#!/usr/bin/env node

// =============================================================================
// SIMPLE REAL EMAIL TEST - Direct quotation ID
// =============================================================================

const fetch = globalThis.fetch || require('node-fetch')

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testRealEmailSimple() {
  console.log('🧪 [SIMPLE-EMAIL-TEST] Testing real email sending to admin.rixou@gmail.com')
  
  try {
    // Let's try with a common quotation ID pattern
    // First, let's try to get a quotation ID from the database using a direct query
    console.log('\n📋 [SIMPLE-EMAIL-TEST] Step 1: Trying to find a quotation ID')
    
    // Try a few common quotation ID patterns
    const testQuotationIds = [
      'test-quotation-1',
      'quotation-1', 
      '1',
      '2',
      '3'
    ]
    
    let foundQuotationId = null
    
    for (const quotationId of testQuotationIds) {
      console.log(`   Trying quotation ID: ${quotationId}`)
      
      const formData = new FormData()
      formData.append('quotation_id', quotationId)
      formData.append('email', 'admin.rixou@gmail.com')
      formData.append('language', 'en')
      formData.append('bcc_emails', '') // No BCC as requested
      
      const response = await fetch(`${API_BASE}/api/quotations/send-email`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log(`✅ [SIMPLE-EMAIL-TEST] Email sent successfully with quotation ID: ${quotationId}`)
        console.log(`   Message ID: ${result.messageId}`)
        console.log(`   Quotation ID: ${result.quotationId}`)
        console.log(`   Email: ${result.email}`)
        console.log(`   Language: ${result.language}`)
        console.log(`   Is Updated: ${result.isUpdated}`)
        console.log('\n📬 [SIMPLE-EMAIL-TEST] Please check admin.rixou@gmail.com for the email!')
        foundQuotationId = quotationId
        break
      } else if (result.error && result.error.includes('not found')) {
        console.log(`   ❌ Quotation ${quotationId} not found`)
      } else {
        console.log(`   ⚠️ Error with quotation ${quotationId}: ${result.error}`)
      }
    }
    
    if (!foundQuotationId) {
      console.log('\n📝 [SIMPLE-EMAIL-TEST] No existing quotations found, creating a test quotation...')
      
      // Create a test quotation using the unified endpoint
      const testQuotationData = {
        customer_name: 'Test Customer',
        customer_email: 'admin.rixou@gmail.com',
        service_type: 'Airport Transfer',
        vehicle_type: 'Toyota Alphard',
        pickup_location: 'Narita Airport',
        dropoff_location: 'Tokyo Station',
        date: '2024-01-15',
        time: '14:00',
        duration_hours: 2,
        total_amount: 15000,
        currency: 'JPY',
        status: 'draft',
        quote_number: Math.floor(Math.random() * 1000000) + 1
      }
      
      // Try to create a quotation using the service client directly
      console.log('   Creating test quotation...')
      
      // For now, let's try with a hardcoded quotation ID that we'll create
      const testId = `test-${Date.now()}`
      
      // Create a minimal quotation object for testing
      const minimalQuotation = {
        id: testId,
        customer_name: 'Test Customer',
        customer_email: 'admin.rixou@gmail.com',
        service_type: 'Airport Transfer',
        vehicle_type: 'Toyota Alphard',
        pickup_location: 'Narita Airport',
        dropoff_location: 'Tokyo Station',
        date: '2024-01-15',
        time: '14:00',
        duration_hours: 2,
        total_amount: 15000,
        currency: 'JPY',
        status: 'draft',
        quote_number: Math.floor(Math.random() * 1000000) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Since we can't easily create a quotation through the API without auth,
      // let's test the email system with a mock quotation by testing the unified endpoint directly
      console.log('\n📧 [SIMPLE-EMAIL-TEST] Testing unified email endpoint directly...')
      
      const unifiedFormData = new FormData()
      unifiedFormData.append('quotation_id', testId)
      unifiedFormData.append('email', 'admin.rixou@gmail.com')
      unifiedFormData.append('language', 'en')
      unifiedFormData.append('bcc_emails', '') // No BCC as requested
      
      const unifiedResponse = await fetch(`${API_BASE}/api/quotations/send-email-unified`, {
        method: 'POST',
        body: unifiedFormData
      })
      
      const unifiedResult = await unifiedResponse.json()
      
      if (unifiedResponse.ok) {
        console.log('✅ [SIMPLE-EMAIL-TEST] Unified email sent successfully!')
        console.log(`   Message ID: ${unifiedResult.messageId}`)
        console.log(`   Quotation ID: ${unifiedResult.quotationId}`)
        console.log(`   Email: ${unifiedResult.email}`)
        console.log(`   Language: ${unifiedResult.language}`)
        console.log('\n📬 [SIMPLE-EMAIL-TEST] Please check admin.rixou@gmail.com for the email!')
      } else {
        console.log('❌ [SIMPLE-EMAIL-TEST] Unified email failed:')
        console.log(`   Status: ${unifiedResponse.status}`)
        console.log(`   Error: ${unifiedResult.error || 'Unknown error'}`)
      }
    }
    
  } catch (error) {
    console.error('❌ [SIMPLE-EMAIL-TEST] Test failed:', error)
  }
}

// Run the test
testRealEmailSimple()
