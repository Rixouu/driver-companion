// Test PDF generation for quotation
const fetch = require('node-fetch');

async function testPdfGeneration() {
  try {
    console.log('🧪 Testing PDF generation...');
    
    const response = await fetch('http://localhost:3000/api/quotations/generate-invoice-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        quotation_id: '8677fc05-006a-4287-923c-43341c83f8a7',
        language: 'en',
        include_details: true,
        status_label: 'PENDING'
      })
    });
    
    if (response.ok) {
      const pdfBuffer = await response.arrayBuffer();
      console.log('✅ PDF generated successfully:', pdfBuffer.byteLength, 'bytes');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ PDF generation failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return false;
  }
}

// Run the test
testPdfGeneration().then(success => {
  process.exit(success ? 0 : 1);
});
