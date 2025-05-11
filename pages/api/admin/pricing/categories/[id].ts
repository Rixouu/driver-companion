import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Category ID must be a string.' });
  }

  const supabase = createPagesServerClient<Database>({ req, res }, {
    supabaseKey: process.env.SUPABASE_SERVICE_KEY, // Use service role key for admin operations
  });

  if (req.method === 'PATCH') {
    try {
      const { name, description, service_type_ids, sort_order, is_active } = req.body;

      // Construct the update object conditionally
      const updateData: Partial<Database['public']['Tables']['pricing_categories']['Update']> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (service_type_ids !== undefined) updateData.service_types = service_type_ids; // Map to service_types
      if (sort_order !== undefined) updateData.sort_order = sort_order;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data provided.' });
      }

      const { data, error } = await supabase
        .from('pricing_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating pricing category:', error);
        return res.status(500).json({ error: error.message || 'Failed to update pricing category.' });
      }
      if (!data) {
        return res.status(404).json({ error: 'Pricing category not found.' });
      }
      return res.status(200).json(data);
    } catch (err: any) {
      console.error('Error updating pricing category:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('pricing_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting pricing category:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete pricing category.' });
      }
      return res.status(204).end(); // No content
    } catch (err: any) {
      console.error('Error deleting pricing category:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 