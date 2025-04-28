import { Booking } from '@/types/bookings'
import { createServiceClient } from '@/lib/supabase/service-client'
import { fetchBookings } from './wordpress'
import { Database, Json } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extracts duration information from WordPress metadata
 */
function getDurationFromMeta(meta: Record<string, any> | null): string | null {
  if (!meta) return null;
  
  if (meta.chbs_duration) {
    return String(meta.chbs_duration);
  }
  
  return null;
}

/**
 * Maps a WordPress booking to a Supabase booking structure
 */
export const mapWordPressBookingToSupabase = (wpBooking: WordPressBooking): Omit<SupabaseBooking, 'id'> => {
  const meta = wpBooking.meta;
  const wpMeta = meta || {};

  // Extract service type from WordPress meta
  let serviceType = wpMeta.chbs_service_type || null;
  
  // Try to determine service type from route name or details
  if (!serviceType && wpMeta.chbs_route_name) {
    const routeName = String(wpMeta.chbs_route_name).toLowerCase();
    if (routeName.includes('airport')) {
      serviceType = 'Airport Transfer';
    }
  }
  
  if (!serviceType && wpMeta.chbs_route_service_type) {
    serviceType = String(wpMeta.chbs_route_service_type);
  }
  
  // Fallback check for airport transfers in booking details
  if (!serviceType && wpMeta.chbs_booking_detail) {
    const bookingDetail = typeof wpMeta.chbs_booking_detail === 'string' 
      ? wpMeta.chbs_booking_detail 
      : JSON.stringify(wpMeta.chbs_booking_detail);
      
    if (bookingDetail.toLowerCase().includes('airport')) {
      serviceType = 'Airport Transfer';
    }
  }

  return {
    wp_id: wpBooking.id,
    service_name: wpMeta.chbs_vehicle_name || 'Vehicle Service',
    service_type: serviceType,
    date: wpBooking.date,
    time: wpBooking.time || '00:00',
    duration: getDurationFromMeta(meta) || null,
    status: wpBooking.status || 'pending',
    customer_name: wpMeta.chbs_client_contact_detail_first_name || null,
    customer_email: wpMeta.chbs_client_contact_detail_email_address || null,
    customer_phone: wpMeta.chbs_client_contact_detail_phone_number || null,
    distance: wpMeta.chbs_distance?.toString() || null,
    price_amount: wpBooking.price?.amount || null,
    price_currency: wpBooking.price?.currency || null,
    price_formatted: wpBooking.price?.formatted || null,
    payment_status: wpBooking.payment_status || null,
    payment_method: wpBooking.payment_method || null,
    payment_link: wpBooking.payment_link || wpBooking.ipps_payment_link || null,
    notes: wpMeta.chbs_comment || null,
    pickup_location: wpMeta.chbs_coordinate && Array.isArray(wpMeta.chbs_coordinate) && wpMeta.chbs_coordinate.length > 0 && wpMeta.chbs_coordinate[0].address || null,
    dropoff_location: wpMeta.chbs_coordinate && Array.isArray(wpMeta.chbs_coordinate) && wpMeta.chbs_coordinate.length > 1 && wpMeta.chbs_coordinate[1].address || null,
    wp_meta: wpMeta as Json,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: new Date().toISOString(),
  };
}

/**
 * Maps a Supabase booking to the Booking type
 */
export function mapSupabaseBookingToBooking(booking: Database['public']['Tables']['bookings']['Row']): Booking {
  return {
    id: booking.wp_id, // Use original WordPress ID for consistency
    booking_id: booking.wp_id,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    service_name: booking.service_name,
    service_id: booking.service_id || undefined,
    customer_id: booking.customer_id || undefined,
    customer_name: booking.customer_name || undefined,
    customer_email: booking.customer_email || undefined,
    customer_phone: booking.customer_phone || undefined,
    driver_id: booking.driver_id || undefined,
    
    // Set vehicle when vehicle_id is available
    ...(booking.vehicle_id && {
      vehicle: {
        id: booking.vehicle_id,
      },
    }),
    
    // Set price when price_amount is available
    ...(booking.price_amount && {
      price: {
        amount: booking.price_amount,
        currency: booking.price_currency || 'USD',
        formatted: booking.price_formatted || `${booking.price_currency || 'USD'} ${booking.price_amount}`,
      },
    }),
    
    // Location information
    pickup_location: booking.pickup_location || undefined,
    dropoff_location: booking.dropoff_location || undefined,
    distance: booking.distance || undefined,
    duration: booking.duration || undefined,
    
    // Payment information
    payment_status: booking.payment_status || undefined,
    payment_method: booking.payment_method || undefined,
    payment_link: booking.payment_link || undefined,
    
    // Additional metadata
    notes: booking.notes || undefined,
    meta: booking.wp_meta || undefined,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  }
}

