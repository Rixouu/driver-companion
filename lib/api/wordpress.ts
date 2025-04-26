import { Booking } from '@/types/bookings'

interface FetchBookingsOptions {
  status?: string
  limit?: number
  page?: number
}

// Safely get environment variables
const getApiEndpoint = () => {
  return typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_URL 
    : process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
}

const getApiKey = () => {
  return typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_KEY
    : process.env.WORDPRESS_API_KEY || process.env.NEXT_PUBLIC_WORDPRESS_API_KEY;
}

/**
 * Fetches bookings from the WordPress plugin API
 */
export async function fetchBookings(options: FetchBookingsOptions = {}): Promise<Booking[]> {
  const { status = 'all', limit = 10, page = 1 } = options
  
  // Build query parameters
  const params = new URLSearchParams()
  if (status !== 'all') {
    params.append('status', status)
  }
  params.append('limit', limit.toString())
  params.append('page', page.toString())
  
  // API endpoint from environment variable
  const apiEndpoint = getApiEndpoint();
  
  if (!apiEndpoint) {
    console.error('WordPress API URL is not configured');
    // Return mock data instead of throwing to prevent client-side errors
    return getMockBookings();
  }
  
  // Fetch data
  try {
    const response = await fetch(`${apiEndpoint}/bookings?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        // Include authentication if required
        ...(getApiKey() ? {
          'Authorization': `Bearer ${getApiKey()}`
        } : {})
      },
      // Use cache: 'no-store' for real-time data or
      // next: { revalidate: 60 } to cache for 60 seconds
      cache: 'no-store'
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch bookings: ${response.status}`)
    }
    
    const data = await response.json()
    return data.bookings || []
  } catch (error) {
    console.error('Error fetching bookings:', error)
    // Return mock data in case of errors
    return getMockBookings();
  }
}

/**
 * Fetches a single booking by ID
 */
export async function fetchBookingById(id: string): Promise<Booking> {
  const apiEndpoint = getApiEndpoint();
  
  if (!apiEndpoint) {
    console.error('WordPress API URL is not configured');
    // Return mock data instead of throwing
    return getMockBookings()[0];
  }
  
  try {
    const response = await fetch(`${apiEndpoint}/bookings/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(getApiKey() ? {
          'Authorization': `Bearer ${getApiKey()}`
        } : {})
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch booking: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error)
    // Return mock data in case of errors
    return getMockBookings()[0];
  }
}

// Mock data function for testing and fallbacks
function getMockBookings(): Booking[] {
  return [
    {
      id: "1",
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
        registration: "ABC123"
      },
      notes: "Customer requested thorough brake inspection",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
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
        year: "2019"
      },
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
} 