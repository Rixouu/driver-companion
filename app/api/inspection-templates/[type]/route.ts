import { NextResponse } from 'next/server'
import { getInspectionTemplates, duplicateInspectionTemplate, deleteInspectionTemplate } from '@/lib/services/inspections'
import { createServiceClient } from '@/lib/supabase/service-client'
import type { InspectionType } from '@/types/inspections'
import { NextRequest } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: InspectionType }> }
) {
  try {
    const resolvedParams = await params
    if (!resolvedParams || !resolvedParams.type) {
      return NextResponse.json({ error: 'Type parameter is required and params must be defined' }, { status: 400 })
    }
    const { type } = resolvedParams

    const templates = await getInspectionTemplates(type)
    return NextResponse.json(templates)
  } catch (error) {
    console.error(`Error fetching inspection templates:`, error)
    // It's good practice to not expose internal error details to the client
    // Instead, log them on the server and return a generic error message.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: 'Failed to fetch inspection templates', details: errorMessage }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: InspectionType }> }
) {
  try {
    const resolvedParams = await params
    if (!resolvedParams || !resolvedParams.type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 })
    }
    const { type: targetType } = resolvedParams
    
    const body = await request.json()
    const { sourceType, nameTranslations } = body
    
    if (!sourceType) {
      return NextResponse.json({ error: 'sourceType is required in request body' }, { status: 400 })
    }

    const duplicatedTemplate = await duplicateInspectionTemplate(sourceType, targetType, nameTranslations)
    return NextResponse.json(duplicatedTemplate, { status: 201 })
  } catch (error) {
    console.error(`Error duplicating inspection template:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: 'Failed to duplicate inspection template', details: errorMessage }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const resolvedParams = await params;
    const { type: oldType } = resolvedParams;
    const body = await request.json();
    const { newType, displayName } = body;

    if (!newType || !displayName) {
      return NextResponse.json(
        { error: 'newType and displayName are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Update all categories with this type
    const { error } = await supabase
      .from('inspection_categories')
      .update({ type: newType })
      .eq('type', oldType);

    if (error) {
      console.error('Error updating template type:', error);
      return NextResponse.json(
        { error: 'Failed to update template type', details: error.message },
        { status: 500 }
      );
    }

    // Update any template assignments
    const { error: assignmentError } = await supabase
      .from('inspection_template_assignments')
      .update({ template_type: newType })
      .eq('template_type', oldType);

    if (assignmentError) {
      console.error('Error updating template assignments:', assignmentError);
      // Don't fail here, just log
    }

    return NextResponse.json({ 
      success: true, 
      message: `Template "${oldType}" renamed to "${newType}"` 
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update template' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const resolvedParams = await params;
    const { type } = resolvedParams;
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    await deleteInspectionTemplate(type as any, force);

    return NextResponse.json({ 
      success: true, 
      message: `Template "${type}" deleted successfully` 
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete template' 
      },
      { status: 500 }
    );
  }
} 