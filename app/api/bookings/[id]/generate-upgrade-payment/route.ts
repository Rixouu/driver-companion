import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OmiseClient } from "@/lib/omise-client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, description } = await request.json();
    const bookingId = params.id;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('wp_id, customer_name, customer_email, service_name')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Initialize Omise client
    const omiseClient = new OmiseClient();

    // Create payment link for upgrade
    const paymentLinkData = {
      amount: Math.round(amount * 100), // Convert to satang
      currency: 'jpy',
      title: `Vehicle Upgrade Payment - ${booking.wp_id}`,
      description: description || `Additional payment for vehicle upgrade - ${booking.service_name}`,
      multiple: false,
      is_live: process.env.NODE_ENV === 'production'
    };

    const paymentLink = await omiseClient.createPaymentLink(paymentLinkData);

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        meta: {
          upgrade_payment_link: paymentLink.linkId,
          upgrade_payment_amount: amount,
          upgrade_payment_generated_at: new Date().toISOString()
        }
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment link:', updateError);
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.linkId,
      paymentUrl: `https://linksplus.omise.co/${paymentLink.linkId}`,
      amount: amount,
      currency: 'JPY'
    });

  } catch (error) {
    console.error('Error generating upgrade payment link:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}
