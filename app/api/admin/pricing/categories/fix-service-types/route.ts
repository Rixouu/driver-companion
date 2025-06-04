import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

type UpdateResult = 
  | { id: string; success: true; service_types: string[] }
  | { id: string; success: false; error: string };

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();

  try {
    // Admin check
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

    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from('service_types')
      .select('id, name');

    if (serviceTypesError) {
      console.error('Error fetching service types:', serviceTypesError);
      return NextResponse.json({ error: serviceTypesError.message }, { status: 500 });
    }

    const serviceTypeMap = new Map<string, string>();
    serviceTypes.forEach(st => {
      serviceTypeMap.set(st.id, st.name);
    });

    const { data: categories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select('id, service_type_ids, service_types');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    const updates: UpdateResult[] = [];
    for (const category of categories) {
      if (!category.service_type_ids || !Array.isArray(category.service_type_ids)) {
        console.log(`Skipping category ${category.id}: No service_type_ids or not an array`);
        continue;
      }

      const serviceNames = category.service_type_ids.map(id => {
        return serviceTypeMap.get(id) || `service_${id.substring(0, 8)}`
      });

      // Only update if service_types actually needs changing
      if (JSON.stringify(category.service_types) !== JSON.stringify(serviceNames)) {
        const { error: updateError } = await supabase
          .from('pricing_categories')
          .update({ service_types: serviceNames, updated_at: new Date().toISOString() })
          .eq('id', category.id);

        if (updateError) {
          console.error(`Error updating category ${category.id}:`, updateError);
          updates.push({ id: category.id, success: false, error: updateError.message });
        } else {
          console.log(`Successfully updated category ${category.id}`);
          updates.push({ id: category.id, success: true, service_types: serviceNames });
        }
      } else {
        // Log skipped due to no change, but don't count as failure or success explicitly in return totals
        console.log(`Skipping category ${category.id}: service_types field already up-to-date.`);
      }
    }

    return NextResponse.json({ 
      message: 'Service types update complete',
      totalUpdated: updates.filter(u => u.success).length,
      totalFailed: updates.filter(u => !u.success).length,
      details: updates
    }, { status: 200 });

  } catch (err: any) {
    console.error('Unexpected error in fix-service-types:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 