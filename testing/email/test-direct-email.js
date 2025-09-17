#!/usr/bin/env node

// =============================================================================
// DIRECT EMAIL TEST - Using notification templates directly
// =============================================================================

const fetch = globalThis.fetch || require('node-fetch')

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testDirectEmail() {
  console.log('🧪 [DIRECT-EMAIL-TEST] Testing direct email sending to admin.rixou@gmail.com')
  
  try {
    // Test 1: Use the email template API to send a test email
    console.log('\n📧 [DIRECT-EMAIL-TEST] Step 1: Testing email template API')
    
    const templateResponse = await fetch(`${API_BASE}/api/email/send-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateName: 'Quotation Sent',
        to: 'admin.rixou@gmail.com',
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
          language: 'en',
          greeting_text: 'Thank you for your quotation request.',
          from_name: 'Driver Japan Team',
          primary_color: '#dc2626'
        },
        team: 'japan',
        language: 'en',
        bcc: [] // No BCC as requested
      })
    })
    
    const templateResult = await templateResponse.json()
    
    if (templateResponse.ok) {
      console.log('✅ [DIRECT-EMAIL-TEST] Email sent successfully via template API!')
      console.log(`   Message ID: ${templateResult.messageId}`)
      console.log(`   Template: ${templateResult.template}`)
      console.log('\n📬 [DIRECT-EMAIL-TEST] Please check admin.rixou@gmail.com for the email!')
    } else {
      console.log('❌ [DIRECT-EMAIL-TEST] Template email failed:')
      console.log(`   Status: ${templateResponse.status}`)
      console.log(`   Error: ${templateResult.error || 'Unknown error'}`)
    }
    
    // Test 2: Try the admin email templates endpoint
    console.log('\n📧 [DIRECT-EMAIL-TEST] Step 2: Testing admin email templates API')
    
    const adminTemplateResponse = await fetch(`${API_BASE}/api/admin/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        templateName: 'Quotation Sent',
        category: 'quotation',
        variables: {
          quotation_id: 'QUO-JPDR-000002',
          customer_name: 'Test Customer 2',
          service_type: 'Charter Service',
          vehicle_type: 'Toyota Hiace',
          duration_hours: 8,
          pickup_location: 'Tokyo Station',
          dropoff_location: 'Narita Airport',
          date: '2024-01-16',
          time: '09:00',
          currency: 'JPY',
          service_total: 25000,
          final_total: 25000,
          language: 'en',
          greeting_text: 'Thank you for your quotation request.',
          from_name: 'Driver Japan Team',
          primary_color: '#dc2626'
        }
      })
    })
    
    const adminTemplateResult = await adminTemplateResponse.json()
    
    if (adminTemplateResponse.ok) {
      console.log('✅ [DIRECT-EMAIL-TEST] Admin template test successful!')
      console.log(`   Template: ${adminTemplateResult.template.name}`)
      console.log(`   Subject: ${adminTemplateResult.rendered.subject}`)
      console.log(`   HTML length: ${adminTemplateResult.rendered.html.length} characters`)
    } else {
      console.log('❌ [DIRECT-EMAIL-TEST] Admin template test failed:')
      console.log(`   Status: ${adminTemplateResponse.status}`)
      console.log(`   Error: ${adminTemplateResult.error || 'Unknown error'}`)
    }
    
    // Test 3: Try to send a system notification email
    console.log('\n📧 [DIRECT-EMAIL-TEST] Step 3: Testing system notification email')
    
    const systemResponse = await fetch(`${API_BASE}/api/email/send-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateName: 'System Notification',
        to: 'admin.rixou@gmail.com',
        variables: {
          subject: 'Test Email from Migration',
          title: 'Migration Test Email',
          message: 'This is a test email sent during the email route migration process. The unified email system is working correctly!',
          company_name: 'Driver Japan',
          language: 'en'
        },
        team: 'japan',
        language: 'en',
        bcc: [] // No BCC as requested
      })
    })
    
    const systemResult = await systemResponse.json()
    
    if (systemResponse.ok) {
      console.log('✅ [DIRECT-EMAIL-TEST] System notification email sent successfully!')
      console.log(`   Message ID: ${systemResult.messageId}`)
      console.log(`   Template: ${systemResult.template}`)
      console.log('\n📬 [DIRECT-EMAIL-TEST] Please check admin.rixou@gmail.com for the system notification email!')
    } else {
      console.log('❌ [DIRECT-EMAIL-TEST] System notification email failed:')
      console.log(`   Status: ${systemResponse.status}`)
      console.log(`   Error: ${systemResult.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.error('❌ [DIRECT-EMAIL-TEST] Test failed:', error)
  }
}

// Run the test
testDirectEmail()
