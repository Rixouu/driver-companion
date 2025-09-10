import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OmiseClient } from "@/lib/omise-client";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
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
      .select('*')
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotationData) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Check if payment link exists
    if (!quotationData.payment_link) {
      return NextResponse.json(
        { error: "No payment link found for this quotation" },
        { status: 400 }
      );
    }

    // Initialize Omise client
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true';
    const omiseClient = new OmiseClient(
      isTestMode ? process.env.OMISE_PUBLIC_KEY_TEST! : process.env.OMISE_PUBLIC_KEY!,
      isTestMode ? process.env.OMISE_SECRET_KEY_TEST! : process.env.OMISE_SECRET_KEY!
    );

    // Extract link ID from payment URL
    const linkId = quotationData.payment_link.split('/').pop();
    if (!linkId) {
      return NextResponse.json(
        { error: "Invalid payment link format" },
        { status: 400 }
      );
    }

    // Check payment link status
    const linkStatus = await omiseClient.getPaymentLink(linkId);
    
    if (linkStatus.error) {
      return NextResponse.json(
        { error: `Failed to check payment status: ${linkStatus.message}` },
        { status: 400 }
      );
    }

    const paymentData = {
      isPaid: linkStatus.used,
      amount: linkStatus.amount,
      currency: linkStatus.currency,
      paidAt: linkStatus.used_at,
      chargeId: linkStatus.charge,
      status: linkStatus.used ? 'paid' : 'pending'
    };

    // If payment is completed, get charge details and receipt
    let receiptData = null;
    if (paymentData.isPaid && paymentData.chargeId) {
      try {
        // Get charge details
        const chargeDetails = await omiseClient.getCharge(paymentData.chargeId);
        
        if (!chargeDetails.error) {
          // Get receipt for the charge
          const receipt = await omiseClient.getReceipt(paymentData.chargeId);
          
          if (!receipt.error) {
            receiptData = {
              receiptId: receipt.id,
              receiptUrl: receipt.location,
              amount: receipt.total,
              currency: receipt.currency,
              issuedOn: receipt.issued_on,
              customerName: receipt.customer_name,
              customerEmail: receipt.customer_email,
              companyName: receipt.company_name,
              companyAddress: receipt.company_address,
              companyTaxId: receipt.company_tax_id,
              subtotal: receipt.subtotal,
              vat: receipt.vat,
              wht: receipt.wht,
              total: receipt.total
            };
          }
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
        // Don't fail the request if receipt can't be fetched
      }
    }

    // Update quotation status if payment is completed
    if (paymentData.isPaid && quotationData.status !== 'paid') {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: 'paid',
          payment_completed_at: paymentData.paidAt,
          payment_amount: paymentData.amount / 100, // Convert from smallest unit
          payment_method: 'Omise',
          payment_date: paymentData.paidAt,
          charge_id: paymentData.chargeId
        } as any)
        .eq('id', quotationId);

      if (updateError) {
        console.error('Failed to update quotation status:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      payment: paymentData,
      receipt: receiptData,
      quotation: {
        id: quotationData.id,
        status: paymentData.isPaid ? 'paid' : quotationData.status,
        payment_link: quotationData.payment_link,
        payment_completed_at: paymentData.isPaid ? paymentData.paidAt : quotationData.payment_completed_at
      }
    });

  } catch (error) {
    console.error('Error checking Omise payment:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
