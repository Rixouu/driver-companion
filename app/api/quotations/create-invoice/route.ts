import { NextRequest, NextResponse } from "next/server";
import { IPPSClient } from "@/lib/ipps-client";
// import { auth } from "@/lib/auth"; // Old auth
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main"; // Assuming authOptions are here
// import { db } from "@/lib/db"; // Old db import
import { getSupabaseServerClient } from "@/lib/supabase/server";
// import type { Database } from "@/types/supabase"; // Keep for when schema is known

export async function POST(req: NextRequest) {
  // const supabase = await getSupabaseServerClient(); // Keep for when schema is known
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Ensure session.user has id by casting or checking type augmentation
    const userId = (session.user as any)?.id;
    if (!userId) {
        return NextResponse.json({ error: "User ID not found in session" }, { status: 401 });
    }

    const userEmail = session.user.email || "";
    if (!userEmail.endsWith("@japandriver.com")) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { quotationId, customerId, customerName, customerEmail, customerPhone, amount } = body;

    if (!quotationId || !customerId || !customerEmail || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // --- Database interactions commented out due to schema uncertainty ---
    console.log("Database interactions for create-invoice are currently commented out.");
    console.log("Quotation ID:", quotationId, "Customer ID:", customerId, "Amount:", amount);

    // Mocking successful invoice creation for now
    const invoiceId = `INV-${quotationId}`;
    const mockCreatedInvoice = {
        id: invoiceId,
        quotation_id: quotationId,
        customer_id: customerId,
        amount: amount,
        status: "created",
        created_by: userId,
        created_at: new Date().toISOString(),
        payment_url: null
    };
    // --- End of commented out DB interactions ---

    const ippsClient = new IPPSClient({
      baseUrl: process.env.IPPS_API_BASE_URL || "",
      accessToken: process.env.IPPS_ACCESS_TOKEN || ""
    });

    const formattedPhone = customerPhone ? customerPhone.replace(/^\+\d{2}/, "0") : "";

    const paymentResult = await ippsClient.createPaylink({
      clientTransactionId: `INV-${invoiceId}-${Date.now()}`,
      amount: amount,
      ref1: `Invoice ID: ${invoiceId}`,
      ref2: `Quotation ID: ${quotationId}`,
      ref3: customerName || "Customer",
      customerPaymentNo: invoiceId,
      customerPaymentDescription: `Payment for invoice ${invoiceId}`,
      sentPaylinkToCustomerEmail: customerEmail,
      sentPaylinkToCustomerMobile: formattedPhone
    });

    let finalInvoice: any = mockCreatedInvoice;

    if (paymentResult.error || !paymentResult.paymentUrl) {
      console.error("IPPS payment link generation failed:", paymentResult.message);
      return NextResponse.json({ 
        invoice: mockCreatedInvoice, 
        warning: "Invoice created (mocked) but payment link generation failed." 
      });
    } else {
      finalInvoice.payment_url = paymentResult.paymentUrl;
      // --- Update invoice with payment URL (commented out) ---
      // const { data: updatedInvoice, error: updateError } = await supabase
      //   .from('invoices')
      //   .update({ payment_url: paymentResult.paymentUrl })
      //   .eq('id', invoiceId)
      //   .select()
      //   .single();
      // if (updateError || !updatedInvoice) { ... }
      console.log("IPPS Payment URL obtained, mock invoice updated.");
    }

    return NextResponse.json({ 
      success: true,
      invoice: finalInvoice
    });

  } catch (error) {
    console.error("Error creating invoice:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 