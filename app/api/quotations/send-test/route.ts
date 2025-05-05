import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function GET(request: NextRequest) {
  console.log('📧 [TEST EMAIL API] Starting test email route');
  
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('📧 [TEST EMAIL API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('📧 [TEST EMAIL API] RESEND_API_KEY environment variable is not configured');
      return NextResponse.json(
        { error: 'RESEND_API_KEY environment variable is not configured' },
        { status: 500 }
      );
    }

    console.log('📧 [TEST EMAIL API] Resend API key is configured:', 
      process.env.RESEND_API_KEY.substring(0, 8) + '...');
    
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get email domain from env or fallback
    const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
    
    // Send test email
    console.log('📧 [TEST EMAIL API] Sending test email to:', session.user.email);
    const { data: emailData, error } = await resend.emails.send({
      from: `Driver Japan <quotations@${emailDomain}>`,
      to: [session.user.email || ''],
      subject: 'Test Email from Vehicle Inspection App',
      text: 'This is a test email to verify the Resend API is working correctly in the app.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #e03e2d;">Email Test from Driver Japan</h1>
          <p>This is a test email sent at: ${new Date().toISOString()}</p>
          <p>If you're seeing this, the email sending system is working correctly.</p>
          <p>Your user ID: ${session.user.id}</p>
        </div>
      `
    });
    
    if (error) {
      console.error('📧 [TEST EMAIL API] Error sending test email:', error);
      return NextResponse.json(
        { error: 'Failed to send test email', details: error },
        { status: 500 }
      );
    }
    
    console.log('📧 [TEST EMAIL API] Test email sent successfully:', emailData);
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: emailData?.id || 'unknown'
    });
  } catch (error) {
    console.error('📧 [TEST EMAIL API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 