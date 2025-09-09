'use server'

import { Booking } from '@/types/bookings'
import { revalidatePath } from 'next/cache'
import { 
  syncBookingsFromWordPress, 
  getBookingsFromDatabase,
  getBookingByIdFromDatabase,
  getBookingsByDriverId,
  mapSupabaseBookingToBooking
} from '@/lib/api/bookings-service'
import { createServiceClient } from '@/lib/supabase/service-client'
import { Database } from '@/types/supabase'

type BookingFilters = {
  status?: string
  limit?: number
  page?: number
}

// API endpoints
const BOOKINGS_LIST = 'bookings';
const SINGLE_BOOKING = 'booking';
const CANCEL_BOOKING = 'booking/cancel';
const UPDATE_BOOKING = 'booking/update';
const CREATE_BOOKING = 'booking/create';

// API paths - legacy code maintained for backward compatibility
const API_PATHS = {
  // User's specific endpoint
  DRIVER_BOOKINGS: '/driver/v1/bookings',
  DRIVER_BOOKINGS_ALT: '/wp-json/driver/v1/bookings', // With wp-json prefix
  
  // Add your exact API endpoint here if you know it
  CUSTOM: '/wp/v2/vehicle-bookings',
  
  // Common WordPress API patterns
  STANDARD_WP: '/wp-json/wp/v2/bookings',
  BOOKLY: '/wp-json/bookly/v1/appointments',
  VEHICLE_BOOKINGS: '/wp-json/vehicle-bookings/v1/bookings',
  WC_BOOKINGS: '/wp-json/wc-bookings/v1/bookings',
  
  // Try direct paths too
  DIRECT: '/bookings',
  DIRECT_API: '/api/bookings',
  SINGLE_BOOKING: '/wp-json/wp/v2/bookings/:id'
}

// Define the DebugAttemptInfo interface with more specific typing
interface DebugAttemptInfo {
  endpoint: string;
  method: string;
  params?: Record<string, any>;
  startTime: number;
  time: number;
  success: boolean;
  result: Record<string, any>;
  error: string | null;
}

/**
 * Server action to fetch bookings from Supabase database
 * Falls back to WordPress API if no bookings in database or if useFallback is true
 */
