import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { couponCode, refundAmount, previousCategory, newCategory } = await request.json();
    const bookingId = params.id;

    if (!couponCode || !refundAmount) {
      return NextResponse.json(
        { error: 'Coupon code and refund amount are required' },
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

    // Send downgrade coupon email
    const emailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [booking.customer_email],
      subject: `Vehicle Downgrade Refund - ${booking.wp_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Vehicle Downgrade Refund</h1>
            <p style="color: #666; margin: 10px 0;">Booking #${booking.wp_id}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Refund Details</h2>
            <p style="margin: 5px 0; color: #555;">
              <strong>Service:</strong> ${booking.service_name}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Previous Vehicle:</strong> ${previousCategory}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>New Vehicle:</strong> ${newCategory}
            </p>
            <p style="margin: 5px 0; color: #555;">
              <strong>Refund Amount:</strong> ¥${refundAmount.toLocaleString()}
            </p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #2d5a2d; margin: 0 0 10px 0;">Your Coupon Code</h3>
            <div style="background: white; padding: 15px; border-radius: 4px; border: 2px dashed #2d5a2d; margin: 10px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #2d5a2d; letter-spacing: 2px;">${couponCode}</span>
            </div>
            <p style="color: #2d5a2d; margin: 10px 0 0 0; font-size: 14px;">
              Use this code for your next booking to receive the refund amount as a discount.
            </p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">Important Information</h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>This coupon is valid for 30 days from today</li>
              <li>Can only be used once</li>
              <li>Must be used for the same service type</li>
              <li>Cannot be combined with other promotions</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0;">
              Thank you for choosing Driver Japan!<br>
              If you have any questions, please contact us at booking@japandriver.com
            </p>
          </div>
        </div>
      `
    };

    const { data: emailResult, error: emailError } = await resend.emails.send(emailData);

    if (emailError) {
      console.error('Error sending downgrade coupon email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send coupon email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Downgrade coupon sent successfully',
      couponCode,
      refundAmount
    });

  } catch (error) {
    console.error('Error sending downgrade coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
