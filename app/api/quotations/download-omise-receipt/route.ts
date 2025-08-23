import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OmiseClient } from "@/lib/omise-client";

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin permission
    const session = await getServerSession(authOptions);
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && !session?.user && !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quotation_id: quotationId } = await req.json();

    if (!quotationId) {
      return NextResponse.json(
        { error: "Missing required field: quotation_id" },
        { status: 400 }
      );
    }

    // Get quotation data from database
    const supabase = await getSupabaseServerClient();
    
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotationData) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Check if payment is completed
    if (quotationData.status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed yet" },
        { status: 400 }
      );
    }

    // Check if we have a charge ID from the payment
    const chargeId = (quotationData as any).charge_id;
    if (!chargeId) {
      return NextResponse.json(
        { error: "No charge ID found for this quotation" },
        { status: 400 }
      );
    }

    // Initialize Omise client with test/production credentials
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true';
    const omiseClient = new OmiseClient({
      publicKey: isTestMode 
        ? (process.env.OMISE_TEST_PUBLIC_KEY || process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea')
        : (process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea'),
      secretKey: isTestMode 
        ? (process.env.OMISE_TEST_SECRET_KEY || process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2')
        : (process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2'),
      baseUrl: process.env.OMISE_API_URL || 'https://api.omise.co'
    });

    // Get charge details from Omise
    const chargeResult = await omiseClient.getChargeStatus(chargeId);
    
    if (chargeResult.error) {
      return NextResponse.json(
        { error: chargeResult.message || 'Failed to get charge details' },
        { status: 400 }
      );
    }

    // For now, we'll return the charge details
    // In the future, we can implement actual receipt PDF generation
    // based on the Omise charge data
    return NextResponse.json({
      success: true,
      chargeId: chargeId,
      chargeDetails: chargeResult,
      message: "Receipt data retrieved successfully. Receipt download will be implemented in future updates."
    });

  } catch (error) {
    console.error('Error downloading Omise receipt:', error);
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    );
  }
}
