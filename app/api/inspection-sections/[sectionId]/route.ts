import { NextResponse } from 'next/server';
import { updateInspectionSection, deleteInspectionSection } from '@/lib/services/inspections';

interface UpdateSectionRequestBody {
  name_translations: { [key: string]: string };
  description_translations?: { [key: string]: string };
  order_number?: number;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
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
    console.error(`Error updating inspection section:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update inspection section', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const url = new URL(request.url);
    const force = url.searchParams.get('force') !== 'false'; // Default to true

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId parameter is required' }, { status: 400 });
    }

    await deleteInspectionSection(sectionId, force);
    return NextResponse.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error(`Error deleting inspection section:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Check if error is due to existing items and provide a specific message
    if (errorMessage.includes('violates foreign key constraint') && errorMessage.includes('inspection_item_templates_category_id_fkey')) {
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to delete section', 
                details: 'This section cannot be deleted because it still contains items. Please delete the items first or use force delete if available.',
                code: 'SECTION_NOT_EMPTY'
            }, 
            { status: 409 } // 409 Conflict
        );
    }
    return NextResponse.json({ success: false, error: 'Failed to delete inspection section', details: errorMessage }, { status: 500 });
  }
} 