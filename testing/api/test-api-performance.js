// Simple test to measure actual API performance
const testQuotationId = 'dd0a5159-4deb-4da4-8281-c36a0e1ed006'; // From terminal logs
const testEmail = 'admin.rixou@gmail.com';

async function testEmailAPI() {
  console.log('🧪 Testing email API performance...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/quotations/send-email-unified', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotation_id: testQuotationId,
        email: testEmail,
        language: 'en',
        bcc_emails: 'admin.rixou@gmail.com'
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  API Response Time: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const error = await response.json();
      console.log('❌ API Error:', error);
    }
    
    return duration;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ API Error after ${duration}ms:`, error.message);
    return duration;
  }
}

// Run the test
testEmailAPI();
