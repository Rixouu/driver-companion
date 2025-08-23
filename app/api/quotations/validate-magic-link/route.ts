import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    // Create service client for admin operations
    const supabase = createServiceClient();
    
    // Find the magic link and check if it's valid
    const { data: magicLink, error: magicLinkError } = await supabase
      .from('quotation_magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (magicLinkError || !magicLink) {
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

    // Check if the magic link has already been used
    if (magicLink.is_used) {
      return NextResponse.json(
        { error: "Magic link has already been used" },
        { status: 410 }
      );
    }

    // Get the quotation with all necessary details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (
          id,
          service_type,
          service_type_name,
          description,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', magicLink.quotation_id)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Mark the magic link as used (optional - you can remove this if you want multiple uses)
    await supabase
      .from('quotation_magic_links')
      .update({ 
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', magicLink.id);

    // Return the quotation data
    return NextResponse.json({
      success: true,
      quotation: {
        id: quotation.id,
        title: quotation.title,
        customer_name: quotation.customer_name,
        customer_email: quotation.customer_email,
        customer_phone: quotation.customer_phone,
        billing_company_name: quotation.billing_company_name,
        billing_tax_number: quotation.billing_tax_number,
        billing_address: quotation.billing_address,
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
        notes: quotation.notes,
        terms: quotation.terms,
        quotation_items: quotation.quotation_items || []
      }
    });

  } catch (error) {
    console.error('Error validating magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
