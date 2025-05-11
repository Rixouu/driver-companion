import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { PricingItem } from '@/types/quotations';

// Define a type for the expected PATCH request body
type UpdatePricingItemPayload = Partial<PricingItem>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Pricing Item ID must be a string.' });
  }

  const supabase = createPagesServerClient<Database>({ req, res }, {
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  });

  if (req.method === 'PATCH') {
    try {
      const body = req.body as UpdatePricingItemPayload;

      // Exclude read-only fields manually if present in body
      // and ensure service_type_name is not passed to the DB update
      const { 
        id: itemId, 
        created_at, 
        updated_at, 
        service_type_name, 
        ...validPayload 
      } = body;

      const updateData: Partial<Database['public']['Tables']['pricing_items']['Update']> = {};

      // Explicitly cast to any to bypass strict type checking for validPayload before assigning to updateData
      // This is a temporary measure due to persistent linter/type issues.
      const VPayload: any = validPayload;

      if (VPayload.category_id !== undefined) updateData.category_id = VPayload.category_id;
      if (VPayload.service_type_id !== undefined) updateData.service_type_id = VPayload.service_type_id;
      if (VPayload.vehicle_type !== undefined) updateData.vehicle_type = VPayload.vehicle_type;
      if (VPayload.duration_hours !== undefined) updateData.duration_hours = VPayload.duration_hours;
      if (VPayload.price !== undefined) updateData.price = VPayload.price;
      if (VPayload.currency !== undefined) updateData.currency = VPayload.currency;
      if (VPayload.is_active !== undefined) updateData.is_active = VPayload.is_active;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data provided.' });
      }

      const { data, error } = await supabase
        .from('pricing_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating pricing item:', error);
        if (error.code === '23503') { 
             return res.status(400).json({ error: `Invalid reference: ${error.details}` });
        }
        return res.status(500).json({ error: error.message || 'Failed to update pricing item.' });
      }
      if (!data) {
        return res.status(404).json({ error: 'Pricing item not found.' });
      }
      return res.status(200).json(data);
    } catch (err: any) {
      console.error('Error updating pricing item:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('pricing_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting pricing item:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete pricing item.' });
      }
      return res.status(204).end();
    } catch (err: any) {
      console.error('Error deleting pricing item:', err);
      return res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 