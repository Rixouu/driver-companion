import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// This is a specialized endpoint that forces an update using the REST API
// directly with the service role key, bypassing any RLS restrictions
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Ensure the user is authenticated
  try {
    const supabase = createPagesServerClient<Database>({ req, res });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse the request body
    const { table, id, updates } = req.body;
    
    // Validation
    if (!table || typeof table !== 'string') {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Record ID is required' });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates object is required' });
    }
    
    // Only allow specific tables for security
    const allowedTables = ['pricing_categories', 'pricing_items'];
    if (!allowedTables.includes(table)) {
      return res.status(403).json({ 
        error: `Table ${table} is not allowed. Only ${allowedTables.join(', ')} are permitted.` 
      });
    }
    
    // Force an update using direct REST API call with service role key
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Supabase configuration is missing' });
    }
    
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    console.log(`Force-updating ${table} with ID ${id}:`, updateData);
    
    // Make direct REST API call to Supabase
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Force update failed:', response.status, errorText);
        return res.status(response.status).json({ error: errorText });
      }
      
      const data = await response.json();
      console.log('Force update successful:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        return res.status(200).json(data[0]);
      } else {
        return res.status(200).json(data);
      }
    } catch (fetchError: any) {
      console.error('Error during force update:', fetchError);
      return res.status(500).json({ error: fetchError.message || 'Error updating record' });
    }
  } catch (err: any) {
    console.error('Unexpected error in force-update endpoint:', err);
    return res.status(500).json({ error: err.message || 'An unexpected error occurred' });
  }
} 