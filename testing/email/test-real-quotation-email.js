#!/usr/bin/env node

// =============================================================================
// REAL QUOTATION EMAIL TEST - Using actual quotation data
// =============================================================================

const fetch = globalThis.fetch || require('node-fetch')

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testRealQuotationEmail() {
  console.log('🧪 [REAL-QUOTATION-TEST] Testing with real quotation data')
  
  try {
    // Use the first real quotation ID from the database
    const realQuotationId = 'a079eee1-b110-4df4-96c2-32de1f47f66b'
    const testEmail = 'admin.rixou@gmail.com'
    
    console.log(`\n📋 [REAL-QUOTATION-TEST] Using real quotation: ${realQuotationId}`)
    console.log(`   Customer: Dear`)
    console.log(`   Service: Airport Transfer Haneda`)
    console.log(`   Vehicle: Mercedes V-class Black Suites`)
    console.log(`   Amount: ¥46,000`)
    
    // Test the migrated send-email route with real data
    console.log('\n📧 [REAL-QUOTATION-TEST] Sending email with real quotation data')
    
    const formData = new FormData()
    formData.append('quotation_id', realQuotationId)
    formData.append('email', testEmail)
    formData.append('language', 'en')
    formData.append('bcc_emails', '') // No BCC as requested
    
    const response = await fetch(`${API_BASE}/api/quotations/send-email`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ [REAL-QUOTATION-TEST] Email sent successfully!')
      console.log(`   Message ID: ${result.messageId}`)
      console.log(`   Quotation ID: ${result.quotationId}`)
      console.log(`   Email: ${result.email}`)
      console.log(`   Language: ${result.language}`)
      console.log(`   Is Updated: ${result.isUpdated}`)
      console.log('\n📬 [REAL-QUOTATION-TEST] Please check admin.rixou@gmail.com for the email!')
      
      // Also test with Japanese
      console.log('\n📧 [REAL-QUOTATION-TEST] Testing Japanese version...')
      
      const japaneseFormData = new FormData()
      japaneseFormData.append('quotation_id', realQuotationId)
      japaneseFormData.append('email', testEmail)
      japaneseFormData.append('language', 'ja')
      japaneseFormData.append('bcc_emails', '') // No BCC as requested
      
      const japaneseResponse = await fetch(`${API_BASE}/api/quotations/send-email`, {
        method: 'POST',
        body: japaneseFormData
      })
      
      const japaneseResult = await japaneseResponse.json()
      
      if (japaneseResponse.ok) {
        console.log('✅ [REAL-QUOTATION-TEST] Japanese email sent successfully!')
        console.log(`   Message ID: ${japaneseResult.messageId}`)
        console.log('\n📬 [REAL-QUOTATION-TEST] Please check admin.rixou@gmail.com for the Japanese email!')
      } else {
        console.log('❌ [REAL-QUOTATION-TEST] Japanese email failed:')
        console.log(`   Status: ${japaneseResponse.status}`)
        console.log(`   Error: ${japaneseResult.error || 'Unknown error'}`)
      }
      
    } else {
      console.log('❌ [REAL-QUOTATION-TEST] Email sending failed:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${result.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.error('❌ [REAL-QUOTATION-TEST] Test failed:', error)
  }
}

// Run the test
testRealQuotationEmail()
