import { NextResponse } from 'next/server';
import { deleteInspectionSection } from '@/lib/services/inspections';

export async function DELETE(request: Request) {
  try {
    const { sectionIds } = await request.json();
    const url = new URL(request.url);
    const force = url.searchParams.get('force') !== 'false'; // Default to true

    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return NextResponse.json({ error: 'sectionIds array is required' }, { status: 400 });
    }

    // Delete each section using the service function
    const results = await Promise.allSettled(
      sectionIds.map(sectionId => deleteInspectionSection(sectionId, force))
    );

    // Check for failures
    const failures = results
      .map((result, index) => ({ result, index, sectionId: sectionIds[index] }))
      .filter(({ result }) => result.status === 'rejected');

    if (failures.length > 0) {
      const errorDetails = failures.map(({ sectionId, result }) => ({
        sectionId,
        error: result.status === 'rejected' ? result.reason.message : 'Unknown error'
      }));

      return NextResponse.json({
        success: false,
        error: 'Some sections could not be deleted',
        details: errorDetails,
        partialSuccess: results.length - failures.length > 0
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({ 
      success: true, 
      message: `${sectionIds.length} sections deleted successfully`,
      deletedCount: sectionIds.length
    });
  } catch (error) {
    console.error('Error in bulk delete sections:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete sections', 
      details: errorMessage 
    }, { status: 500 });
  }
} 