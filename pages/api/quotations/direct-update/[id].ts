import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Direct update API called with query:', req.query);
    console.log('Direct update API called with body:', req.body);
    
    // Get quotation ID from the URL and ensure it's a string
    const quotationId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    // Get update data from request body
    const { amount, total_amount } = req.body;
    
    if (!quotationId) {
      console.error('Missing quotation ID in request');
      return res.status(400).json({ error: 'Quotation ID is required' });
    }
    
    if (amount === undefined || total_amount === undefined) {
      console.error('Missing required fields:', { amount, total_amount });
      return res.status(400).json({ error: 'Both amount and total_amount are required' });
    }

    // Log the values we're using
    console.log('Direct update parameters:', { 
      quotationId, 
      amount, 
      total_amount,
      amountType: typeof amount,
      totalAmountType: typeof total_amount
    });

    // Get supabase client - properly awaiting the async function
    try {
      console.log('Getting Supabase client...');
      const supabase = await createServerSupabaseClient();
      console.log('Supabase client created successfully');
      
      // Create update data - ensure numeric values
      const updateData = {
        amount: Number(amount),
        total_amount: Number(total_amount)
      };
      
      console.log(`Direct update for quotation ${quotationId}:`, updateData);
      
      // Update the quotation directly
      console.log('Executing update query...');
      const { data, error } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', quotationId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error updating quotation:', error);
        return res.status(500).json({ error: 'Failed to update quotation', details: error });
      }
      
      console.log('Update successful:', data);
      
      // Return the updated quotation
      return res.status(200).json(data);
    } catch (supabaseError) {
      console.error('Error creating or using Supabase client:', supabaseError);
      return res.status(500).json({ error: 'Supabase client error', details: supabaseError });
    }
  } catch (error) {
    console.error('Unexpected error in direct-update API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error });
  }
} 