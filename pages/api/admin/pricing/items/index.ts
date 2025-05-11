import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { PricingItem } from '@/types/quotations';
import { Database } from '@/types/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const supabase = createPagesServerClient<Database>({ req, res }, {
      supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    });

    try {
      const { 
        category_id,
        service_type_id,
        vehicle_type,
        duration_hours,
        price,
        currency,
        is_active 
      } = req.body as Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>;

      // Basic validation (can be expanded)
      if (!service_type_id || !vehicle_type || duration_hours === undefined || price === undefined || !currency) {
        return res.status(400).json({ error: 'Missing required fields for pricing item.' });
      }

      const { data, error } = await supabase
        .from('pricing_items')
        .insert({
          category_id: category_id || null,
          service_type_id,
          vehicle_type,
          duration_hours,
          price,
          currency,
          is_active: is_active === undefined ? true : is_active,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating pricing item:', error);
        return res.status(500).json({ error: error.message || 'Failed to create pricing item.' });
      }

      return res.status(201).json(data);
    } catch (err: any) {
      console.error('Error creating pricing item:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 