/**
 * Syncs a single booking from WordPress to Supabase
 */
async function syncSingleBooking(supabase: SupabaseClient<Database>, wpBooking: Booking): Promise<{
  created: boolean;
  updated: boolean;
  booking_id?: string;
  error?: string;
}> {
  try {
    // First, check if this booking already exists in Supabase
    const { data: existingBooking, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('wp_id', String(wpBooking.id || wpBooking.booking_id || ''))
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "Did not find a single row"
      throw queryError;
    }
    
    // Map the WordPress booking to Supabase structure
    const bookingData = mapWordPressBookingToSupabase(wpBooking);
    
    // Add timestamps
    const now = new Date().toISOString();
    bookingData.created_at = bookingData.created_at || now;
    bookingData.updated_at = now;
    bookingData.synced_at = now;
    
    console.log(`Processing booking ${wpBooking.id}: ${existingBooking ? 'UPDATE' : 'INSERT'}`);
    
    if (existingBooking) {
      // Update existing booking
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('wp_id', String(wpBooking.id || wpBooking.booking_id || ''))
        .select('id')
        .single();
      
      if (updateError) {
        console.error('Error updating booking:', updateError);
        return { updated: false, created: false, error: updateError.message };
      }
      
      return { 
        updated: true, 
        created: false,
        booking_id: data?.id
      };
    } else {
      // Create new booking
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error inserting booking:', insertError);
        console.error('Booking data:', JSON.stringify(bookingData, null, 2));
        return { updated: false, created: false, error: insertError.message };
      }
      
      return { 
        updated: false, 
        created: true,
        booking_id: data?.id
      };
    }
  } catch (error) {
    console.error('Error syncing booking:', error);
    return { 
      updated: false, 
      created: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Syncs bookings from WordPress to Supabase
 */
export async function syncBookingsFromWordPress(): Promise<{
  total: number;
  created: number;
  updated: number;
  error?: string;
}> {
  try {
    // Create service client for admin-level database operations
    const supabase = createServiceClient()
    console.log('Starting WordPress to Supabase sync...');
    
    // Fetch all bookings from WordPress API - set a higher limit to get ALL bookings
    console.log('Fetching bookings from WordPress API...');
    let wordpressBookings;
    try {
      wordpressBookings = await fetchBookings({ limit: 1000 });
      console.log(`Fetched ${wordpressBookings?.length || 0} bookings from WordPress API`);
    } catch (apiError) {
      console.error('Error fetching from WordPress API:', apiError);
      return { 
        total: 0, 
        created: 0, 
        updated: 0, 
        error: `WordPress API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`
      };
    }
    
    if (!wordpressBookings || wordpressBookings.length === 0) {
      console.error('No bookings found in WordPress API');
      return { 
        total: 0, 
        created: 0, 
        updated: 0, 
        error: 'No bookings found in WordPress API'
      }
    }
    
    // Validate booking data format
    const validBookings = wordpressBookings.filter(booking => {
      if (!booking || typeof booking !== 'object') {
        console.error('Invalid booking data (not an object):', booking);
        return false;
      }
      
      if (!booking.id && !booking.booking_id) {
        console.error('Booking missing ID:', booking);
        return false;
      }
      
      // We only require ID now - date and time will be handled during mapping
      // The mapper is robust enough to extract date/time from various fields
      return true;
    });
    
    console.log(`Found ${validBookings.length} valid bookings out of ${wordpressBookings.length} total`);
    
    if (validBookings.length === 0) {
      return {
        total: wordpressBookings.length,
        created: 0,
        updated: 0,
        error: 'No valid bookings found in WordPress API response'
      };
    }
    
    // Track stats
    let created = 0
    let updated = 0
    let errors = 0
    
    // Sync each booking
    const syncResults = await Promise.all(validBookings.map(async (wpBooking) => {
      try {
        const result = await syncSingleBooking(supabase, wpBooking)
        
        if (result.error) {
          console.error(`Error syncing booking ${wpBooking.id}:`, result.error);
          errors++;
        }
        
        return result
      } catch (syncError) {
        console.error(`Error processing booking ${wpBooking.id}:`, syncError);
        errors++;
        return {
          created: false,
          updated: false,
          error: syncError instanceof Error ? syncError.message : 'Unknown error'
        };
      }
    }))
    
    // Count created and updated bookings
    for (const result of syncResults) {
      if (result.created) created++
      if (result.updated) updated++
    }
    
    console.log(`Sync completed: ${created} created, ${updated} updated, ${errors} errors`);
    
    return {
      total: validBookings.length,
      created,
      updated,
    }
  } catch (error) {
    console.error('Error syncing bookings:', error)
    return {
      total: 0,
      created: 0,
      updated: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Gets all bookings from Supabase
 */
export async function getBookingsFromDatabase(options: {
  limit?: number;
  page?: number;
  status?: string;
} = {}): Promise<{
  bookings: Booking[];
  total: number;
  error?: string;
}> {
  try {
    const { limit = 10, page = 1, status = 'all' } = options
    const offset = (page - 1) * limit
    
    // Create service client for admin-level operations
    const supabase = createServiceClient()
    
    // Build query
    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
    
    // Add status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1)
    
    // Order by date (newest first)
    query = query.order('date', { ascending: false })
    
    // Execute query
    const { data, count, error } = await query
    
    if (error) throw error
    
    // Map to Booking type
    const mappedBookings = (data || []).map(mapSupabaseBookingToBooking)
    
    console.log(`Retrieved ${mappedBookings.length} bookings from database (total: ${count})`);
    
    return {
      bookings: mappedBookings,
      total: count || 0,
    }
  } catch (error) {
    console.error('Error fetching bookings from database:', error)
    return {
      bookings: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Gets a single booking by ID from Supabase
 */
export async function getBookingByIdFromDatabase(id: string): Promise<{
  booking: Booking | null;
  error?: string;
}> {
  try {
    // Create service client for admin-level operations
    const supabase = createServiceClient()
    
    // First try to find by internal UUID
    let { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    // If not found, try to find by WordPress ID
    if (!bookingData) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', id)
        .maybeSingle()
      
      bookingData = data
    }
    
    if (!bookingData) {
      return { booking: null, error: 'Booking not found' }
    }
    
    // Map to Booking type
    return { booking: mapSupabaseBookingToBooking(bookingData) }
  } catch (error) {
    console.error(`Error fetching booking ${id} from database:`, error)
    return {
      booking: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Gets bookings assigned to a specific driver
 */
export async function getBookingsByDriverId(driverId: string, options: {
  limit?: number;
  status?: string;
  upcoming?: boolean;
} = {}): Promise<{
  bookings: Booking[];
  error?: string;
}> {
  try {
    const { limit = 5, status, upcoming = true } = options;
    const supabase = createServiceClient();
    
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('driver_id', driverId)
      .order('date', { ascending: upcoming }) // upcoming=true → ascending order, otherwise descending
      .limit(limit);
      
    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // If upcoming is true, only get bookings from today or later
    if (upcoming) {
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
      query = query.gte('date', today);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching driver bookings:', error);
      return { bookings: [], error: error.message };
    }
    
    const bookings = (data || []).map(booking => mapSupabaseBookingToBooking(booking));
    return { bookings };
  } catch (error) {
    console.error('Error in getBookingsByDriverId:', error);
    return { 
      bookings: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export interface SupabaseBooking {
  id?: string;
  wp_id: string;
  customer_id?: string | null;
  vehicle_id?: string | null;
  driver_id?: string | null;
  service_name: string;
  service_id?: string | null;
  service_type?: string | null;
  date: string;
  time: string;
  duration?: string | null;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  distance?: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
  price_formatted?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_link?: string | null;
  notes?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  wp_meta?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
} 