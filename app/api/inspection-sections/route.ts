import { NextResponse } from 'next/server';
import { addInspectionSection } from '@/lib/services/inspections';
import type { InspectionType } from '@/types/inspections';

interface CreateSectionRequestBody {
  type: InspectionType;
  name_translations: { [key: string]: string };
  description_translations?: { [key: string]: string };
}

export async function POST(request: Request) {
  try {
    const body: CreateSectionRequestBody = await request.json();
    const { type, name_translations, description_translations } = body;

    if (!type || !name_translations) {
      return NextResponse.json({ error: 'Missing required fields: type and name_translations are required.' }, { status: 400 });
    }

    const newSection = await addInspectionSection(type, name_translations, description_translations);
    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error('Error creating inspection section:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to create inspection section', details: errorMessage }, { status: 500 });
  }
} 