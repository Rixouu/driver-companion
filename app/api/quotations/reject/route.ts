import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Get the quotation data from the request body
    const { id, reason, customerId } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Get translations
    const { t } = await getDictionary();
    
    // Get current session - this may be null for public access
    const { data: { session } } = await supabase.auth.getSession();
    
    // Fetch the quotation
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select('*, customers (*)')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching quotation:', fetchError);
      return NextResponse.json(
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }
    
    // Check if the quotation can be rejected
    if (['approved', 'rejected', 'converted'].includes(quotation.status)) {
      return NextResponse.json(
        { error: t('quotations.notifications.cannotReject') },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'rejected' and add rejection reason
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
      console.error('Error updating quotation status:', updateError);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    // Create activity log
    // If session exists, use user_id, otherwise use customerId or a placeholder
    const userId = session?.user?.id || customerId || '00000000-0000-0000-0000-000000000000';
    
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: userId,
        action: 'rejected',
        details: { reason: reason || 'No reason provided' }
      });
    
    // Send email notification if Resend API key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        // Initialize Resend with API key
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Get email domain from env or fallback
        const emailDomain = (process.env.NEXT_PUBLIC_EMAIL_DOMAIN || 'japandriver.com').replace(/%$/, '');
        
        // Get the public URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
        
        // Format quotation ID to use JPDR prefix
        const formattedQuotationId = `JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
        
        // Email subject
        const emailSubject = `Quotation Rejected - ${formattedQuotationId}`;
        
        // Send notification email to merchant/admin
        await resend.emails.send({
          from: `Driver Japan <noreply@${emailDomain}>`,
          to: [process.env.ADMIN_EMAIL || 'info@japandriver.com'],
          subject: emailSubject,
          text: `Quotation ${formattedQuotationId} has been rejected by the customer.\n\nReason: ${reason || 'No reason provided'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Quotation Rejected</h2>
              <p>Quotation <strong>${formattedQuotationId}</strong> has been rejected by the customer.</p>
              <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
              <p><a href="${appUrl}/quotations/${id}">View Quotation Details</a></p>
            </div>
          `
        });
        
        console.log(`Rejection notification email sent for quotation ${id}`);
      } catch (emailError) {
        console.error('Error sending rejection notification email:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    console.log(`Quotation ${id} rejected by ${customerId || 'customer'}`);
    
    return NextResponse.json({
      success: true,
      message: t('quotations.notifications.rejectSuccess'),
      quotation: updatedQuotation
    });
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 