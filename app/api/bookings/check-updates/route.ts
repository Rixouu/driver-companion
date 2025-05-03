import { NextResponse } from "next/server";
import { fetchBookings } from "@/lib/api/wordpress";
import { createServiceClient } from "@/lib/supabase/service-client";
import { Booking as BookingType } from "@/types/bookings";

// Extended booking interface for WordPress data that might include wp_meta
interface ExtendedBooking extends BookingType {
  wp_meta?: Record<string, any>;
}

// Function to get booking by ID
export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('id');

    // If booking ID is provided, return just that booking's data
    if (bookingId) {
      return await getBookingById(bookingId);
    }

    // Otherwise, continue with the regular update check process
    console.log("Starting check-updates API route");
    
    // Create service client for admin-level database operations
    const supabase = createServiceClient();
    
    // Fetch bookings from WordPress
    console.log("Fetching bookings from WordPress...");
    const wordpressBookings = await fetchBookings({ limit: 1000 });
    
    if (!wordpressBookings || wordpressBookings.length === 0) {
      console.log("No bookings found in WordPress API");
      return NextResponse.json({ 
        error: "No bookings found in WordPress API" 
      }, { status: 404 });
    }
    
    console.log(`Fetched ${wordpressBookings.length} bookings from WordPress`);
    
    // Look for billing data in WordPress bookings using various detection methods
    let bookingsWithBilling = wordpressBookings.filter(b => 
      b.billing_company_name || 
      b.billing_tax_number || 
      b.billing_street_name || 
      b.billing_street_number || 
      b.billing_city || 
      b.billing_state || 
      b.billing_postal_code || 
      b.billing_country
    );
    
    console.log(`Found ${bookingsWithBilling.length} WordPress bookings with direct billing fields`);
    
    // Check for billing data in meta fields
    const bookingsWithMetaBilling = wordpressBookings.filter(b => {
      const booking = b as unknown as ExtendedBooking;
      if (!booking.meta && !booking.wp_meta) return false;
      
      const meta = booking.meta || {};
      const wpMeta = booking.wp_meta || {};
      
      // Check for billing in meta
      return Object.keys(meta).some(key => key.toLowerCase().includes('billing')) ||
             Object.keys(wpMeta).some(key => key.toLowerCase().includes('billing'));
    });
    
    console.log(`Found ${bookingsWithMetaBilling.length} WordPress bookings with billing in meta fields`);
    
    // Add meta-based billing bookings to our list
    bookingsWithBilling = [...new Set([...bookingsWithBilling, ...bookingsWithMetaBilling])];
    
    // Get existing bookings from the database
    console.log("Fetching bookings from database...");
    const { data: databaseBookings, error } = await supabase
      .from('bookings')
      .select('*');
    
    if (error) {
      console.error('Error fetching bookings from database:', error);
      return NextResponse.json({ 
        error: "Failed to fetch bookings from database" 
      }, { status: 500 });
    }
    
    console.log(`Fetched ${databaseBookings.length} bookings from database`);
    
    // Create a map of database bookings by WP ID for easy lookup
    const dbBookingMap = new Map();
    databaseBookings.forEach(booking => {
      if (booking.wp_id) {
        dbBookingMap.set(booking.wp_id, booking);
      }
    });
    
    // Count new bookings (not in database)
    const newBookings = wordpressBookings.filter(wpBooking => {
      const wpId = String(wpBooking.id || wpBooking.booking_id || '');
      return !dbBookingMap.has(wpId);
    });
    
    console.log(`Found ${newBookings.length} new bookings to create`);
    
    // Find bookings that have updates by comparing key fields
    console.log("Checking for bookings that need updates...");
    
    const updatableBookings = wordpressBookings
      .filter(wpBooking => {
        const wpId = String(wpBooking.id || wpBooking.booking_id || '');
        const dbBooking = dbBookingMap.get(wpId);
        
        // Only check existing bookings
        if (!dbBooking) return false;
        
        // Extract WordPress booking details 
        const wpDate = wpBooking.date || '';
        const wpTime = wpBooking.time || '';
        const wpStatus = wpBooking.status || '';
        const wpCustomerName = wpBooking.customer_name || '';
        const wpServiceName = wpBooking.service_name || '';
        
        // Get billing data from different possible locations
        const wpBillingData = extractBillingData(wpBooking);
        
        // Extract database booking details
        const dbDate = dbBooking.date || '';
        const dbTime = dbBooking.time || '';
        const dbStatus = dbBooking.status || '';
        const dbCustomerName = dbBooking.customer_name || '';
        const dbServiceName = dbBooking.service_name || '';
        const dbCouponCode = (dbBooking as any).coupon_code || '';
        const dbCouponDiscountPercentage = (dbBooking as any).coupon_discount_percentage || '';
        
        // Flag to check if WordPress has any billing data
        const wpHasBillingData = Object.values(wpBillingData).some(value => !!value);
        
        // Check if this booking needs an update
        if (wpHasBillingData) {
          return true;
        }
        
        // Check if any of the standard fields have changed
        return wpDate !== dbDate ||
               wpTime !== dbTime ||
               wpStatus !== dbStatus ||
               wpCustomerName !== dbCustomerName ||
               wpServiceName !== dbServiceName;
      })
      .map(wpBooking => {
        const wpId = String(wpBooking.id || wpBooking.booking_id || '');
        const dbBooking = dbBookingMap.get(wpId);
        
        // Get billing data from different possible locations in WordPress booking
        const wpBillingData = extractBillingData(wpBooking);
        
        // Extract database booking details for changes detection
        const dbBillingCompanyName = dbBooking.billing_company_name || '';
        const dbBillingTaxNumber = dbBooking.billing_tax_number || '';
        const dbBillingStreetName = dbBooking.billing_street_name || '';
        const dbBillingStreetNumber = dbBooking.billing_street_number || '';
        const dbBillingCity = dbBooking.billing_city || '';
        const dbBillingState = dbBooking.billing_state || '';
        const dbBillingPostalCode = dbBooking.billing_postal_code || '';
        const dbBillingCountry = dbBooking.billing_country || '';
        const dbCouponCode = (dbBooking as any).coupon_code || '';
        const dbCouponDiscountPercentage = (dbBooking as any).coupon_discount_percentage || '';
        
        // Determine which fields have changes
        const changes: string[] = [];
        if (wpBooking.date !== dbBooking.date) changes.push('date');
        if (wpBooking.time !== dbBooking.time) changes.push('time');
        if (wpBooking.status !== dbBooking.status) changes.push('status');
        if (wpBooking.customer_name !== dbBooking.customer_name) changes.push('customer_name');
        if (wpBooking.service_name !== dbBooking.service_name) changes.push('service_name');
        
        // FORCE ADD the billing fields to changes list if they exist in WordPress
        const billingChanges: string[] = [];
        
        if (wpBillingData.company) {
          billingChanges.push('billing_company_name');
          changes.push('billing_company_name');
        }
        if (wpBillingData.taxNumber) {
          billingChanges.push('billing_tax_number');
          changes.push('billing_tax_number');
        }
        if (wpBillingData.streetName) {
          billingChanges.push('billing_street_name');
          changes.push('billing_street_name');
        }
        if (wpBillingData.streetNumber) {
          billingChanges.push('billing_street_number');
          changes.push('billing_street_number');
        }
        if (wpBillingData.city) {
          billingChanges.push('billing_city');
          changes.push('billing_city');
        }
        if (wpBillingData.state) {
          billingChanges.push('billing_state');
          changes.push('billing_state');
        }
        if (wpBillingData.postalCode) {
          billingChanges.push('billing_postal_code');
          changes.push('billing_postal_code');
        }
        if (wpBillingData.country) {
          billingChanges.push('billing_country');
          changes.push('billing_country');
        }
        
        // Add coupon data to changes list if it exists in WordPress
        if (wpBillingData.couponCode && wpBillingData.couponCode !== dbCouponCode) {
          changes.push('coupon_code');
        }
        if (wpBillingData.couponDiscountPercentage && wpBillingData.couponDiscountPercentage !== dbCouponDiscountPercentage) {
          changes.push('coupon_discount_percentage');
        }
        
        // Format the changes for UI display
        const result = {
          id: wpId,
          booking_id: wpBooking.id || wpBooking.booking_id || '',
          importedBy: 'WordPress',
          changes,
          current: {
            date: dbBooking.date || '',
            time: dbBooking.time || '',
            status: dbBooking.status || '',
            customer_name: dbBooking.customer_name || '',
            service_name: dbBooking.service_name || '',
            billing_company_name: dbBooking.billing_company_name || '',
            billing_tax_number: dbBooking.billing_tax_number || '',
            billing_street_name: dbBooking.billing_street_name || '',
            billing_street_number: dbBooking.billing_street_number || '',
            billing_city: dbBooking.billing_city || '',
            billing_state: dbBooking.billing_state || '',
            billing_postal_code: dbBooking.billing_postal_code || '',
            billing_country: dbBooking.billing_country || '',
            coupon_code: dbCouponCode || '',
            coupon_discount_percentage: dbCouponDiscountPercentage || ''
          },
          updated: {
            date: wpBooking.date || '',
            time: wpBooking.time || '',
            status: wpBooking.status || '',
            customer_name: wpBooking.customer_name || '',
            service_name: wpBooking.service_name || '',
            billing_company_name: wpBillingData.company || '',
            billing_tax_number: wpBillingData.taxNumber || '',
            billing_street_name: wpBillingData.streetName || '',
            billing_street_number: wpBillingData.streetNumber || '',
            billing_city: wpBillingData.city || '',
            billing_state: wpBillingData.state || '',
            billing_postal_code: wpBillingData.postalCode || '',
            billing_country: wpBillingData.country || '',
            coupon_code: wpBillingData.couponCode || '',
            coupon_discount_percentage: wpBillingData.couponDiscountPercentage || ''
          }
        };
        
        return result;
      });
    
    console.log(`Found ${updatableBookings.length} bookings that need updates`);
    
    // Return the results
    const response = {
      newBookings: newBookings.length,
      updatableBookings: updatableBookings
    };
    
    console.log(`Returning response with ${response.updatableBookings.length} updatable bookings`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error checking for booking updates:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to check for booking updates" 
    }, { status: 500 });
  }
}

