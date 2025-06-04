import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PricingCategory } from '@/types/quotations'; // Assuming this type is still valid

export const dynamic = "force-dynamic";

interface DirectUpdateBody {
  id: string;
  updates: Partial<Omit<PricingCategory, 'id' | 'created_at'> // updated_at will be set by the server
  >; 
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  try {
    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id, updates } = await req.json() as DirectUpdateBody;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Category ID is required and must be a string' }, { status: 400 });
    }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Update data is required and must be an object' }, { status: 400 });
    }

    // Fetch existing category to help with service_types sync
    const { data: existingCategory, error: fetchError } = await supabase
      .from('pricing_categories')
      .select('*') // Select all fields, especially service_type_ids and service_types
      .eq('id', id)
      .single();

    if (fetchError || !existingCategory) {
      console.error('Error fetching existing category or category not found:', fetchError);
      return NextResponse.json({ error: 'Pricing category not found or error fetching it.' }, { status: 404 });
    }

    const updatePayload: { [key: string]: any } = { ...updates };

    // Sync service_types if service_type_ids are being updated
    if (updates.service_type_ids) {
      let serviceTypeNames: string[] = [];
      if (updates.service_type_ids.length > 0) {
        const { data: serviceTypesResult, error: stError } = await supabase
          .from('service_types')
          .select('id, name')
          .in('id', updates.service_type_ids);

        if (stError) {
          console.error('Error fetching service types for category update:', stError);
          // Potentially allow update to proceed with derived names or fail
        }
        
        const serviceTypeMap = new Map<string, string>();
        if (serviceTypesResult) {
          serviceTypesResult.forEach(st => serviceTypeMap.set(st.id, st.name));
        }
        serviceTypeNames = updates.service_type_ids.map(stId => 
          serviceTypeMap.get(stId) || `service_${stId.substring(0, 8)}`
        );
      }
      updatePayload.service_types = serviceTypeNames;
    }

    // Always set updated_at
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedData, error: updateError } = await supabase
      .from('pricing_categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single(); // Assuming update should return the single updated record

    if (updateError) {
      console.error('Supabase error updating pricing category:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update pricing category.' }, { status: 500 });
    }
    
    if (!updatedData) {
        // This case should ideally not happen if .single() is used after a successful update on an existing ID
        return NextResponse.json({ error: 'Failed to update pricing category or category not found after update.' }, { status: 404 });
    }

    return NextResponse.json(updatedData, { status: 200 });
  } catch (err: any) {
    console.error('Error processing direct-update for pricing category:', err);
    const message = err.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 