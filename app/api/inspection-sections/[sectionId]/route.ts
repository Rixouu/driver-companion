import { NextResponse } from 'next/server';
import { updateInspectionSection, deleteInspectionSection } from '@/lib/services/inspections';

interface UpdateSectionRequestBody {
  name_translations: { [key: string]: string };
  description_translations?: { [key: string]: string };
  order_number?: number;
}

export async function PUT(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const body: UpdateSectionRequestBody = await request.json();
    const { name_translations, description_translations, order_number } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId parameter is required' }, { status: 400 });
    }
    if (!name_translations) {
      return NextResponse.json({ error: 'name_translations is required in the request body' }, { status: 400 });
    }

    const updatedSection = await updateInspectionSection(sectionId, name_translations, description_translations, undefined, order_number);
    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error(`Error updating inspection section ${params.sectionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update inspection section', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId parameter is required' }, { status: 400 });
    }

    await deleteInspectionSection(sectionId);
    return NextResponse.json({ message: 'Section deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting inspection section ${params.sectionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Check if error is due to existing items and provide a specific message
    if (errorMessage.includes('violates foreign key constraint') && errorMessage.includes('inspection_item_templates_category_id_fkey')) {
        return NextResponse.json(
            { 
                error: 'Failed to delete section', 
                details: 'This section cannot be deleted because it still contains items. Please delete the items first or use force delete if available.',
                code: 'SECTION_NOT_EMPTY'
            }, 
            { status: 409 } // 409 Conflict
        );
    }
    return NextResponse.json({ error: 'Failed to delete inspection section', details: errorMessage }, { status: 500 });
  }
} 