// Dedicated function to get a single booking by ID
async function getBookingById(bookingId: string) {
  try {
    console.log(`Fetching specific booking with ID: ${bookingId}`);
    
    // Fetch bookings from WordPress - we'll filter for the specific one
    const wordpressBookings = await fetchBookings({ limit: 1000 });
    
    if (!wordpressBookings || wordpressBookings.length === 0) {
      return NextResponse.json({ 
        error: "No bookings found in WordPress API" 
      }, { status: 404 });
    }
    
    // Special case: if ID is 'all', return all bookings data
    if (bookingId === 'all') {
      return NextResponse.json({
        bookings: wordpressBookings,
        meta: {
          method: "All bookings fetch",
          count: wordpressBookings.length,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Find the booking with the matching ID
    const booking = wordpressBookings.find(b => 
      String(b.id) === bookingId || 
      String(b.booking_id) === bookingId
    );
    
    if (!booking) {
      return NextResponse.json({ 
        error: `Booking with ID ${bookingId} not found` 
      }, { status: 404 });
    }
    
    // Return the full booking JSON with metadata
    return NextResponse.json({
      booking,
      meta: {
        method: "Direct booking fetch",
        requestedId: bookingId,
        foundId: booking.id || booking.booking_id,
        matchType: String(booking.id) === bookingId ? "id" : "booking_id"
      }
    });
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : `Failed to fetch booking ${bookingId}` 
    }, { status: 500 });
  }
}

// Helper function to extract billing data from a WordPress booking
// This checks multiple possible locations and formats
function extractBillingData(booking: ExtendedBooking) {
  const result = {
    company: '',
    taxNumber: '',
    streetName: '',
    streetNumber: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    source: 'none',
    couponCode: '',
    couponDiscountPercentage: '',
    hasBillingData: false
  };
  
  // FIRST check for CHBS specific fields (chauffeur booking system format)
  const b = booking as any; // For accessing non-standard fields
  
  // Check if billing is enabled in CHBS
  if (b.chbs_client_billing_detail_enable === "1") {
    result.hasBillingData = true;
    result.company = b.chbs_client_billing_detail_company_name || '';
    result.taxNumber = b.chbs_client_billing_detail_tax_number || '';
    result.streetName = b.chbs_client_billing_detail_street_name || '';
    result.streetNumber = b.chbs_client_billing_detail_street_number || '';
    result.city = b.chbs_client_billing_detail_city || '';
    result.state = b.chbs_client_billing_detail_state || '';
    result.postalCode = b.chbs_client_billing_detail_postal_code || '';
    result.country = b.chbs_client_billing_detail_country_code || '';
    result.source = 'chbs';
    
    // Check for coupon data
    result.couponCode = b.chbs_coupon_code || '';
    result.couponDiscountPercentage = b.chbs_coupon_discount_percentage || '';
    
    return result;
  }
  
  // Check standard fields in our schema
  if (booking.billing_company_name) {
    result.company = booking.billing_company_name;
    result.taxNumber = booking.billing_tax_number || '';
    result.streetName = booking.billing_street_name || '';
    result.streetNumber = booking.billing_street_number || '';
    result.city = booking.billing_city || '';
    result.state = booking.billing_state || '';
    result.postalCode = booking.billing_postal_code || '';
    result.country = booking.billing_country || '';
    result.source = 'standard';
    result.hasBillingData = true;
    return result;
  }
  
  // Check WooCommerce standard fields
  if (b.billing_first_name || b.billing_address_1) {
    result.firstName = b.billing_first_name || '';
    result.lastName = b.billing_last_name || '';
    result.company = b.billing_company || '';
    result.email = b.billing_email || '';
    result.phone = b.billing_phone || '';
    result.address1 = b.billing_address_1 || '';
    result.address2 = b.billing_address_2 || '';
    result.city = b.billing_city || '';
    result.state = b.billing_state || '';
    result.postalCode = b.billing_postcode || b.billing_postal_code || '';
    result.country = b.billing_country || '';
    result.source = 'woocommerce';
    result.hasBillingData = true;
    return result;
  }
  
  // Check meta fields
  if (booking.meta) {
    const metaFields = Object.keys(booking.meta).filter(key => 
      key.toLowerCase().includes('billing') || 
      key.toLowerCase().includes('coupon')
    );
    
    if (metaFields.length > 0) {
      // Try to extract billing info from meta fields
      metaFields.forEach(field => {
        const value = booking.meta?.[field];
        if (!value) return;
        
        const lowerField = field.toLowerCase();
        
        // Check for chbs fields in meta
        if (lowerField.includes('chbs_client_billing_detail_enable') && value === "1") {
          result.hasBillingData = true;
        }
        if (lowerField.includes('chbs_client_billing_detail_company_name')) result.company = String(value);
        if (lowerField.includes('chbs_client_billing_detail_tax_number')) result.taxNumber = String(value);
        if (lowerField.includes('chbs_client_billing_detail_street_name')) result.streetName = String(value);
        if (lowerField.includes('chbs_client_billing_detail_street_number')) result.streetNumber = String(value);
        if (lowerField.includes('chbs_client_billing_detail_city')) result.city = String(value);
        if (lowerField.includes('chbs_client_billing_detail_state')) result.state = String(value);
        if (lowerField.includes('chbs_client_billing_detail_postal_code')) result.postalCode = String(value);
        if (lowerField.includes('chbs_client_billing_detail_country_code')) result.country = String(value);
        if (lowerField.includes('chbs_coupon_code')) result.couponCode = String(value);
        if (lowerField.includes('chbs_coupon_discount_percentage')) result.couponDiscountPercentage = String(value);
        
        // Check for standard billing fields in meta
        if (lowerField.includes('company')) result.company = String(value);
        if (lowerField.includes('tax') || lowerField.includes('vat')) result.taxNumber = String(value);
        if (lowerField.includes('street') || lowerField.includes('address1')) result.address1 = String(value);
        if (lowerField.includes('address2')) result.address2 = String(value);
        if (lowerField.includes('city')) result.city = String(value);
        if (lowerField.includes('state') || lowerField.includes('province')) result.state = String(value);
        if (lowerField.includes('zip') || lowerField.includes('postal')) result.postalCode = String(value);
        if (lowerField.includes('country')) result.country = String(value);
        if (lowerField.includes('first')) result.firstName = String(value);
        if (lowerField.includes('last')) result.lastName = String(value);
        if (lowerField.includes('email')) result.email = String(value);
        if (lowerField.includes('phone')) result.phone = String(value);
      });
      
      if (result.company || result.address1 || result.city) {
        result.hasBillingData = true;
      }
      
      result.source = 'meta';
      return result;
    }
  }
  
  // Check wp_meta fields if they exist
  if (booking.wp_meta) {
    const wpMetaFields = Object.keys(booking.wp_meta).filter(key => 
      key.toLowerCase().includes('billing') || 
      key.toLowerCase().includes('coupon')
    );
    
    if (wpMetaFields.length > 0) {
      // Try to extract billing info from wp_meta fields
      wpMetaFields.forEach(field => {
        const value = booking.wp_meta?.[field];
        if (!value) return;
        
        const lowerField = field.toLowerCase();
        
        // Check for chbs fields in wp_meta
        if (lowerField.includes('chbs_client_billing_detail_enable') && value === "1") {
          result.hasBillingData = true;
        }
        if (lowerField.includes('chbs_client_billing_detail_company_name')) result.company = String(value);
        if (lowerField.includes('chbs_client_billing_detail_tax_number')) result.taxNumber = String(value);
        if (lowerField.includes('chbs_client_billing_detail_street_name')) result.streetName = String(value);
        if (lowerField.includes('chbs_client_billing_detail_street_number')) result.streetNumber = String(value);
        if (lowerField.includes('chbs_client_billing_detail_city')) result.city = String(value);
        if (lowerField.includes('chbs_client_billing_detail_state')) result.state = String(value);
        if (lowerField.includes('chbs_client_billing_detail_postal_code')) result.postalCode = String(value);
        if (lowerField.includes('chbs_client_billing_detail_country_code')) result.country = String(value);
        if (lowerField.includes('chbs_coupon_code')) result.couponCode = String(value);
        if (lowerField.includes('chbs_coupon_discount_percentage')) result.couponDiscountPercentage = String(value);
        
        // Check for standard fields in wp_meta
        if (lowerField.includes('company')) result.company = String(value);
        if (lowerField.includes('tax') || lowerField.includes('vat')) result.taxNumber = String(value);
        if (lowerField.includes('street') || lowerField.includes('address1')) result.address1 = String(value);
        if (lowerField.includes('address2')) result.address2 = String(value);
        if (lowerField.includes('city')) result.city = String(value);
        if (lowerField.includes('state') || lowerField.includes('province')) result.state = String(value);
        if (lowerField.includes('zip') || lowerField.includes('postal')) result.postalCode = String(value);
        if (lowerField.includes('country')) result.country = String(value);
        if (lowerField.includes('first')) result.firstName = String(value);
        if (lowerField.includes('last')) result.lastName = String(value);
        if (lowerField.includes('email')) result.email = String(value);
        if (lowerField.includes('phone')) result.phone = String(value);
      });
      
      if (result.company || result.address1 || result.city) {
        result.hasBillingData = true;
      }
      
      result.source = 'wp_meta';
      return result;
    }
  }
  
  return result;
} 