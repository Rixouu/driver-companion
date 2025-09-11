import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { OmiseClient } from "@/lib/omise-client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, description, bccEmail, operationId } = await request.json();
    const { id: bookingId } = await params;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
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
    console.log('Looking for operation ID:', operationId);
    const { data: assignmentOperation, error: operationError } = await supabase
      .from('vehicle_assignment_operations')
      .select('previous_vehicle_id, new_vehicle_id')
      .eq('id', operationId)
      .single();

    console.log('Operation query result:', { assignmentOperation, operationError });

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

    // Initialize Omise client
    const omiseClient = new OmiseClient(
      process.env.OMISE_PUBLIC_KEY || '',
      process.env.OMISE_SECRET_KEY || ''
    );

    // Create payment link for upgrade
    const paymentLinkData = {
      amount: amount, // Keep as JPY amount, don't multiply by 100
      currency: 'jpy',
      description: `Vehicle upgrade from ${previousVehicleName} to ${newVehicleName}`,
      reference: `upgrade-${booking.wp_id}`,
      customerEmail: booking.customer_email || '',
      customerName: booking.customer_name || '',
      returnUrl: process.env.OMISE_RETURN_URL || 'https://driver-companion.vercel.app/quotations/[QUOTATION_ID]'
    };

    console.log('Creating payment link with data:', paymentLinkData);

    const paymentLink = await omiseClient.createPaymentLink(paymentLinkData);

    // Update booking with payment link
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        meta: {
          upgrade_payment_link: paymentLink.chargeId,
          upgrade_payment_amount: amount,
          upgrade_payment_generated_at: new Date().toISOString()
        }
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment link:', updateError);
    }

    // Generate invoice PDF for attachment
    let invoiceBuffer = null;
    try {
      // Get the base URL for the current request
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                     process.env.NODE_ENV === 'production' ? 'https://japandriver.com' :
                     'http://localhost:3000';
      
      const invoiceResponse = await fetch(`${baseUrl}/api/bookings/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          operation_type: 'upgrade',
          previous_vehicle_name: previousVehicleName,
          new_vehicle_name: newVehicleName,
          payment_amount: amount
        })
      });
      
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.arrayBuffer();
        invoiceBuffer = Buffer.from(invoiceData);
        console.log('✅ [UPGRADE PAYMENT] Invoice PDF generated successfully');
      } else {
        console.warn('⚠️ [UPGRADE PAYMENT] Failed to generate invoice PDF, continuing without attachment');
      }
    } catch (error) {
      console.warn('⚠️ [UPGRADE PAYMENT] Error generating invoice PDF:', error);
    }

    // Send email notification to customer
    try {
      const emailData = {
        from: 'Driver Japan <booking@japandriver.com>',
        to: [booking.customer_email || ''],
        bcc: bccEmail ? [bccEmail] : undefined,
        subject: `Vehicle Upgrade Payment Required - ${booking.wp_id}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Vehicle Upgrade Required</title>
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
              .payment-info {
                background-color: #fef2f2;
                border-left: 4px solid #dc2626;
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
                          Vehicle Upgrade Required
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
                          
                          <p>Your vehicle has been upgraded for your booking. An additional payment is required to confirm this upgrade.</p>
                          
                          <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                            <h3 style="margin:0 0 12px 0; color:#32325D;">Booking Details</h3>
                            <p style="margin:0; color:#525f7f;">
                              <strong>Booking ID:</strong> ${booking.wp_id}<br>
                              <strong>Service:</strong> ${booking.service_name || 'Airport Transfer'}<br>
                              <strong>Previous Vehicle:</strong> ${previousVehicleName}${previousVehicleDetails}<br>
                              <strong>New Vehicle:</strong> ${newVehicleName}${newVehicleDetails}<br>
                              <strong>Additional Payment Required:</strong> <span style="color:#dc2626; font-weight:bold; font-size:18px;">JPY ${amount.toLocaleString()}</span><br>
                              <strong>Status:</strong> <span style="color:#dc2626; font-weight:600;">Payment Required</span><br>
                              <strong>Date:</strong> ${new Date().toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div class="payment-info">
                            <h4 style="margin:0 0 8px 0; color:#32325D;">Payment Details:</h4>
                            <p style="margin:0 0 16px; color:#525f7f;">
                              <strong>Payment Method:</strong> Online Payment<br>
                              <strong>Payment Amount:</strong> JPY ${amount.toLocaleString()}<br>
                              <strong>Payment Date:</strong> ${new Date().toLocaleDateString()}
                            </p>
                            <p style="margin:0 0 16px; color:#525f7f;">
                              Please review the attached PDF file and proceed with payment.
                            </p>
                            <div style="text-align: center; margin: 20px 0;">
                              <a href="${paymentLink.paymentUrl}" 
                                 style="background-color: #E03E2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                                Pay Now
                              </a>
                            </div>
                            <p style="margin:16px 0 0; font-size:12px; color:#6b7280; text-align: center;">
                              Or click the link above to complete your payment.
                            </p>
                          </div>
                          
                          <p>Please complete the payment to confirm your vehicle upgrade.</p>
                          <p>Thank you for your payment!</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; font-size:12px; color:#8898AA;">
                        <p style="color: #333; font-weight: bold; margin: 0 0 10px;">Thank you for your business!</p>
                        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
                          If you have any questions about this upgrade, please contact us at 
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

      await resend.emails.send({
        ...emailData,
        attachments: invoiceBuffer ? [
          {
            filename: `invoice-${booking.wp_id}-upgrade.pdf`,
            content: invoiceBuffer.toString('base64')
          }
        ] : undefined
      } as any);
      console.log('Upgrade payment email sent successfully');
    } catch (emailError) {
      console.error('Error sending upgrade payment email:', emailError);
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.chargeId, // Use chargeId from Omise client
      paymentUrl: paymentLink.paymentUrl, // Use the full URL from Omise client
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