export async function getBookings(filters: BookingFilters = {}, useFallback: boolean = false): Promise<{
  bookings: Booking[]
  total?: number
  error?: string
  debug?: any
}> {
  const { status = 'all', limit = 10, page = 1 } = filters
  
  try {
    // First attempt to get bookings from database
    const dbResult = await getBookingsFromDatabase({
      status,
      limit,
      page
    })
    
    // Use database bookings if available and not explicitly using fallback
    if (!useFallback && dbResult.bookings.length > 0) {
      return {
        bookings: dbResult.bookings,
        total: dbResult.total
      }
    }
    
    // Fall back to WordPress API if database is empty or if explicitly requested
    console.log('Falling back to WordPress API for bookings')
    
    // Build query parameters
    const params = new URLSearchParams()
    if (status !== 'all') {
      params.append('status', status)
    }
    params.append('limit', limit.toString())
    params.append('page', page.toString())
    
    // API endpoint from environment variable (server-side only)
    const apiEndpoint = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    const apiKey = process.env.WORDPRESS_API_KEY || process.env.NEXT_PUBLIC_WORDPRESS_API_KEY
    const customEndpoint = process.env.WORDPRESS_API_CUSTOM_PATH || process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH
    
    if (!apiEndpoint) {
      console.error('WordPress API URL is not configured')
      throw new Error('WordPress API URL environment variable is not set. Please configure WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL.');
    }
    
    // Ensure endpoint doesn't have double slashes when joined
    const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint
    
    // Prepare debug info
    const debugInfo: any = {
      baseUrl,
      apiKey: apiKey ? '[REDACTED]' : 'Not set',
      customEndpoint,
      params: params.toString(),
      attempts: [],
      wpApiDiscovery: null
    }
    
    // Test server connection and check CORS
    try {
      console.log('Testing basic server connection...')
      const testResponse = await fetch(baseUrl, {
        method: 'HEAD',
        next: { revalidate: 3600 }
      })
      
      debugInfo.serverConnection = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries([...testResponse.headers.entries()])
      }
      console.log(`Server connection test: ${testResponse.status} ${testResponse.statusText}`)
    } catch (error) {
      console.error('Error connecting to server:', error)
      debugInfo.serverConnection = {
        error: error instanceof Error ? error.message : String(error)
      }
      throw new Error(`Failed to connect to WordPress server: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Set up header variations to try
    const headerVariations = [
      // Standard JSON headers
      {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      // Without content-type to avoid preflight
      {
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      // With X-WP-Nonce (if using WordPress nonce auth)
      {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-WP-Nonce': apiKey } : {})
      }
    ]
    
    // Add custom endpoint first if provided
    const endpoints = []
    
    // Prioritize the user's specific endpoint
    endpoints.push(`${baseUrl}${API_PATHS.DRIVER_BOOKINGS}`)
    endpoints.push(`${baseUrl}${API_PATHS.DRIVER_BOOKINGS_ALT}`)
    
    if (customEndpoint) {
      // Add the custom endpoint from env variable
      endpoints.push(`${baseUrl}${customEndpoint}`)
    }
    
    // Add standard endpoints
    Object.values(API_PATHS).forEach(path => {
      if (path !== API_PATHS.DRIVER_BOOKINGS && path !== API_PATHS.DRIVER_BOOKINGS_ALT) {
        endpoints.push(`${baseUrl}${path}`)
      }
    })
    
    debugInfo.endpoints = endpoints
    
    // Try WordPress REST API discovery to help diagnose API structure
    try {
      console.log('Trying WordPress REST API discovery...')
      const discoveryResponse = await fetch(`${baseUrl}/wp-json`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 } // Cache for an hour
      })
      
      if (discoveryResponse.ok) {
        const apiData = await discoveryResponse.json()
        console.log('WordPress REST API found! Available routes:', Object.keys(apiData?.routes || {}))
        debugInfo.wpApiDiscovery = {
          status: discoveryResponse.status,
          routes: Object.keys(apiData?.routes || {})
        }
        
        // Try to find booking-related routes
        const bookingRoutes = Object.keys(apiData?.routes || {})
          .filter(route => route.includes('book') || route.includes('appointment') || route.includes('driver'))
        
        if (bookingRoutes.length > 0) {
          console.log('Potential booking routes found:', bookingRoutes)
          debugInfo.potentialBookingRoutes = bookingRoutes
          
          // Add these routes to our endpoints to try
          bookingRoutes.forEach(route => {
            // Strip any regex patterns from route
            const cleanRoute = route.replace(/\(\?.*?\)/, '')
            endpoints.unshift(`${baseUrl}${cleanRoute}`)
          })
        }
      } else {
        console.log('WordPress REST API discovery failed with status:', discoveryResponse.status)
        debugInfo.wpApiDiscovery = {
          status: discoveryResponse.status,
          statusText: discoveryResponse.statusText
        }
      }
    } catch (error) {
      console.error('Error during WordPress REST API discovery:', error)
      debugInfo.wpApiDiscoveryError = error instanceof Error ? error.message : String(error)
    }
    
    // Try each endpoint until one succeeds or all fail
    let lastError = null
    
    // First try the specific driver/v1/bookings endpoint with each header variation
    const driverEndpoint = `${baseUrl}${API_PATHS.DRIVER_BOOKINGS}`
    console.log(`🔍 Trying user-provided endpoint: ${driverEndpoint}?${params.toString()}`)
    
    for (const headers of headerVariations) {
      try {
        const attemptInfo = {
          endpoint: driverEndpoint,
          headers,
          result: {} as Record<string, any> // Initialize as an empty object with type annotation
        }
        
        console.log(`Trying with headers:`, headers)
        
        const response = await fetch(`${driverEndpoint}?${params.toString()}`, {
          headers,
          next: { revalidate: 60 }
        })
        
        attemptInfo.result = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]) 
        }
        
        // Store this attempt in debug info
        debugInfo.attempts.push(attemptInfo)
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          attemptInfo.result.contentType = contentType
          
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            console.log('SUCCESS! API Response structure:', Object.keys(data))
            attemptInfo.result.dataStructure = Object.keys(data)
            
            // The WordPress plugin returns data in a 'data' property with pagination info
            if (data && data.data && Array.isArray(data.data)) {
              return { 
                bookings: data.data,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint: driverEndpoint,
                    dataStructure: 'data property contains bookings array',
                    pagination: {
                      total: data.total,
                      page: data.page,
                      per_page: data.per_page,
                      total_pages: data.total_pages
                    }
                  }
                }
              }
            }
            
            // Continue with other patterns...
            const bookingsData = data.bookings || data.appointments || data.data || data.results || data
            
            // If we got an array directly, use it
            if (Array.isArray(bookingsData)) {
              return { 
                bookings: bookingsData,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint: driverEndpoint,
                    dataStructure: 'Array directly returned'
                  }
                }
              }
            }
            
            // If we got bookings as an array property
            if (bookingsData && Array.isArray(bookingsData.bookings)) {
              return { 
                bookings: bookingsData.bookings,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint: driverEndpoint,
                    dataStructure: 'bookings property found'
                  }
                }
              }
            }
            
            // Return whatever we found
            return { 
              bookings: Array.isArray(bookingsData) ? bookingsData : [bookingsData],
              debug: { 
                ...debugInfo,
                successful: {
                  endpoint: driverEndpoint,
                  responseData: data
                }
              }
            }
          } else {
            console.log('Non-JSON response received from driver endpoint')
            attemptInfo.result.error = 'Response was not JSON'
          }
        } else {
          console.log(`Driver endpoint failed with status: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error(`Error with driver endpoint:`, error)
        debugInfo.attempts.push({
          endpoint: driverEndpoint,
          headers,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    // Now try all the remaining endpoints
    for (const endpoint of endpoints) {
      // Skip the driver endpoint we already tried
      if (endpoint === driverEndpoint) continue;
      
      try {
        const attemptInfo = {
          endpoint,
          headers: headerVariations[0], // Use standard headers for other endpoints
          result: {} as Record<string, any> // Initialize as an empty object with type annotation
        }
        
        console.log(`Trying endpoint: ${endpoint}?${params.toString()}`)
        
        const response = await fetch(`${endpoint}?${params.toString()}`, {
          headers: headerVariations[0],
          next: { revalidate: 60 }
        })
        
        attemptInfo.result = {
          status: response.status,
          statusText: response.statusText
        }
        
        // Store this attempt in debug info
        debugInfo.attempts.push(attemptInfo)
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          attemptInfo.result.contentType = contentType
          
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json()
            console.log('API Response structure:', Object.keys(data))
            
            // The WordPress plugin returns data in a 'data' property with pagination info
            if (data && data.data && Array.isArray(data.data)) {
              return { 
                bookings: data.data,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint,
                    dataStructure: 'data property contains bookings array',
                    pagination: {
                      total: data.total,
                      page: data.page,
                      per_page: data.per_page,
                      total_pages: data.total_pages
                    }
                  }
                }
              }
            }
            
            // Try to extract bookings data based on common patterns
            const bookingsData = data.bookings || data.appointments || data.data || data.results || data
            
            // If we got an array directly, use it
            if (Array.isArray(bookingsData)) {
              return { 
                bookings: bookingsData,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint,
                    dataStructure: 'Array directly returned'
                  }
                }
              }
            }
            
            // If we got bookings as an array property
            if (bookingsData && Array.isArray(bookingsData.bookings)) {
              return { 
                bookings: bookingsData.bookings,
                debug: { 
                  ...debugInfo,
                  successful: {
                    endpoint,
                    dataStructure: 'bookings property found'
                  }
                }
              }
            }
            
            // Return whatever we found
            return { 
              bookings: Array.isArray(bookingsData) ? bookingsData : [bookingsData],
              debug: { 
                ...debugInfo,
                successful: {
                  endpoint,
                  responseData: data
                }
              }
            }
          } else {
            console.log('Non-JSON response received')
            lastError = {
              status: response.status,
              statusText: 'Response was not JSON',
              url: endpoint,
              contentType
            }
          }
        } else {
          // Store the last error but keep trying other endpoints
          lastError = {
            status: response.status,
            statusText: response.statusText,
            url: endpoint
          }
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error)
        debugInfo.attempts.push({
          endpoint,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    console.error('All API endpoints failed. Last error:', lastError)
    
    // If all API calls failed, throw an error instead of returning mock data
    throw new Error(`Failed to fetch bookings: ${lastError?.status || 'Unknown error'}`);
  } catch (error) {
    console.error('Error in getBookings:', error)
    throw error; // Rethrow error to show the actual problem
  }
}

/**
 * Get a specific booking by wp_id from the database
 */
export async function getBookingByWpId(
  wpId: string
): Promise<{ booking: Booking | null; error?: string }> {
  try {
    const supabase = createServiceClient();
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          email,
          phone
        ),
        drivers:driver_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        vehicles:vehicle_id (
          id,
          brand,
          model,
          year,
          passenger_capacity,
          pricing_category_vehicles (
            pricing_categories (
              name
            )
          )
        )
      `)
      .eq('wp_id', wpId)
      .single();

    if (error) {
      console.error('Error fetching booking by wp_id:', error);
      return { booking: null, error: error.message };
    }

    if (!booking) {
      return { booking: null, error: 'Booking not found' };
    }

    // Get creator information if available
    let creatorInfo = null;
    if (booking.created_by) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', booking.created_by)
        .single();
      
      if (profileData) {
        creatorInfo = {
          full_name: profileData.full_name,
          email: profileData.email
        };
      }
    }

    // Transform the booking data to match our Booking interface
    const transformedBooking: Booking = {
      id: booking.id,
      supabase_id: booking.id,
      booking_id: booking.wp_id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      service_name: booking.service_name,
      service_id: booking.service_id || undefined,
      customer_id: booking.customer_id || undefined,
      customer_name: booking.customer_name || booking.customers?.name || undefined,
      customer_email: booking.customer_email || booking.customers?.email || undefined,
      customer_phone: booking.customer_phone || booking.customers?.phone || undefined,
      driver_id: booking.driver_id || undefined,
      vehicle_id: booking.vehicle_id || undefined,
      pickup_location: booking.pickup_location || undefined,
      dropoff_location: booking.dropoff_location || undefined,
      distance: booking.distance || undefined,
      duration: booking.duration || undefined,
      price: booking.price_amount ? {
        amount: booking.price_amount,
        currency: booking.price_currency || 'JPY',
        formatted: booking.price_formatted || `${booking.price_currency || 'JPY'} ${booking.price_amount}`
      } : undefined,
      payment_status: booking.payment_status || undefined,
      payment_method: booking.payment_method || undefined,
      payment_link: booking.payment_link || undefined,
      notes: booking.notes || undefined,
      wp_id: booking.wp_id,
      created_by: booking.created_by || undefined,
      billing_company_name: booking.billing_company_name || undefined,
      billing_tax_number: booking.billing_tax_number || undefined,
      billing_street_name: booking.billing_street_name || undefined,
      billing_street_number: booking.billing_street_number || undefined,
      billing_city: booking.billing_city || undefined,
      billing_state: booking.billing_state || undefined,
      billing_postal_code: booking.billing_postal_code || undefined,
      billing_country: booking.billing_country || undefined,
      coupon_code: booking.coupon_code || undefined,
      coupon_discount_percentage: booking.coupon_discount_percentage?.toString() || undefined,
      created_at: booking.created_at || undefined,
      updated_at: booking.updated_at || undefined,
      // Add vehicle details if available
      vehicle: booking.vehicles && !('code' in booking.vehicles) ? {
        id: booking.vehicles.id,
        make: booking.vehicles.brand || '',
        model: booking.vehicles.model || '',
        year: booking.vehicles.year || '',
        created_at: new Date().toISOString()
      } : undefined,
      // Add creator details if available
      creator: creatorInfo || undefined
    };

    return { booking: transformedBooking };
  } catch (error) {
    console.error('Error in getBookingByWpId:', error);
    return { 
      booking: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get a specific booking by ID from the database
 * Falls back to WordPress API if not found in database or if useFallback is true
 */
export async function getBookingById(
  id: string,
  useFallback: boolean = false
): Promise<{ booking: Booking | null; debugInfo?: DebugAttemptInfo[] }> {
  try {
    // Check if the ID is a booking number (like QUO-316-1) or a UUID
    const isBookingNumber = /^QUO-\d+-\d+$/.test(id);
    
    let dbResult;
    if (isBookingNumber) {
      // Search by wp_id field for booking numbers
      dbResult = await getBookingByWpId(id);
    } else {
      // Search by UUID for regular IDs
      dbResult = await getBookingByIdFromDatabase(id);
    }
    
    // Use database booking if available and not explicitly using fallback
    if (!useFallback && dbResult.booking) {
      return { booking: dbResult.booking }
    }
    
    // Fall back to WordPress API 
    console.log('Falling back to WordPress API for booking details')
    const debugInfo: DebugAttemptInfo[] = []
    
    // Set up API information
    const apiEndpoint = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '';
    const apiKey = process.env.WORDPRESS_API_KEY || process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || '';
    const customPath = process.env.WORDPRESS_API_CUSTOM_PATH || process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH || '';
    
    // Ensure endpoint doesn't have double slashes when joined
    const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    
    // First attempt: Try to get the booking directly using the custom path with ID
    let attemptInfo: DebugAttemptInfo = {
      endpoint: `${customPath}/${id}`,
      method: 'GET',
      params: { id },
      startTime: Date.now(),
      time: 0,
      success: false,
      result: {} as Record<string, any>, // Initialize as empty object instead of null
      error: null
    };
    
    // Try several endpoint variations for fetching a single booking
    const singleBookingEndpoints = [
      `${baseUrl}/${customPath}/${id}`,                   // Custom path with ID appended
      `${baseUrl}/${customPath}?id=${id}`,                // Custom path with ID as query parameter
      `${baseUrl}/wp-json/${customPath.replace(/^wp-json\//, '')}/${id}`, // With wp-json prefix if needed
      `${baseUrl}/wp-json/driver/v1/bookings/${id}`,      // Common WordPress API pattern
      `${baseUrl}/wp-json/wp/v2/bookings/${id}`,          // WordPress REST API
      `${baseUrl}/wp-json/vehicle-bookings/v1/bookings/${id}`, // Vehicle bookings
      `${baseUrl}${API_PATHS.SINGLE_BOOKING.replace(':id', id)}` // Try the defined path
    ];
    
    // Log the endpoints we're going to try
    console.log('Trying to fetch booking with ID:', id);
    console.log('Endpoints to try:', singleBookingEndpoints);
    
    // Keep track of all attempts
    const allAttempts: DebugAttemptInfo[] = [];
    
    // Try each endpoint
    for (const endpoint of singleBookingEndpoints) {
      const currentAttempt: DebugAttemptInfo = {
        endpoint,
        method: 'GET',
        params: { id },
        startTime: Date.now(),
        time: 0,
        success: false,
        result: {} as Record<string, any>,
        error: null
      };
      
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
          },
          next: { tags: [`booking-${id}`] }
        });
        
        currentAttempt.time = Date.now() - currentAttempt.startTime;
        
        if (!response.ok) {
          currentAttempt.success = false;
          currentAttempt.error = `HTTP error: ${response.status} ${response.statusText}`;
          currentAttempt.result = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          };
          allAttempts.push(currentAttempt);
          continue; // Try the next endpoint
        }
        
        // Check if the content type is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          currentAttempt.success = false;
          currentAttempt.error = `Invalid content type: ${contentType}`;
          currentAttempt.result = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          };
          allAttempts.push(currentAttempt);
          continue; // Try the next endpoint
        }
        
        const jsonData = await response.json();
        console.log('Response data structure:', JSON.stringify(jsonData, null, 2).slice(0, 500) + '...');
        
        currentAttempt.success = true;
        currentAttempt.result = jsonData;
        
        // Check various response formats
        let booking = null;
        
        // Check for result.data array format (specific WordPress format we're seeing)
        if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
          console.log(`Found ${jsonData.data.length} bookings in data array, looking for ID ${id}`);
          const foundBooking = jsonData.data.find((item: any) => 
            String(item.id) === String(id) || 
            (item.title && item.title.includes(`Booking ${id}`))
          );
          
          if (foundBooking) {
            console.log('Found booking in data array:', foundBooking.id);
            booking = processWordPressBooking(foundBooking);
          }
        }
        // Format 1: Response has a data property containing the booking (non-array)
        else if (jsonData && jsonData.data && isBooking(jsonData.data)) {
          booking = processWordPressBooking(jsonData.data);
        } 
        // Format 2: Response itself is the booking
        else if (isBooking(jsonData)) {
          booking = processWordPressBooking(jsonData);
        }
        // Format 3: Response is an array and we need to find the matching booking
        else if (Array.isArray(jsonData) && jsonData.length > 0) {
          const foundBooking = jsonData.find(item => 
            isBooking(item) && 
            (
              String(item.id) === String(id) || 
              String(item.booking_id) === String(id) ||
              (item.title && item.title.includes(`Booking ${id}`))
            )
          );
          if (foundBooking) {
            booking = processWordPressBooking(foundBooking);
          }
        }
        
        allAttempts.push(currentAttempt);
        
        if (booking) {
          console.log('Found booking:', booking);
          return {
            booking,
            debugInfo: allAttempts
          };
        } else {
          currentAttempt.success = false;
          currentAttempt.error = 'Response does not contain a valid booking';
        }
      } catch (error) {
        currentAttempt.time = Date.now() - currentAttempt.startTime;
        currentAttempt.success = false;
        currentAttempt.error = error instanceof Error ? error.message : String(error);
        currentAttempt.result = { status: 500, statusText: String(error) };
        allAttempts.push(currentAttempt);
      }
    }
    
    // Fallback: Try to get all bookings and find the one with the matching ID
    const fallbackAttempt: DebugAttemptInfo = {
      endpoint: BOOKINGS_LIST,
      method: 'GET',
      startTime: Date.now(),
      time: 0,
      success: false,
      result: {} as Record<string, any>, // Initialize as empty object instead of null
      error: null
    };
    
    try {
      console.log('Falling back to getting all bookings and searching for ID:', id);
      const result = await getBookings({ limit: 100 }); // Get a larger set to search through
      fallbackAttempt.time = Date.now() - fallbackAttempt.startTime;
      
      if (result.error) {
        fallbackAttempt.success = false;
        fallbackAttempt.error = result.error;
        allAttempts.push(fallbackAttempt);
        return { booking: null, debugInfo: allAttempts };
      }
      
      fallbackAttempt.success = true;
      fallbackAttempt.result = result;
      allAttempts.push(fallbackAttempt);
      
      // Find the booking with the matching ID or title "Booking XXXX"
      const normalizedId = String(id).toLowerCase();
      let booking = null;
      
      for (const b of result.bookings) {
        if (!b) continue;
        
        // Match by ID
        if (
          (b.id !== undefined && String(b.id).toLowerCase() === normalizedId) || 
          (b.booking_id !== undefined && String(b.booking_id).toLowerCase() === normalizedId)
        ) {
          booking = b;
          break;
        }
        
        // Match by title (WordPress specific)
        if (b.title && typeof b.title === 'string' && 
            b.title.toLowerCase().includes(`booking ${normalizedId}`)) {
          booking = processWordPressBooking(b);
          break;
        }
      }
      
      return {
        booking: booking,
        debugInfo: allAttempts
      };
    } catch (error) {
      fallbackAttempt.time = Date.now() - fallbackAttempt.startTime;
      fallbackAttempt.success = false;
      fallbackAttempt.error = error instanceof Error ? error.message : String(error);
      allAttempts.push(fallbackAttempt);
      return { booking: null, debugInfo: allAttempts };
    }
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error)
    return { 
      booking: getMockBookings()[0],
      debugInfo: [{
        endpoint: 'none',
        method: 'GET',
        startTime: Date.now(),
        time: 0,
        success: false,
        result: {},
        error: error instanceof Error ? error.message : String(error)
      }]
    }
  }
}

