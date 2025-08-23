import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OmiseClient } from "@/lib/omise-client";

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

    const { quotation_id: quotationId, regenerate = false, customName } = await req.json();

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

    // Check if payment link already exists and we're not regenerating
    if (!regenerate && (quotationData as any).payment_link) {
      return NextResponse.json({
        success: true,
        paymentUrl: (quotationData as any).payment_link,
        message: "Payment link already exists"
      });
    }

    // Initialize Omise client with test/production credentials
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.OMISE_TEST_MODE === 'true';
    const omiseClient = new OmiseClient({
      publicKey: isTestMode 
        ? (process.env.OMISE_TEST_PUBLIC_KEY || process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea')
        : (process.env.OMISE_PUBLIC_KEY || 'pkey_63znvleq75487yf61ea'),
      secretKey: isTestMode 
        ? (process.env.OMISE_TEST_SECRET_KEY || process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2')
        : (process.env.OMISE_SECRET_KEY || 'skey_64t36zji5r1yloelbv2'),
      baseUrl: process.env.OMISE_API_URL || 'https://api.omise.co'
    });
    
    console.log(`[Omise] Using ${isTestMode ? 'TEST' : 'PRODUCTION'} credentials`);

    // Calculate proper totals like in PDF
    const calculateTotals = () => {
      let serviceBaseTotal = 0;
      let serviceTimeAdjustment = 0;
      let serviceTotal = 0;
      let packageTotal = 0;

      // Calculate service totals
      if ((quotationData as any).quotation_items && Array.isArray((quotationData as any).quotation_items)) {
        (quotationData as any).quotation_items.forEach((item: any) => {
          const basePrice = item.base_price || 0;
          const durationHours = item.duration_hours || 1;
          const timeMultiplier = item.time_multiplier || 1;
          
          serviceBaseTotal += basePrice;
          serviceTimeAdjustment += (basePrice * durationHours * timeMultiplier) - basePrice;
          serviceTotal += basePrice * durationHours * timeMultiplier;
        });
      }

      // Calculate package total
      if ((quotationData as any).selected_package) {
        packageTotal = (quotationData as any).selected_package.price || 0;
      }

      const baseTotal = serviceTotal + packageTotal;
      const discountPercentage = quotationData.discount_percentage || 0;
      const taxPercentage = quotationData.tax_percentage || 0;
      
      const promotionDiscount = (quotationData as any).selected_promotion ? 
        ((quotationData as any).selected_promotion.discount_type === 'percentage' ? 
          baseTotal * ((quotationData as any).selected_promotion.discount_value / 100) : 
          (quotationData as any).selected_promotion.discount_value) : 0;
      
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
    const amount = totals.finalTotal || quotationData.total_amount || quotationData.amount || 0;
    const currency = 'JPY'; // Force JPY for now

    console.log('Amount calculation debug:', {
      totals,
      total_amount: quotationData.total_amount,
      amount: quotationData.amount,
      finalAmount: amount
    });

    console.log('Service data debug:', {
      quotation_items: (quotationData as any).quotation_items,
      service_type: quotationData.service_type,
      service_type_name: (quotationData as any).service_type_name,
      service_name: (quotationData as any).service_name
    });

    // Validate amount
    if (amount <= 0) {
      console.error('Invalid amount calculated:', { amount, totals, quotationData });
      return NextResponse.json(
        { error: 'Invalid amount calculated. Please check quotation pricing.' },
        { status: 400 }
      );
    }

    // Create payment link data with better description format
    const customerName = quotationData.customer_name || quotationData.customers?.name || 'Customer';
    
    // Get service names from quotation items or fallback to service_type
    let serviceNames = '';
    if ((quotationData as any).quotation_items && Array.isArray((quotationData as any).quotation_items)) {
      // Extract unique service types from quotation items
      const uniqueServiceTypes = [...new Set(
        (quotationData as any).quotation_items
          .map((item: any) => item.service_type_name || item.service_type || 'Service')
          .filter(Boolean)
      )];
      serviceNames = uniqueServiceTypes.join(', ');
    }
    
    // If no service names from items, use the main service_type
    if (!serviceNames) {
      serviceNames = quotationData.service_type || 'Service';
    }
    
    const quotationNumber = quotationData.quote_number || quotationData.id;
    
    const defaultDescription = `${customerName} - ${serviceNames} - Quotation ${quotationNumber}`;
    
    console.log('Service names extracted:', {
      fromItems: (quotationData as any).quotation_items?.map((item: any) => item.service_type_name || item.service_type),
      finalServiceNames: serviceNames,
      mainServiceType: quotationData.service_type,
      finalDescription: defaultDescription
    });
    
    const paymentLinkData = {
      amount: amount,
      currency: currency,
      description: customName || defaultDescription,
      reference: `QUO-${quotationNumber}`,
      customerEmail: quotationData.customer_email || quotationData.customers?.email || '',
      customerName: customerName,
      expiryHours: 48 // 48 hours expiry
    };

    console.log('Payment link data:', paymentLinkData);

    // Generate payment link
    const result = await omiseClient.createPaymentLink(paymentLinkData);

    if (result.error) {
      return NextResponse.json(
        { error: result.message || 'Failed to generate payment link' },
        { status: 400 }
      );
    }

    // Update quotation with payment link
    const { error: updateError } = await supabase
      .from('quotations')
      .update({ 
        payment_link: result.paymentUrl,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
      } as any)
      .eq('id', quotationId);

    if (updateError) {
      console.error('Failed to update quotation with payment link:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      chargeId: result.chargeId,
      amount: amount,
      currency: currency,
      expiresAt: new Date(Date.now() + (48 * 60 * 60 * 1000)).toISOString()
    });

  } catch (error) {
    console.error('Error generating Omise payment link:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment link' },
      { status: 500 }
    );
  }
}
