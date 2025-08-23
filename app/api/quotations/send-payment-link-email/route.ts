import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendInvoiceEmail } from "@/lib/email/send-email";
import { generateOptimizedQuotationPDF } from '@/lib/optimized-html-pdf-generator';

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

    // Parse request body - only read once
    const contentType = req.headers.get('content-type') || '';
    let requestData: any = {};
    let formData: FormData | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      formData = await req.formData();
      requestData = {
        email: formData.get('email') as string,
        quotation_id: formData.get('quotation_id') as string,
        customer_name: formData.get('customer_name') as string,
        language: formData.get('language') as string || 'en',
        payment_link: formData.get('payment_link') as string,
        custom_payment_name: formData.get('custom_payment_name') as string
      };
    } else {
      requestData = await req.json();
    }
    
    const { email, quotation_id: quotationId, customer_name: customerName, language, payment_link: paymentLink, custom_payment_name: customPaymentName } = requestData;
    
    // Get PDF file if it exists (for multipart requests)
    const pdfFile = formData ? (formData.get('invoice_pdf') as File) : null;

    if (!email || !quotationId) {
      return NextResponse.json(
        { error: "Missing required fields: email and quotation_id are required" },
        { status: 400 }
      );
    }

    // If no payment link provided, generate one using Omise
    let finalPaymentLink = paymentLink;
    if (!finalPaymentLink) {
      try {
        const omiseResponse = await fetch(`${req.nextUrl.origin}/api/quotations/generate-omise-payment-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            quotation_id: quotationId,
            customName: customPaymentName
          })
        });

        if (omiseResponse.ok) {
          const omiseData = await omiseResponse.json();
          finalPaymentLink = omiseData.paymentUrl;
        } else {
          console.error('Failed to generate Omise payment link:', await omiseResponse.text());
          return NextResponse.json(
            { error: "Failed to generate payment link" },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Error generating Omise payment link:', error);
        return NextResponse.json(
          { error: "Failed to generate payment link" },
          { status: 500 }
        );
      }
    }

    // Validate payment link format
    if (!finalPaymentLink || !finalPaymentLink.startsWith('http')) {
      return NextResponse.json(
        { error: "Invalid payment link format. Must be a valid URL." },
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

    // Convert File to Buffer (will be updated after package/promotion fetch)
    let pdfBuffer: Buffer | null = null;
    if (pdfFile) {
      pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    }
    
    // Determine service name
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driver-companion.vercel.app';
    const displayCurrency = quotationData.display_currency || quotationData.currency || 'JPY';
    const invoiceId = `INV-JPDR-${String(quotationData.quote_number || 0).padStart(6, '0')}`;
    
    const serviceSummary = (() => {
      try {
        const items = (quotationData as any).quotation_items as Array<any> | null;
        if (items && items.length > 0) {
          // Create detailed service description
          const serviceDetails = items.map(item => {
            const serviceName = item.service_type_name || item.description || 'Service';
            const vehicleType = item.vehicle_type || '';
            const duration = item.duration_hours ? `${item.duration_hours}h` : 
                           item.service_days ? `${item.service_days} day(s)` : '';
            const location = item.pickup_location || item.dropoff_location ? 
                           ` (${[item.pickup_location, item.dropoff_location].filter(Boolean).join(' → ')})` : '';
            
            return `${serviceName}${vehicleType ? ` - ${vehicleType}` : ''}${duration ? ` (${duration})` : ''}${location}`;
          });
          
          // Show first 2 services with details, then count for remainder
          if (serviceDetails.length <= 2) {
            return serviceDetails.join(' + ');
          } else {
            return `${serviceDetails.slice(0, 2).join(' + ')} + ${serviceDetails.length - 2} more service(s)`;
          }
        }
        
        // Fallback for single service quotations
        const serviceType = quotationData.service_type || (quotationData as any).service_type_name || 'Transportation Service';
        const vehicle = quotationData.vehicle_type || '';
        const duration = quotationData.duration_hours ? `${quotationData.duration_hours}h` : '';
        
        return `${serviceType}${vehicle ? ` - ${vehicle}` : ''}${duration ? ` (${duration})` : ''}`;
      } catch { 
        return (quotationData as any).title || 'Transportation Service'; 
      }
    })();

    // Fetch package and promotion data if available
    let selectedPackage: any = null;
    let selectedPromotion: any = null;

    if (quotationData.selected_package_id) {
      try {
        const { data: packageData } = await supabase
          .from('pricing_packages')
          .select('*, items:pricing_package_items(*)')
          .eq('id', quotationData.selected_package_id)
          .single();
        selectedPackage = packageData;
      } catch (error) {
        console.error('Error fetching package data:', error);
      }
    }

    if (quotationData.selected_promotion_code) {
      try {
        const { data: promotionData } = await supabase
          .from('pricing_promotions')
          .select('*')
          .eq('code', quotationData.selected_promotion_code)
          .single();
        selectedPromotion = promotionData;
      } catch (error) {
        console.error('Error fetching promotion data:', error);
      }
    } else if (quotationData.selected_promotion_name) {
      // Try to fetch by name as fallback
      try {
        const { data: promotionData } = await supabase
          .from('pricing_promotions')
          .select('*')
          .eq('name', quotationData.selected_promotion_name)
          .single();
        selectedPromotion = promotionData;
      } catch (error) {
        console.error('Error fetching promotion data by name:', error);
        // Create temporary promotion object - but don't set discount_value since we'll use stored promotion_discount
        selectedPromotion = {
          id: quotationData.selected_promotion_id || 'stored-promotion',
          name: quotationData.selected_promotion_name,
          code: quotationData.selected_promotion_code || 'APPLIED',
          description: quotationData.selected_promotion_description || '',
          discount_type: 'percentage',
          discount_value: 0, // Don't use this - use stored promotion_discount instead
          is_active: true,
          created_at: '',
          updated_at: ''
        };
      }
    }

    // Calculate proper totals like in PDF - EXACTLY matching the PDF logic
    const calculateTotals = () => {
      let serviceBaseTotal = 0;
      let serviceTimeAdjustment = 0;
      
      if ((quotationData as any).quotation_items && (quotationData as any).quotation_items.length > 0) {
        (quotationData as any).quotation_items.forEach((item: any) => {
          const itemBasePrice = item.unit_price * (item.quantity || 1) * (item.service_days || 1);
          serviceBaseTotal += itemBasePrice;
          
          if (item.time_based_adjustment) {
            const timeAdjustment = itemBasePrice * (item.time_based_adjustment / 100);
            serviceTimeAdjustment += timeAdjustment;
          }
        });
      } else {
        // Fallback for older quotations
        serviceBaseTotal = quotationData.amount || 0;
      }
      
      const serviceTotal = serviceBaseTotal + serviceTimeAdjustment;
      const packageTotal = selectedPackage ? selectedPackage.base_price : 0;
      const baseTotal = serviceTotal + packageTotal;
      
      const discountPercentage = quotationData.discount_percentage || 0;
      const taxPercentage = quotationData.tax_percentage || 0;
      
      // Calculate promotion discount exactly like PDF - but use stored value if selectedPromotion has no discount_value
      const promotionDiscount = selectedPromotion && selectedPromotion.discount_value > 0 ? 
        (selectedPromotion.discount_type === 'percentage' ? 
          baseTotal * (selectedPromotion.discount_value / 100) : 
          selectedPromotion.discount_value) : (quotationData.promotion_discount || 0);
      
      const regularDiscount = baseTotal * (discountPercentage / 100);
      const totalDiscount = promotionDiscount + regularDiscount;
      
      const subtotal = Math.max(0, baseTotal - totalDiscount);
      const taxAmount = subtotal * (taxPercentage / 100);
      const finalTotal = subtotal + taxAmount;
      
      return {
        serviceBaseTotal,
        serviceTimeAdjustment,
        serviceTotal,
        packageTotal,
        baseTotal,
        promotionDiscount,
        regularDiscount,
        totalDiscount,
        subtotal,
        taxAmount,
        finalTotal
      };
    };

    const totals = calculateTotals();

    // Generate PDF using optimized generator if no PDF file provided
    if (!pdfFile && !pdfBuffer) {
      try {
        console.log('[SEND-PAYMENT-LINK-EMAIL] Generating PDF using optimized generator');
        pdfBuffer = await generateOptimizedQuotationPDF(
          quotationData, 
          language || 'en', 
          selectedPackage, 
          selectedPromotion
        );
        console.log('[SEND-PAYMENT-LINK-EMAIL] PDF generated successfully');
      } catch (pdfError) {
        console.error('[SEND-PAYMENT-LINK-EMAIL] PDF generation error:', pdfError);
        // Continue without PDF attachment
      }
    }

    // Prepare email data with payment link
    const emailData = {
      to: email,
      customerName: customerName || quotationData.customer_name || quotationData.customers?.name || 'Customer',
      invoiceId: invoiceId,
      quotationId: `QUO-JPDR-${String(quotationData.quote_number || 0).padStart(6, '0')}`,
      amount: quotationData.total_amount || totals.finalTotal, // Use calculated final total
      currencyCode: displayCurrency,
      paymentLink: finalPaymentLink, // Use the generated or provided payment link
      serviceName: serviceSummary,
      pdfAttachment: pdfBuffer || undefined,
      // Add breakdown details for enhanced email template
      quotationData: quotationData,
      totals: totals,
      selectedPackage: selectedPackage,
      selectedPromotion: selectedPromotion
    };
    
    const emailResult = await sendInvoiceEmail(emailData);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send payment link email' },
        { status: 500 }
      );
    }

    // Log the activity
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          action: 'payment_link_sent',
          user_id: (session?.user as any)?.id || null,
          user_name: session?.user?.name || session?.user?.email || 'admin',
          details: {
            email: email,
            invoice_id: invoiceId,
            payment_link: paymentLink,
            language: language
          }
        });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment link email sent successfully"
    });

  } catch (error) {
    console.error("Error in send-payment-link-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
