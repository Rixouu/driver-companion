import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Resend } from 'resend';
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';
import { getTeamFooterHtml } from '@/lib/team-addresses';
import { emailTemplateService } from '@/lib/email/template-service';
import { PricingPackage, PricingPromotion } from '@/types/quotations';

export async function POST(req: NextRequest) {
  console.log('==================== REJECT-MAGIC-LINK-OPTIMIZED ROUTE START ====================');
  
  // Set up timeout for the entire request (30 seconds)
  const timeoutId = setTimeout(() => {
    console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Request timeout after 30 seconds');
  }, 30000);
  
  try {
    const { quotation_id, reason, signature } = await req.json();

    if (!quotation_id || !reason) {
      return NextResponse.json(
        { error: "Missing quotation_id or reason" },
        { status: 400 }
      );
    }

    // OPTIMIZATION 1: Parallel initialization
    console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Starting parallel initialization');
    const [supabase, resend] = await Promise.all([
      Promise.resolve(createServiceClient()),
      Promise.resolve(new Resend(process.env.RESEND_API_KEY))
    ]);
    console.log('✅ [REJECT-MAGIC-LINK-OPTIMIZED] Parallel initialization complete');

    // OPTIMIZATION 2: Parallel data fetching
    console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Starting parallel data fetching');
    const [
      quotationResult,
      packageResult,
      promotionResult
    ] = await Promise.allSettled([
      supabase
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
        .single(),
      // Package and promotion will be fetched after quotation
      Promise.resolve(null),
      Promise.resolve(null)
    ]);

    // Handle quotation result
    if (quotationResult.status === 'rejected' || !quotationResult.value.data) {
      console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Error fetching quotation:', quotationResult.status === 'rejected' ? quotationResult.reason : quotationResult.value.error);
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    const quotation = quotationResult.value.data;
    console.log('✅ [REJECT-MAGIC-LINK-OPTIMIZED] Quotation fetched successfully');

    // OPTIMIZATION 3: Fetch package and promotion in parallel
    console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Fetching package and promotion data');
    const packageId = (quotation as any).selected_package_id || (quotation as any).package_id || (quotation as any).pricing_package_id;
    const promotionCode = (quotation as any).selected_promotion_code || (quotation as any).promotion_code;
    
    const [packageFetchResult, promotionFetchResult] = await Promise.allSettled([
      packageId ? supabase.from('pricing_packages').select('*, items:pricing_package_items(*)').eq('id', packageId).single() : Promise.resolve({ data: null }),
      promotionCode ? supabase.from('pricing_promotions').select('*').eq('code', promotionCode).single() : Promise.resolve({ data: null })
    ]);
    
    const selectedPackage = packageFetchResult.status === 'fulfilled' ? packageFetchResult.value.data : null;
    const selectedPromotion = promotionFetchResult.status === 'fulfilled' ? promotionFetchResult.value.data : null;
    
    console.log('✅ [REJECT-MAGIC-LINK-OPTIMIZED] Package and promotion data fetched');

    // OPTIMIZATION 4: Parallel processing - Database updates and PDF generation
    console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Starting parallel processing');
    const [
      updateResult,
      pdfResult,
      activityResult
    ] = await Promise.allSettled([
      // Update the quotation status to rejected
      supabase
        .from('quotations')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          rejection_signature: signature || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', quotation_id),
      // Generate PDF for attachment
      (async () => {
        try {
          console.log('🔍 [REJECT-MAGIC-LINK-OPTIMIZED] Generating PDF for rejection email...');
          
          // Create updated quotation object with signature and notes for PDF generation
          const updatedQuotationForPdf = {
            ...quotation,
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejection_reason: reason,
            rejection_signature: signature || null,
            updated_at: new Date().toISOString()
          };
          
          // Generate optimized PDF using the same generator as main reject route
          return await generateOptimizedQuotationPDF(
            updatedQuotationForPdf, 
            'en', 
            selectedPackage, 
            selectedPromotion
          );
        } catch (pdfError) {
          console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] PDF generation failed:', pdfError);
          return null; // Continue without PDF attachment
        }
      })(),
      // Record the rejection activity
      supabase
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
        })
    ]);

    // Handle update result
    if (updateResult.status === 'rejected' || updateResult.value.error) {
      console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Error rejecting quotation:', updateResult.status === 'rejected' ? updateResult.reason : updateResult.value.error);
      return NextResponse.json(
        { error: "Failed to reject quotation" },
        { status: 500 }
      );
    }

    const pdfBuffer = pdfResult.status === 'fulfilled' ? pdfResult.value : null;
    console.log('✅ [REJECT-MAGIC-LINK-OPTIMIZED] Parallel processing complete');

    // Send rejection email to customer and BCC to admin
    try {
      console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Preparing email data');
      
      // Get customer email
      const customerEmail = quotation.customers?.email || quotation.customer_email;
      const customerName = quotation.customers?.name || quotation.customer_name || 'Customer';
      
      // Format quotation ID
      const formattedQuotationId = `QUO-JPDR-${quotation.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
      
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
          
          // Rejection specific
          rejection_reason: reason || '',
          rejection_signature: signature || '',
          rejection_date: new Date().toISOString(),
          
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
          'Quotation Rejected',
          templateVariables as any,
          'japan',
          'en'
        );

        if (!rendered) {
          console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Template rendering failed');
          return NextResponse.json({ error: 'Failed to render template' }, { status: 500 });
        }

        // Send email with BCC to admin
        console.log('🔄 [REJECT-MAGIC-LINK-OPTIMIZED] Sending rejection email via Resend...');
        const emailSendPromise = resend.emails.send({
          from: 'Driver Japan <booking@japandriver.com>',
          to: [customerEmail],
          bcc: ['admin.rixou@gmail.com'],
          subject: rendered.subject || `Your Quotation has been Rejected - ${templateVariables.quotation_id}`,
          html: rendered.html,
          attachments: pdfBuffer ? [
            {
              filename: `${templateVariables.quotation_id}-quotation.pdf`,
              content: pdfBuffer.toString('base64')
            }
          ] : undefined
        });

        const { data: emailData, error: emailError } = await Promise.race([
          emailSendPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Email sending timeout after 20 seconds')), 20000)
          )
        ]);

        if (emailError) {
          console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Error sending rejection email:', emailError);
        } else {
          console.log('✅ [REJECT-MAGIC-LINK-OPTIMIZED] Rejection email sent successfully:', emailData?.id);
        }
      }
    } catch (emailError) {
      console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Error in email sending process:', emailError);
      // Don't fail the rejection if email fails
    }

    clearTimeout(timeoutId);
    return NextResponse.json({
      success: true,
      message: "Quotation rejected successfully and notification email sent"
    });

  } catch (error) {
    console.error('❌ [REJECT-MAGIC-LINK-OPTIMIZED] Error rejecting quotation via magic link:', error);
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    console.log('==================== REJECT-MAGIC-LINK-OPTIMIZED ROUTE END ====================');
  }
}

