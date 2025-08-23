import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendPaymentConfirmationEmail } from "@/lib/email/send-email";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Omise Webhook] Received payload:", payload);

    // Verify webhook signature (you should implement this for production)
    // const signature = req.headers.get('x-omise-signature');
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Handle different webhook types
    if (payload.object === 'charge') {
      await handleChargeWebhook(payload);
    } else if (payload.object === 'link') {
      await handleLinkWebhook(payload);
    } else if (payload.object === 'event') {
      // Handle events (like payment completed)
      await handleEventWebhook(payload);
    } else {
      console.log("[Omise Webhook] Unknown webhook type:", payload.object);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Omise Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleChargeWebhook(payload: any) {
  try {
    const chargeId = payload.id;
    const status = payload.status;
    const amount = payload.amount;
    const currency = payload.currency;
    const reference = payload.reference;

    console.log(`[Omise Webhook] Processing charge ${chargeId} with status: ${status}`);

    // Extract quotation ID from reference (format: QUO-{quotationId})
    const quotationId = reference?.replace('QUO-', '');
    if (!quotationId) {
      console.error("[Omise Webhook] No quotation ID found in reference:", reference);
      return;
    }

    const supabase = await getSupabaseServerClient();

    // Get quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      console.error("[Omise Webhook] Quotation not found:", quotationId);
      return;
    }

    // Update quotation status based on charge status
    let newStatus: string | null = null;
    let paymentSuccessful = false;

    switch (status) {
      case 'successful':
        newStatus = 'paid';
        paymentSuccessful = true;
        console.log("[Omise Webhook] Payment successful for quotation:", quotationId);
        break;
      case 'failed':
        newStatus = 'payment_failed';
        console.log("[Omise Webhook] Payment failed for quotation:", quotationId);
        break;
      case 'expired':
        newStatus = 'payment_expired';
        console.log("[Omise Webhook] Payment expired for quotation:", quotationId);
        break;
      case 'pending':
        newStatus = 'payment_pending';
        console.log("[Omise Webhook] Payment pending for quotation:", quotationId);
        break;
      default:
        console.log(`[Omise Webhook] Unhandled charge status: ${status}`);
        return;
    }

    if (newStatus) {
      // Update quotation status
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: newStatus,
          payment_completed_at: paymentSuccessful ? new Date().toISOString() : null,
          payment_amount: paymentSuccessful ? amount / 100 : null, // Convert from smallest unit
          payment_method: 'Omise',
          payment_date: paymentSuccessful ? new Date().toISOString() : null
        })
        .eq('id', quotationId);

      if (updateError) {
        console.error("[Omise Webhook] Failed to update quotation status:", updateError);
      }

      // Store payment details in quotation_payments table
      if (paymentSuccessful) {
        const { error: paymentError } = await (supabase as any)
          .from('quotation_payments')
          .insert({
            quotation_id: quotationId,
            payment_method: 'Omise',
            amount: amount / 100, // Convert from smallest unit
            currency: currency,
            charge_id: chargeId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            reference: reference
          });

        if (paymentError) {
          console.error("[Omise Webhook] Failed to store payment details:", paymentError);
        }

        // Send payment confirmation email
        try {
                  await sendPaymentConfirmationEmail({
          to: quotation.customer_email || '',
          customerName: quotation.customer_name || 'Customer',
          invoiceId: `QUO-${quotation.quote_number || quotationId}`,
          amount: amount / 100,
          serviceName: quotation.title || "Service"
        });
        } catch (emailError) {
          console.error("[Omise Webhook] Failed to send confirmation email:", emailError);
        }
      }
    }
  } catch (error) {
    console.error("[Omise Webhook] Error handling charge webhook:", error);
  }
}

async function handleLinkWebhook(payload: any) {
  try {
    const linkId = payload.id;
    const status = payload.status;
    const used = payload.used;

    console.log(`[Omise Webhook] Processing link ${linkId} with status: ${status}, used: ${used}`);

    // Handle link-specific events if needed
    if (used && status === 'used') {
      console.log("[Omise Webhook] Payment link was used:", linkId);
    }
  } catch (error) {
    console.error("[Omise Webhook] Error handling link webhook:", error);
  }
}

