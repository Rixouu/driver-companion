import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(req: NextRequest) {
  try {
    const { quotation_id, customer_email } = await req.json();
    
    if (!quotation_id || !customer_email) {
      return NextResponse.json(
        { error: "Missing quotation_id or customer_email" },
        { status: 400 }
      );
    }

    // Create service client for admin operations
    const supabase = createServiceClient();
    
    // Get quotation details to use quote number in URL
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('quote_number')
      .eq('id', quotation_id)
      .single();

    if (quotationError || !quotation) {
      console.error('Error fetching quotation for magic link:', quotationError);
      return NextResponse.json(
        { error: "Failed to fetch quotation details" },
        { status: 500 }
      );
    }

    // Generate a unique token for the magic link (still needed for validation)
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(); // 7 days

    // Store the magic link in the database
    const { error: insertError } = await supabase
      .from('quotation_magic_links')
      .insert({
        quotation_id,
        customer_email,
        token,
        expires_at,
        is_used: false,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating magic link:', insertError);
      return NextResponse.json(
        { error: "Failed to create magic link" },
        { status: 500 }
      );
    }

    // Generate the magic link URL using quote number instead of token
    let baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      // Fallback based on environment
      if (process.env.NODE_ENV === 'production') {
        baseUrl = 'https://my.japandriver.com';
      } else if (process.env.NODE_ENV === 'development') {
        baseUrl = 'http://localhost:3000';
      } else {
        baseUrl = 'https://my.japandriver.com'; // Default to production
      }
    }
    const magicLinkUrl = `${baseUrl}/quote-access/QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;

    return NextResponse.json({
      success: true,
      magic_link: magicLinkUrl
    });

  } catch (error) {
    console.error('Error creating magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
