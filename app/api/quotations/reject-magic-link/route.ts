import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

export async function POST(req: NextRequest) {
  try {
    const { quotation_id, reason, signature } = await req.json();

    if (!quotation_id || !reason) {
      return NextResponse.json(
        { error: "Missing quotation_id or reason" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Update the quotation status to rejected
    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        rejection_signature: signature || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotation_id);

    if (updateError) {
      console.error('Error rejecting quotation:', updateError);
      return NextResponse.json(
        { error: "Failed to reject quotation" },
        { status: 500 }
      );
    }

    // Record the rejection activity
    await supabase
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
      });

    return NextResponse.json({
      success: true,
      message: "Quotation rejected successfully"
    });

  } catch (error) {
    console.error('Error rejecting quotation via magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
