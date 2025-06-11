import { NextRequest, NextResponse } from 'next/server';
import { addInspectionItem } from '@/lib/services/inspections';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/main';

interface CreateItemRequestBody {
  category_id: string;
  name_translations: { [key: string]: string };
  description_translations?: { [key: string]: string };
  requires_photo: boolean;
  requires_notes: boolean;
  order_number?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable auth check for debugging
    // const session = await getServerSession(authOptions)
    
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { categoryId, nameTranslations, requiresPhoto, requiresNotes, descriptionTranslations } = body

    if (!categoryId || !nameTranslations) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await addInspectionItem(
      categoryId,
      nameTranslations,
      requiresPhoto || false,
      requiresNotes || false,
      descriptionTranslations
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error adding inspection item:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 