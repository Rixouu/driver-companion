import { NextRequest, NextResponse } from 'next/server'
import { generateEmailTemplate } from '@/lib/email/email-partials'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email partials integration...')
    
    // Test data
    const testData = {
      customerName: 'John Doe',
      language: 'en' as const,
      team: 'japan' as const,
      title: 'Test Email',
      subtitle: 'Testing Email Partials',
      content: '<p>This is a test email to verify that email partials are working correctly with the database integration.</p>',
      primaryColor: '#FF2800',
      secondaryColor: '#FF2800dd',
      logoUrl: 'https://japandriver.com/img/driver-invoice-logo.png'
    }
    
    // Generate email template using database partials
    const emailHTML = await generateEmailTemplate(testData)
    
    return NextResponse.json({
      success: true,
      message: 'Email partials integration test successful',
      emailHTML: emailHTML.substring(0, 500) + '...', // Truncate for response
      testData
    })
    
  } catch (error) {
    console.error('Error testing email partials:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Email partials test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
