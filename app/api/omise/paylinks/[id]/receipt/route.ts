import { NextRequest, NextResponse } from "next/server";
import { OmiseClient } from "@/lib/omise-client";

// GET - Generate receipt for a payment link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment link ID is required' },
        { status: 400 }
      );
    }

    const omise = new OmiseClient();
    
    // Get the payment link details
    const link = await omise.links.retrieve(id);
    
    // Check if the link is paid
    const isPaid = link.state === 'paid' || link.used;
    
    if (!isPaid) {
      return NextResponse.json(
        { success: false, error: 'Receipt can only be generated for paid payment links' },
        { status: 400 }
      );
    }

    // Generate receipt data
    const receiptData = {
      id: link.id,
      title: link.title || link.name || 'Payment Receipt',
      description: link.description || '',
      amount: link.amount,
      currency: link.currency,
      status: link.state || 'paid',
      created_at: link.created_at,
      paid_at: link.used_at || link.updated_at,
      transaction_url: link.transaction_url || link.payment_uri,
      receipt_url: null // We'll generate a custom receipt
    };

    return NextResponse.json({
      success: true,
      data: receiptData
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate receipt' 
      },
      { status: 500 }
    );
  }
}