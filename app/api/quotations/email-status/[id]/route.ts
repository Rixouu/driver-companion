import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotationId = params.id;
    
    // Check quotation status
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('status, sent_at, rejected_at, last_email_sent')
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json({ 
        error: 'Quotation not found',
        code: 'QUOTATION_NOT_FOUND'
      }, { status: 404 });
    }

    // Check recent activities
    const { data: activities, error: activitiesError } = await supabase
      .from('quotation_activities')
      .select('*')
      .eq('quotation_id', quotationId)
      .in('activity_type', ['email_sent', 'email_error', 'quotation_rejected', 'rejection_error'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    }

    // Determine current status
    let emailStatus = 'unknown';
    let lastActivity = null;
    
    if (activities && activities.length > 0) {
      lastActivity = activities[0];
      
      if (lastActivity.activity_type === 'email_sent') {
        emailStatus = 'sent';
      } else if (lastActivity.activity_type === 'email_error') {
        emailStatus = 'failed';
      } else if (lastActivity.activity_type === 'quotation_rejected') {
        emailStatus = 'rejected';
      } else if (lastActivity.activity_type === 'rejection_error') {
        emailStatus = 'rejection_failed';
      }
    }

    // Check if email is still processing
    if (quotation.status === 'sent' && quotation.sent_at) {
      emailStatus = 'sent';
    } else if (quotation.status === 'rejected' && quotation.rejected_at) {
      emailStatus = 'rejected';
    } else if (quotation.status === 'draft' || quotation.status === 'pending') {
      emailStatus = 'processing';
    }

    return NextResponse.json({
      quotationId,
      quotationStatus: quotation.status,
      emailStatus,
      lastActivity: lastActivity ? {
        type: lastActivity.activity_type,
        description: lastActivity.description,
        timestamp: lastActivity.created_at,
        metadata: lastActivity.metadata
      } : null,
      timestamps: {
        sentAt: quotation.sent_at,
        rejectedAt: quotation.rejected_at,
        lastEmailSent: quotation.last_email_sent
      }
    });

  } catch (error) {
    console.error('❌ [EMAIL-STATUS] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to check email status',
      code: 'STATUS_CHECK_ERROR'
    }, { status: 500 });
  }
}
