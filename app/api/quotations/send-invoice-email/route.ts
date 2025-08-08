import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendInvoiceEmail } from "@/lib/email/send-email";

export async function POST(req: NextRequest) {
  try {
    // Allow unauthenticated in development to facilitate testing
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userEmail = session.user.email || "";
      if (!userEmail.endsWith("@japandriver.com")) {
        return NextResponse.json(
          { error: "You do not have permission to perform this action" },
          { status: 403 }
        );
      }
    }

    // Parse form data for file upload
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const quotationId = formData.get('quotation_id') as string;
    const customerName = formData.get('customer_name') as string;
    const includeDetails = formData.get('include_details') === 'true';
    const language = (formData.get('language') as string) || 'en';
    const pdfFile = formData.get('invoice_pdf') as File;
    const overridePaymentLink = (formData.get('payment_link') as string) || '';

    if (!email || !quotationId || !pdfFile) {
      return NextResponse.json(
        { error: "Missing required fields: email, quotation_id, and invoice_pdf are required" },
        { status: 400 }
      );
    }

    // Get quotation data from database
    const supabase = await getSupabaseServerClient();
    
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*),
        customers:customer_id (*)
      `)
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotationData) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Check if quotation is approved
    if (quotationData.status !== 'approved') {
      return NextResponse.json(
        { error: "Can only send invoices for approved quotations" },
        { status: 400 }
      );
    }
    
    // Convert the PDF file to buffer for email attachment
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    
    // Generate invoice ID
    const invoiceId = `INV-${quotationId}`;
    
    // Determine base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    // Prepare derived fields
    const displayCurrency = (quotationData as any).display_currency || (quotationData as any).currency || 'JPY';
    const serviceSummary = (() => {
      try {
        const items = (quotationData as any).quotation_items as Array<any> | null;
        if (items && items.length > 0) {
          // Concise summary with up to two items
          const parts = items.slice(0, 2).map(it => it.description || `${it.service_type_name || 'Service'} - ${it.vehicle_type || ''}`.trim());
          const summary = parts.join(' + ');
          return items.length > 2 ? `${summary} + ${items.length - 2} more` : summary;
        }
        const serviceType = (quotationData as any).service_type || (quotationData as any).service_type_name || 'Service';
        const vehicle = (quotationData as any).vehicle_type || '';
        return `${serviceType}${vehicle ? ` - ${vehicle}` : ''}`;
      } catch { return (quotationData as any).title || 'Service'; }
    })();

    // Prepare email data
    const emailData = {
      to: email,
      customerName: customerName || quotationData.customer_name || quotationData.customers?.name || 'Customer',
      invoiceId: `invoice-JPDR-${String(quotationData.quote_number || 0).padStart(6, '0')}`,
      quotationId: `quotation-JPDR-${String(quotationData.quote_number || 0).padStart(6, '0')}`,
      amount: quotationData.total_amount || quotationData.amount,
      currencyCode: displayCurrency,
      paymentLink: overridePaymentLink || `${baseUrl}/quotations/${quotationId}`,
      serviceName: serviceSummary,
      pdfAttachment: pdfBuffer
    };
    
    const emailResult = await sendInvoiceEmail(emailData);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Log the activity
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          action: 'invoice_sent',
          user_id: (session?.user as any)?.id || null,
          user_name: session?.user?.name || session?.user?.email || 'system',
          details: {
            email: email,
            invoice_id: invoiceId,
            language: language
          }
        });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Invoice email sent successfully"
    });

  } catch (error) {
    console.error("Error in send-invoice-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}