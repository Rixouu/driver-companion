import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
// import { db } from "@/lib/db"; // Old db import
// import { getSupabaseServerClient } from "@/lib/supabase/server"; // For when Supabase is used
import { sendInvoiceEmail } from "@/lib/email/send-email";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
// import type { Database } from "@/types/supabase"; // For Supabase types

export async function POST(req: NextRequest) {
  // const supabase = await getSupabaseServerClient(); // For when Supabase is used
  try {
    const session = await getServerSession(authOptions);
    
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
    
    const body = await req.json();
    const { quotationId, invoiceId, customerEmail, customerName } = body;
    
    if (!quotationId || !invoiceId || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // --- Database interactions commented out due to schema uncertainty ---
    console.log("DB: Fetching invoice and quotation for send-email (commented out)");
    // Mock invoice data for now
    const mockInvoice = {
        id: invoiceId,
        quotation_id: quotationId,
        customer_id: "mock-customer-id",
        amount: 10000, // Example amount
        status: "created",
        created_by: (session.user as any)?.id || "unknown-user",
        payment_url: `https://example.com/pay/${invoiceId}`,
        quotation: {
            id: quotationId,
            customer_name: customerName || "Mock Customer",
            title: "Mock Service Title",
            // Add other fields from quotation if needed by PDF/email
        }
    };

    if (!mockInvoice.payment_url) {
      return NextResponse.json(
        { error: "Invoice has no payment link (mock check)" },
        { status: 400 }
      );
    }
    // --- End of commented out DB interactions ---
    
    let pdfBuffer;
    try {
      pdfBuffer = await generateInvoicePDF({
        invoiceId: mockInvoice.id,
        quotationId: mockInvoice.quotation.id,
        customerName: customerName || mockInvoice.quotation.customer_name,
        customerEmail: customerEmail,
        amount: mockInvoice.amount,
        serviceName: mockInvoice.quotation.title || "Service",
        date: new Date().toISOString(),
        items: [
          {
            description: mockInvoice.quotation.title || "Service",
            quantity: 1,
            unitPrice: mockInvoice.amount,
            total: mockInvoice.amount
          }
        ]
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
    }
    
    const emailResult = await sendInvoiceEmail({
      to: customerEmail,
      customerName: customerName || mockInvoice.quotation.customer_name,
      invoiceId: mockInvoice.id,
      quotationId: mockInvoice.quotation.id,
      amount: mockInvoice.amount,
      paymentLink: mockInvoice.payment_url,
      serviceName: mockInvoice.quotation.title || "Service",
      pdfAttachment: pdfBuffer
    });
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
    
    // --- Update invoice status (commented out) ---
    console.log("DB: Updating invoice status to sent (commented out)");
    // await supabase.from('invoices').update({ status: "sent", sent_at: new Date().toISOString() }).eq('id', invoiceId);
    // --- End of commented out DB interactions ---
    
    return NextResponse.json({ 
      success: true,
      message: "Invoice sent successfully (mocked DB)" 
    });
    
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
} 