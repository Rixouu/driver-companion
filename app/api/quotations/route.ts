import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Make sure to properly await the Supabase client creation
    const supabase = await createServerSupabaseClient();
    const { t } = await getDictionary();

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Start building the query
    let query = supabase
      .from('quotations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,title.ilike.%${search}%`);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: quotations, error, count } = await query;

    if (error) {
      console.error('Error fetching quotations:', error);
      return NextResponse.json(
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quotations,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error handling quotations GET request:', error);
    const { t } = await getDictionary();
    return NextResponse.json(
      { error: t('quotations.notifications.error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Make sure to properly await the Supabase client creation
    const supabase = await createServerSupabaseClient();
    const { t } = await getDictionary();

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    
    // Ensure required fields are present
    if (!requestData.title || !requestData.customer_email || !requestData.service_type || !requestData.vehicle_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add merchant_id
    requestData.merchant_id = session.user.id;
    
    // Calculate the expiry date (48 hours from now if not provided)
    if (!requestData.expiry_date) {
      requestData.expiry_date = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }
    
    // Insert the quotation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      console.error('Error creating quotation:', error);
      return NextResponse.json(
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id: quotation.id,
        user_id: session.user.id,
        action: 'created',
        details: { status: quotation.status }
      });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error handling quotations POST request:', error);
    const { t } = await getDictionary();
    return NextResponse.json(
      { error: t('quotations.notifications.error') },
      { status: 500 }
    );
  }
} 