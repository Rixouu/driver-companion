import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { quotation_id, reason, signature } = await req.json();

    if (!quotation_id || !reason) {
      return NextResponse.json(
        { error: "Missing quotation_id or reason" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // First, get the quotation details for email
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', quotation_id)
      .single();

    if (fetchError || !quotation) {
      console.error('Error fetching quotation:', fetchError);
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Update the quotation status to rejected
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        rejection_signature: signature || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotation_id);

    if (updateError) {
      console.error('Error rejecting quotation:', updateError);
      return NextResponse.json(
        { error: "Failed to reject quotation" },
        { status: 500 }
      );
    }

    // Record the rejection activity
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id,
        action: 'rejected',
        description: reason,
        metadata: {
          signature: signature || null,
          rejected_via: 'magic_link'
        },
        created_at: new Date().toISOString()
      });

    // Send rejection email to customer and BCC to admin
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get customer email
      const customerEmail = quotation.customers?.email || quotation.customer_email;
      const customerName = quotation.customers?.name || quotation.customer_name || 'Customer';
      
      if (customerEmail) {
        // Generate email HTML
        const emailHtml = generateRejectionEmailHtml(customerName, quotation, reason);
        
        // Send email with BCC to admin
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Driver Japan <booking@japandriver.com>',
          to: [customerEmail],
          bcc: ['booking@japandriver.com'],
          subject: `Quotation Update - ${quotation.title || 'Your Quotation'}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Don't fail the rejection if email fails
        } else {
          console.log('Rejection email sent successfully:', emailData?.id);
          
          // Update last_email_sent_at
          await supabase
            .from('quotations')
            .update({ 
              last_email_sent_at: new Date().toISOString() 
            })
            .eq('id', quotation_id);
        }
      }
    } catch (emailError) {
      console.error('Error in email sending process:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Quotation rejected successfully and notification email sent"
    });

  } catch (error) {
    console.error('Error rejecting quotation via magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate rejection email HTML
function generateRejectionEmailHtml(customerName: string, quotation: any, reason: string) {
  const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Quotation Update</title>
      <style>
        body, table, td, a {
          -webkit-text-size-adjust:100%;
          -ms-text-size-adjust:100%;
          font-family: Work Sans, sans-serif;
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
          background-color: #dc3545;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        }
        .reason {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 16px;
          margin: 16px 0;
          border-radius: 4px;
        }
        .contact-info {
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
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
                <td style="background:#dc3545; padding:32px 24px; text-align:center;">
                  <img src="https://japandriver.com/img/driver-invoice-logo.png" 
                       alt="Driver Logo" 
                       style="height:40px; width:auto; margin-bottom:16px;">
                  <h1 style="color:white; margin:0; font-size:24px; font-weight:600;">
                    Quotation Update
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>Hello ${customerName},</p>
                    
                    <p>We wanted to inform you about an update regarding your quotation.</p>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                      <h3 style="margin:0 0 12px 0; color:#32325D;">Quotation Details</h3>
                      <p style="margin:0; color:#525f7f;">
                        <strong>Quotation ID:</strong> ${formattedQuotationId}<br>
                        <strong>Title:</strong> ${quotation.title || 'Untitled'}<br>
                        <strong>Total Amount:</strong> ${quotation.currency || 'JPY'} ${quotation.total_amount?.toLocaleString() || '0'}<br>
                        <strong>Status:</strong> <span style="color:#dc3545; font-weight:600;">Rejected</span><br>
                        <strong>Date:</strong> ${new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div class="reason">
                      <h4 style="margin:0 0 8px 0; color:#721c24;">Reason for Rejection:</h4>
                      <p style="margin:0; color:#721c24;">${reason}</p>
                    </div>
                    
                    <div class="contact-info">
                      <h4 style="margin:0 0 8px 0; color:#0c5460;">Need Help?</h4>
                      <p style="margin:0; color:#0c5460;">
                        If you have any questions about this decision or would like to discuss alternatives, 
                        please don't hesitate to contact us. We're here to help find a solution that works for you.
                      </p>
                    </div>
                    
                    <p>We appreciate your interest in our services and hope to have the opportunity to work with you in the future.</p>
                    
                    <p style="margin:24px 0 0 0;">
                      Best regards,<br>
                      <strong>Driver (Thailand) Company Limited</strong>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#f8f9fa; padding:24px; text-align:center;">
                  <p style="margin:0; color:#8898AA; font-size:12px;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