/**
 * Syncs bookings from WordPress to Supabase
 * This is the recommended way to ensure your database has the latest bookings
 */
export async function syncBookingsAction(params?: {
  bookingIdsToUpdate?: string[];
  selectedFieldsByBooking?: Record<string, string[]>;
}): Promise<{
  success: boolean;
  message: string;
  stats?: {
    total: number;
    created: number;
    updated: number;
  };
}> {
  try {
    // Trigger the sync process
    const result = await syncBookings(
      params?.bookingIdsToUpdate,
      params?.selectedFieldsByBooking
    );
    
    return {
      success: result.success,
      message: result.message,
      stats: result.stats // Pass along the stats for use with translations
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during sync'
    };
  }
}

/**
 * Sync all bookings from WordPress API to the database
 */
export async function syncBookings(
  bookingIdsToUpdate?: string[],
  selectedFieldsByBooking?: Record<string, string[]>
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    total: number;
    created: number;
    updated: number;
  };
  errors?: Array<{
    booking_id: string;
    error: string;
  }>;
}> {
  try {
    console.log("Starting booking sync from WordPress to database...");
    // Clear any cached data to ensure fresh sync
    const cacheHeaders = new Headers();
    cacheHeaders.append('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const result = await syncBookingsFromWordPress(bookingIdsToUpdate, selectedFieldsByBooking);
    console.log("Sync completed with result:", result);
    
    if (result.error) {
      return {
        success: false,
        message: `Failed to sync bookings: ${result.error}`
      }
    }
    
    // Handle errors array from individual sync failures
    if (result.errors && result.errors.length > 0) {
      console.log(`Sync completed with ${result.errors.length} errors`);
      
      // If there were some successes despite errors, return partial success
      if (result.created > 0 || result.updated > 0) {
        return {
          success: true,
          message: `Partially synced ${result.total} bookings (${result.created} created, ${result.updated} updated) with ${result.errors.length} errors`,
          stats: {
            total: result.total,
            created: result.created,
            updated: result.updated
          },
          errors: result.errors
        };
      }
      
      // If no successes at all, return failure
      return {
        success: false,
        message: `Sync failed with ${result.errors.length} errors`,
        errors: result.errors
      };
    }
    
    return {
      success: true,
      message: `Successfully synced ${result.total} bookings (${result.created} created, ${result.updated} updated)`,
      stats: {
        total: result.total,
        created: result.created,
        updated: result.updated
      }
    }
  } catch (error) {
    console.error('Error syncing bookings:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred while syncing bookings'
    }
  }
}

/**
 * Get mock bookings for development and fallback
 */
function getMockBookings(): Booking[] {
  return [
    {
      id: "1",
      supabase_id: "1",
      date: new Date().toISOString().split('T')[0],
      time: "10:00 AM",
      status: "confirmed",
      service_name: "Full Vehicle Inspection",
      service_id: "svc-001",
      customer_id: "cus-001",
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+1234567890",
      vehicle: {
        id: "veh-001",
        make: "Toyota",
        model: "Camry",
        year: "2020",
        created_at: new Date().toISOString()
      },
      // Add coupon fields for testing
      coupon_code: "SPRING25",
      coupon_discount_percentage: "25",
      // Add billing address fields for testing
      billing_company_name: "Acme Corporation",
      billing_tax_number: "TAX123456",
      billing_street_name: "Main Street",
      billing_street_number: "123",
      billing_city: "New York",
      billing_state: "NY",
      billing_postal_code: "10001",
      billing_country: "USA",
      notes: "Customer requested thorough brake inspection",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      supabase_id: "2",
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      time: "2:30 PM",
      status: "pending",
      service_name: "Oil Change & Maintenance",
      service_id: "svc-002",
      customer_id: "cus-002",
      vehicle: {
        id: "veh-002",
        make: "Honda",
        model: "Civic",
        year: "2019",
        created_at: new Date().toISOString()
      },
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

// Type guard for Booking with WordPress response support
function isBooking(obj: any): obj is Booking {
  // Basic check if this is an object with an ID
  const hasId = obj && 
    typeof obj === 'object' && 
    (typeof obj.id === 'string' || typeof obj.id === 'number' || 
     typeof obj.booking_id === 'string' || typeof obj.booking_id === 'number');
  
  // WordPress specific check for "title": "Booking XXXX"
  const isWordPressBooking = obj?.title && typeof obj.title === 'string' && 
                           obj.title.startsWith('Booking ');
  
  return hasId || isWordPressBooking;
}

// Process WordPress booking format into our Booking interface
function processWordPressBooking(data: any): Booking {
  console.log("Processing WordPress booking:", JSON.stringify(data).substring(0, 200));
  
  // Handle case when data is not in WordPress format
  if (!data.meta) {
    return data as Booking;
  }
  
  // Extract customer details
  const firstName = data.meta.chbs_client_contact_detail_first_name || '';
  const lastName = data.meta.chbs_client_contact_detail_last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  // Extract coordinates for pickup/dropoff
  const coordinates = data.meta.chbs_coordinate || [];
  const pickupLocation = coordinates.length > 0 ? coordinates[0].address : undefined;
  const dropoffLocation = coordinates.length > 1 ? coordinates[1].address : undefined;
  
  // Format price
  const price = {
    amount: parseFloat(data.meta.chbs_price_fixed_value || '0'),
    currency: data.meta.chbs_currency_id || 'THB',
    formatted: `${data.meta.chbs_currency_id || 'THB'} ${parseFloat(data.meta.chbs_price_fixed_value || '0').toLocaleString()}`
  };
  
  // Map statuses from WordPress to our format
  let status = 'pending';
  if (data.status === 'publish') {
    if (data.meta.chbs_booking_declined === '1') {
      status = 'cancelled';
    } else if (data.meta.chbs_booking_status_id === '2') {
      status = 'completed';
    } else {
      status = 'confirmed';
    }
  }
  
  // Convert WordPress date format (DD-MM-YYYY) to standard format (YYYY-MM-DD)
  let formattedDate = '';
  if (data.meta.chbs_pickup_date) {
    const dateParts = data.meta.chbs_pickup_date.split('-');
    if (dateParts.length === 3) {
      formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    }
  }
  
  // Extract payment link
  const paymentLink = data.meta.ipps_payment_link || data.meta.chbs_ipps_payment_url;
  
  // Return a properly formatted booking object
  return {
    id: data.id.toString(),
    supabase_id: data.id.toString(),
    booking_id: data.id.toString(),
    title: data.title,
    date: formattedDate || data.date?.split(' ')[0] || '',
    time: data.meta.chbs_pickup_time || '',
    status,
    service_name: data.meta.chbs_vehicle_name || 'Vehicle Service',
    customer_name: fullName,
    customer_email: data.meta.chbs_client_contact_detail_email_address,
    customer_phone: data.meta.chbs_client_contact_detail_phone_number,
    
    // Include original meta data for debugging
    meta: data.meta,
    
    // Vehicle details
    vehicle: {
      id: data.meta.chbs_vehicle_id || '0',
      make: 'Toyota', // Hardcoded based on vehicle name "Toyota Hiace Grand Cabin"
      model: data.meta.chbs_vehicle_name?.replace('Toyota ', '') || '',
      year: '',
      created_at: new Date().toISOString()
    },
    
    // Route information
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    distance: data.meta.chbs_distance || '0',
    duration: data.meta.chbs_duration || '0',
    
    // Payment information
    payment_method: data.meta.chbs_payment_name,
    ipps_payment_link: paymentLink,
    
    // Price details
    price,
    
    // Additional metadata
    notes: data.meta.chbs_comment || '',
    created_at: data.date || '',
    updated_at: data.modified || '',
  };
}

// Helper function to construct API URL
function constructApiUrl(endpoint: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || '';
  const customPath = process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH || '';
  
  // If we have a custom path for this endpoint, use it
  if (customPath) {
    return `${apiUrl}/${customPath}`;
  }
  
  // Otherwise construct from the endpoint
  return `${apiUrl}/${endpoint}`;
}

// Helper function to get headers for API requests
function getHeaders(): HeadersInit {
  const apiKey = process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || '';
  return {
    'Authorization': apiKey ? `Bearer ${apiKey}` : '',
    'Content-Type': 'application/json'
  };
}

/**
 * Updates a booking in the database
 */
export async function updateBookingAction(
  id: string, 
  data: Partial<Booking>
): Promise<{
  success: boolean;
  message: string;
  booking?: Booking;
}> {
  try {
    const supabase = createServiceClient();
    let bookingId = id;
    let isWpId = false;
    
    // Check if the ID is a UUID or a WordPress ID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      isWpId = true;
    }
    
    // First check if booking exists
    let existingBooking: Database['public']['Tables']['bookings']['Row'] | null = null;
    
    if (isWpId) {
      // Try finding by WordPress ID
      const { data: wpBooking, error: wpQueryError } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', id)
        .single();
      
      if (wpQueryError) {
        console.error('Error finding booking by WordPress ID:', wpQueryError.message);
        return {
          success: false,
          message: `Booking not found with WordPress ID: ${id}`
        };
      }
      
      existingBooking = wpBooking;
      bookingId = existingBooking.id; // Use the internal UUID for updates
    } else {
      // Try finding by internal UUID
      const { data: uuidBooking, error: queryError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (queryError) {
        return {
          success: false,
          message: `Booking not found with UUID: ${id}`
        };
      }
      
      existingBooking = uuidBooking;
    }
    
    // Add updated timestamp
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    console.log('Update data before filtering:', Object.keys(updateData));
    
    // Remove properties that shouldn't be updated directly
    // These are fields that exist in the Booking type but not in the database schema
    const fieldsToRemove = [
      'id', 'wp_id', 'created_at', 'booking_id', 'supabase_id', 
      'title', 'customer', 'vehicle', 'price', 'selectedVehicle',
      'synced_at', 'updated_by', 'creator', 'service', 'ipps_payment_link', 'booking_status'
      // These are managed by the system, computed fields, or joined data
    ];
    
    fieldsToRemove.forEach(field => {
      if (field in updateData) {
        delete (updateData as any)[field];
      }
    });
    
    console.log('Update data after filtering:', Object.keys(updateData));
    
    // Update booking in database using the correct internal UUID
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData as any)
      .eq('id', bookingId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating booking:', updateError);
      return {
        success: false,
        message: updateError.message
      };
    }
    
    return {
      success: true,
      message: `Booking ${id} updated successfully`,
      booking: mapSupabaseBookingToBooking(updatedBooking)
    };
  } catch (error) {
    console.error('Error in updateBookingAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Reschedules a booking to a new date and time
 */
export async function rescheduleBookingAction(
  id: string,
  date: string,
  time: string
): Promise<{
  success: boolean;
  message: string;
  booking?: Booking;
}> {
  try {
    const supabase = createServiceClient();
    let bookingId = id;
    
    // Check if the ID is a UUID or a WordPress ID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      // Try finding by WordPress ID
      const { data: wpBooking, error: wpQueryError } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', id)
        .single();
      
      if (wpQueryError) {
        return {
          success: false,
          message: `Booking not found with WordPress ID: ${id}`
        };
      }
      
      bookingId = wpBooking.id; // Use the internal UUID for update
    }
    
    // Update booking date and time
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update({ 
        date,
        time,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) {
      console.error('Error rescheduling booking:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: true,
      message: `Booking ${id} has been rescheduled successfully`,
      booking: mapSupabaseBookingToBooking(updatedBooking)
    };
  } catch (error) {
    console.error('Error in rescheduleBookingAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Cancels a booking (sets status to cancelled)
 */
export async function cancelBookingAction(
  id: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = createServiceClient();
    let bookingId = id;
    
    // Check if the ID is a UUID or a WordPress ID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      // Try finding by WordPress ID
      const { data: wpBooking, error: wpQueryError } = await supabase
        .from('bookings')
        .select('id')
        .eq('wp_id', id)
        .single();
      
      if (wpQueryError) {
        return {
          success: false,
          message: `Booking not found with WordPress ID: ${id}`
        };
      }
      
      bookingId = wpBooking.id; // Use the internal UUID for deletion
    }
    
    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: true,
      message: `Booking ${id} has been cancelled successfully`
    };
  } catch (error) {
    console.error('Error in cancelBookingAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Deletes a booking from the database
 * Note: This is a permanent action and cannot be undone
 */
export async function deleteBookingAction(
  id: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = createServiceClient();
    let bookingId = id;
    
    // Check if the ID is a UUID or a WordPress ID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      // Try finding by WordPress ID
      const { data: wpBooking, error: wpQueryError } = await supabase
        .from('bookings')
        .select('id')
        .eq('wp_id', id)
        .single();
      
      if (wpQueryError) {
        return {
          success: false,
          message: `Booking not found with WordPress ID: ${id}`
        };
      }
      
      bookingId = wpBooking.id; // Use the internal UUID for deletion
    }
    
    // Delete the booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);
    
    if (error) {
      console.error('Error deleting booking:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: true,
      message: `Booking ${id} has been permanently deleted`
    };
  } catch (error) {
    console.error('Error in deleteBookingAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Gets bookings assigned to a specific driver
 */
export async function getDriverBookings(driverId: string, options: {
  limit?: number;
  status?: string;
  upcoming?: boolean;
  refresh?: boolean;
} = {}): Promise<{
  bookings: Booking[];
  error?: string;
}> {
  try {
    // Just pass the options through to the existing implementation
    // The refresh param will be ignored if the underlying function doesn't use it
    return await getBookingsByDriverId(driverId, options);
  } catch (error) {
    console.error('Error in getDriverBookings:', error);
    return { 
      bookings: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function unassignBookingFromDriver(bookingId: string, driverId: string): Promise<{ success: boolean; message: string }> {
    if (!bookingId || !driverId) {
        return { success: false, message: "Booking ID and Driver ID are required." };
    }

    try {
        const supabase = createServiceClient();

        // When unassigning, we assume the booking goes back to a 'confirmed' state, ready for another driver.
        const { data, error } = await supabase
            .from('bookings')
            .update({ driver_id: null, status: 'confirmed' })
            .eq('id', bookingId)
            .eq('driver_id', driverId)
            .select();

        if (error) {
            console.error("Error unassigning driver from booking:", error);
            throw error;
        }

        if (data && data.length > 0) {
            console.log(`Driver ${driverId} unassigned from booking ${bookingId}`);
            // Revalidate paths to ensure data freshness across the app
            revalidatePath(`/bookings/${bookingId}`);
            revalidatePath(`/drivers/${driverId}`);
            revalidatePath('/dispatch'); // Also revalidate dispatch page
            return { success: true, message: "Driver has been successfully unassigned from the booking." };
        } else {
            console.warn(`Attempted to unassign driver ${driverId} from booking ${bookingId}, but no matching record was found.`);
            return { success: false, message: "Could not unassign driver. The booking may not be assigned to this driver or does not exist." };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while unassigning driver.";
        console.error("Exception in unassignBookingFromDriver:", errorMessage);
        return { success: false, message: errorMessage };
    }
}

/**
 * Creates a new booking with customer creation/update logic
 */
export async function createBookingAction(bookingData: Partial<Booking>): Promise<{
  success: boolean;
  message: string;
  bookingId?: string;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    
    // Validate required fields
    if (!bookingData.customer_email || !bookingData.service_name || !bookingData.date || !bookingData.time) {
      return {
        success: false,
        message: 'Missing required fields: customer_email, service_name, date, and time are required'
      };
    }

    let customerId: string | null = null;

    // Check if customer exists by email
    if (bookingData.customer_email) {
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, billing_company_name, billing_tax_number, billing_street_name, billing_street_number, billing_city, billing_state, billing_postal_code, billing_country')
        .eq('email', bookingData.customer_email)
        .single();

      if (customerError && customerError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing customer:', customerError);
        return {
          success: false,
          message: 'Error checking existing customer'
        };
      }

      if (existingCustomer) {
        // Customer exists, update with new information
        customerId = existingCustomer.id;
        
        const updateData: any = {};
        
        // Update customer fields if new data is provided
        if (bookingData.customer_name && bookingData.customer_name !== existingCustomer.name) {
          updateData.name = bookingData.customer_name;
        }
        if (bookingData.customer_phone && bookingData.customer_phone !== existingCustomer.phone) {
          updateData.phone = bookingData.customer_phone;
        }
        
        // Update billing information if provided
        if (bookingData.billing_company_name !== undefined) {
          updateData.billing_company_name = bookingData.billing_company_name;
        }
        if (bookingData.billing_tax_number !== undefined) {
          updateData.billing_tax_number = bookingData.billing_tax_number;
        }
        if (bookingData.billing_street_name !== undefined) {
          updateData.billing_street_name = bookingData.billing_street_name;
        }
        if (bookingData.billing_street_number !== undefined) {
          updateData.billing_street_number = bookingData.billing_street_number;
        }
        if (bookingData.billing_city !== undefined) {
          updateData.billing_city = bookingData.billing_city;
        }
        if (bookingData.billing_state !== undefined) {
          updateData.billing_state = bookingData.billing_state;
        }
        if (bookingData.billing_postal_code !== undefined) {
          updateData.billing_postal_code = bookingData.billing_postal_code;
        }
        if (bookingData.billing_country !== undefined) {
          updateData.billing_country = bookingData.billing_country;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customerId);

          if (updateError) {
            console.error('Error updating customer:', updateError);
            return {
              success: false,
              message: 'Error updating customer information'
            };
          }
        }
      } else {
        // Customer doesn't exist, create new customer
        const newCustomerData = {
          name: bookingData.customer_name || null,
          email: bookingData.customer_email,
          phone: bookingData.customer_phone || null,
          notes: null,
          billing_company_name: bookingData.billing_company_name || null,
          billing_tax_number: bookingData.billing_tax_number || null,
          billing_street_name: bookingData.billing_street_name || null,
          billing_street_number: bookingData.billing_street_number || null,
          billing_city: bookingData.billing_city || null,
          billing_state: bookingData.billing_state || null,
          billing_postal_code: bookingData.billing_postal_code || null,
          billing_country: bookingData.billing_country || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newCustomer, error: createCustomerError } = await supabase
          .from('customers')
          .insert(newCustomerData)
          .select('id')
          .single();

        if (createCustomerError) {
          console.error('Error creating customer:', createCustomerError);
          return {
            success: false,
            message: 'Error creating customer'
          };
        }

        customerId = newCustomer.id;
      }
    }

    // Get vehicle information if vehicle_id is provided
    let vehicleInfo = null;
    if (bookingData.vehicle_id) {
      // Get vehicle info from junction table to include correct category
      const { data: vehicleWithCategory, error: vehicleError } = await supabase
        .from('pricing_category_vehicles')
        .select(`
          category_id,
          vehicles!inner(
            id,
            name,
            brand,
            model,
            year,
            plate_number,
            passenger_capacity,
            luggage_capacity,
            image_url
          ),
          pricing_categories!inner(
            name
          )
        `)
        .eq('vehicles.id', bookingData.vehicle_id)
        .single();

      if (!vehicleError && vehicleWithCategory) {
        vehicleInfo = {
          ...vehicleWithCategory.vehicles,
          category_name: vehicleWithCategory.pricing_categories.name
        };
      }
    }

    // Get current user for created_by field - prefer passed user ID from client
    let user = null
    if (bookingData.created_by) {
      // Use the user ID passed from the client
      user = { id: bookingData.created_by }
    } else {
      // Fallback to server-side auth (for API calls)
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.log('No authenticated user found, proceeding without user context')
        } else {
          user = currentUser
        }
      } catch (error) {
        console.log('Auth session not available, proceeding without user context')
      }
    }

    // Generate sequential booking number using timestamp approach
    // Get the current count of bookings to create a sequential number
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    const nextBookingNumber = (bookingCount || 0) + 1;
    const formattedBookingId = `BOO-${nextBookingNumber.toString().padStart(3, '0')}`;

    // Calculate pricing if not provided
    let calculatedPricing = null;
    
    if ((bookingData as any).calculated_pricing) {
      calculatedPricing = (bookingData as any).calculated_pricing;
    } else if (bookingData.service_name && bookingData.vehicle_id) {
      // First, get the service_type_id from the service name
      let serviceTypeId = null;
      try {
        const { data: serviceTypes, error: serviceError } = await supabase
          .from('service_types')
          .select('id')
          .ilike('name', `%${bookingData.service_name}%`)
          .limit(1);
        
        if (!serviceError && serviceTypes && serviceTypes.length > 0) {
          serviceTypeId = serviceTypes[0].id;
        }
      } catch (error) {
        console.error('Error looking up service type:', error);
      }

      // Calculate pricing directly using the same logic as the pricing API
      if (serviceTypeId) {
        try {
          // Get vehicle information
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select(`
              id,
              brand,
              model,
              image_url,
              passenger_capacity,
              luggage_capacity,
              pricing_category_vehicles (
                category_id,
                pricing_categories (
                  name
                )
              )
            `)
            .eq('id', bookingData.vehicle_id)
            .single();

          if (vehicleError) {
            console.error('Error fetching vehicle data:', vehicleError);
          } else {
            const vehicleCategory = vehicleData?.pricing_category_vehicles?.[0]?.category_id;
            
            // Query pricing directly from database
            let pricingQuery = supabase
              .from('pricing_items')
              .select('price, currency')
              .eq('service_type_id', serviceTypeId)
              .eq('vehicle_id', bookingData.vehicle_id)
              .eq('duration_hours', bookingData.duration_hours || 1)
              .eq('is_active', true);
            
            if (vehicleCategory) {
              pricingQuery = pricingQuery.eq('category_id', vehicleCategory);
            }
            
            const { data: pricingItems, error: pricingError } = await pricingQuery;
            
            if (pricingError) {
              console.error('Pricing query error:', pricingError);
            } else if (pricingItems && pricingItems.length > 0) {
              const baseAmount = Number(pricingItems[0].price);
              const discountPercentage = bookingData.discount_percentage || 0;
              const taxPercentage = bookingData.tax_percentage || 10;
              const couponCode = bookingData.coupon_code || '';
              
              // Apply time-based pricing adjustment if pickup date and time are provided
              let timeBasedAdjustment = 0;
              let appliedTimeBasedRule = null;
              
              if (bookingData.date && bookingData.time) {
                try {
                  // Create a date object from pickup_date and pickup_time
                  const pickupDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
                  
                  // Get the day of week (0 = Sunday, 6 = Saturday)
                  const dayOfWeek = pickupDateTime.getDay();
                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const day = dayNames[dayOfWeek];
                  
                  // Fetch active time-based pricing rules
                  const { data: timeBasedRules, error: timeBasedError } = await supabase
                    .from('pricing_time_based_rules')
                    .select('*')
                    .eq('is_active', true)
                    .order('priority', { ascending: false });
                  
                  if (!timeBasedError && timeBasedRules && timeBasedRules.length > 0) {
                    // Find applicable rules
                    const applicableRules = timeBasedRules.filter(rule => {
                      // Check if rule applies to this category/service type
                      if (rule.category_id && vehicleCategory && rule.category_id !== vehicleCategory) {
                        return false;
                      }
                      if (rule.service_type_id && rule.service_type_id !== serviceTypeId) {
                        return false;
                      }
                      
                      // Check if rule applies to this day
                      const applicableDays = rule.days_of_week || [];
                      if (applicableDays.length > 0 && !applicableDays.includes(day)) {
                        return false;
                      }
                      
                      // Check if rule applies to this time
                      if (rule.start_time && rule.end_time) {
                        const [startHours, startMinutes] = rule.start_time.split(':').map(Number);
                        const [endHours, endMinutes] = rule.end_time.split(':').map(Number);
                        
                        const startTime = startHours * 60 + startMinutes;
                        const endTime = endHours * 60 + endMinutes;
                        const timeInMinutes = pickupDateTime.getHours() * 60 + pickupDateTime.getMinutes();
                        
                        // Handle overnight time ranges (e.g., 22:00-06:00)
                        if (startTime > endTime) {
                          return timeInMinutes >= startTime || timeInMinutes <= endTime;
                        } else {
                          return timeInMinutes >= startTime && timeInMinutes <= endTime;
                        }
                      }
                      
                      return true;
                    });
                    
                    // Apply the highest priority rule
                    if (applicableRules.length > 0) {
                      const rule = applicableRules[0];
                      timeBasedAdjustment = baseAmount * (rule.adjustment_percentage / 100);
                      appliedTimeBasedRule = {
                        name: rule.name,
                        adjustment_percentage: rule.adjustment_percentage,
                        description: rule.description,
                        start_time: rule.start_time,
                        end_time: rule.end_time,
                        days_of_week: rule.days_of_week
                      };
                      
                      console.log(`🕐 [TIME-BASED] Applied rule: ${rule.name} (${rule.adjustment_percentage}%)`);
                    }
                  }
                } catch (error) {
                  console.error('Error applying time-based pricing:', error);
                }
              }
              
              // Apply time-based adjustment to base amount
              const adjustedBaseAmount = baseAmount + timeBasedAdjustment;
              
              // Calculate regular discount
              const regularDiscountAmount = adjustedBaseAmount * (discountPercentage / 100);
              
              // Calculate coupon discount if provided
              let couponDiscountAmount = 0;
              let couponDiscountPercentage = 0;
              if (couponCode) {
                const { data: couponData } = await supabase
                  .from('pricing_promotions')
                  .select('discount_type, discount_value, is_active, start_date, end_date, maximum_discount, minimum_amount')
                  .eq('code', couponCode)
                  .eq('is_active', true)
                  .single();
                
                if (couponData) {
                  const now = new Date();
                  const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
                  const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;
                  
                  if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
                    if (!couponData.minimum_amount || adjustedBaseAmount >= couponData.minimum_amount) {
                      if (couponData.discount_type === 'percentage') {
                        couponDiscountPercentage = couponData.discount_value;
                        couponDiscountAmount = adjustedBaseAmount * (couponData.discount_value / 100);
                        if (couponData.maximum_discount && couponDiscountAmount > couponData.maximum_discount) {
                          couponDiscountAmount = couponData.maximum_discount;
                        }
                      } else {
                        couponDiscountAmount = Math.min(couponData.discount_value, adjustedBaseAmount);
                        couponDiscountPercentage = (couponDiscountAmount / adjustedBaseAmount) * 100;
                      }
                    }
                  }
                }
              }
              
              const amountAfterDiscount = adjustedBaseAmount - regularDiscountAmount - couponDiscountAmount;
              const taxAmount = amountAfterDiscount * (taxPercentage / 100);
              const totalAmount = amountAfterDiscount + taxAmount;
              
              calculatedPricing = {
                baseAmount,
                timeBasedAdjustment,
                adjustedBaseAmount,
                appliedTimeBasedRule,
                regularDiscountAmount,
                couponDiscountAmount,
                taxAmount,
                totalAmount,
                currency: pricingItems[0].currency || 'JPY',
                discountPercentage,
                taxPercentage,
                couponCode,
                couponDiscountPercentage
              };
            }
          }
        } catch (error) {
          console.error('Error calculating pricing:', error);
        }
      }
    }

    // Create the booking
    const bookingInsertData = {
      wp_id: formattedBookingId, // Use formatted booking ID like BOO-001, BOO-002, etc.
      customer_id: customerId,
      vehicle_id: bookingData.vehicle_id || null,
      service_name: bookingData.service_name,
      service_id: bookingData.service_id || null,
      date: bookingData.date,
      time: bookingData.time,
      status: bookingData.status || 'pending',
      customer_name: bookingData.customer_name || null,
      customer_email: bookingData.customer_email,
      customer_phone: bookingData.customer_phone || null,
      pickup_location: bookingData.pickup_location || null,
      dropoff_location: bookingData.dropoff_location || null,
      distance: bookingData.distance ? String(bookingData.distance) : null,
      duration: bookingData.duration ? String(bookingData.duration) : null,
      hours_per_day: bookingData.hours_per_day || null,
      duration_hours: bookingData.duration_hours || null,
      service_days: bookingData.service_days || null,
      price_amount: calculatedPricing?.totalAmount || bookingData.price?.amount || null,
      base_amount: calculatedPricing?.baseAmount || bookingData.price?.amount || null,
      price_currency: bookingData.price?.currency || 'JPY',
      price_formatted: calculatedPricing ? `¥${calculatedPricing.totalAmount.toLocaleString()}` : bookingData.price?.formatted || null,
      payment_status: bookingData.payment_status || 'pending',
      payment_method: bookingData.payment_method || null,
      payment_link: bookingData.payment_link || null,
      notes: bookingData.notes || null,
      driver_id: bookingData.driver_id || null,
      service_type: bookingData.service_name || null, // Use service_name as service_type
      vehicle_make: vehicleInfo?.brand || null,
      vehicle_model: vehicleInfo?.model || null,
      vehicle_capacity: vehicleInfo?.passenger_capacity || null,
      vehicle_year: vehicleInfo?.year || null,
      created_by: user?.id || null, // Set with current user ID
      team_location: bookingData.team_location || 'thailand', // Set team location

      billing_company_name: bookingData.billing_company_name || null,
      billing_tax_number: bookingData.billing_tax_number || null,
      billing_street_name: bookingData.billing_street_name || null,
      billing_street_number: bookingData.billing_street_number || null,
      billing_city: bookingData.billing_city || null,
      billing_state: bookingData.billing_state || null,
      billing_postal_code: bookingData.billing_postal_code || null,
      billing_country: bookingData.billing_country || null,
      coupon_code: bookingData.coupon_code || null,
      coupon_discount_percentage: calculatedPricing?.couponDiscountPercentage || (bookingData.coupon_discount_percentage ? parseFloat(bookingData.coupon_discount_percentage) : null),
      tax_percentage: bookingData.tax_percentage || 10, // Default 10% Japanese tax
      discount_percentage: bookingData.discount_percentage || 0,
      flight_number: bookingData.flight_number || null,
      terminal: bookingData.terminal || null,
      meta: {
        chbs_flight_number: bookingData.flight_number || null,
        chbs_terminal: bookingData.terminal || null,
        vehicle_category_name: vehicleInfo?.category_name || null,
        vehicle_category: vehicleInfo?.category_name || null,
        vehicle_passenger_capacity: vehicleInfo?.passenger_capacity || null,
        vehicle_luggage_capacity: vehicleInfo?.luggage_capacity || null,
        creator_info: user ? {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString()
        } : null
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    const { data: newBooking, error: createBookingError } = await supabase
      .from('bookings')
      .insert(bookingInsertData)
      .select('id')
      .single();

    if (createBookingError) {
      console.error('Error creating booking:', createBookingError);
      return {
        success: false,
        message: 'Error creating booking'
      };
    }

    // Revalidate relevant paths
    revalidatePath('/bookings');
    revalidatePath('/dispatch');
    if (customerId) {
      revalidatePath(`/customers/${customerId}`);
    }

    return {
      success: true,
      message: 'Booking created successfully',
      bookingId: newBooking.id
    };

  } catch (error) {
    console.error('Error in createBookingAction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 