import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inspector_ids } = req.body

    if (!inspector_ids || !Array.isArray(inspector_ids) || inspector_ids.length === 0) {
      return res.status(400).json({ error: 'Invalid inspector_ids array' })
    }

    const supabase = getSupabaseServerClient()

    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name')
      .in('id', inspector_ids)

    if (error) {
      console.error('Error fetching drivers:', error)
      return res.status(500).json({ error: 'Failed to fetch driver information' })
    }

    // Create a map of driver_id to driver data
    const driversMap: Record<string, any> = {}
    drivers?.forEach(driver => {
      driversMap[driver.id] = driver
    })

    return res.status(200).json({ drivers: driversMap })
  } catch (error) {
    console.error('Error in inspector-info-batch:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
