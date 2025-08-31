import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { booking_ids } = req.body

    if (!booking_ids || !Array.isArray(booking_ids) || booking_ids.length === 0) {
      return res.status(400).json({ error: 'Invalid booking_ids array' })
    }

    const supabase = getSupabaseServerClient()

    // Fetch driver info for multiple bookings
    const { data: dispatchEntries, error } = await supabase
      .from('dispatch_entries')
      .select(`
        booking_id,
        driver_id,
        drivers!inner (
          id,
          first_name,
          last_name
        )
      `)
      .in('booking_id', booking_ids)

    if (error) {
      console.error('Error fetching dispatch entries:', error)
      return res.status(500).json({ error: 'Failed to fetch driver information' })
    }

    // Map booking_id to driver info
    const driversMap: Record<string, any> = {}
    dispatchEntries?.forEach(entry => {
      if (entry.booking_id && entry.drivers) {
        driversMap[entry.booking_id] = {
          id: entry.drivers.id,
          first_name: entry.drivers.first_name,
          last_name: entry.drivers.last_name
        }
      }
    })

    return res.status(200).json({ drivers: driversMap })
  } catch (error) {
    console.error('Error in dispatch info batch API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
