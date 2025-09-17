#!/usr/bin/env node

// =============================================================================
// TEST REAL EMAIL SENDING
// =============================================================================

const fetch = globalThis.fetch || require('node-fetch')

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testRealEmail() {
  console.log('🧪 [REAL-EMAIL-TEST] Testing real email sending to admin.rixou@gmail.com')
  
  try {
    // First, let's check if we have any quotations in the database
    console.log('\n📋 [REAL-EMAIL-TEST] Step 1: Checking for existing quotations')
    
    const quotationsResponse = await fetch(`${API_BASE}/api/quotations`)
    if (quotationsResponse.ok) {
      const quotationsData = await quotationsResponse.json()
      console.log(`✅ [REAL-EMAIL-TEST] Found ${quotationsData.length || 0} quotations in database`)
      
      if (quotationsData.length > 0) {
        const firstQuotation = quotationsData[0]
        console.log(`   Using quotation: ${firstQuotation.id} - ${firstQuotation.customer_name}`)
        
        // Test the migrated send-email route with real data
        console.log('\n📧 [REAL-EMAIL-TEST] Step 2: Sending real email')
        
        const formData = new FormData()
        formData.append('quotation_id', firstQuotation.id)
        formData.append('email', 'admin.rixou@gmail.com')
        formData.append('language', 'en')
        formData.append('bcc_emails', '') // No BCC as requested
        
        const response = await fetch(`${API_BASE}/api/quotations/send-email`, {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (response.ok) {
          console.log('✅ [REAL-EMAIL-TEST] Email sent successfully!')
          console.log(`   Message ID: ${result.messageId}`)
          console.log(`   Quotation ID: ${result.quotationId}`)
          console.log(`   Email: ${result.email}`)
          console.log(`   Language: ${result.language}`)
          console.log(`   Is Updated: ${result.isUpdated}`)
          console.log('\n📬 [REAL-EMAIL-TEST] Please check admin.rixou@gmail.com for the email!')
        } else {
          console.log('❌ [REAL-EMAIL-TEST] Email sending failed:')
          console.log(`   Status: ${response.status}`)
          console.log(`   Error: ${result.error || 'Unknown error'}`)
        }
      } else {
        console.log('⚠️ [REAL-EMAIL-TEST] No quotations found in database')
        console.log('   Creating a test quotation first...')
        
        // Create a test quotation
        const testQuotation = {
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
          status: 'draft'
        }
        
        const createResponse = await fetch(`${API_BASE}/api/quotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testQuotation)
        })
        
        if (createResponse.ok) {
          const createdQuotation = await createResponse.json()
          console.log(`✅ [REAL-EMAIL-TEST] Test quotation created: ${createdQuotation.id}`)
          
          // Now send the email
          console.log('\n📧 [REAL-EMAIL-TEST] Sending email with test quotation')
          
          const formData = new FormData()
          formData.append('quotation_id', createdQuotation.id)
          formData.append('email', 'admin.rixou@gmail.com')
          formData.append('language', 'en')
          formData.append('bcc_emails', '') // No BCC as requested
          
          const response = await fetch(`${API_BASE}/api/quotations/send-email`, {
            method: 'POST',
            body: formData
          })
          
          const result = await response.json()
          
          if (response.ok) {
            console.log('✅ [REAL-EMAIL-TEST] Email sent successfully!')
            console.log(`   Message ID: ${result.messageId}`)
            console.log(`   Quotation ID: ${result.quotationId}`)
            console.log(`   Email: ${result.email}`)
            console.log(`   Language: ${result.language}`)
            console.log('\n📬 [REAL-EMAIL-TEST] Please check admin.rixou@gmail.com for the email!')
          } else {
            console.log('❌ [REAL-EMAIL-TEST] Email sending failed:')
            console.log(`   Status: ${response.status}`)
            console.log(`   Error: ${result.error || 'Unknown error'}`)
          }
        } else {
          console.log('❌ [REAL-EMAIL-TEST] Failed to create test quotation')
          const errorData = await createResponse.json()
          console.log(`   Error: ${errorData.error || 'Unknown error'}`)
        }
      }
    } else {
      console.log('❌ [REAL-EMAIL-TEST] Failed to fetch quotations from database')
    }
    
  } catch (error) {
    console.error('❌ [REAL-EMAIL-TEST] Test failed:', error)
  }
}

// Run the test
testRealEmail()
