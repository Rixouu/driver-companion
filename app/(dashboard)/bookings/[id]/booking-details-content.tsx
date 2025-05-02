'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, CreditCard, FileText, Link as LinkIcon, MapPin, Printer, Truck, User, Mail, Phone, Navigation, FileX, ShieldAlert, ShieldCheck, CloudSun } from 'lucide-react'
import Script from 'next/script'
import { PrintButton } from '@/components/bookings/print-button'
import { DriverActionsDropdown } from '@/components/bookings/driver-actions-dropdown'
import { ContactButtons } from '@/components/bookings/contact-buttons'
import { BookingActions } from '@/components/bookings/booking-actions'
import { WeatherForecast } from '@/components/bookings/weather-forecast'
import { useI18n } from '@/lib/i18n/context'
import { Booking } from '@/types/bookings'
import { PageHeader } from '@/components/ui/page-header'
import { BookingInspections } from "@/components/bookings/booking-inspections"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BookingAssignment from '@/components/bookings/booking-assignment'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

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

export default function BookingDetailsContent({
  booking,
  bookingId
}: {
  booking: Booking;
  bookingId: string;
}) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('details')
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // Fetch dispatch status on component mount
  useEffect(() => {
    async function fetchDispatchStatus() {
      const { data, error } = await supabase
        .from('dispatch_entries')
        .select('status')
        .eq('booking_id', booking.id || booking.booking_id || bookingId)
        .single()
      
      if (!error && data) {
        setDispatchStatus(data.status)
      }
    }
    
    fetchDispatchStatus()
  }, [booking, bookingId, supabase])
  
  const getStatusBadge = (status: string) => {
    // First check dispatch status
    if (dispatchStatus) {
      switch (dispatchStatus.toLowerCase()) {
        case 'assigned':
          return <Badge className="bg-green-600 text-white">{t('dispatch.status.assigned')}</Badge>;
        case 'in_transit':
          return <Badge className="bg-blue-600 text-white">{t('dispatch.status.in_transit')}</Badge>;
        case 'completed':
          return <Badge className="bg-purple-600 text-white">{t('dispatch.status.completed')}</Badge>;
        case 'cancelled':
          return <Badge className="bg-red-600 text-white">{t('dispatch.status.cancelled')}</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-600 text-white">{t('dispatch.status.pending')}</Badge>;
      }
    }
    
    // Fall back to booking status
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-600 text-white">{t('bookings.details.status.confirmed')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">{t('bookings.details.status.pending')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-600 text-white">{t('bookings.details.status.cancelled')}</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600 text-white">{t('bookings.details.status.completed')}</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };
  
  const handleAssignmentComplete = () => {
    // Refetch dispatch status after assignment is complete
    const fetchDispatchStatus = async () => {
      const { data, error } = await supabase
        .from('dispatch_entries')
        .select('status')
        .eq('booking_id', booking.id || booking.booking_id || bookingId)
        .single()
      
      if (!error && data) {
        setDispatchStatus(data.status)
      }
    }
    
    fetchDispatchStatus()
    // Switch back to details tab
    setActiveTab('details')
  }
  
  return (
    <div className="space-y-6" id="booking-details-content">
      <Link
        href="/bookings"
        className="flex items-center text-blue-500 hover:text-blue-400 mb-6" >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('bookings.details.backToBookings')}
      </Link>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('bookings.details.bookingNumber', { id: booking.id || booking.booking_id })}</h1>
          <p className="text-muted-foreground">
            {t('bookings.details.createdOn', { date: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A' })}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0 items-center">
          {getStatusBadge(booking.status)}
          <PrintButton booking={booking} />
          <DriverActionsDropdown booking={booking} />
        </div>
      </div>
      
      {/* Assignment Card - Now containing Booking Details inside */}
      <Card className="mb-6">
        <div className="p-6">
          <BookingAssignment booking={booking} onAssignmentComplete={handleAssignmentComplete} />
        </div>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="details">{t('bookings.details.sections.additionalInfo') || 'Additional Info'}</TabsTrigger>
          <TabsTrigger value="route">{t('bookings.details.sections.route')}</TabsTrigger>
          <TabsTrigger value="client">{t('bookings.details.sections.client')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Payment Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.payment')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.status')}</h3>
                  <p className="mt-1">{booking.payment_status || 'Pending'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.amount')}</h3>
                  <p className="mt-1 font-semibold">
                    {booking.price ? 
                      (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                      'THB 8,200'
                    }
                  </p>
                </div>
                
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.paymentLink')}</h3>
                  {booking.payment_link ? (
                    <a 
                      href={booking.payment_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-2 inline-flex items-center text-blue-500 hover:text-blue-600"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      {t('bookings.details.actions.openPaymentLink')}
                    </a>
                  ) : (
                    <p className="text-muted-foreground mt-1">
                      {t('bookings.details.noPaymentLink')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Vehicle Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.vehicle')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.vehicle')}</h3>
                  <p className="mt-1">
                    {booking.vehicle?.make ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Toyota Hiace Grand Cabin'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.capacity')}</h3>
                  <p className="mt-1">10 passengers</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.serviceType')}</h3>
                  <p className="mt-1">Airport Transfer</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Notes Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.notes')}
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-sm">
                {booking.notes || t('bookings.details.noNotes')}
              </p>
            </div>
          </Card>
          
          {/* Weather Forecast Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <CloudSun className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.weather')}
              </h2>
            </div>
            
            <div className="p-6">
              <WeatherForecast 
                date={booking.date || ""} 
                location={booking.pickup_location || ""}
              />
            </div>
          </Card>
          
          {/* Inspections Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                {(booking as any).inspections && (booking as any).inspections.length > 0 
                  ? <ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> 
                  : <ShieldAlert className="mr-2 h-5 w-5 text-amber-500" />
                }
                {t('bookings.details.sections.inspections')}
              </h2>
            </div>
            
            <div className="p-6">
              <BookingInspections 
                bookingId={booking.id || booking.booking_id || bookingId} 
                vehicleId={booking.vehicle?.id || ""}
              />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="route" className="space-y-6">
          {/* Route Information */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Navigation className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.routeInfo')}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupLocation')}</h3>
                  <p className="mt-1 flex items-center">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.pickup_location}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.dropoffLocation')}</h3>
                  <p className="mt-1 flex items-center">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.dropoff_location}
                  </p>
                </div>
              </div>
              
              {booking.pickup_location && booking.dropoff_location && (
                <GoogleMap 
                  pickupLocation={booking.pickup_location}
                  dropoffLocation={booking.dropoff_location}
                />
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="client" className="space-y-6">
          {/* Client Information */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.clientInfo')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/4 flex justify-center">
                  {(booking.customer as any)?.avatar ? (
                    <img 
                      src={(booking.customer as any).avatar} 
                      alt={booking.customer?.name || 'Client'} 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarInitials name={booking.customer?.name || booking.customer_name || 'Unknown'} />
                  )}
                </div>
                
                <div className="md:w-3/4 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{booking.customer?.name || booking.customer_name || 'Unknown'}</h3>
                    <p className="text-muted-foreground">
                      {(booking.customer as any)?.company || (booking as any).customer_company || t('bookings.details.individualBooking')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(booking.customer?.email || booking.customer_email) && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.customer?.email || booking.customer_email}</span>
                      </div>
                    )}
                    
                    {(booking.customer?.phone || booking.customer_phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.customer?.phone || booking.customer_phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <ContactButtons 
                    phoneNumber={booking.customer?.phone || booking.customer_phone || ""}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 