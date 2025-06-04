import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PricingCategory } from '@/types/quotations'; // Assuming this type is still valid

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  try {
    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users') // Assuming an 'admin_users' table with a 'role' column
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json() as Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>;
    const { name, description, service_type_ids, sort_order, is_active } = body;

    // Basic validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Category name is required and must be a string.' }, { status: 400 });
    }
    // sort_order can be 0, so check for undefined
    if (sort_order === undefined || typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'Sort order is required and must be a number.' }, { status: 400 });
    }
    if (service_type_ids && !Array.isArray(service_type_ids)) {
      return NextResponse.json({ error: 'Service type IDs must be an array.' }, { status: 400 });
    }

    // Get service type names for the IDs
    let serviceTypeNames: string[] = [];
    if (service_type_ids && service_type_ids.length > 0) {
      const { data: serviceTypes, error: stError } = await supabase
        .from('service_types')
        .select('id, name')
        .in('id', service_type_ids);
      
      if (stError) {
        console.error('Error fetching service types for category creation:', stError);
        // Decide if this is a hard error or if we can proceed without names
        // For now, proceed, names will be derived or empty
      }
      
      const serviceTypeMap = new Map<string, string>();
      if (serviceTypes) {
        serviceTypes.forEach(st => serviceTypeMap.set(st.id, st.name));
      }
      
      serviceTypeNames = service_type_ids.map(id => 
        serviceTypeMap.get(id) || `service_${id.substring(0, 8)}`
      );
    }

    const { data, error: insertError } = await supabase
      .from('pricing_categories')
      .insert({
        name,
        description: description || null,
        service_types: serviceTypeNames, // Storing resolved names
        service_type_ids: service_type_ids || [], // Storing original IDs
        sort_order,
        is_active: is_active === undefined ? true : is_active,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase error creating pricing category:', insertError);
      return NextResponse.json({ error: insertError.message || 'Failed to create pricing category.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating pricing category:', err);
    // Ensure a default message if err.message is not available
    const message = err.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 