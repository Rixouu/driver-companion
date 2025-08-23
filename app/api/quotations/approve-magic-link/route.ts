import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";

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

    return NextResponse.json({
      success: true,
      message: "Quotation approved successfully"
    });

  } catch (error) {
    console.error('Error approving quotation via magic link:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
