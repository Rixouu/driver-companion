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
 * Process and format WordPress booking dates
 * WordPress stores dates in DD-MM-YYYY format, but we need YYYY-MM-DD
 */
function formatWordPressDate(wpDate: string | undefined): string {
  if (!wpDate) return '';
  
  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(wpDate)) {
    return wpDate.split(' ')[0]; // Extract date part if datetime
  }
  
  // Handle DD-MM-YYYY format
  const parts = wpDate.split('-');
  if (parts.length === 3) {
    // Rearrange from DD-MM-YYYY to YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  return wpDate;
}

/**
 * Extracts vehicle information from WordPress meta data
 */
function extractVehicleInfo(wpMeta: Record<string, any>): {
  vehicle_id?: string | null;
  make?: string | null;
  model?: string | null;
  capacity?: number | null;
} {
  // Initialize with empty values
  const result = {
    vehicle_id: null as string | null,
    make: null as string | null,
    model: null as string | null,
    capacity: null as number | null
  };

  // Extract vehicle ID
  if (wpMeta.chbs_vehicle_id) {
    result.vehicle_id = String(wpMeta.chbs_vehicle_id);
  }

  // Extract vehicle name and parse it to get make and model
  if (wpMeta.chbs_vehicle_name) {
    const vehicleName = String(wpMeta.chbs_vehicle_name);
    
    // Common vehicle makes that might appear in the name
    const commonMakes = [
      'Toyota', 'Honda', 'Nissan', 'Lexus', 'Mercedes', 'BMW', 
      'Audi', 'Ford', 'Hyundai', 'Mazda', 'Mitsubishi'
    ];
    
    // Try to extract the make from the vehicle name
    const foundMake = commonMakes.find(make => vehicleName.includes(make));
    if (foundMake) {
      result.make = foundMake;
      // Model is everything after the make
      result.model = vehicleName.replace(foundMake, '').trim();
    } else {
      // If make not found, use first word as make and rest as model
      const parts = vehicleName.split(' ');
      if (parts.length > 0) {
        result.make = parts[0];
        result.model = parts.slice(1).join(' ');
      }
    }
  }
  
  // Try to extract capacity information
  if (wpMeta.chbs_vehicle_passenger_count) {
    const passengerCount = parseInt(String(wpMeta.chbs_vehicle_passenger_count), 10);
    if (!isNaN(passengerCount)) {
      result.capacity = passengerCount;
    }
  } else {
    // Fallback: Try to infer capacity from name and known vehicle models
    const vehicleName = String(wpMeta.chbs_vehicle_name || '').toLowerCase();
    
    // Define common model capacity mappings
    const capacityMapping: Record<string, number> = {
      'hiace grand cabin': 10,
      'hiace': 8,
      'alphard': 6,
      'alphard executive': 4,
      'alphard executive lounge': 4,
      'alphard z-class': 6,
      'camry': 4,
      'prius': 4,
      'crown': 4,
      'century': 4
    };
    
    // Try to find matching model for capacity
    for (const [model, capacity] of Object.entries(capacityMapping)) {
      if (vehicleName.includes(model.toLowerCase())) {
        result.capacity = capacity;
        break;
      }
    }
  }

  return result;
}

/**
 * Extracts billing address information from WordPress metadata
 */
function getBillingAddressFromMeta(meta: Record<string, any> | null): {
  company_name?: string | undefined;
  tax_number?: string | undefined;
  street_name?: string | undefined;
  street_number?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postal_code?: string | undefined;
  country?: string | undefined;
} {
  if (!meta) return {};
  
  // Extract billing information from WordPress metadata
  return {
    company_name: meta.chbs_billing_company_name || meta.billing_company || undefined,
    tax_number: meta.chbs_billing_tax_number || meta.billing_tax_id || undefined,
    street_name: meta.chbs_billing_street_name || meta.billing_address_1 || undefined,
    street_number: meta.chbs_billing_street_number || meta.billing_address_2 || undefined,
    city: meta.chbs_billing_city || meta.billing_city || undefined,
    state: meta.chbs_billing_state || meta.billing_state || undefined,
    postal_code: meta.chbs_billing_postal_code || meta.billing_postcode || undefined,
    country: meta.chbs_billing_country || meta.billing_country || undefined
  };
}

/**
 * Maps a WordPress booking to a Supabase booking structure
 */
