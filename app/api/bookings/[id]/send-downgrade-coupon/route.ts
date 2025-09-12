import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Resend } from 'resend';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { couponCode, refundAmount, previousCategory, newCategory, bccEmail, operationId } = await request.json();
    const { id: bookingId } = await params;

    if (!couponCode || !refundAmount) {
      return NextResponse.json(
        { error: 'Coupon code and refund amount are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        wp_id, 
        customer_name, 
        customer_email, 
        service_name,
        vehicle_id
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get the specific vehicle assignment operation
    const { data: assignmentOperation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .select('previous_vehicle_id, new_vehicle_id')
      .eq('id', operationId)
      .single();

    if (operationError || !assignmentOperation) {
      return NextResponse.json(
        { error: 'Vehicle assignment operation not found' },
        { status: 404 }
      );
    }

    // Get vehicle names and details using separate queries
    let previousVehicleName = 'N/A';
    let newVehicleName = 'N/A';
    let previousVehicleDetails = '';
    let newVehicleDetails = '';

    if (assignmentOperation.previous_vehicle_id) {
      const { data: previousVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', assignmentOperation.previous_vehicle_id)
        .single();
      previousVehicleName = previousVehicle?.name || 'N/A';
      if (previousVehicle?.brand && previousVehicle?.model) {
        previousVehicleDetails = ` (${previousVehicle.brand} ${previousVehicle.model})`;
      }
    }

    if (assignmentOperation.new_vehicle_id) {
      const { data: newVehicle } = await supabase
        .from('vehicles')
        .select('name, brand, model')
        .eq('id', assignmentOperation.new_vehicle_id)
        .single();
      newVehicleName = newVehicle?.name || 'N/A';
      if (newVehicle?.brand && newVehicle?.model) {
        newVehicleDetails = ` (${newVehicle.brand} ${newVehicle.model})`;
      }
    }

    // Send downgrade coupon email
    const emailData = {
      from: 'Driver Japan <booking@japandriver.com>',
      to: [booking.customer_email],
      bcc: bccEmail ? [bccEmail] : undefined,
      subject: `Vehicle Downgrade Refund - ${booking.wp_id}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vehicle Downgrade Refund</title>
            <style>
              body, table, td, a {
                -webkit-text-size-adjust:100%;
                -ms-text-size-adjust:100%;
                font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
              }
              table, td { mso-table-lspace:0; mso-table-rspace:0; }
              img {
                border:0;
                line-height:100%;
                outline:none;
                text-decoration:none;
                -ms-interpolation-mode:bicubic;
              }
              table { border-collapse:collapse!important; }
              body {
                margin:0;
                padding:0;
                width:100%!important;
                background:#F2F4F6;
              }
              .greeting {
                color:#32325D;
                margin:24px 24px 16px;
                line-height:1.4;
                font-size: 14px;
              }
              @media only screen and (max-width:600px) {
                .container { width:100%!important; }
                .stack { display:block!important; width:100%!important; text-align:center!important; }
              }
              .details-table td, .details-table th {
                padding: 10px 0;
                font-size: 14px;
              }
              .details-table th {
                 color: #8898AA;
                 text-transform: uppercase;
                 text-align: left;
              }
              .button {
                background-color: #E03E2D;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin: 16px 0;
              }
              .coupon-info {
                background-color: #f0fdf4;
                border-left: 4px solid #059669;
                padding: 16px;
                margin: 16px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body style="background:#F2F4F6; margin:0; padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding:24px;">
                  <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                         style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%); padding:32px 24px; text-align:center;">
                        <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                          <tr><td align="center" valign="middle" style="text-align:center;">
                              <img src="https://japandriver.com/img/driver-invoice-logo.png" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                          </td></tr>
                        </table>
                        <h1 style="color:white; margin:0; font-size:24px; font-weight:600;">
                          Vehicle Downgrade Refund
                        </h1>
                        <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                          Booking #${booking.wp_id}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding:32px 24px;">
                        <div class="greeting">
                          <p>Hello ${booking.customer_name},</p>
                          
                          <p>Your vehicle has been downgraded for your booking. A refund coupon has been generated for the price difference.</p>
                          
                          <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                            <h3 style="margin:0 0 12px 0; color:#32325D;">Refund Details</h3>
                            <p style="margin:0; color:#525f7f;">
                              <strong>Booking ID:</strong> ${booking.wp_id}<br>
                              <strong>Service:</strong> ${booking.service_name || 'Airport Transfer'}<br>
                              <strong>Previous Vehicle:</strong> ${previousVehicleName}${previousVehicleDetails}<br>
                              <strong>New Vehicle:</strong> ${newVehicleName}${newVehicleDetails}<br>
                              <strong>Refund Amount:</strong> <span style="color:#059669; font-weight:bold; font-size:18px;">JPY ${refundAmount.toLocaleString()}</span><br>
                              <strong>Date:</strong> ${formatDateDDMMYYYY(new Date())}
                            </p>
                          </div>
                          
                          <div class="coupon-info">
                            <h4 style="margin:0 0 8px 0; color:#32325D;">Your Coupon Code:</h4>
                            <div style="background:#059669; color:white; padding:15px; border-radius:6px; text-align:center; margin:10px 0;">
                              <span style="font-size:24px; font-weight:bold; letter-spacing:2px;">${couponCode}</span>
                            </div>
                            <p style="margin:0; color:#525f7f; text-align:left;">
                              Use this code for your next booking to receive the refund amount as a discount.
                            </p>
                          </div>
                          
                          <div style="background:#fef3c7; padding:16px; border-radius:4px; margin:16px 0; border-left:4px solid #f59e0b;">
                            <h4 style="margin:0 0 8px 0; color:#92400e;">Important Information:</h4>
                            <ul style="margin:0; padding-left:20px; color:#92400e;">
                              <li>This coupon is valid for 30 days from today</li>
                              <li>Can only be used once</li>
                              <li>Must be used for the same service type</li>
                              <li>Cannot be combined with other promotions</li>
                            </ul>
                          </div>
                          
                          <p>Thank you for choosing Driver Japan!</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                        <p style="color: #333; font-weight: bold; margin: 0 0 10px;">Thank you for your business!</p>
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                          If you have any questions about this refund, please contact us at 
                          <a href="mailto:booking@japandriver.com" style="color: #1e40af; text-decoration: none;">booking@japandriver.com</a>
                        </p>
                        <p style="color: #666; font-size: 14px; margin: 0;">
                          Driver (Thailand) Company Limited • 
                          <a href="https://www.japandriver.com" style="color: #1e40af; text-decoration: none;">www.japandriver.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
    };

    // Generate invoice PDF for attachment
    let invoiceBuffer = null;
    try {
      // Use the same pattern as quotations - use request.nextUrl.origin
      const baseUrl = request.nextUrl.origin;
      
      const invoiceResponse = await fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          operation_type: 'downgrade',
          previous_vehicle_name: previousVehicleName,
          new_vehicle_name: newVehicleName,
          coupon_code: couponCode,
          refund_amount: refundAmount
        })
      });
      
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.arrayBuffer();
        invoiceBuffer = Buffer.from(invoiceData);
        console.log('✅ [DOWNGRADE COUPON] Invoice PDF generated successfully');
      } else {
        console.warn('⚠️ [DOWNGRADE COUPON] Failed to generate invoice PDF, continuing without attachment');
      }
    } catch (error) {
      console.warn('⚠️ [DOWNGRADE COUPON] Error generating invoice PDF:', error);
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      ...emailData,
      attachments: invoiceBuffer ? [
        {
          filename: `invoice-${booking.wp_id}-downgrade.pdf`,
          content: invoiceBuffer.toString('base64')
        }
      ] : undefined
    });

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
