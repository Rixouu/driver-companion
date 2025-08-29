import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 [Validate Magic Link API] Request received');
    const { token } = await req.json();
    console.log('🔍 [Validate Magic Link API] Token:', token);
    
    if (!token) {
      console.log('❌ [Validate Magic Link API] Missing token');
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    // Create service client for admin operations
    console.log('🔍 [Validate Magic Link API] Creating service client...');
    const supabase = createServiceClient();
    console.log('🔍 [Validate Magic Link API] Service client created');
    
    // Find the magic link and check if it's valid
    console.log('🔍 [Validate Magic Link API] Querying magic link...');
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('quotation_magic_links')
      .select('*')
      .eq('token', token)
      .single();

    console.log('🔍 [Validate Magic Link API] Magic link query result:', { magicLink, magicLinkError });

    if (magicLinkError || !magicLink) {
      console.log('❌ [Validate Magic Link API] Magic link not found or error:', magicLinkError);
      return NextResponse.json(
        { error: "Invalid magic link" },
        { status: 404 }
      );
    }

    // Check if the magic link has expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Magic link has expired" },
        { status: 410 }
      );
    }

    // Check if the magic link has already been used (commented out for testing)
    // if (magicLink.is_used) {
    //   return NextResponse.json(
    //     { error: "Magic link has already been used" },
    //     { status: 410 }
    //   );
    // }

    // Get the quotation with all necessary details
    console.log('🔍 [Validate Magic Link API] Magic link found, now querying quotation:', magicLink.quotation_id);
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          id,
          service_type_id,
          service_type_name,
          description,
          quantity,
          unit_price,
          total_price,
          vehicle_type,
          vehicle_category,
          duration_hours,
          service_days,
          hours_per_day,
          pickup_date,
          pickup_time,
          time_based_adjustment,
          time_based_rule_name
        )
      `)
      .eq('id', magicLink.quotation_id)
      .single();

    console.log('🔍 [Validate Magic Link API] Quotation query result:', { quotation, quotationError });

    if (quotationError || !quotation) {
      console.log('❌ [Validate Magic Link API] Quotation not found or error:', quotationError);
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Mark the magic link as used (commented out for testing - allows multiple uses)
    // console.log('🔍 [Validate Magic Link API] Marking magic link as used...');
    // const { error: updateError } = await supabase
    //   .from('quotation_magic_links')
    //   .update({ 
    //     is_used: true,
    //     used_at: new Date().toISOString()
    //   })
    //   .eq('id', magicLink.id);

    // if (updateError) {
    //   console.log('⚠️ [Validate Magic Link API] Warning: Failed to mark magic link as used:', updateError);
    // } else {
    //   console.log('✅ [Validate Magic Link API] Magic link marked as used successfully');
    // }

    // Return the quotation data
    console.log('🔍 [Validate Magic Link API] Preparing response with quotation data...');
                    const responseData = {
                  success: true,
                  quotation: {
                    id: quotation.id,
                    title: quotation.title,
                    customer_name: quotation.customer_name,
                    customer_email: quotation.customer_email,
                    customer_phone: quotation.customer_phone,
                    billing_company_name: quotation.billing_company_name,
                    billing_tax_number: quotation.billing_tax_number,
                    billing_street_name: quotation.billing_street_name,
                    billing_city: quotation.billing_city,
                    billing_state: quotation.billing_state,
                    billing_postal_code: quotation.billing_postal_code,
                    billing_country: quotation.billing_country,
                    status: quotation.status,
                    quote_number: quotation.quote_number,
                    created_at: quotation.created_at,
                    expiry_date: quotation.expiry_date,
                    amount: quotation.amount,
                    total_amount: quotation.total_amount,
                    currency: quotation.currency,
                    // Notes fields
                    customer_notes: quotation.customer_notes,
                    merchant_notes: quotation.merchant_notes,
                    // Price details fields
                    tax_percentage: quotation.tax_percentage,
                    promotion_discount: quotation.promotion_discount,
                    selected_promotion_name: quotation.selected_promotion_name,
                    selected_promotion_description: quotation.selected_promotion_description,
                    selected_promotion_code: quotation.selected_promotion_code,
                    // Workflow fields
                    approved_at: quotation.approved_at,
                    rejected_at: quotation.rejected_at,
                    invoice_generated_at: quotation.invoice_generated_at,
                    payment_completed_at: quotation.payment_completed_at,
                    receipt_url: quotation.receipt_url,
                    updated_at: quotation.updated_at,
                    quotation_items: quotation.quotation_items || []
                  }
                };
    
    console.log('🔍 [Validate Magic Link API] Response data prepared:', responseData);
    console.log('✅ [Validate Magic Link API] Returning success response');
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ [Validate Magic Link API] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('❌ [Validate Magic Link API] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
