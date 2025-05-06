import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  console.log('==================== REJECT ROUTE START ====================');
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();
  
  console.log('Reject route - Session check result:', await supabase.auth.getSession().then(res => res.data.session ? 'Active session found' : 'No session'));

  try {
    const { id, reason, customerId } = await request.json();
    
    console.log(`Reject route - Request data: id=${id}, reason=${reason ? 'provided' : 'null'}, customerId=${customerId || 'null'}`);
    
    if (!id) {
      console.log('Reject route - Missing quotation ID');
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Get current session - this may be null for public access
    const { data: { session } } = await supabase.auth.getSession();
    
    // Fetch the quotation
    console.log(`Reject route - Fetching quotation with ID: ${id}`);
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Reject route - Error fetching quotation:', fetchError);
      return NextResponse.json(
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }
    
    console.log(`Reject route - Quotation fetched successfully. ID: ${quotation.id}, Status: ${quotation.status}, Quote Number: ${quotation.quote_number}`);
    
    // Check if the quotation can be rejected
    if (['approved', 'rejected', 'converted'].includes(quotation.status)) {
      console.log(`Reject route - Cannot reject quotation with status: ${quotation.status}`);
      return NextResponse.json(
        { error: t('quotations.notifications.cannotReject') },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'rejected' and add rejection reason
    console.log('Reject route - Updating quotation status to rejected');
    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        rejected_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Reject route - Error updating quotation status:', updateError);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    console.log(`Reject route - Quotation status updated successfully to: ${updatedQuotation.status}`);
    
    // Create activity log
    // If session exists, use user_id, otherwise use customerId or a placeholder
    const userId = session?.user?.id || customerId || '00000000-0000-0000-0000-000000000000';
    console.log(`Reject route - Creating activity log with user ID: ${userId}`);
    
    try {
      const { error: activityError } = await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: userId,
          action: 'rejected',
          details: { reason: reason || 'No reason provided' }
        });
        
      if (activityError) {
        console.error('Reject route - Error creating activity log:', activityError);
      } else {
        console.log('Reject route - Activity log created successfully');
      }
    } catch (activityError) {
      console.error('Reject route - Exception creating activity log:', activityError);
    }
    
    // Send email notification if Resend API key is configured
    if (process.env.RESEND_API_KEY) {
      console.log('Reject route - Preparing to send email notification');
      console.log(`Reject route - RESEND_API_KEY configured: ${!!process.env.RESEND_API_KEY}`);
      console.log(`Reject route - Email domain: ${process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com'}`);
      console.log(`Reject route - Admin email: ${process.env.ADMIN_EMAIL || 'info@japandriver.com'}`);
      
      try {
        // Initialize Resend with API key
        const resend = new Resend(process.env.RESEND_API_KEY);
        console.log('Reject route - Resend client initialized');
        
        // Get email domain from env or fallback
        const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
        
        // Get the public URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
        
        // Format quotation ID to use JPDR prefix
        const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
        
        // Email subject
        const emailSubject = `Quotation Rejected - ${formattedQuotationId}`;
        
        console.log(`Reject route - Sending email notification to ${process.env.ADMIN_EMAIL || 'info@japandriver.com'}`);
        
        // Prepare email content
        const emailText = `Quotation ${formattedQuotationId} has been rejected.\n\nReason: ${reason || 'No reason provided'}`;
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Quotation Rejected</h2>
            <p>Quotation <strong>${formattedQuotationId}</strong> has been rejected.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '<p>No reason was provided.</p>'}
            <p><a href="${appUrl}/quotations/${id}">View Quotation Details</a></p>
          </div>
        `;
        
        console.log('Reject route - Email content prepared');
        
        // Send notification email to merchant/admin
        const fromEmail = `Driver Japan <noreply@${emailDomain}>`;
        const toEmail = [process.env.ADMIN_EMAIL || 'info@japandriver.com'];
        
        console.log(`Reject route - From email: ${fromEmail}`);
        console.log(`Reject route - To email: ${toEmail}`);
        
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        });
        
        if (emailError) {
          console.error('Reject route - Email send error:', JSON.stringify(emailError, null, 2));
        } else {
          console.log(`Reject route - Rejection notification email sent successfully. Email ID: ${emailData?.id}`);
        }
      } catch (emailError) {
        console.error('Reject route - Exception in email sending process:', emailError);
        // Continue with the response even if email fails
      }
    } else {
      console.log('Reject route - RESEND_API_KEY not configured, skipping email notification');
    }
    
    console.log(`Reject route - Quotation ${id} rejected by ${customerId || 'customer'}`);
    console.log('==================== REJECT ROUTE END ====================');
    
    return NextResponse.json({
      success: true,
      message: t('quotations.notifications.rejectSuccess'),
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Reject route - Error rejecting quotation:', error);
    console.log('==================== REJECT ROUTE END WITH ERROR ====================');
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 