async function handleEventWebhook(payload: any) {
  try {
    const eventType = payload.key;
    const eventData = payload.data;

    console.log(`[Omise Webhook] Processing event: ${eventType}`);

    if (eventType === 'link.charge.succeeded') {
      // Payment completed via payment link
      await handleLinkPaymentSuccess(eventData);
    } else if (eventType === 'link.charge.failed') {
      // Payment failed via payment link
      await handleLinkPaymentFailure(eventData);
    }
  } catch (error) {
    console.error("[Omise Webhook] Error handling event webhook:", error);
  }
}

async function handleLinkPaymentSuccess(eventData: any) {
  try {
    const charge = eventData;
    const linkId = charge.link;
    const amount = charge.amount;
    const currency = charge.currency;
    const reference = charge.reference;

    console.log(`[Omise Webhook] Link payment successful: ${linkId}, amount: ${amount}, reference: ${reference}`);

    // Extract quotation ID from reference (format: QUO-{quotationId})
    const quotationId = reference?.replace('QUO-', '');
    if (!quotationId) {
      console.error("[Omise Webhook] No quotation ID found in reference:", reference);
      return;
    }

    const supabase = await getSupabaseServerClient();

    // Get quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    if (quotationError || !quotation) {
      console.error("[Omise Webhook] Quotation not found:", quotationId);
      return;
    }

    // Update quotation status
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'paid',
        payment_completed_at: new Date().toISOString(),
        payment_amount: amount / 100, // Convert from smallest unit
        payment_method: 'Omise',
        payment_date: new Date().toISOString(),
        charge_id: charge.id // Store Omise charge ID for receipt download
      } as any)
      .eq('id', quotationId);

    if (updateError) {
      console.error("[Omise Webhook] Failed to update quotation status:", updateError);
    }

    // Store payment details in quotation_payments table
    const { error: paymentError } = await (supabase as any)
      .from('quotation_payments')
      .insert({
        quotation_id: quotationId,
        payment_method: 'Omise',
        amount: amount / 100, // Convert from smallest unit
        currency: currency,
        charge_id: linkId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        reference: reference
      });

    if (paymentError) {
      console.error("[Omise Webhook] Failed to update payment link:", paymentError);
    }

    // Send payment confirmation email
    try {
      await sendPaymentConfirmationEmail({
        to: quotation.customer_email || '',
        customerName: quotation.customer_name || 'Customer',
        invoiceId: `QUO-${quotation.quote_number || quotationId}`,
        amount: amount / 100,
        serviceName: quotation.title || "Service"
      });
    } catch (emailError) {
      console.error("[Omise Webhook] Failed to send confirmation email:", emailError);
    }
  } catch (error) {
    console.error("[Omise Webhook] Error handling link payment success:", error);
  }
}

async function handleLinkPaymentFailure(eventData: any) {
  try {
    const charge = eventData;
    const linkId = charge.link;
    const reference = charge.reference;

    console.log(`[Omise Webhook] Link payment failed: ${linkId}, reference: ${reference}`);

    // Extract quotation ID from reference
    const quotationId = reference?.replace('QUO-', '');
    if (!quotationId) {
      return;
    }

    const supabase = await getSupabaseServerClient();

    // Update quotation status to payment failed
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'payment_failed'
      })
      .eq('id', quotationId);

    if (updateError) {
      console.error("[Omise Webhook] Failed to update quotation status:", updateError);
    }
  } catch (error) {
    console.error("[Omise Webhook] Error handling link payment failure:", error);
  }
}

// Function to verify webhook signature (implement for production)
function verifyWebhookSignature(payload: any, signature: string | null): boolean {
  // TODO: Implement signature verification using Omise's webhook secret
  // For now, return true for development
  return true;
}
