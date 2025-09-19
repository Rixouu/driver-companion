import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  // Create server-side Supabase client with auth cookies
  const supabase = await getSupabaseServerClient();
  
  try {
    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the quotation ID from URL params
    const { id } = params;
    
    // Determine organization membership
    const ORGANIZATION_DOMAIN = 'japandriver.com';
    const isOrganizationMember = user.email?.endsWith(`@${ORGANIZATION_DOMAIN}`);

    // Determine if the ID is a quote number (QUO-JPDR-XXXXXX) or UUID
    const isQuoteNumber = id.startsWith('QUO-JPDR-');
    let actualQuotationId = id;
    
    // If it's a quote number, extract the number and find the corresponding UUID
    if (isQuoteNumber) {
      const quoteNumber = parseInt(id.replace('QUO-JPDR-', ''));
      if (!isNaN(quoteNumber)) {
        const { data: quotationData } = await supabase
          .from('quotations')
          .select('id')
          .eq('quote_number', quoteNumber)
          .single();
        
        if (quotationData) {
          actualQuotationId = quotationData.id;
        } else {
          return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: 'Invalid quotation ID format' }, { status: 400 });
      }
    }

    // Build query; restrict non-organization users to their own quotations
    let query = supabase
      .from('quotations')
      .select('*, quotation_items (*)')
      .eq('id', actualQuotationId);

    if (!isOrganizationMember && user.email) {
      query = query.eq('customer_email', user.email);
    }

    const { data: quotation, error } = await query.single();
    
    if (error) {
      console.error('Error fetching quotation:', error);
      return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
    }
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Unhandled error in quotation API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    // Create the Supabase client
    const supabase = await getSupabaseServerClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await request.json();
    
    // Sanitize input data to prevent UUID conversion errors
    const sanitizedData: Record<string, any> = {};
    
    // Process each field, converting empty strings to null for UUID fields
    Object.entries(body).forEach(([key, value]) => {
      // UUID fields that need to be null instead of empty string
      const uuidFields = ['customer_id', 'service_type_id', 'merchant_id'];
      
      if (uuidFields.includes(key) && value === '') {
        sanitizedData[key] = null;
      } else {
        sanitizedData[key] = value;
      }
    });
    
    console.log('Updating quotation:', id);
    console.log('Sanitized update data:', sanitizedData);

    // Recalculate total_amount if quotation_items or pricing fields are being updated
    if (sanitizedData.quotation_items && Array.isArray(sanitizedData.quotation_items) && sanitizedData.quotation_items.length > 0) {
      const { calculateQuotationTotals } = await import('@/lib/utils/quotation-calculations');
      
      const totals = calculateQuotationTotals(
        sanitizedData.quotation_items,
        sanitizedData.packages || [],
        sanitizedData.discount_percentage || 0,
        sanitizedData.tax_percentage || 0,
        sanitizedData.promotion_discount || 0,
        sanitizedData.service_type
      );
      
      // Update the sanitized data with calculated amounts
      sanitizedData.total_amount = totals.finalTotal;
      sanitizedData.amount = sanitizedData.amount || totals.serviceBaseTotal;
      
      console.log('Recalculated totals for quotation update:', {
        service_type: sanitizedData.service_type,
        service_days: sanitizedData.service_days,
        amount: sanitizedData.amount,
        total_amount: sanitizedData.total_amount,
        promotion_discount: sanitizedData.promotion_discount
      });
    }

    // Update the quotation with sanitized data
    const { data, error } = await supabase
      .from('quotations')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating quotation:', error);
      return NextResponse.json(
        { error: 'Failed to update quotation', details: error },
        { status: 500 }
      );
    }
    
    // Log activity
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: user.id,
          action: 'updated',
          details: JSON.stringify({ changes: sanitizedData })
        });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Continue anyway, this is non-critical
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH handler:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
} 