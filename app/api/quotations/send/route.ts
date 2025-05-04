import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Update quotation status to 'sent'
    const { data: quotation, error: updateError } = await supabase
      .from('quotations')
      .update({ status: 'sent' })
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
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: id,
        user_id: session.user.id,
        action: 'sent',
        details: { status: 'sent' }
      });

    // In a real implementation, you would send an email to the customer here
    // This is a placeholder for the email sending logic
    // You would typically use a service like SendGrid, Mailchimp, etc.
    
    // For demonstration purposes, we'll just log that an email would be sent
    console.log(`Email would be sent to ${quotation.customer_email} for quotation ${id}`);
    
    return NextResponse.json({
      success: true,
      message: t('notifications.sendSuccess')
    });
  } catch (error) {
    console.error('Error handling send quotation request:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
} 