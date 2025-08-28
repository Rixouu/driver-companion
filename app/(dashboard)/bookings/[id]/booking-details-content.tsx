'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, CreditCard, FileText, Link as LinkIcon, MapPin, Printer, Truck, User, Mail, Phone, Navigation, FileX, ShieldAlert, ShieldCheck, CloudSun } from 'lucide-react'
import { DriverActionsDropdown } from '@/components/bookings/driver-actions-dropdown'
import { ContactButtons } from '@/components/bookings/contact-buttons'
import BookingActions from '@/components/bookings/booking-actions'
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider'
import { WeatherForecast } from '@/components/bookings/weather-forecast'
import { useI18n } from '@/lib/i18n/context'
import { Booking } from '@/types/bookings'
import { PageHeader } from '@/components/ui/page-header'
import { BookingInspections } from "@/components/bookings/booking-inspections"
import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import Image from 'next/image'

// Avatar component for client display
function AvatarInitials({ name }: { name: string }) {
  const getInitials = (name: string) => {
    // Check if name is undefined, null, or empty
    if (!name || typeof name !== 'string') {
      return 'U'; // Return 'U' for unknown if no valid name
    }
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const initials = getInitials(name);
  
  return (
    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-semibold">
      {initials}
    </div>
  );
}

// Google Maps Component
function GoogleMap({ pickupLocation, dropoffLocation }: { pickupLocation: string, dropoffLocation: string }) {
  return (
    <div className="relative w-full h-[300px] rounded overflow-hidden">
        <iframe 
          width="100%" 
          height="100%" 
          style={{border: 0}}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(dropoffLocation)}&mode=driving`}
        />
        <div className="absolute bottom-3 left-3 z-10">
          <a 
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(dropoffLocation)}&travelmode=driving`} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white text-black py-2 px-3 rounded shadow-md hover:bg-gray-100"
          >
            View larger map
          </a>
        </div>
      </div>
  );
}

