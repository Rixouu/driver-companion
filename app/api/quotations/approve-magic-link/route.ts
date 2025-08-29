import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const { quotation_id, notes, signature } = await req.json();

    if (!quotation_id) {
      return NextResponse.json(
        { error: "Missing quotation_id" },
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

    // Update the quotation status to approved
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        approval_signature: signature || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotation_id);

    if (updateError) {
      console.error('Error approving quotation:', updateError);
      return NextResponse.json(
        { error: "Failed to approve quotation" },
        { status: 500 }
      );
    }

    // Record the approval activity
    await supabase
      .from('quotation_activities')
      .insert({
        quotation_id,
        action: 'approved',
        description: notes || 'Quotation approved via magic link',
        metadata: {
          signature: signature || null,
          approved_via: 'magic_link'
        },
        created_at: new Date().toISOString()
      });

    // Generate PDF for attachment with updated quotation data
    let pdfBuffer: Buffer | null = null;
    try {
      console.log('🔍 [APPROVE-MAGIC-LINK] Generating PDF for approval email...');
      
      // Create updated quotation object with signature and notes for PDF generation
      const updatedQuotationForPdf = {
        ...quotation,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        approval_signature: signature || null,
        updated_at: new Date().toISOString()
      };
      
      // Fetch associated package and promotion for the PDF (same as main approve route)
      let selectedPackage = null;
      const packageId = (quotation as any).selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id;
      if (packageId) {
        const { data: pkg } = await supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single();
        selectedPackage = pkg;
      }

      let selectedPromotion = null;
      const promotionCode = (quotation as any).selected_promotion_code || (quotation as any).promotion_code;
      if (promotionCode) {
        const { data: promo } = await supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single();
        selectedPromotion = promo;
      }
      
      // Generate optimized PDF using the same generator as main approve route
      pdfBuffer = await generateOptimizedQuotationPDF(
        updatedQuotationForPdf, 
        'en', 
        selectedPackage, 
        selectedPromotion
      );
      console.log('✅ [APPROVE-MAGIC-LINK] PDF generated successfully with signature and notes');
    } catch (pdfError) {
      console.error('❌ [APPROVE-MAGIC-LINK] PDF generation failed:', pdfError);
      // Continue without PDF attachment
    }

    // Send approval email to customer and BCC to admin
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get customer email
      const customerEmail = quotation.customers?.email || quotation.customer_email;
      const customerName = quotation.customers?.name || quotation.customer_name || 'Customer';
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
      if (customerEmail) {
        // Generate email HTML
        const emailHtml = generateApprovalEmailHtml(customerName, quotation, notes);
        
        // Send email with BCC to admin (always include booking@japandriver.com)
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Driver Japan <booking@japandriver.com>',
          to: [customerEmail],
          bcc: ['booking@japandriver.com'],
          subject: `Your Quotation has been Approved - ${formattedQuotationId}`,
          html: emailHtml,
          attachments: pdfBuffer ? [
            {
              filename: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}-quotation.pdf`,
              content: pdfBuffer.toString('base64')
            }
          ] : undefined
        });

        if (emailError) {
          console.error('Error sending approval email:', emailError);
          // Don't fail the approval if email fails
        } else {
          console.log('Approval email sent successfully:', emailData?.id);
          
          // Note: last_sent_at update removed due to type issues
        }
      }
    } catch (emailError) {
      console.error('Error in email sending process:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Quotation approved successfully and notification email sent"
    });

  } catch (error) {
    console.error('Error approving quotation via magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate approval email HTML
function generateApprovalEmailHtml(customerName: string, quotation: any, notes?: string) {
  const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Your Quotation has been Approved</title>
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
          background-color: #E03E2D;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          margin: 16px 0;
        }
        .reason {
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
                    Your Quotation has been Approved
                  </h1>
                  <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                    Quotation #${formattedQuotationId}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  <div class="greeting">
                    <p>Hello ${customerName},</p>
                    
                    <p>Great news! Your quotation has been approved.</p>
                    
                    <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
                      <h3 style="margin:0 0 12px 0; color:#32325D;">Quotation Details</h3>
                      <p style="margin:0; color:#525f7f;">
                        <strong>Quotation ID:</strong> ${formattedQuotationId}<br>
                        <strong>Title:</strong> ${quotation.title || 'Untitled'}<br>
                        <strong>Total Amount:</strong> ${quotation.currency || 'JPY'} ${quotation.total_amount?.toLocaleString() || '0'}<br>
                        <strong>Status:</strong> <span style="color:#059669; font-weight:600;">Approved</span><br>
                        <strong>Date:</strong> ${new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    ${notes ? `
                      <div class="reason">
                        <h4 style="margin:0 0 8px 0; color:#32325D;">Approved Notes:</h4>
                        <p style="margin:0; color:#525f7f;">${notes}</p>
                      </div>
                    ` : ''}
                    
                    <p>You can now proceed with the next steps. If you have any questions or need assistance, please don't hesitate to contact us.</p>
                    
                    <p>Thank you for choosing Driver Japan!</p>
                    
                    <p style="margin:24px 0 0 0;">
                      Best regards,<br>
                      <strong>Driver (Thailand) Company Limited</strong>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F8FAFC; padding:16px 24px; text-align:center; font-family: Work Sans, sans-serif; font-size:12px; color:#8898AA;">
                  <p style="margin:0 0 4px;">Driver (Thailand) Company Limited</p>
                  <p style="margin:0;">
                    <a href="https://japandriver.com" style="color:#E03E2D; text-decoration:none;">
                      japandriver.com
                    </a>
                  </p>
                </td>
              </tr>>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
