import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const quotationIdParam = req.query.id;
    const quotationId = Array.isArray(quotationIdParam) ? quotationIdParam[0] : quotationIdParam;

    if (!quotationId) {
      return res.status(400).json({ error: 'Quotation ID is required' });
    }

    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching quotation items:', error);
      return res.status(500).json({ error: 'Failed to fetch quotation items' });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Unexpected error in direct-items API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 