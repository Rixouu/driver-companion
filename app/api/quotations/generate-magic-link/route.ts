import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { quotation_id, customer_email, expires_in_hours = 168 } = await req.json(); // Default 7 days (168 hours)
    
    if (!quotation_id || !customer_email) {
      return NextResponse.json(
        { error: "Missing quotation_id or customer_email" },
        { status: 400 }
      );
    }

    // Create service client for admin operations
    const supabase = createServiceClient();
    
    // First, verify the quotation exists and get customer details
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('id, customer_name, customer_email, quote_number, status')
      .eq('id', quotation_id)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Verify email matches the quotation
    if (quotation.customer_email !== customer_email) {
      return NextResponse.json(
        { error: "Email does not match quotation" },
        { status: 403 }
      );
    }

    // Generate a unique token for the magic link
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + (expires_in_hours * 60 * 60 * 1000)).toISOString();

    // Store the magic link in the database
    const { data: magicLink, error: insertError } = await supabase
      .from('quotation_magic_links')
      .insert({
        quotation_id,
        customer_email,
        token,
        expires_at,
        is_used: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating magic link:', insertError);
      return NextResponse.json(
        { error: "Failed to create magic link" },
        { status: 500 }
      );
    }

    // Generate the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/quote-access/${token}`;

    // Update the quotation to mark magic link as generated
    await supabase
      .from('quotations')
      .update({ 
        magic_link_generated_at: new Date().toISOString(),
        magic_link_expires_at: expires_at
      })
      .eq('id', quotation_id);

    return NextResponse.json({
      success: true,
      magic_link: magicLinkUrl,
      expires_at,
      quotation: {
        id: quotation.id,
        quote_number: quotation.quote_number,
        customer_name: quotation.customer_name,
        customer_email: quotation.customer_email
      }
    });

  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
