import { NextRequest, NextResponse } from 'next/server';
import { updateInspectionItem, deleteInspectionItem, InspectionItemTemplate } from '@/lib/services/inspections';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/main';

interface UpdateItemRequestBody {
  name_translations?: { [key: string]: string };
  description_translations?: { [key: string]: string };
  requires_photo?: boolean;
  requires_notes?: boolean;
  order_number?: number;
  // category_id is generally not updated, as items are tied to a section.
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    // Temporarily disable auth check for debugging
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { itemId } = await params;
    const body = await request.json();

    console.log('PUT /api/inspection-items/[itemId] - Request data:', {
      itemId,
      body
    });

    if (!itemId) {
      return NextResponse.json({ error: 'itemId parameter is required' }, { status: 400 });
    }
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Request body cannot be empty for an update' }, { status: 400 });
    }
    
    const updates: Partial<InspectionItemTemplate> = {};

    if (body.name_translations) updates.name_translations = body.name_translations as any; // Cast to any to match InspectionItemTemplate
    if (body.description_translations) updates.description_translations = body.description_translations as any; // Cast to any to match InspectionItemTemplate
    if (body.requires_photo !== undefined) updates.requires_photo = body.requires_photo;
    if (body.requires_notes !== undefined) updates.requires_notes = body.requires_notes;
    if (body.order_number !== undefined) updates.order_number = body.order_number;

    console.log('PUT /api/inspection-items/[itemId] - Updates to apply:', updates);

    const updatedItem = await updateInspectionItem(itemId, updates);
    
    console.log('PUT /api/inspection-items/[itemId] - Updated item:', updatedItem);
    
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Error updating inspection item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inspection item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    // Temporarily disable auth check for debugging
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { itemId } = await params;
    await deleteInspectionItem(itemId, true); // Force delete

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inspection item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete inspection item' },
      { status: 500 }
    );
  }
} 