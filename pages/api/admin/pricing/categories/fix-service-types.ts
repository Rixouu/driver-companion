import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

type UpdateResult = 
  | { id: string; success: true; service_types: string[] }
  | { id: string; success: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res }, {
      supabaseKey: process.env.SUPABASE_SERVICE_KEY, // Use service role key for admin operations
    });

    // First, get all service types to create a mapping
    const { data: serviceTypes, error: serviceTypesError } = await supabase
      .from('service_types')
      .select('id, name');

    if (serviceTypesError) {
      console.error('Error fetching service types:', serviceTypesError);
      return res.status(500).json({ error: serviceTypesError.message });
    }

    // Create a map of ID -> name
    const serviceTypeMap = new Map();
    serviceTypes.forEach(st => {
      serviceTypeMap.set(st.id, st.name);
    });

    // Get all pricing categories
    const { data: categories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select('id, service_type_ids, service_types');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return res.status(500).json({ error: categoriesError.message });
    }

    // Process each category to fix service_types
    const updates: UpdateResult[] = [];
    for (const category of categories) {
      if (!category.service_type_ids || !Array.isArray(category.service_type_ids)) {
        console.log(`Skipping category ${category.id}: No service_type_ids or not an array`);
        continue;
      }

      // Map IDs to actual service names
      const serviceNames = category.service_type_ids.map(id => {
        return serviceTypeMap.get(id) || `service_${id.substring(0, 8)}`;
      });

      // Update the category
      const { data, error } = await supabase
        .from('pricing_categories')
        .update({
          service_types: serviceNames
        })
        .eq('id', category.id);

      if (error) {
        console.error(`Error updating category ${category.id}:`, error);
        updates.push({ id: category.id, success: false, error: error.message });
      } else {
        console.log(`Successfully updated category ${category.id}`);
        updates.push({ id: category.id, success: true, service_types: serviceNames });
      }
    }

    return res.status(200).json({ 
      message: 'Service types update complete',
      totalUpdated: updates.filter(u => u.success).length,
      totalFailed: updates.filter(u => !u.success).length,
      updates
    });

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred' });
  }
} 