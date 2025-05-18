import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { PricingCategory } from '@/types/quotations';
import { Database } from '@/types/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const supabase = createPagesServerClient<Database>({ req, res }, {
      supabaseKey: process.env.SUPABASE_SERVICE_KEY, // Use service role key for admin operations
    });

    try {
      const { name, description, service_type_ids, sort_order, is_active } = req.body as Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>;

      // Basic validation
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Category name is required and must be a string.' });
      }
      if (sort_order === undefined || typeof sort_order !== 'number') {
        return res.status(400).json({ error: 'Sort order is required and must be a number.' });
      }
      if (service_type_ids && !Array.isArray(service_type_ids)) {
        return res.status(400).json({ error: 'Service type IDs must be an array.' });
      }

      // Get service type names for the IDs
      let serviceTypeNames: string[] = [];
      if (service_type_ids && service_type_ids.length > 0) {
        const { data: serviceTypes } = await supabase
          .from('service_types')
          .select('id, name')
          .in('id', service_type_ids);
          
        // Create a mapping of ID to name
        const serviceTypeMap = new Map();
        if (serviceTypes) {
          serviceTypes.forEach(st => serviceTypeMap.set(st.id, st.name));
        }
        
        // Map each ID to its name, fallback to a short ID string if name not found
        serviceTypeNames = service_type_ids.map(id => 
          serviceTypeMap.get(id) || `service_${id.substring(0, 8)}`
        );
      }

      const { data, error } = await supabase
        .from('pricing_categories')
        .insert({
          name,
          description: description || null,
          service_types: serviceTypeNames,
          service_type_ids: service_type_ids || [],
          sort_order,
          is_active: is_active === undefined ? true : is_active,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating pricing category:', error);
        return res.status(500).json({ error: error.message || 'Failed to create pricing category.' });
      }

      return res.status(201).json(data);
    } catch (err: any) {
      console.error('Error creating pricing category:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 