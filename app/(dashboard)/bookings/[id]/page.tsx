import { Metadata } from 'next'
import { getBookingById } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, CreditCard, Edit, FileText, Link as LinkIcon, MapPin, Printer, Truck, User, X, Mail, Phone } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { PrintButton } from '@/components/bookings/print-button'

export const metadata: Metadata = {
  title: 'Booking Details',
  description: 'View booking details',
}

function BookingNotFound({ bookingId }: { bookingId: string }) {
  return (
    <div className="border rounded-lg p-8 shadow">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Booking Not Found</h1>
      <p className="text-muted-foreground mb-4">
        We couldn't find booking #{bookingId}. It might have been deleted or the ID is incorrect.
      </p>
      
      <div className="mt-6">
        <Link href="/bookings">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Bookings
          </Button>
        </Link>
      </div>
    </div>
  );
}

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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
      />
      
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
    </>
  );
}

export default async function BookingPage({ params }: { params: { id: string } }) {
  const { booking } = await getBookingById(params.id);
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-600 text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600 text-white">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600 text-white">Completed</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };
  
  if (!booking) {
    return <BookingNotFound bookingId={params.id} />;
  }
  
  return (
    <div className="space-y-6">
      <Link 
        href="/bookings" 
        className="flex items-center text-blue-500 hover:text-blue-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Bookings
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Booking #{booking.id || booking.booking_id}</h1>
          <p className="text-muted-foreground">
            Created on {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          {getStatusBadge(booking.status)}
          <PrintButton />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary Section with Vehicle Information */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Booking Summary
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Booking ID</h3>
                  <p className="mt-1">#{booking.id || booking.booking_id || '25346'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Total</h3>
                  <p className="mt-1 font-semibold">
                    {booking.price ? 
                      (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                      'THB 8,200'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Pickup Date</h3>
                  <p className="mt-1 flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.date || '2025-04-30'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Method</h3>
                  <p className="mt-1 flex items-center">
                    <CreditCard className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.payment_method || 'IPPS Payment'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Pickup Time</h3>
                  <p className="mt-1 flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.time || '06:30'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                  <p className="mt-1 text-yellow-500">
                    {booking.payment_status || 'Pending'}
                  </p>
                </div>
              </div>
              
              {/* Vehicle Information Section */}
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Truck className="mr-2 h-5 w-5" />
                  Vehicle Information
                </h2>
                
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Vehicle</h3>
                    <p className="mt-1">
                      {booking.vehicle?.make ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Toyota Hiace Grand Cabin'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                    <p className="mt-1">10 passengers</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Vehicle ID</h3>
                    <p className="mt-1">#{booking.vehicle?.id || '25139'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Service Type</h3>
                    <p className="mt-1">Airport Transfer</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Route Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Route Information
              </h2>
            </div>
            
            <div className="p-6">
              {booking.pickup_location || booking.dropoff_location ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Pickup Location</h3>
                      <p className="text-muted-foreground mt-1">{booking.pickup_location || 'Suvarnabhumi Airport, Bangkok'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Dropoff Location</h3>
                      <p className="text-muted-foreground mt-1">{booking.dropoff_location || 'The Sukhothai Bangkok, South Sathorn Road'}</p>
                    </div>
                  </div>
                  
                  {booking.pickup_location && booking.dropoff_location && (
                    <div className="mt-6">
                      <GoogleMap
                        pickupLocation={booking.pickup_location}
                        dropoffLocation={booking.dropoff_location}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No route information available</p>
              )}
              
              {/* Add distance and duration */}
              {(booking.distance || booking.duration) && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  {booking.distance && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Distance</h3>
                      <p className="mt-1">{booking.distance} km</p>
                    </div>
                  )}
                  
                  {booking.duration && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                      <p className="mt-1">{booking.duration} min</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Right Column: Client Details, Payment Link, etc. */}
        <div className="space-y-6">
          {/* Client Details Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                Client Details
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 mb-4">
                <AvatarInitials name={booking.customer_name || 'Aroon Muangkaew'} />
                
                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-lg">{booking.customer_name || 'Aroon Muangkaew'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer since {
                      // @ts-ignore - Property may not exist in the type definition but could be in the data
                      booking.customer_since || 
                      (booking.created_at ? 
                        new Date(booking.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                        'January 2023')
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="mt-1 flex items-center">
                    <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.customer_email || 'aroon.m@example.com'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p className="mt-1 flex items-center">
                    <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.customer_phone || '+66 98 765 4321'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Additional Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Additional Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Flight Number</h3>
                  <p className="mt-1">
                    {(() => {
                      // Check if form element fields exist and is an array
                      if (booking.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
                        // Find flight number field
                        const flightField = booking.meta.chbs_form_element_field.find(
                          (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
                        );
                        if (flightField?.value) return flightField.value;
                      }
                      return booking.meta?.chbs_flight_number || 'Not provided';
                    })()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Terminal</h3>
                  <p className="mt-1">
                    {(() => {
                      // Check if form element fields exist and is an array
                      if (booking.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
                        // Find terminal field
                        const terminalField = booking.meta.chbs_form_element_field.find(
                          (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
                        );
                        if (terminalField?.value) return terminalField.value;
                      }
                      return booking.meta?.chbs_terminal || 'Not provided';
                    })()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Comment</h3>
                  <p className="mt-1 whitespace-pre-wrap">
                    {booking.notes || booking.meta?.chbs_comment || 'No comments provided'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Payment Link Section - Added */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Link
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1">{booking.payment_status || 'Pending'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Payment Link</h3>
                  {booking.payment_link ? (
                    <a 
                      href={booking.payment_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-2 inline-flex items-center text-blue-500 hover:text-blue-600"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Open Payment Link
                    </a>
                  ) : (
                    <p className="mt-1 text-muted-foreground">No payment link available</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                  <p className="mt-1 font-semibold">
                    {booking.price ? 
                      (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                      'THB 8,200'
                    }
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Additional Actions */}
          <div className="space-y-3">
            <Button className="w-full" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Booking
            </Button>
            
            <Button className="w-full" variant="destructive">
              <X className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 