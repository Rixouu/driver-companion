import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  try {
    const id = context.params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Quotation ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user is authenticated for protected details
    const { data: { session } } = await supabase.auth.getSession();
    
    // Fetch the quotation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_items (*),
        quotation_activities (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching quotation:', error);
      return NextResponse.json(
        { error: t('notifications.error') },
        { status: 500 }
      );
    }
    
    if (!quotation) {
      return NextResponse.json(
        { error: t('notifications.notFound') },
        { status: 404 }
      );
    }
    
    // Check if the user is authorized to view this quotation
    // If they are authenticated, they must be the creator (merchant_id)
    // If not authenticated, the quotation must be public (status = sent, approved, etc.)
    const isCreator = session && quotation.merchant_id === session.user.id;
    const isPublicStatus = ['sent', 'approved', 'rejected', 'converted'].includes(quotation.status);
    
    if (!isCreator && !isPublicStatus) {
      return NextResponse.json(
        { error: t('notifications.unauthorized') },
        { status: 403 }
      );
    }
    
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error handling quotation GET request:', error);
    return NextResponse.json(
      { error: t('notifications.error') },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  // ... rest of the file stays the same
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { t } = await getDictionary();

  // ... rest of the file stays the same
} 