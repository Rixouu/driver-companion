import { NextRequest, NextResponse } from 'next/server';
import { getDictionary } from '@/lib/i18n/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/services/notification-service';
import { handleApiError } from '@/lib/errors/error-handler';
import { DatabaseError } from '@/lib/errors/app-error';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Make sure to properly await the Supabase client creation
    const supabase = await getSupabaseServerClient();
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
    
    // Start building the query with quotation_items for proper amount calculation
    let query = supabase
      .from('quotations')
      .select(`
        *,
        quotation_items(
          id,
          unit_price,
          total_price,
          quantity,
          service_days,
          time_based_adjustment
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Determine organization membership and restrict customers to their own quotes
    const ORGANIZATION_DOMAIN = 'japandriver.com';
    const userEmail = session.user?.email || '';
    const isOrganizationMember = userEmail.endsWith(`@${ORGANIZATION_DOMAIN}`);
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,title.ilike.%${search}%`);
    }
    
    // Non-org users only see their own quotations
    if (!isOrganizationMember && userEmail) {
      query = query.eq('customer_email', userEmail);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: quotations, error, count } = await query;

    if (error) {
      throw new DatabaseError('Error fetching quotations from database.', { cause: error });
    }

    return NextResponse.json({
      quotations,
      count,
      limit,
      offset
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Make sure to properly await the Supabase client creation
    const supabase = await getSupabaseServerClient();
    const { t } = await getDictionary();

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    
    // Ensure required fields are present
    if (!requestData.title || !requestData.customer_email || !requestData.vehicle_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add merchant_id and team tracking fields
    requestData.merchant_id = session.user.id;
    requestData.created_by = session.user.id;
    
    // Set default team_location if not provided
    if (!requestData.team_location) {
      requestData.team_location = 'thailand';
    }
    
    // Calculate the expiry date (48 hours from now if not provided)
    if (!requestData.expiry_date) {
      requestData.expiry_date = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }
    
    // Validate service_type_id - remove if empty or invalid format
    if (!requestData.service_type_id || requestData.service_type_id === '' || requestData.service_type_id === 'default-service-type') {
      // Remove invalid service_type_id
      delete requestData.service_type_id;
      // Set a default service_type if needed for UI display
      requestData.service_type = requestData.service_type || 'General Service';
    }
    
    // Use computed totals if provided, otherwise calculate from quotation_items
    if (requestData.__computedTotals) {
      // Use the computed totals from the form
      requestData.amount = requestData.__computedTotals.baseAmount;
      requestData.total_amount = requestData.__computedTotals.totalAmount;
      
      console.log('Using computed totals from form:', {
        baseAmount: requestData.amount,
        totalAmount: requestData.total_amount
      });
    } else if (requestData.quotation_items && Array.isArray(requestData.quotation_items) && requestData.quotation_items.length > 0) {
      // Fallback to calculation if no computed totals
      const { calculateQuotationTotals } = await import('@/lib/utils/quotation-calculations');
      
      const totals = calculateQuotationTotals(
        requestData.quotation_items,
        requestData.packages || [],
        requestData.discount_percentage || 0,
        requestData.tax_percentage || 0,
        requestData.promotion_discount || 0,
        requestData.service_type
      );
      
      // Update the request data with calculated amounts
      requestData.total_amount = totals.finalTotal;
      requestData.amount = requestData.amount || totals.serviceBaseTotal;
      
      console.log('Calculated totals for new quotation:', {
        service_type: requestData.service_type,
        service_days: requestData.service_days,
        amount: requestData.amount,
        total_amount: requestData.total_amount,
        promotion_discount: requestData.promotion_discount
      });
    }
    
    // Filter out internal fields that shouldn't be saved to database
    const sanitizedData = Object.fromEntries(
      Object.entries(requestData).filter(([key]) => !key.startsWith('__'))
    );
    
    // Insert the quotation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .insert(sanitizedData as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating quotation:', error);
      return NextResponse.json(
        { error: t('quotations.notifications.error') },
        { status: 500 }
      );
    }

    // Create activity log and notification in parallel for better performance
    const [activityResult, notificationResult] = await Promise.allSettled([
      supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotation.id,
          user_id: session.user.id,
          action: 'created',
          details: { status: quotation.status }
        }),
      // Only create notification for non-draft quotations
      quotation.status !== 'draft' ? notificationService.createAdminNotification(
        'quotation_created',
        {
          id: quotation.id,
          quoteNumber: quotation.quote_number,
          customerName: quotation.customer_name || quotation.customer_email,
          title: quotation.title,
          amount: quotation.total_amount,
          currency: quotation.currency
        },
        quotation.id
      ) : Promise.resolve()
    ]);

    // Log any errors but don't fail the quotation creation
    if (activityResult.status === 'rejected') {
      console.error('Error creating quotation activity:', activityResult.reason);
    }
    if (notificationResult.status === 'rejected') {
      console.error('Error creating quotation notification:', notificationResult.reason);
    }

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