export const mapWordPressBookingToSupabase = (wpBooking: any): Omit<SupabaseBooking, 'id'> => {
  const meta = wpBooking.meta;
  const wpMeta = meta || {};

  // Process date properly from WordPress format
  let bookingDate = '';
  
  // First try the date field from the booking object
  if (wpBooking.date) {
    bookingDate = formatWordPressDate(wpBooking.date);
  } 
  // Then try the pickup_date from meta
  else if (wpMeta.chbs_pickup_date) {
    bookingDate = formatWordPressDate(wpMeta.chbs_pickup_date);
  }
  
  // Extract booking time from various possible sources
  let bookingTime = wpBooking.time || wpMeta.chbs_pickup_time || '00:00';
  
  // Clean up time format if needed (remove AM/PM, etc.)
  if (bookingTime.includes('AM') || bookingTime.includes('PM')) {
    // Convert 12-hour format to 24-hour
    const timeParts = bookingTime.split(' ');
    const timeValue = timeParts[0];
    const ampm = timeParts[1];
    
    if (timeValue && timeValue.includes(':')) {
      const [hours, minutes] = timeValue.split(':');
      let hoursNum = parseInt(hours, 10);
      
      if (ampm === 'PM' && hoursNum < 12) {
        hoursNum += 12;
      } else if (ampm === 'AM' && hoursNum === 12) {
        hoursNum = 0;
      }
      
      bookingTime = `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
    }
  }

  // Extract service type information and store in service_name (since service_type column doesn't exist)
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
  
  // Check service_type_id which often contains the service type
  if (!serviceType && wpMeta.chbs_service_type_id) {
    // Common mapping for service type IDs
    const serviceTypeMap: Record<string, string> = {
      '1': 'Airport Transfer',
      '2': 'Hourly Hire',
      '3': 'Point to Point'
    };
    
    const typeId = String(wpMeta.chbs_service_type_id);
    if (serviceTypeMap[typeId]) {
      serviceType = serviceTypeMap[typeId];
    }
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

  // Check for airport pickup/dropoff locations
  if (!serviceType && wpMeta.chbs_coordinate) {
    const coordinates = Array.isArray(wpMeta.chbs_coordinate) ? wpMeta.chbs_coordinate : [];
    
    for (const coordinate of coordinates) {
      const address = coordinate.address || '';
      if (typeof address === 'string' && 
          (address.toLowerCase().includes('airport') || 
           address.toLowerCase().includes('haneda') || 
           address.toLowerCase().includes('narita'))) {
        serviceType = 'Airport Transfer';
        break;
      }
    }
  }

  // Combine service type into service name if available
  const serviceName = serviceType 
    ? `${wpMeta.chbs_vehicle_name || 'Vehicle Service'} (${serviceType})` 
    : wpMeta.chbs_vehicle_name || 'Vehicle Service';
    
  // Extract price information from meta data
  let priceAmount: number | null = null;
  let priceCurrency: string | null = wpMeta.chbs_currency_id || null;
  
  // First check if price is directly in the booking object
  if (wpBooking.price && typeof wpBooking.price.amount !== 'undefined') {
    priceAmount = parseFloat(String(wpBooking.price.amount));
    priceCurrency = wpBooking.price.currency || priceCurrency;
  } 
  // If not, try to extract from meta data based on calculation method and price type
  else {
    // Based on calculation method, determine which price field to use
    const calculationMethod = wpMeta.chbs_calculation_method;
    const priceType = wpMeta.chbs_price_type;
    
    if (priceType === '2' || priceType === 2) { // Fixed price
      const fixedValue = wpMeta.chbs_price_fixed_value;
      if (fixedValue) {
        priceAmount = parseFloat(String(fixedValue));
      }
    } else if (calculationMethod === '1' || calculationMethod === 1) { // Hourly
      const hourValue = wpMeta.chbs_price_hour_value;
      if (hourValue) {
        priceAmount = parseFloat(String(hourValue));
      }
    } else {
      // Try to find any price field with a value
      const possiblePriceFields = [
        'chbs_price_fixed_value',
        'chbs_price_hour_value', 
        'chbs_price_distance_value',
        'chbs_price_initial_value'
      ];
      
      for (const field of possiblePriceFields) {
        if (wpMeta[field] && parseFloat(String(wpMeta[field])) > 0) {
          priceAmount = parseFloat(String(wpMeta[field]));
          break;
        }
      }
    }
  }
  
  // Format price for display
  let priceFormatted: string | null = null;
  if (priceAmount !== null && priceCurrency) {
    priceFormatted = `${priceCurrency} ${priceAmount.toLocaleString()}`;
  }
  
  // Extract payment link - check both standard and IPPS fields
  const paymentLink = wpBooking.payment_link || 
                      wpBooking.ipps_payment_link || 
                      wpMeta.chbs_ipps_payment_url || 
                      wpMeta.ipps_payment_link || 
                      null;
                      
  // Get customer full name
  const firstName = wpMeta.chbs_client_contact_detail_first_name || '';
  const lastName = wpMeta.chbs_client_contact_detail_last_name || '';
  const customerName = (firstName + ' ' + lastName).trim() || null;

  // Extract vehicle information
  const vehicleInfo = extractVehicleInfo(wpMeta);
  
  // Extract coupon information from WordPress metadata
  const couponCode = wpBooking.coupon_code || 
                     wpMeta.chbs_coupon_code || 
                     wpMeta.coupon_code || 
                     null;
                     
  const couponDiscountPercentage = wpBooking.coupon_discount_percentage || 
                                   wpMeta.chbs_coupon_discount_percentage || 
                                   wpMeta.coupon_discount_percentage || 
                                   null;
                                   
  // Convert coupon discount percentage to number if it's a string
  const couponDiscountPercentageNumber = couponDiscountPercentage ? 
    (typeof couponDiscountPercentage === 'string' ? parseFloat(couponDiscountPercentage) : couponDiscountPercentage) : 
    null;
                                   
  // Extract billing information from WordPress metadata
  const billingCompanyName = wpBooking.billing_company_name || 
                            wpMeta.chbs_client_billing_detail_company_name || 
                            wpMeta.billing_company_name || 
                            null;
                          
  const billingTaxNumber = wpBooking.billing_tax_number || 
                           wpMeta.chbs_client_billing_detail_tax_number || 
                           wpMeta.billing_tax_number || 
                           null;
                          
  const billingStreetName = wpBooking.billing_street_name || 
                            wpMeta.chbs_client_billing_detail_street_name || 
                            wpMeta.billing_street_name || 
                            null;
                          
  const billingStreetNumber = wpBooking.billing_street_number || 
                              wpMeta.chbs_client_billing_detail_street_number || 
                              wpMeta.billing_street_number || 
                              null;
                            
  const billingCity = wpBooking.billing_city || 
                      wpMeta.chbs_client_billing_detail_city || 
                      wpMeta.billing_city || 
                      null;
                    
  const billingState = wpBooking.billing_state || 
                       wpMeta.chbs_client_billing_detail_state || 
                       wpMeta.billing_state || 
                       null;
                       
  const billingPostalCode = wpBooking.billing_postal_code || 
                           wpMeta.chbs_client_billing_detail_postal_code || 
                           wpMeta.billing_postal_code || 
                           null;
                         
  const billingCountry = wpBooking.billing_country || 
                         wpMeta.chbs_client_billing_detail_country_code || 
                         wpMeta.billing_country || 
                         null;

  // Create the base booking data
  const bookingData: Omit<SupabaseBooking, 'id'> = {
    wp_id: String(wpBooking.id || wpBooking.booking_id || ''),
    status: wpBooking.status || 'pending',
    
    // Common fields
    date: wpBooking.date,
    time: wpBooking.time,
    
    // Service information
    service_id: wpBooking.service_id || null,
    service_name: wpBooking.service_name || wpBooking.service?.name || '',
    
    // Customer information
    customer_id: wpBooking.customer_id || null,
    customer_name: wpBooking.customer_name || wpBooking.customer?.name || '',
    customer_email: wpBooking.customer_email || wpBooking.customer?.email || wpBooking.email || '',
    customer_phone: wpBooking.customer_phone || wpBooking.customer?.phone || wpBooking.phone || '',
    
    // Vehicle and driver information (UUID fields)
    vehicle_id: wpBooking.vehicle_id || null,
    driver_id: wpBooking.driver_id || null,
    
    // Price information
    price_amount: wpBooking.price?.amount,
    price_currency: wpBooking.price?.currency || 'THB',
    price_formatted: wpBooking.price?.formatted || '',
    
    // Payment information
    payment_status: wpBooking.payment_status || 'pending',
    payment_method: wpBooking.payment_method || '',
    payment_link: wpBooking.payment_link || wpBooking.ipps_payment_link || '',
    
    // Location information
    pickup_location: wpBooking.pickup_location || '',
    dropoff_location: wpBooking.dropoff_location || '',
    distance: wpBooking.distance || '',
    duration: wpBooking.duration || '',
    
    // Billing information
    billing_company_name: billingCompanyName,
    billing_tax_number: billingTaxNumber,
    billing_street_name: billingStreetName,
    billing_street_number: billingStreetNumber,
    billing_city: billingCity,
    billing_state: billingState,
    billing_postal_code: billingPostalCode,
    billing_country: billingCountry,
    
    // Coupon information
    coupon_code: couponCode,
    coupon_discount_percentage: couponDiscountPercentageNumber,
    
    // Additional metadata
    notes: wpBooking.notes || undefined,
    wp_meta: wpBooking.wp_meta ? (typeof wpBooking.wp_meta === 'object' ? wpBooking.wp_meta : undefined) : undefined,
    created_at: wpBooking.created_at || undefined,
    updated_at: wpBooking.updated_at || undefined,
    created_by: wpBooking.created_by || null, // Add created_by field
  }
  
  return bookingData;
}

/**
 * Maps a Supabase booking to the Booking type
 */
export function mapSupabaseBookingToBooking(booking: Database['public']['Tables']['bookings']['Row'] & { vehicle?: any; creatorInfo?: { full_name?: string | null; email?: string | null } | null }): Booking {
  // Extract vehicle information
  let vehicleInfo: {
    id?: string;
    make?: string;
    model?: string;
    year?: string;
    registration?: string;
    capacity?: number;
  } = {};
  
  // Process vehicle data from various sources
  
  // 1. First check if we have joined vehicle data (highest priority)
  if (booking.vehicle) {
    vehicleInfo.id = booking.vehicle.id;
    vehicleInfo.make = booking.vehicle.brand || booking.vehicle.make;
    vehicleInfo.model = booking.vehicle.model;
    vehicleInfo.year = booking.vehicle.year;
    vehicleInfo.registration = booking.vehicle.plate_number;
    vehicleInfo.capacity = booking.vehicle.passenger_capacity;
  }
  
  // 2. Check if vehicle_id exists (fallback)
  if (!vehicleInfo.id && booking.vehicle_id) {
    vehicleInfo.id = booking.vehicle_id;
  }
  
  // 3. Use direct database fields if available (fallback if no joined data)
  if (!vehicleInfo.make && booking.vehicle_make) {
    vehicleInfo.make = booking.vehicle_make;
  }
  if (!vehicleInfo.model && booking.vehicle_model) {
    vehicleInfo.model = booking.vehicle_model;
  }
  if (!vehicleInfo.year && booking.vehicle_year) {
    vehicleInfo.year = booking.vehicle_year;
  }
  if (!vehicleInfo.capacity && booking.vehicle_capacity) {
    vehicleInfo.capacity = booking.vehicle_capacity;
  }
  
  // 4. Try to extract vehicle data from wp_meta (fallback if direct fields not available)
  if (booking.wp_meta && typeof booking.wp_meta === 'object') {
    const meta = booking.wp_meta as Record<string, any>;
    
    // Extract vehicle ID from meta if not already set
    if (!vehicleInfo.id && meta.chbs_vehicle_id) {
      vehicleInfo.id = String(meta.chbs_vehicle_id);
    }
    
    // Extract vehicle name and parse for make/model (only if not already set from direct fields)
    if (!vehicleInfo.make && !vehicleInfo.model && meta.chbs_vehicle_name) {
      const vehicleName = String(meta.chbs_vehicle_name);
      
      // Common vehicle makes
      const commonMakes = [
        'Toyota', 'Honda', 'Nissan', 'Lexus', 'Mercedes', 'BMW', 
        'Audi', 'Ford', 'Hyundai', 'Mazda', 'Mitsubishi'
      ];
      
      // Try to extract the make from the vehicle name
      const foundMake = commonMakes.find(make => vehicleName.includes(make));
      if (foundMake) {
        vehicleInfo.make = foundMake;
        vehicleInfo.model = vehicleName.replace(foundMake, '').trim();
      } else {
        // If make not found, use first word as make and rest as model
        const parts = vehicleName.split(' ');
        if (parts.length > 0) {
          vehicleInfo.make = parts[0];
          vehicleInfo.model = parts.slice(1).join(' ');
        }
      }
    }
    
    // Extract capacity (only if not already set from direct fields)
    if (!vehicleInfo.capacity && meta.chbs_vehicle_passenger_count) {
      const passengerCount = parseInt(String(meta.chbs_vehicle_passenger_count), 10);
      if (!isNaN(passengerCount)) {
        vehicleInfo.capacity = passengerCount;
      }
    } else {
      // Try to infer capacity from vehicle name
      const vehicleName = String(meta.chbs_vehicle_name || '').toLowerCase();
      
      // Capacity mappings
      const capacityMapping: Record<string, number> = {
        'hiace grand cabin': 10,
        'hiace': 8,
        'alphard': 6,
        'alphard executive': 4,
        'alphard executive lounge': 4,
        'alphard z-class': 6,
        'camry': 4,
        'prius': 4,
        'crown': 4,
        'century': 4
      };
      
      // Find matching model for capacity
      for (const [model, capacity] of Object.entries(capacityMapping)) {
        if (vehicleName.includes(model.toLowerCase())) {
          vehicleInfo.capacity = capacity;
          break;
        }
      }
    }
  }
  
  // 5. If we didn't extract any vehicle info and have a service_name, try to get make/model from it
  if (!vehicleInfo.make && booking.service_name) {
    const serviceName = booking.service_name;
    const commonMakes = ['Toyota', 'Honda', 'Nissan', 'Lexus', 'Mercedes', 'BMW'];
    
    for (const make of commonMakes) {
      if (serviceName.includes(make)) {
        vehicleInfo.make = make;
        // Extract model (everything between make and first parenthesis or end of string)
        const modelMatch = serviceName.replace(make, '').trim().match(/^(.*?)(\s*\(|$)/);
        if (modelMatch && modelMatch[1]) {
          vehicleInfo.model = modelMatch[1].trim();
        }
        break;
      }
    }
  }

  return {
    id: booking.id, // Map the actual Supabase UUID to id
    supabase_id: booking.id, // Also map to supabase_id for consistency
    wp_id: booking.wp_id, // Keep wp_id separate for reference
    booking_id: booking.wp_id,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    service_name: booking.service_name,
    service_type: booking.service_type || undefined, // Map direct service_type field
    service_id: booking.service_id || undefined,
    customer_id: booking.customer_id || undefined,
    customer_name: booking.customer_name || undefined,
    customer_email: booking.customer_email || undefined,
    customer_phone: booking.customer_phone || undefined,
    driver_id: booking.driver_id || undefined,
    vehicle_id: booking.vehicle_id || vehicleInfo.id || undefined,
    
    // Direct vehicle fields from database
    vehicle_make: booking.vehicle_make || undefined,
    vehicle_model: booking.vehicle_model || undefined,
    vehicle_capacity: booking.vehicle_capacity || undefined,
    vehicle_year: booking.vehicle_year || undefined,
    
    // Service duration fields (from meta if not in direct fields)
    hours_per_day: (booking as any).hours_per_day || (booking.meta as any)?.hours_per_day || undefined,
    duration_hours: (booking as any).duration_hours || (booking.meta as any)?.duration_hours || undefined,
    service_days: (booking as any).service_days || (booking.meta as any)?.service_days || undefined,
    
    // Billing address fields
    billing_company_name: booking.billing_company_name || undefined,
    billing_tax_number: booking.billing_tax_number || undefined,
    billing_street_name: booking.billing_street_name || undefined,
    billing_street_number: booking.billing_street_number || undefined,
    billing_city: booking.billing_city || undefined,
    billing_state: booking.billing_state || undefined,
    billing_postal_code: booking.billing_postal_code || undefined,
    billing_country: booking.billing_country || undefined,
    
    // Coupon fields
    coupon_code: booking.coupon_code || undefined,
    coupon_discount_percentage: booking.coupon_discount_percentage ? String(booking.coupon_discount_percentage) : undefined,
    
    // Enhanced vehicle information
    ...(Object.keys(vehicleInfo).length > 0 && {
      vehicle: {
        id: vehicleInfo.id || '',
        created_at: new Date().toISOString(),
        make: vehicleInfo.make || '',
        model: vehicleInfo.model || '',
        year: vehicleInfo.year || '',
        license_plate: vehicleInfo.registration || '',
        name: `${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
      }
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
    meta: booking.meta ? (typeof booking.meta === 'object' ? booking.meta as Record<string, any> : undefined) : 
          booking.wp_meta ? (typeof booking.wp_meta === 'object' ? booking.wp_meta as Record<string, any> : undefined) : undefined,
    
    // Flight information - prioritize direct fields over meta fields
    flight_number: booking.flight_number || (booking.meta as any)?.chbs_flight_number || (booking.wp_meta as any)?.chbs_flight_number || undefined,
    terminal: booking.terminal || (booking.meta as any)?.chbs_terminal || (booking.wp_meta as any)?.chbs_terminal || undefined,
    
    created_at: booking.created_at || undefined,
    updated_at: booking.updated_at || undefined,
    
    // Creator information
    created_by: booking.created_by || undefined,
    creator: booking.creatorInfo || undefined,
  }
}

/**
 * Extract relevant fields from WordPress booking data to our format
 */
export function extractBookingFieldsFromWordPress(wpBooking: any): Partial<Booking> {
  const meta = wpBooking.meta_data || wpBooking.meta;
  
  // Debug: Log the actual WordPress booking structure
  console.log('WordPress booking structure:', {
    id: wpBooking.id,
    title: wpBooking.title,
    status: wpBooking.status,
    service_name: wpBooking.service_name,
    client_name: wpBooking.client_name,
    client_contact_detail_name: wpBooking.client_contact_detail_name,
    meta_keys: meta ? Object.keys(meta) : 'no meta',
    sample_meta_values: meta ? {
      chbs_service_type: meta.chbs_service_type,
      chbs_client_name: meta.chbs_client_name,
      service_type: meta.service_type,
      client_name: meta.client_name
    } : 'no meta'
  });
  
  // Log ALL available fields in the booking object to see what's actually there
  console.log('All available fields in wpBooking:', Object.keys(wpBooking));
  console.log('Sample field values:', {
    'wpBooking.service_name': wpBooking.service_name,
    'wpBooking.title': wpBooking.title,
    'wpBooking.client_name': wpBooking.client_name,
    'wpBooking.client_contact_detail_name': wpBooking.client_contact_detail_name,
    'wpBooking.customer_name': wpBooking.customer_name,
    'wpBooking.billing_first_name': wpBooking.billing_first_name,
    'wpBooking.billing_last_name': wpBooking.billing_last_name,
    'wpBooking.first_name': wpBooking.first_name,
    'wpBooking.last_name': wpBooking.last_name
  });
  
  // Log meta data structure if available
  if (meta) {
    console.log('Meta data keys:', Object.keys(meta));
    console.log('Meta data sample values:', {
      'meta.chbs_service_type': meta.chbs_service_type,
      'meta.chbs_client_name': meta.chbs_client_name,
      'meta.service_type': meta.service_type,
      'meta.service_name': meta.service_name,
      'meta.client_name': meta.client_name,
      'meta.customer_name': meta.customer_name,
      'meta.billing_first_name': meta.billing_first_name,
      'meta.billing_last_name': meta.billing_last_name,
      'meta.first_name': meta.first_name,
      'meta.last_name': meta.last_name
    });
  }
  
  // Try to find meaningful service and customer names from various sources
  let serviceName = wpBooking.service_name || wpBooking.title || meta?.chbs_service_type || meta?.service_type || meta?.service_name || meta?.service_title || "";
  
  // For customer name, prioritize CHBS fields since that's where the data actually is
  let customerName = '';
  if (meta?.chbs_client_contact_detail_first_name && meta?.chbs_client_contact_detail_last_name) {
    customerName = `${meta.chbs_client_contact_detail_first_name.trim()} ${meta.chbs_client_contact_detail_last_name.trim()}`;
  } else {
    customerName = wpBooking.client_contact_detail_name || wpBooking.client_name || meta?.chbs_client_name || meta?.client_name || meta?.customer_name || meta?.billing_first_name || meta?.first_name || meta?.name || "";
  }
  
  // If still empty, try to extract from title or other fields
  if (!serviceName && wpBooking.title) {
    // Try to extract service type from title
    serviceName = wpBooking.title;
  }
  
  if (!customerName) {
    // Try to find customer name in other common locations
    const possibleCustomerFields = [
      meta?.billing_first_name,
      meta?.billing_last_name,
      meta?.first_name,
      meta?.last_name,
      meta?.customer_first_name,
      meta?.customer_last_name,
      wpBooking.billing_first_name,
      wpBooking.billing_last_name,
      wpBooking.first_name,
      wpBooking.last_name
    ];
    
    const foundName = possibleCustomerFields.find(field => field && field.trim() !== '');
    if (foundName) {
      customerName = foundName;
    }
  }
  
  // Log what we found
  console.log('Extracted values:', { serviceName, customerName });
  
  // If we still don't have names, try to search through ALL available fields for any text that might be a name
  if (!customerName || customerName.trim() === '') {
    console.log('Customer name still empty, searching all fields for potential names...');
    const allFields = { ...wpBooking, ...meta };
    const potentialNames = [];
    
    for (const [key, value] of Object.entries(allFields)) {
      if (typeof value === 'string' && value.trim() !== '' && 
          (key.toLowerCase().includes('name') || key.toLowerCase().includes('client') || key.toLowerCase().includes('customer'))) {
        potentialNames.push({ key, value });
      }
    }
    
    if (potentialNames.length > 0) {
      console.log('Found potential name fields:', potentialNames);
      
      // Try to combine first and last names if we have both
      const firstName = allFields.chbs_client_contact_detail_first_name || '';
      const lastName = allFields.chbs_client_contact_detail_last_name || '';
      
      if (firstName && lastName) {
        customerName = `${firstName.trim()} ${lastName.trim()}`;
        console.log('Combined first and last names:', customerName);
      } else {
        // Fallback to first available name field
        customerName = potentialNames[0].value;
      }
    }
  }
  
  if (!serviceName || serviceName.trim() === '') {
    console.log('Service name still empty, searching all fields for potential service info...');
    const allFields = { ...wpBooking, ...meta };
    const potentialServices = [];
    
    for (const [key, value] of Object.entries(allFields)) {
      if (typeof value === 'string' && value.trim() !== '' && 
          (key.toLowerCase().includes('service') || key.toLowerCase().includes('type') || key.toLowerCase().includes('category'))) {
        potentialServices.push({ key, value });
      }
    }
    
    if (potentialServices.length > 0) {
      console.log('Found potential service fields:', potentialServices);
      serviceName = potentialServices[0].value;
    }
  }
  
  // Extract fields from meta
  const serviceType = meta?.chbs_service_type || "";
  const pickupLocation = meta?.chbs_pickup_location_coordinate_address || meta?.chbs_pickup_location || "";
  const dropoffLocation = meta?.chbs_dropoff_location_coordinate_address || meta?.chbs_dropoff_location || "";
  const distance = meta?.chbs_distance ? parseFloat(meta.chbs_distance) : 0;
  const duration = getDurationFromMeta(meta);
  const time = meta?.chbs_pickup_time || meta?.chbs_pickup_datetime?.split(' ')[1] || "";
  
  // Extract billing address from meta data
  const billingAddress = getBillingAddressFromMeta(meta);
  
  // Transform booking to our format
  return {
    date: formatWordPressDate(meta?.chbs_pickup_date || meta?.chbs_pickup_datetime),
    time: time,
    status: wpBooking.status,
    service_name: serviceName,
    service_type: serviceType,
    customer_name: customerName,
    customer_email: wpBooking.client_contact_detail_email || wpBooking.client_email || meta?.chbs_client_email || meta?.client_email || meta?.customer_email || meta?.billing_email || meta?.email || "",
    customer_phone: wpBooking.client_contact_detail_phone || wpBooking.client_phone || meta?.chbs_client_phone || meta?.client_phone || meta?.customer_phone || meta?.billing_phone || meta?.phone || "",
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    distance: distance,
    duration: duration || undefined,
    
    // WordPress specific fields
    title: wpBooking.title,
    meta: meta || {},
    wp_id: String(wpBooking.id) || "",
    
    // Add billing address fields
    billing_company_name: billingAddress.company_name,
    billing_tax_number: billingAddress.tax_number,
    billing_street_name: billingAddress.street_name,
    billing_street_number: billingAddress.street_number,
    billing_city: billingAddress.city,
    billing_state: billingAddress.state,
    billing_postal_code: billingAddress.postal_code,
    billing_country: billingAddress.country
  };
}

/**
 * Syncs bookings from WordPress to Supabase
 */
export async function syncBookingsFromWordPress(
  bookingIdsToUpdate?: string[],
  selectedFieldsByBooking?: Record<string, string[]>
): Promise<{
  total: number;
  created: number;
  updated: number;
  error?: string;
  errors?: Array<{
    booking_id: string;
    error: string;
  }>;
  debug_info?: Record<string, any>;
}> {
  try {
    // CRITICAL FIX: If bookingIdsToUpdate is provided but empty, don't sync anything
    if (bookingIdsToUpdate && bookingIdsToUpdate.length === 0) {
      return {
        total: 0,
        created: 0,
        updated: 0,
        error: 'No bookings were selected for update'
      };
    }
    
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
        error: `WordPress API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
        debug_info: {
          error_type: apiError instanceof Error ? apiError.constructor.name : typeof apiError,
          error_details: apiError instanceof Error ? apiError.message : String(apiError)
        }
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
    const errorDetails: Array<{ booking_id: string; error: string }> = []
    
    // Process each booking - figure out if it's new or existing
    // First, get all the WP IDs from the database
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id, wp_id');
    
    // Create lookup maps for existing bookings
    const existingWpIds = new Set(existingBookings?.map(b => b.wp_id) || []);

    // Filter bookings based on operation:
    // 1. New bookings: Always included
    // 2. Update bookings: Only if in bookingIdsToUpdate (if specified)
    const bookingsToProcess = validBookings.filter(booking => {
      const bookingId = String(booking.id || booking.booking_id || '');
      const exists = existingWpIds.has(bookingId);
      
      if (!exists) {
        // New booking - always process
        return true;
      } else if (bookingIdsToUpdate) {
        // Existing booking - only process if in the approved list
        return bookingIdsToUpdate.includes(bookingId);
      } else {
        // No filter provided - process all
        return true;
      }
    });
    
    // Sync the bookings
    const syncResults = await Promise.all(bookingsToProcess.map(async (wpBooking) => {
      try {
        const bookingId = String(wpBooking.id || wpBooking.booking_id || '');
        const selectedFields = selectedFieldsByBooking?.[bookingId] || [];
        
        const result = await syncSingleBooking(supabase, wpBooking, selectedFields);
        
        if (result.error) {
          console.error(`Error syncing booking ${wpBooking.id}:`, result.error);
          errors++;
          errorDetails.push({
            booking_id: String(wpBooking.id || wpBooking.booking_id || 'unknown'),
            error: result.error
          });
        }
        
        return result
      } catch (syncError) {
        console.error(`Error processing booking ${wpBooking.id}:`, syncError);
        errors++;
        errorDetails.push({
          booking_id: String(wpBooking.id || wpBooking.booking_id || 'unknown'),
          error: syncError instanceof Error ? syncError.message : String(syncError)
        });
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
    
    // Prepare return value
    const returnValue = {
      total: bookingsToProcess.length,
      created,
      updated,
    }
    
    // Add error details if there were errors
    if (errors > 0) {
      return {
        ...returnValue,
        errors: errorDetails
      }
    }
    
    return returnValue;
  } catch (error) {
    console.error('Error syncing bookings:', error)
    return {
      total: 0,
      created: 0,
      updated: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      debug_info: {
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        error_stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

/**
 * Syncs a single booking from WordPress to Supabase
 */
async function syncSingleBooking(
  supabase: SupabaseClient<Database>, 
  wpBooking: Booking, 
  selectedFields: string[] = []
): Promise<{
  created: boolean;
  updated: boolean;
  booking_id?: string;
  error?: string;
  debug_info?: Record<string, any>;
}> {
  try {
    // Ensure WordPress ID exists
    const wpId = String(wpBooking.id || wpBooking.booking_id || '');
    if (!wpId) {
      console.error('Cannot sync booking without an ID:', wpBooking);
      return { 
        created: false, 
        updated: false, 
        error: 'Booking is missing ID', 
        debug_info: {
          booking_data: { ...wpBooking },
          reason: 'missing_id'
        }
      };
    }
    
    // First, check if this booking already exists in Supabase
    const { data: existingBooking, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('wp_id', wpId)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "Did not find a single row"
      console.error(`Database error checking for booking ${wpId}:`, queryError);
      throw queryError;
    }
    
    // First, extract the enhanced fields using our improved extraction logic
    const extractedFields = extractBookingFieldsFromWordPress(wpBooking as any);
    console.log(`Extracted fields for booking ${wpId}:`, {
      customer_name: extractedFields.customer_name,
      service_name: extractedFields.service_name,
      customer_email: extractedFields.customer_email,
      customer_phone: extractedFields.customer_phone,
      date: extractedFields.date,
      time: extractedFields.time,
      status: extractedFields.status
    });
    
    // Map the WordPress booking to Supabase structure
    const bookingData = mapWordPressBookingToSupabase(wpBooking as any);
    
    // Override the mapped data with our enhanced extracted fields
    if (extractedFields.customer_name) {
      bookingData.customer_name = extractedFields.customer_name;
    }
    if (extractedFields.service_name) {
      bookingData.service_name = extractedFields.service_name;
    }
    if (extractedFields.customer_email) {
      bookingData.customer_email = extractedFields.customer_email;
    }
    if (extractedFields.customer_phone) {
      bookingData.customer_phone = extractedFields.customer_phone;
    }
    if (extractedFields.date) {
      bookingData.date = extractedFields.date;
    }
    if (extractedFields.time) {
      bookingData.time = extractedFields.time;
    }
    if (extractedFields.status) {
      bookingData.status = extractedFields.status;
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    bookingData.created_at = bookingData.created_at || now;
    bookingData.updated_at = now;
    bookingData.synced_at = now;
    
    console.log(`Processing booking ${wpBooking.id}: ${existingBooking ? 'UPDATE' : 'INSERT'}`);
    
    if (existingBooking) {
      // If selected fields are specified, only update those fields
      let updateData: Partial<SupabaseBooking> = {
        updated_at: now,
        synced_at: now
      };
      
      // CRITICAL: if selected fields are specified, ONLY update those fields
      // Otherwise, update everything except for fields we need to preserve from existingBooking
      if (selectedFields.length > 0) {
        // Map of field names to properties in bookingData
        const fieldMapping: Record<string, keyof SupabaseBooking> = {
          'date': 'date',
          'time': 'time',
          'status': 'status',
          'customer_name': 'customer_name',
          'customer_email': 'customer_email',
          'customer_phone': 'customer_phone',
          'service_name': 'service_name',
          'price_amount': 'price_amount',
          'price_currency': 'price_currency',
          'price_formatted': 'price_formatted',
          'pickup_location': 'pickup_location',
          'dropoff_location': 'dropoff_location',
          'distance': 'distance',
          'duration': 'duration',
          'payment_status': 'payment_status',
          'payment_method': 'payment_method',
          'payment_link': 'payment_link',
          'notes': 'notes',
          'billing_company_name': 'billing_company_name',
          'billing_tax_number': 'billing_tax_number',
          'billing_street_name': 'billing_street_name',
          'billing_street_number': 'billing_street_number',
          'billing_city': 'billing_city',
          'billing_state': 'billing_state',
          'billing_postal_code': 'billing_postal_code',
          'billing_country': 'billing_country',
          'coupon_code': 'coupon_code',
          'coupon_discount_percentage': 'coupon_discount_percentage',
        };
        
        // Copy only the selected fields from bookingData
        for (const field of selectedFields) {
          const bookingField = fieldMapping[field];
          if (bookingField && (bookingData as any)[bookingField] !== undefined) {
            (updateData as any)[bookingField] = (bookingData as any)[bookingField];
          }
        }
        
        console.log(`Updating booking ${wpId} with selected fields:`, Object.keys(updateData).filter(k => k !== 'updated_at' && k !== 'synced_at'));
      } else {
        // No selected fields, update all fields EXCEPT driver_id and status 
        // which should be preserved unless explicitly selected
        updateData = { ...bookingData };
        
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
        
        // NEVER override driver_id (assignment) since that's managed by the app
        updateData.driver_id = existingBooking.driver_id;
        
        // NEVER override status unless explicitly selected - this is a common issue!
        updateData.status = existingBooking.status;
      }
      
      // Update existing booking
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('wp_id', wpId)
        .select('id')
        .single();
      
      if (updateError) {
        console.error('Error updating booking:', updateError);
        console.error('Booking data causing update error:', JSON.stringify(updateData, null, 2));
        return { 
          updated: false, 
          created: false, 
          error: `Update error: ${updateError.message}`,
          debug_info: {
            booking_data: { ...updateData },
            error_details: updateError,
            operation: 'update',
            booking_wp_id: wpId
          }
        };
      }
      
      return { 
        updated: true, 
        created: false,
        booking_id: data?.id
      };
    } else {
      // Create new booking - add more verbose logging
      console.log(`Creating new booking from WordPress ID: ${wpId}`);
      
      // Additional validation check for required fields
      if (!bookingData.date) {
        console.error('Cannot create booking: missing required date field');
        return {
          updated: false,
          created: false,
          error: 'Missing required date field', 
          debug_info: {
            booking_data: { ...bookingData },
            reason: 'missing_required_field',
            missing_field: 'date'
          }
        };
      }
      
      if (!bookingData.time) {
        // Set a default time if missing
        console.warn(`Booking ${wpId} missing time field, defaulting to 00:00`);
        bookingData.time = '00:00';
      }
      
      // Create new booking
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`Error inserting booking ${wpId}:`, insertError);
        console.error('Booking data causing insert error:', JSON.stringify(bookingData, null, 2));
        
        return { 
          updated: false, 
          created: false, 
          error: `Insert error: ${insertError.message}`, 
          debug_info: {
            booking_data: { ...bookingData },
            error_details: insertError,
            operation: 'insert',
            booking_wp_id: wpId
          }
        };
      }
      
      console.log(`Successfully created booking ${wpId} with Supabase ID ${data?.id}`);
      return { 
        updated: false, 
        created: true,
        booking_id: data?.id
      };
    }
  } catch (error) {
    console.error('Unhandled error syncing booking:', error);
    
    return { 
      updated: false, 
      created: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      debug_info: {
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        error_message: error instanceof Error ? error.message : String(error),
        stack_trace: error instanceof Error ? error.stack : undefined
      }
    };
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
    console.log(`[DB] getBookingByIdFromDatabase: Starting lookup for ID ${id}`)
    
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
      console.log(`[DB] No booking found with internal UUID ${id}, trying WordPress ID`)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('wp_id', id)
        .maybeSingle()
      
      bookingData = data
    }
    
    // Get creator information separately if created_by exists
    let profileCreatorInfo = null;
    if (bookingData?.created_by) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', bookingData.created_by)
        .maybeSingle()
      
      profileCreatorInfo = creatorData;
    }
    
    if (!bookingData) {
      console.log(`[DB] Booking not found with either ID: ${id}`)
      return { booking: null, error: 'Booking not found' }
    }
    
    // Get vehicle category name if available
    let vehicleCategoryName = null;
    if (bookingData.meta && typeof bookingData.meta === 'object' && bookingData.meta !== null) {
      const meta = bookingData.meta as Record<string, any>;
      if (meta.vehicle_category) {
        const { data: categoryData } = await supabase
          .from('pricing_categories')
          .select('name')
          .eq('id', meta.vehicle_category)
          .single();
        
        if (categoryData) {
          vehicleCategoryName = categoryData.name;
        }
      }
    }
    
    // Get creator information if available
    let creatorInfo = null;
    
    // For converted bookings, get creator from quotations table
    if (bookingData.meta && typeof bookingData.meta === 'object' && bookingData.meta !== null) {
      const meta = bookingData.meta as Record<string, any>;
      if (meta.quotation_id) {
        const { data: quotationData } = await supabase
          .from('quotations')
          .select('created_by, created_at')
          .eq('id', meta.quotation_id)
          .single();
        
        if (quotationData?.created_by) {
          // Get the creator's name from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', quotationData.created_by)
            .single();
          
          creatorInfo = {
            id: quotationData.created_by,
            name: profileData?.full_name || 'Unknown User',
            email: profileData?.email || '',
            role: 'Admin',
            created_at: quotationData.created_at
          };
        }
      }
    }
    
    // For direct bookings, we don't have created_by field in the schema
    // So we'll leave creatorInfo as null for now
    
    console.log(`[DB] Raw booking data from database:`, {
      id: bookingData.id,
      wp_id: bookingData.wp_id,
      meta: bookingData.meta,
      service_name: bookingData.service_name,
      vehicle_category_name: vehicleCategoryName,
      creator_info: creatorInfo,
      all_keys: Object.keys(bookingData)
    })
    
    // Map to Booking type
    const mappedBooking = mapSupabaseBookingToBooking({ ...bookingData, creatorInfo: profileCreatorInfo })
    
    // Add the additional information to the meta
    if (mappedBooking.meta) {
      mappedBooking.meta.vehicle_category_name = vehicleCategoryName;
      mappedBooking.meta.creator_info = creatorInfo;
    } else {
      mappedBooking.meta = {
        vehicle_category_name: vehicleCategoryName,
        creator_info: creatorInfo
      };
    }
    
    console.log(`[DB] Mapped booking data:`, {
      id: mappedBooking.id,
      meta: mappedBooking.meta,
      vehicle_type: mappedBooking.meta?.vehicle_type,
      vehicle_category_name: mappedBooking.meta?.vehicle_category_name,
      service_type_name: mappedBooking.meta?.service_type_name,
      creator_info: mappedBooking.meta?.creator_info,
      all_keys: Object.keys(mappedBooking)
    })
    
    return { booking: mappedBooking }
  } catch (error) {
    console.error(`[DB] Error fetching booking ${id} from database:`, error)
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
    const { limit = 100, status, upcoming } = options;
    const supabase = createServiceClient();

    // Get booking IDs from dispatch_entries for the driver
    const { data: dispatchEntries, error: dispatchError } = await supabase
      .from('dispatch_entries')
      .select('booking_id')
      .eq('driver_id', driverId);

    if (dispatchError) {
      console.error('Error fetching dispatch entries for driver:', dispatchError);
      return { bookings: [], error: dispatchError.message };
    }

    const bookingIdsFromDispatch = dispatchEntries?.map(e => e.booking_id).filter(e => e !== null) as string[] || [];

    // Get booking IDs from direct assignment on bookings table
    const { data: directBookings, error: directBookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('driver_id', driverId);
    
    if (directBookingError) {
        // Don't fail here, just log, dispatch entries might still yield results
        console.error('Error fetching direct bookings for driver:', directBookingError);
    }

    const bookingIdsFromDirect = directBookings?.map(b => b.id).filter(b => b !== null) as string[] || [];

    // Combine and unique booking IDs
    const allBookingIds = [...new Set([...bookingIdsFromDispatch, ...bookingIdsFromDirect])];

    if (allBookingIds.length === 0) {
      return { bookings: [] };
    }

    // Now fetch all booking details for these IDs with vehicle information
    let query = supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles (
          id,
          name,
          brand,
          model,
          year,
          plate_number,
          passenger_capacity
        )
      `)
      .in('id', allBookingIds)
      .order('date', { ascending: upcoming === true })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // If upcoming is true, only get bookings from today or later.
    // If upcoming is false, get past bookings.
    // If upcoming is undefined, get all.
    const today = new Date().toISOString().split('T')[0];
    if (upcoming === true) {
      query = query.gte('date', today);
    } else if (upcoming === false) {
      query = query.lt('date', today);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching driver bookings:', error);
      return { bookings: [], error: error.message };
    }

    const bookings = (data || []).map(mapSupabaseBookingToBooking);
    return { bookings };
  } catch (error) {
    console.error('Error in getBookingsByDriverId:', error);
    return {
      bookings: [],
      error: error instanceof Error ? error.message : 'Unknown error',
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
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_capacity?: number | null;
  vehicle_year?: string | null;
  wp_vehicle_id?: string | null;
  wp_meta?: Json | null;
  created_by?: string | null; // UUID of the admin user who created this booking
  billing_company_name?: string | null;
  billing_tax_number?: string | null;
  billing_street_name?: string | null;
  billing_street_number?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  coupon_code?: string | null;
  coupon_discount_percentage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
} 