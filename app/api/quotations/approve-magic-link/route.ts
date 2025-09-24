import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { getTeamFooterHtml } from '@/lib/team-addresses';
import { emailTemplateService } from '@/lib/email/template-service';
import { PricingPackage, PricingPromotion } from '@/types/quotations';

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

    // First, get the quotation details for email with quotation_items
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*),
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

    // Send approval email using unified template service
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get customer email
      const customerEmail = quotation.customers?.email || quotation.customer_email;
      const customerName = quotation.customers?.name || quotation.customer_name || 'Customer';
      
      if (customerEmail) {
        // Get selected package and promotion data
        let selectedPackage: PricingPackage | null = null;
        let selectedPromotion: PricingPromotion | null = null;
        
        if (quotation.selected_package_id) {
          const { data: packageData } = await supabase
            .from('pricing_packages')
            .select('*')
            .eq('id', quotation.selected_package_id)
            .single();
          selectedPackage = packageData as PricingPackage | null;
        }
        
        if (quotation.selected_promotion_id) {
          const { data: promotionData } = await supabase
            .from('pricing_promotions')
            .select('*')
            .eq('id', quotation.selected_promotion_id)
            .single();
          selectedPromotion = promotionData as PricingPromotion | null;
        }

        // Process quotation_items for template variables (same as admin routes)
        const processedQuotationItems = (quotation.quotation_items || []).map((item: any) => {
          const isCharter = item.service_type_name?.toLowerCase().includes('charter') || item.service_type === 'Charter' || false;
          const isAirport = item.service_type_name?.toLowerCase().includes('airport') || item.service_type === 'Airport' || false;
          
          return {
            ...item,
            service_type_charter: isCharter,
            service_type_airport: isAirport,
            service_type_name: item.service_type_name || item.service_type || 'Charter',
            short_description: `${item.service_type_name || item.service_type} - ${item.vehicle_type}`,
            
            // Time-based pricing data - ONLY for Airport services (Charter Services get null)
            time_based_discount: isCharter ? null : (isAirport && item.time_based_adjustment ? (item.unit_price * item.time_based_adjustment / 100) : null),
            time_based_discount_percentage: isCharter ? null : (isAirport && item.time_based_adjustment ? item.time_based_adjustment : null),
            time_based_rule_name: isCharter ? null : (isAirport && item.time_based_rule_name ? item.time_based_rule_name : null),
            
            // Pre-computed display flags
            show_time_adjustment_flag: (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) ? 'yes' : 'no',
            show_time_pricing: isAirport ? 'yes' : 'no',
            
            // Additional details
            number_of_passengers: (quotation as any).number_of_passengers || 0,
            number_of_bags: (quotation as any).number_of_bags || 0,
            flight_number: (quotation as any).flight_number || '',
            terminal: (quotation as any).terminal || '',
            
            // Pre-generated HTML for time adjustment - ONLY for Airport services
            time_adjustment_html: (() => {
              if (isAirport && item.time_based_adjustment && item.time_based_adjustment > 0) {
                const amount = item.unit_price * item.time_based_adjustment / 100;
                const percentage = item.time_based_adjustment;
                const ruleName = item.time_based_rule_name;
                const timeLabel = 'Time Adjustment';
                
                return `
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                    <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">${timeLabel} (${percentage}%): +¥${amount.toLocaleString()}</div>
                    ${ruleName ? `<div style="color: #6b7280; font-size: 10px;">${ruleName}</div>` : ''}
                  </div>
                `;
              }
              return '';
            })()
          };
        });

        // Calculate total time-based discount
        let totalTimeBasedDiscount = 0;
        let totalTimeBasedDiscountPercentage = 0;
        let timeBasedRuleName = '';
        
        processedQuotationItems.forEach((item: any) => {
          if (item.service_type_airport && item.time_based_discount && item.time_based_discount > 0) {
            totalTimeBasedDiscount += item.time_based_discount;
            if (item.time_based_discount_percentage > totalTimeBasedDiscountPercentage) {
              totalTimeBasedDiscountPercentage = item.time_based_discount_percentage;
            }
            if (item.time_based_rule_name && !timeBasedRuleName) {
              timeBasedRuleName = item.time_based_rule_name;
            }
          }
        });

        // Prepare template variables
        const templateVariables = {
          // Basic quotation info
          quotation_id: `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || quotation.id.slice(-6).toUpperCase()}`,
          customer_name: customerName,
          customer_email: customerEmail,
          language: 'en',
          
          // Service details
          service_name: (quotation as any).service_name || 'Charter Service',
          service_type: quotation.service_type || 'Charter',
          vehicle_type: quotation.vehicle_type || 'Luxury Vehicle',
          service_days_display: quotation.service_days ? `(${quotation.service_days} day(s))` : '',
          
          // Quotation items
          quotation_items: processedQuotationItems,
          
          // Time-based pricing
          time_based_discount: totalTimeBasedDiscount,
          time_based_discount_percentage: totalTimeBasedDiscountPercentage,
          time_based_rule_name: timeBasedRuleName,
          
          // Package and promotion
          selected_package: selectedPackage ? {
            name: selectedPackage.name,
            base_price: selectedPackage.base_price,
            description: selectedPackage.description
          } : null,
          selected_promotion: selectedPromotion ? {
            name: selectedPromotion.name,
            discount_percentage: (selectedPromotion as any).discount_percentage || 0,
            description: selectedPromotion.description
          } : null,
          selected_package_name: selectedPackage?.name,
          selected_promotion_name: selectedPromotion?.name,
          
          // Pricing details
          currency: quotation.currency || 'JPY',
          display_currency: quotation.currency || 'JPY',
          total_amount: quotation.total_amount || 0,
          service_total: (quotation as any).service_total || quotation.total_amount || 0,
          subtotal: (quotation as any).subtotal || (quotation as any).service_total || quotation.total_amount || 0,
          tax_amount: (quotation as any).tax_amount || 0,
          tax_percentage: (quotation as any).tax_percentage || 0,
          discount_percentage: (quotation as any).discount_percentage || 0,
          regular_discount: (quotation as any).regular_discount || 0,
          promotion_discount: (quotation as any).promotion_discount || 0,
          promo_code_discount: (quotation as any).promo_code_discount || 0,
          refund_amount: (quotation as any).refund_amount || 0,
          final_total: (quotation as any).final_total || quotation.total_amount || 0,
          
          // Approval specific
          approval_notes: notes || '',
          approval_signature: signature || '',
          approval_date: new Date().toISOString(),
          
          // Dates
          date: quotation.pickup_date || (quotation as any).service_date || new Date().toISOString().split('T')[0],
          time: quotation.pickup_time || (quotation as any).service_time || '09:00',
          expiry_date: quotation.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requested_date: quotation.created_at ? new Date(quotation.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          
          // Location details
          pickup_location: quotation.pickup_location || '',
          dropoff_location: quotation.dropoff_location || '',
          
          // Additional details
          number_of_passengers: (quotation as any).number_of_passengers || 0,
          number_of_bags: (quotation as any).number_of_bags || 0,
          flight_number: (quotation as any).flight_number || '',
          terminal: (quotation as any).terminal || '',
          
          // Flags
          show_time_adjustment_flag: totalTimeBasedDiscount > 0
        };

        // Render the template using emailTemplateService
        const rendered = await emailTemplateService.renderTemplate(
          'Quotation Approved',
          templateVariables as any,
          'japan',
          'en'
        );

        if (!rendered) {
          console.error('❌ [APPROVE-MAGIC-LINK] Template rendering failed');
          return NextResponse.json({ error: 'Failed to render template' }, { status: 500 });
        }

        // Send email with BCC to admin
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Driver Japan <booking@japandriver.com>',
          to: [customerEmail],
          bcc: ['admin.rixou@gmail.com'],
          subject: rendered.subject || `Your Quotation has been Approved - ${templateVariables.quotation_id}`,
          html: rendered.html,
          attachments: pdfBuffer ? [
            {
              filename: `${templateVariables.quotation_id}-quotation.pdf`,
              content: pdfBuffer.toString('base64')
            }
          ] : undefined
        });

        if (emailError) {
          console.error('Error sending approval email:', emailError);
        } else {
          console.log('Approval email sent successfully:', emailData?.id);
        }
      }
    } catch (emailError) {
      console.error('Error in email sending process:', emailError);
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

