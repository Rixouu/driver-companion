import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db"; // Old db import
// import { getSupabaseServerClient } from "@/lib/supabase/server"; // For when Supabase is used
import { sendPaymentConfirmationEmail } from "@/lib/email/send-email";
// import type { Database } from "@/types/supabase"; // For Supabase types

// Define status codes
const STATUS_SUCCESS = 51;
const STATUS_FAILED = 52;
const STATUS_EXPIRED = 53;
const STATUS_CANCELLED = 54;

export async function POST(req: NextRequest) {
  // const supabase = await getSupabaseServerClient(); // For when Supabase is used
  try {
    const payload = await req.json();
    console.log("[IPPS Webhook] Received payload:", payload);
    
    // Validate webhook payload
    if (!payload || !payload.status?.code || !payload.data?.client_transaction_id) {
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }
    
    // Extract invoice ID from transaction ID
    // Format: INV-{invoiceId}-{timestamp}
    const transactionIdParts = payload.data.client_transaction_id.split("-");
    if (transactionIdParts.length < 3 || transactionIdParts[0] !== "INV") {
      return NextResponse.json({ error: "Invalid transaction ID format" }, { status: 400 });
    }
    
    // The invoiceId from IPPS payload is `INV-{original_invoice_id_part}-{timestamp}`.
    // The original invoice ID we stored would be `{original_invoice_id_part}` or `INV-{original_invoice_id_part}`.
    // If `invoiceId` stored in our DB is `INV-quotationId`, then we need to reconstruct that.
    // Assuming the second part `transactionIdParts[1]` is the core quotationId or a unique part of our invoiceId.
    // Let's assume our invoiceId is `INV-${transactionIdParts[1]}` if that's how we formed it.
    // Or, if `transactionIdParts[1]` directly refers to quotationId, then use that.    
    // For now, let's assume `transactionIdParts[1]` IS the invoiceId (without INV- prefix)
    // const invoiceId = transactionIdParts[1]; 
    // Re-evaluating: client_transaction_id was `INV-${invoiceId}-${Date.now()}` where invoiceId was `INV-${quotationId}`
    // So client_transaction_id is `INV-INV-quotationId-timestamp` or if invoiceId did not have INV- it's `INV-quotationId-timestamp`
    // The previous code was: const invoiceId = `${transactionIdParts[1]}-${transactionIdParts[2]}`;
    // This implies invoiceId from payload is INV-ACTUAL_ID-PART1-ACTUAL_ID-PART2-TIMESTAMP
    // Let's assume `client_transaction_id` was initially `INV-${DB_INVOICE_ID}-${timestamp}`
    // So `payload.data.client_transaction_id` is like `INV-OUR_STORED_INVOICE_ID-TIMESTAMP`
    // And OUR_STORED_INVOICE_ID was `INV-QUOTATION_ID`
    // So `payload.data.client_transaction_id` = `INV-INV-QUOTATION_ID-TIMESTAMP` -> transactionIdParts = ["INV", "INV", "QUOTATION_ID", "TIMESTAMP"]
    // Then `invoiceId = `${transactionIdParts[1]}-${transactionIdParts[2]}` becomes `INV-QUOTATION_ID` which is correct.
    const invoiceId = `${transactionIdParts[1]}-${transactionIdParts[2]}`;
    if (!invoiceId.startsWith("INV-")) { // Basic sanity check for our assumed format
        console.error("[IPPS Webhook] Could not parse valid invoiceId from client_transaction_id:", payload.data.client_transaction_id);
        return NextResponse.json({ error: "Could not parse invoiceId from transaction" }, { status: 400 });
    }

    // --- Database interactions commented out due to schema uncertainty ---
    console.log(`DB: Verifying invoice ${invoiceId} (commented out)`);
    // Mock invoice data for now
    const mockInvoice = {
        id: invoiceId,
        quotation_id: "mock-quotation-id",
        amount: parseFloat(payload.data.amount || "0"),
        status: "created", // Initial status before update
        payment_url: `https://example.com/pay/${invoiceId}`,
        quotation: {
            id: "mock-quotation-id",
            customer_email: "test@example.com", // Mock email
            customer_name: "Mock Customer",
            title: "Mock Service Title"
        }
    };
    // --- End of commented out DB interactions ---
    
    const paymentAmount = parseFloat(payload.data.amount || "0");
    if (paymentAmount !== mockInvoice.amount) {
      console.warn(`[IPPS Webhook] Payment amount mismatch: expected ${mockInvoice.amount}, got ${paymentAmount}`);
    }
    
    // Process payment status
    const status = payload.status.code;
    let newStatus: string | null = null;
    let paymentSuccessful = false;
    
    switch (status) {
      case STATUS_SUCCESS:
        newStatus = "paid";
        paymentSuccessful = true;
        console.log("[IPPS Webhook] Payment successful");
        break;
      case STATUS_FAILED:
        newStatus = "payment_failed";
        console.log("[IPPS Webhook] Payment failed");
        break;
      case STATUS_EXPIRED:
        newStatus = "payment_expired";
        console.log("[IPPS Webhook] Payment expired");
        break;
      case STATUS_CANCELLED:
        newStatus = "payment_cancelled";
        console.log("[IPPS Webhook] Payment cancelled");
        break;
      default:
        console.log(`[IPPS Webhook] Unhandled status code: ${status}`);
    }
    
    if (newStatus) {
      if (status !== STATUS_SUCCESS || mockInvoice.status !== "paid") {
        console.log(`DB: Updating invoice ${invoiceId} to status ${newStatus} (commented out)`);
        // await supabase.from('invoices').update({ status: newStatus, paid_at: paymentSuccessful ? new Date() : null }).eq('id', invoiceId);
      }
      
      console.log(`DB: Storing payment details for invoice ${invoiceId} (commented out)`);
      // await supabase.from('payments').insert({ invoice_id: invoiceId, ... });
      
      if (paymentSuccessful && mockInvoice.quotation) {
        try {
          await sendPaymentConfirmationEmail({
            to: mockInvoice.quotation.customer_email,
            customerName: mockInvoice.quotation.customer_name,
            invoiceId: invoiceId,
            amount: mockInvoice.amount,
            serviceName: mockInvoice.quotation.title || "Service"
          });
        } catch (emailError) {
          console.error("[IPPS Webhook] Failed to send confirmation email:", emailError);
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[IPPS Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
} 