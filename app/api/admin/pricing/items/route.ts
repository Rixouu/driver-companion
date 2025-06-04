import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PricingItem } from '@/types/quotations'; // Assuming this type is still valid

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  try {
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

    const body = await req.json() as Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>;
    const {
      category_id,
      service_type_id,
      vehicle_type,
      duration_hours,
      price,
      currency,
      is_active
    } = body;

    if (!service_type_id || !vehicle_type || duration_hours === undefined || price === undefined || !currency) {
      return NextResponse.json({ error: 'Missing required fields for pricing item.' }, { status: 400 });
    }

    // Fetch service_type_name based on service_type_id
    let serviceTypeName = 'Unknown Service'; // Default value
    if (service_type_id) {
      const { data: serviceTypeData, error: stError } = await supabase
        .from('service_types')
        .select('name')
        .eq('id', service_type_id)
        .single();
      if (stError) {
        console.warn(`Could not fetch service type name for ID ${service_type_id}:`, stError.message);
        // Proceed with default or potentially throw error if name is strictly required and lookup fails
      } else if (serviceTypeData) {
        serviceTypeName = serviceTypeData.name;
      }
    }

    const { data, error: insertError } = await supabase
      .from('pricing_items')
      .insert({
        category_id: category_id || null,
        service_type_id,
        service_type: serviceTypeName,
        vehicle_type,
        duration_hours,
        price,
        currency,
        is_active: is_active === undefined ? true : is_active,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error creating pricing item:', insertError);
      return NextResponse.json({ error: insertError.message || 'Failed to create pricing item.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating pricing item:', err);
    const message = err.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 