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
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || null
    : process.env.WORDPRESS_API_KEY || process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || null
}

const getAuthMethod = () => {
  return typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_AUTH_METHOD || 'header'
    : process.env.WORDPRESS_API_AUTH_METHOD || process.env.NEXT_PUBLIC_WORDPRESS_API_AUTH_METHOD || 'header'
}

// Create authorization headers with proper format
const getAuthHeaders = () => {
  const apiKey = getApiKey();
  if (!apiKey) return {};
  
  const authMethod = getAuthMethod();
  
  if (authMethod === 'basic') {
    // Use Basic auth
    const basicAuth = typeof window !== 'undefined' 
      ? btoa(`${apiKey}:`) // For browser
      : Buffer.from(`${apiKey}:`).toString('base64'); // For Node.js
    return {
      'Authorization': `Basic ${basicAuth}`
    };
  } else {
    // Default to Bearer token
    return {
      'Authorization': `Bearer ${apiKey}`
    };
  }
}

/**
 * Gets the request headers for WordPress API
 */
export function getRequestHeaders(): HeadersInit {
  const apiKey = getApiKey()
  const authMethod = getAuthMethod()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  
  // Add API key to headers if using header method (default)
  if (authMethod !== 'query' && apiKey) {
    // Use Bearer token authentication which worked in our tests
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  
  return headers
}

// Create URL with authentication if needed
const createAuthenticatedUrl = (baseUrl: string): string => {
  const apiKey = getApiKey();
  const authMethod = getAuthMethod();
  
  if (apiKey && authMethod === 'query') {
    // Add API key as query parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}api_key=${apiKey}`;
  }
  
  return baseUrl;
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
    // Don't return mock data - throw an error instead
    throw new Error('WordPress API URL is not configured. Please set WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL in your environment variables.');
  }
  
  // Get custom path if available
  const customPath = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH 
    : process.env.WORDPRESS_API_CUSTOM_PATH || process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH;
  
  // Construct the full endpoint URL
  let endpointUrl = `${apiEndpoint}/bookings?${params.toString()}`;
  
  // If we have a custom path, use that instead (and make sure we don't append /bookings)
  if (customPath) {
    // Remove trailing slash from apiEndpoint if it exists
    const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    // Add leading slash to customPath if it doesn't exist
    const fullPath = customPath.startsWith('/') ? customPath : `/${customPath}`;
    // Construct the full URL with query parameters
    endpointUrl = `${baseUrl}${fullPath}?${params.toString()}`;
  } else {
    // Try with wp-json path which is standard for WordPress REST API
    endpointUrl = `${apiEndpoint}/wp-json/driver/v1/bookings?${params.toString()}`;
  }
  
  console.log('Fetching bookings from:', endpointUrl);
  
  // Add authentication to URL if using query param method
  endpointUrl = createAuthenticatedUrl(endpointUrl);
  
  // Fetch data
  try {
    console.log('Using API Key:', getApiKey() ? 'Yes (configured)' : 'No');
    console.log('Auth Method:', getAuthMethod());
    
    const headers = getRequestHeaders();
    console.log('Request headers:', JSON.stringify(headers));

    // Try different authentication methods if the default doesn't work
    let response;
    
    // First try with the standard headers
    response = await fetch(endpointUrl, {
      headers,
      cache: 'no-store'
    });
    
    // If that fails with 401, try with X-API-Key header only
    if (response.status === 401) {
      console.log('First attempt failed with 401, trying with X-API-Key header only');
      response = await fetch(endpointUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey() || '',
        },
        cache: 'no-store'
      });
    }
    
    // If that still fails, try with api_key in the URL
    if (response.status === 401) {
      console.log('Second attempt failed with 401, trying with api_key in URL');
      const apiKey = getApiKey();
      const urlWithApiKey = `${endpointUrl}${endpointUrl.includes('?') ? '&' : '?'}api_key=${apiKey}`;
      response = await fetch(urlWithApiKey, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
    }
    
    // If all authentication methods failed
    if (!response.ok) {
      console.error('Failed to fetch bookings with status:', response.status);
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch bookings: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Check for data in expected format (WordPress API returns { data: [ bookings ] })
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`Found ${data.data.length} bookings in WordPress API response`);
      return data.data;
    }
    
    // Fallback to other formats
    return data.bookings || data || []
  } catch (error) {
    console.error('Error fetching bookings:', error)
    // Don't return mock data - rethrow the error
    throw error;
  }
}

/**
 * Fetches a single booking by ID
 */
export async function fetchBookingById(id: string): Promise<Booking> {
  const apiEndpoint = getApiEndpoint();
  
  if (!apiEndpoint) {
    console.error('WordPress API URL is not configured');
    // Don't return mock data - throw an error
    throw new Error('WordPress API URL is not configured. Please set WORDPRESS_API_URL or NEXT_PUBLIC_WORDPRESS_API_URL in your environment variables.');
  }
  
  // Get custom path if available
  const customPath = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH 
    : process.env.WORDPRESS_API_CUSTOM_PATH || process.env.NEXT_PUBLIC_WORDPRESS_API_CUSTOM_PATH;
  
  // Construct the full endpoint URL
  let endpointUrl = `${apiEndpoint}/bookings/${id}`;
  
  // If we have a custom path, use that instead
  if (customPath) {
    // Remove trailing slash from apiEndpoint if it exists
    const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    // Add leading slash to customPath if it doesn't exist
    const fullPath = customPath.startsWith('/') ? customPath : `/${customPath}`;
    // Use the custom path but add the ID
    if (fullPath.endsWith('/')) {
      endpointUrl = `${baseUrl}${fullPath}${id}`;
    } else {
      endpointUrl = `${baseUrl}${fullPath}/${id}`;
    }
  } else {
    // Try with wp-json path which is standard for WordPress REST API
    endpointUrl = `${apiEndpoint}/wp-json/driver/v1/bookings/${id}`;
  }
  
  console.log('Fetching booking details from:', endpointUrl);
  
  // Add authentication to URL if using query param method
  endpointUrl = createAuthenticatedUrl(endpointUrl);
  
  try {
    const headers = getRequestHeaders();
    
    const response = await fetch(endpointUrl, {
      headers,
      cache: 'no-store'
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch booking: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Check for data in expected format (WordPress API may return { data: booking })
    if (data && data.data && typeof data.data === 'object') {
      console.log(`Found booking ${id} in response data`);
      return data.data;
    }
    
    return data
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error)
    // Don't return mock data - rethrow the error
    throw error;
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