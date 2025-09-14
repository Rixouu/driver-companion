#!/usr/bin/env node

// =============================================================================
// UNIFIED EMAIL SYSTEM TEST SCRIPT
// =============================================================================

// Use built-in fetch for Node.js 18+ or install node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch')

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testUnifiedEmailSystem() {
  console.log('🧪 [EMAIL-TEST] Starting unified email system test')
  
  try {
    // Test 1: Populate templates
    console.log('\n📝 [EMAIL-TEST] Step 1: Populating unified templates')
    const populateResponse = await fetch(`${API_BASE}/api/admin/email-templates/populate-unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!populateResponse.ok) {
      throw new Error(`Failed to populate templates: ${populateResponse.statusText}`)
    }
    
    const populateResult = await populateResponse.json()
    console.log(`✅ [EMAIL-TEST] Templates populated: ${populateResult.message}`)
    
    // Test 2: Get templates
    console.log('\n📋 [EMAIL-TEST] Step 2: Fetching templates')
    const templatesResponse = await fetch(`${API_BASE}/api/admin/email-templates?category=quotation`)
    
    if (!templatesResponse.ok) {
      throw new Error(`Failed to fetch templates: ${templatesResponse.statusText}`)
    }
    
    const templatesResult = await templatesResponse.json()
    console.log(`✅ [EMAIL-TEST] Found ${templatesResult.count} quotation templates`)
    
    // Test 3: Test template rendering
    console.log('\n🎨 [EMAIL-TEST] Step 3: Testing template rendering')
    const testRenderResponse = await fetch(`${API_BASE}/api/admin/email-templates`, {
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
          language: 'en'
        }
      })
    })
    
    if (!testRenderResponse.ok) {
      throw new Error(`Failed to test template rendering: ${testRenderResponse.statusText}`)
    }
    
    const renderResult = await testRenderResponse.json()
    console.log(`✅ [EMAIL-TEST] Template rendering successful`)
    console.log(`   Subject: ${renderResult.rendered.subject}`)
    console.log(`   HTML length: ${renderResult.rendered.html.length} characters`)
    console.log(`   Text length: ${renderResult.rendered.text.length} characters`)
    
    // Test 4: Cache statistics
    console.log('\n💾 [EMAIL-TEST] Step 4: Checking cache statistics')
    const cacheResponse = await fetch(`${API_BASE}/api/admin/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cache_stats' })
    })
    
    if (cacheResponse.ok) {
      const cacheResult = await cacheResponse.json()
      console.log(`✅ [EMAIL-TEST] Cache stats: ${cacheResult.cache.size} templates cached`)
    }
    
    console.log('\n🎉 [EMAIL-TEST] All tests passed! Unified email system is working correctly.')
    
  } catch (error) {
    console.error('❌ [EMAIL-TEST] Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testUnifiedEmailSystem()
}

module.exports = { testUnifiedEmailSystem }
