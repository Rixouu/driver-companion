import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PricingItem } from '@/types/quotations'; // Assuming type is still valid
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic";

async function verifyAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .single();
  return !adminError && adminUser && adminUser.role === 'admin';
}

// PATCH handler for updating a pricing item
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const itemId = params.id;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!await verifyAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json() as Partial<Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'> >;
    
    const updatePayload: Partial<Database['public']['Tables']['pricing_items']['Update']> = {};

    // Map known fields from body to updatePayload
    if (body.category_id !== undefined) updatePayload.category_id = body.category_id;
    if (body.service_type_id !== undefined) updatePayload.service_type_id = body.service_type_id;
    if (body.vehicle_type !== undefined) updatePayload.vehicle_type = body.vehicle_type;
    if (body.duration_hours !== undefined) updatePayload.duration_hours = body.duration_hours;
    if (body.price !== undefined) updatePayload.price = body.price;
    if (body.currency !== undefined) updatePayload.currency = body.currency;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

    // If service_type_id is updated, also update service_type (name)
    if (body.service_type_id) {
      let serviceTypeName = 'Unknown Service';
      const { data: serviceTypeData, error: stError } = await supabase
        .from('service_types')
        .select('name')
        .eq('id', body.service_type_id)
        .single();
      if (stError) {
        console.warn(`Could not fetch service type name for ID ${body.service_type_id} during update:`, stError.message);
      } else if (serviceTypeData) {
        serviceTypeName = serviceTypeData.name;
      }
      updatePayload.service_type = serviceTypeName; // Assuming column name is 'service_type'
    }
    
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No update data provided.' }, { status: 400 });
    }
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('pricing_items')
      .update(updatePayload)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating pricing item (PATCH):', error);
      // PGRST116: No rows found. PGRST202: Foreign key violation.
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Pricing item not found.' }, { status: 404 });
      if (error.code === '23503') return NextResponse.json({ error: `Invalid reference: ${error.details}` }, { status: 400 });
      return NextResponse.json({ error: error.message || 'Failed to update pricing item.' }, { status: 500 });
    }
    if (!data) {
         return NextResponse.json({ error: 'Pricing item not found after update.' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Error updating pricing item (PATCH):', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE handler for deleting a pricing item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const itemId = params.id;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!await verifyAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { error } = await supabase
      .from('pricing_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Supabase error deleting pricing item:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pricing item not found or already deleted.'}, { status: 404 });
      }
      return NextResponse.json({ error: error.message || 'Failed to delete pricing item.' }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 }); // No content
  } catch (err: any) {
    console.error('Error deleting pricing item:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
} 