export default function BookingDetailsContent({
  booking,
  bookingId
}: {
  booking: Booking;
  bookingId: string;
}) {
  const { t } = useI18n()
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Booking object complete:', booking)
  }
  
  // Function to fetch and display raw booking data from debug endpoint
  const fetchDebugData = async () => {
    try {
      const id = booking.id || booking.booking_id || bookingId
      const response = await fetch(`/api/bookings/debug/${id}`)
      
      if (!response.ok) {
        console.error('Error fetching debug data:', await response.text())
        return
      }
      
      const data = await response.json()
      console.log('DEBUG - Raw booking data:', data.raw)
      console.log('DEBUG - Mapped booking data:', data.mapped)
    } catch (error) {
      console.error('Error in debug function:', error)
    }
  }
  
  // Function to fetch debug data from our SQL debug endpoint
  const fetchSqlDebugData = async () => {
    try {
      const id = booking.id || booking.booking_id || bookingId
      const response = await fetch(`/api/bookings/sql-debug/${id}`)
      
      if (!response.ok) {
        console.error('Error fetching SQL debug data:', await response.text())
        return
      }
      
      const data = await response.json()
      console.log('SQL DEBUG - Raw booking data:', data)
      console.log('SQL DEBUG - Fields of interest:', data.fields_of_interest)
      
      // Show alert with key data
      alert(
        `SQL Debug Results:\n\n` +
        `Coupon Code: ${data.fields_of_interest?.coupon_code || 'NULL'}\n` +
        `Coupon Discount: ${data.fields_of_interest?.coupon_discount_percentage || 'NULL'}\n` +
        `Company Name: ${data.fields_of_interest?.billing_company_name || 'NULL'}\n` +
        `Tax Number: ${data.fields_of_interest?.billing_tax_number || 'NULL'}\n` +
        `See console for full data`
      )
    } catch (error) {
      console.error('Error in SQL debug function:', error)
      alert('Error in SQL debug function: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
  
  // Fetch dispatch status on component mount
  const fetchDispatchStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from('dispatch_entries')
      .select('status')
      .eq('booking_id', booking.id || booking.booking_id || bookingId)
      .order('updated_at', { ascending: false }) // Get most recent status
      .maybeSingle()
    
    if (!error && data) {
      console.log('Dispatch status fetched:', data.status);
      setDispatchStatus(data.status);
    } else if (error) {
      console.error('Error fetching dispatch status:', error);
    }
  }, [booking.id, booking.booking_id, bookingId, supabase]);
  
  useEffect(() => {
    fetchDispatchStatus();
    
    // Poll for dispatch status updates every 30 seconds
    const intervalId = setInterval(fetchDispatchStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchDispatchStatus]);
  
  const getStatusBadge = (status: string) => {
    // First check dispatch status
    if (dispatchStatus) {
      switch (dispatchStatus.toLowerCase()) {
        case 'assigned':
          return <Badge className="bg-green-600 text-white font-medium">{t('dispatch.status.assigned')}</Badge>;
        case 'en_route':
          return <Badge className="bg-purple-600 text-white font-medium">{t('dispatch.status.en_route')}</Badge>;
        case 'completed':
          return <Badge className="bg-blue-600 text-white font-medium">{t('dispatch.status.completed')}</Badge>;
        case 'cancelled':
          return <Badge className="bg-red-600 text-white font-medium">{t('dispatch.status.cancelled')}</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-600 text-white font-medium">{t('dispatch.status.pending')}</Badge>;
        case 'confirmed':
          return <Badge className="bg-green-600 text-white font-medium">{t('dispatch.status.confirmed')}</Badge>;
      }
    }
    
    // Fall back to booking status
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-600 text-white font-medium">{t('bookings.details.status.confirmed')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white font-medium">{t('bookings.details.status.pending')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600 text-white font-medium">{t('bookings.details.status.cancelled')}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600 text-white font-medium">{t('bookings.details.status.completed')}</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white font-medium">{status}</Badge>;
    }
  };
  
  return (
    <GoogleMapsProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
      libraries={['places']}
    >
      <div className="space-y-6" id="booking-details-content">
      {/* Header with Booking Number and Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">{t('bookings.details.bookingNumber', { id: booking.id || booking.booking_id })}</h1>
          <p className="text-muted-foreground">
            {t('bookings.details.createdOn', { date: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A' })}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0 items-center">
          {getStatusBadge(booking.status)}
          {dispatchStatus && dispatchStatus !== booking.status && (
            <Badge className="bg-purple-600 text-white font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse"></span>
              {t(`dispatch.status.${dispatchStatus}`)}
            </Badge>
          )}
          <DriverActionsDropdown booking={booking} />
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button variant="outline" size="sm" onClick={fetchDebugData}>Debug</Button>
              <Button variant="outline" size="sm" onClick={fetchSqlDebugData} className="ml-2 bg-blue-50">SQL Debug</Button>
            </>
          )}
        </div>
      </div>
      
      {/* Booking Actions at the top */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <BookingActions 
            booking={booking} 
            bookingId={booking.id || booking.booking_id || bookingId}
            status={booking.status || 'pending'}
            date={booking.date || ''}
            time={booking.time || ''}
          />
        </CardContent>
      </Card>
      
      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Driver Booking Information */}
        <div className="space-y-6">
          
          {/* Booking Summary & Additional Information (Merged) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Booking Summary & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.serviceType')}</h3>
                    <p className="mt-1 font-medium">
                      {/* Get service_type_name from the first quotation item */}
                      {booking.meta?.quotation_items?.[0]?.service_type_name || 'Airport Transfer'}
                    </p>
                  {/* Show multi-service information if this is part of a multi-service booking */}
                  {booking.meta?.is_multi_service_booking && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Service {booking.meta.service_index + 1} of {booking.meta.total_services} from quotation
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupDate')}</h3>
                  <p className="mt-1 flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.date ? new Date(booking.date).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupTime')}</h3>
                  <p className="mt-1 flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.time || 'Not specified'}
                  </p>
                </div>
                
                {booking.vehicle && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.vehicle')}</h3>
                    <p className="mt-1 flex items-center">
                      <Truck className="mr-1 h-4 w-4 text-muted-foreground" />
                      {/* Use vehicle_type from meta (which comes directly from quotations table) */}
                      {booking.meta?.vehicle_type || 'Toyota Hiace Grand Cabin'}
                    </p>
                  </div>
                )}
                
                {/* Vehicle Details from Quotation */}
                {booking.meta?.vehicle_category && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.vehicleCategory')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.meta.vehicle_category}
                    </p>
                  </div>
                )}
                
                {booking.meta?.hours_per_day && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.hoursPerDay')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.meta.hours_per_day} hour(s)
                    </p>
                  </div>
                )}
                
                {booking.meta?.duration_hours && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.durationHours')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.meta.duration_hours} hour(s)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Multi-service booking notice */}
              {booking.meta?.is_multi_service_booking && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Multi-Service Booking:</strong> This booking is part of a quotation with {booking.meta.total_services} services. 
                    Please review and edit pickup/dropoff locations as needed for this specific service.
                  </p>
                </div>
              )}
              
              {/* Additional Information Section */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Flight Number and Terminal if available */}
                  {(() => {
                    let flightNumber = 'N/A';
                    let terminal = 'N/A';
                    
                    // Try to extract flight number and terminal from meta data
                    if (booking?.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
                      const flightField = booking.meta.chbs_form_element_field.find(
                        (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
                      );
                      if (flightField?.value) flightNumber = flightField.value;
                      
                      const terminalField = booking.meta.chbs_form_element_field.find(
                        (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
                      );
                      if (terminalField?.value) terminal = terminalField.value;
                    }
                    
                    flightNumber = flightNumber || booking?.meta?.chbs_flight_number || 'N/A';
                    terminal = terminal || booking?.meta?.chbs_terminal || 'N/A';
                    
                    return (
                      <>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.flightNumber') || 'Flight Number'}</h4>
                          <p className="mt-1 text-sm">{flightNumber}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.terminal') || 'Terminal'}</h4>
                          <p className="mt-1 text-sm">{terminal}</p>
                        </div>
                      </>
                    );
                  })()}
                  
                  {/* Notes/Comments */}
                  {booking.notes && (
                    <div className="col-span-2">
                      <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.comment') || 'Comments'}</h4>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Weather Forecast */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-3">
                  <CloudSun className="mr-2 h-4 w-4" />
                  {t('bookings.details.weather.title')}
                </h3>
                <WeatherForecast 
                  date={booking.date || ""} 
                  location={booking.pickup_location || ""}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Navigation className="mr-2 h-5 w-5" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupLocation')}</h3>
                  <p className="mt-1 flex items-center">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.pickup_location || 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.dropoffLocation')}</h3>
                  <p className="mt-1 flex items-center">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.dropoff_location || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {/* Message about editing locations for converted quotations */}
              {booking.meta?.quotation_id && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Location Update Required:</strong> This booking was converted from a quotation. 
                    Please edit the pickup and dropoff locations to match the specific requirements for this service.
                  </p>
                </div>
              )}
              
              {booking.pickup_location && booking.dropoff_location && (
                <GoogleMap 
                  pickupLocation={booking.pickup_location}
                  dropoffLocation={booking.dropoff_location}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Inspections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {(booking as any).inspections && (booking as any).inspections.length > 0 
                  ? <ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> 
                  : <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                }
                Vehicle Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingInspections 
                bookingId={booking.id || booking.booking_id || bookingId} 
                vehicleId={booking.vehicle?.id || ""}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Client Booking Details */}
        <div className="space-y-6">
          
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {(booking.customer as any)?.avatar ? (
                  <Image 
                    src={(booking.customer as any).avatar} 
                    alt={booking.customer?.name || 'Client'} 
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <AvatarInitials name={booking.customer?.name || booking.customer_name || 'Unknown'} />
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{booking.customer?.name || booking.customer_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">
                    {(booking.customer as any)?.company || (booking as any).customer_company || 'Individual Customer'}
                  </p>
                </div>
                
                <div className="w-full space-y-2 mt-2">
                  {(booking.customer?.email || booking.customer_email) && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.customer?.email || booking.customer_email}</span>
                    </div>
                  )}
                  
                  {(booking.customer?.phone || booking.customer_phone) && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.customer?.phone || booking.customer_phone}</span>
                    </div>
                  )}
                </div>
                
                <ContactButtons 
                  phoneNumber={booking.customer?.phone || booking.customer_phone || ""}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Payment & Billing Information (Combined) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.amount')}</h4>
                    <p className="mt-1 font-semibold">
                      {booking.price ? 
                        (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                        'THB 8,200'
                      }
                    </p>
                    {/* Show multi-service information in payment section */}
                    {booking.meta?.is_multi_service_booking && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Price for {booking.meta.total_services} services from quotation
                      </p>
                    )}
                  </div>
                  
                  {/* Coupon Code Section */}
                  {(booking?.coupon_code || booking?.coupon_discount_percentage) && (
                    <>
                      {booking?.coupon_code && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.couponCode') || 'Coupon Code'}</h4>
                          <p className="mt-1 font-medium">{booking.coupon_code}</p>
                        </div>
                      )}
                      {booking?.coupon_discount_percentage && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.discount') || 'Discount'}</h4>
                          <p className="mt-1 font-medium">{booking.coupon_discount_percentage}%</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Link to original quotation if converted */}
                  {booking.meta?.quotation_id && (
                    <div className="col-span-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Original Quotation</h4>
                      <Link 
                        href={`/quotations/${booking.meta.quotation_id}`}
                        className="mt-2 inline-flex items-center text-blue-500 hover:text-blue-600"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Original Quotation
                      </Link>
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <h4 className="text-xs font-medium text-muted-foreground">{t('bookings.details.fields.paymentLink')}</h4>
                    {/* Removed payment link section as requested */}
                  </div>
                </div>
              </div>
              
              {/* Billing Address - Only if billing data exists */}
              {/* Removed Billing Address section as requested */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      </GoogleMapsProvider>
  );
} 