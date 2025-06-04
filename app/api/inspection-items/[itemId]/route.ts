import { NextResponse } from 'next/server';
import { updateInspectionItem, deleteInspectionItem, InspectionItemTemplate } from '@/lib/services/inspections';

interface UpdateItemRequestBody {
  name_translations?: { [key: string]: string };
  description_translations?: { [key: string]: string };
  requires_photo?: boolean;
  requires_notes?: boolean;
  order_number?: number;
  // category_id is generally not updated, as items are tied to a section.
}

export async function PUT(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const body: UpdateItemRequestBody = await request.json();

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

    const updatedItem = await updateInspectionItem(itemId, updates);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(`Error updating inspection item ${params.itemId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update inspection item', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';

    if (!itemId) {
      return NextResponse.json({ error: 'itemId parameter is required' }, { status: 400 });
    }

    await deleteInspectionItem(itemId, forceDelete);
    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting inspection item ${params.itemId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const urlForErrorScope = new URL(request.url);
    const forceDeleteInErrorScope = urlForErrorScope.searchParams.get('force') === 'true';

    if (errorMessage.includes('violates foreign key constraint') && 
        errorMessage.includes('inspection_items_template_id_fkey') && 
        !forceDeleteInErrorScope
    ) {
      return NextResponse.json(
        { 
            error: 'Failed to delete item', 
            details: 'This item is part of an existing inspection and cannot be deleted. Use force delete to remove it and associated inspection data.',
            code: 'ITEM_IN_USE'
        }, 
        { status: 409 } // 409 Conflict
      );
    }
    return NextResponse.json({ error: 'Failed to delete inspection item', details: errorMessage }, { status: 500 });
  }
} 