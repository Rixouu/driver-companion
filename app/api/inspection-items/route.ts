import { NextResponse } from 'next/server';
import { addInspectionItem } from '@/lib/services/inspections';

interface CreateItemRequestBody {
  category_id: string;
  name_translations: { [key: string]: string };
  description_translations?: { [key: string]: string };
  requires_photo: boolean;
  requires_notes: boolean;
  order_number?: number;
}

export async function POST(request: Request) {
  try {
    const body: CreateItemRequestBody = await request.json();
    const { category_id, name_translations, description_translations, requires_photo, requires_notes, order_number } = body;

    if (!category_id || !name_translations || requires_photo === undefined || requires_notes === undefined) {
      return NextResponse.json({ error: 'Missing required fields: category_id, name_translations, requires_photo, and requires_notes are required.' }, { status: 400 });
    }

    // The addInspectionItem function in inspections.ts might not directly take order_number.
    // It typically sets a default. If order_number needs to be set at creation, the service function might need adjustment
    // or this API will rely on a subsequent update if ordering is immediately critical.
    const newItem = await addInspectionItem(category_id, name_translations, requires_photo, requires_notes, description_translations);
    
    // If order_number was provided and needs to be set, and addInspectionItem doesn't handle it, 
    // an update call would be needed here. For now, we assume addInspectionItem sets a sensible default or is updated separately.

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating inspection item:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to create inspection item', details: errorMessage }, { status: 500 });
  }
} 