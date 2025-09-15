import { NextRequest, NextResponse } from "next/server";
import { OmiseClient } from "@/lib/omise-client";

// GET - Retrieve a specific payment link
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
    const link = await omise.links.retrieve(id);

    return NextResponse.json({
      success: true,
      data: link
    });

  } catch (error) {
    console.error('Error retrieving payment link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve payment link' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment link
export async function DELETE(
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
    const link = await omise.links.destroy(id);

    return NextResponse.json({
      success: true,
      data: link
    });

  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete payment link' 
      },
      { status: 500 }
    );
  }
}
