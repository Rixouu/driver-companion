'use client'

import { Metadata } from 'next'
import { getBookingById } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CreditCard, Edit, FileText, Link as LinkIcon, MapPin, User, X, Mail, Phone, Navigation, CloudSun, CalendarPlus, FileX, Loader2, ArrowLeft, Truck } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { DriverActionsDropdown } from '@/components/bookings/driver-actions-dropdown'
import { ContactButtons } from '@/components/bookings/contact-buttons'
import { BookingActions } from '@/components/bookings/booking-actions'
import { PageHeader } from '@/components/ui/page-header'
import { WeatherForecast } from '@/components/bookings/weather-forecast'
import { useI18n } from '@/lib/i18n/context'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuotationMessageContainer } from '@/components/quotations/quotation-containers'
import { getStatusBadgeClasses, getPaymentStatusBadgeClasses } from '@/lib/utils/styles'

function BookingNotFound({ bookingId }: { bookingId: string }) {
  const { t } = useI18n()
  return (
    <div className="border rounded-lg p-8 shadow">
      <h1 className="text-2xl font-bold text-red-500 mb-4">{t('bookings.details.notFound')}</h1>
      <p className="text-muted-foreground mb-4">
        {t('bookings.details.notFoundDescription')}
      </p>
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

// Convert to client component with loading state
export default function BookingPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to calculate original price from final price and discount percentage
  const calculateOriginalPrice = (finalAmount?: string | number, discountPercentage?: string | number) => {
    if (!finalAmount || !discountPercentage) return 'N/A';
    
    const finalPrice = typeof finalAmount === 'string' ? parseFloat(finalAmount.replace(/[^0-9.]/g, '')) : finalAmount;
    const discount = typeof discountPercentage === 'string' ? parseFloat(discountPercentage) : discountPercentage;
    
    if (isNaN(finalPrice) || isNaN(discount) || discount <= 0 || discount >= 100) {
      return 'THB ' + finalPrice;
    }
    
    const originalPrice = Math.round(finalPrice / (1 - discount/100));
    return `THB ${originalPrice.toLocaleString()}`;
  };

  useEffect(() => {
    async function fetchBookingData() {
      try {
        setLoading(true)
        const result = await getBookingById(id)
        
        if (result.booking) {
          setBooking(result.booking)
        } else {
          setError('Booking not found')
        }
      } catch (err) {
        console.error("Error fetching booking:", err)
        setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [id])

  const handleAssignmentComplete = () => {
    // Reload the booking data after assignment is completed
    router.refresh();
    fetchBookingData();
  }

  const fetchBookingData = async () => {
    try {
      const result = await getBookingById(id)
      
      if (result.booking) {
        setBooking(result.booking)
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking')
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={t('bookings.details.notFound')}
            description={t('bookings.details.notFoundDescription')}
          />
        </div>
        <Card className="min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <FileX className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('bookings.details.notFound')}</h3>
            <p className="text-muted-foreground">
              {t('bookings.details.notFoundDescription')}
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  const getStatusBadge = (status: string) => {
    const statusKey = status?.toLowerCase() || 'unknown'
    const statusText = t(`bookings.details.status.${statusKey}`, {
      defaultValue: statusKey.charAt(0).toUpperCase() + statusKey.slice(1),
    })
    return (
      <Badge className={getStatusBadgeClasses(status)}>
        {statusText}
      </Badge>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('bookings.details.bookingNumber', { id: booking.id || booking.booking_id || id })}</h1>
          <p className="text-muted-foreground">
            {t('bookings.details.createdOn', { date: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A' })}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          {getStatusBadge(booking.status)}
          <DriverActionsDropdown booking={booking} />
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
                {t('bookings.details.sections.summary')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.bookingId')}</h3>
                  <p className="mt-1">#{booking.id || booking.booking_id || '25346'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.orderTotal')}</h3>
                  <p className="mt-1 font-semibold">
                    {booking.price ? 
                      (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                      'THB 8,200'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupDate')}</h3>
                  <p className="mt-1 flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.date || '2025-04-30'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.paymentMethod')}</h3>
                  <p className="mt-1 flex items-center">
                    <CreditCard className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.payment_method || 'IPPS Payment'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupTime')}</h3>
                  <p className="mt-1 flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.time || '06:30'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.paymentStatus')}</h3>
                  <p className="mt-1 text-yellow-500">
                    <Badge className={getPaymentStatusBadgeClasses(booking.payment_status || 'Pending')}>
                      {booking.payment_status || 'Pending'}
                    </Badge>
                  </p>
                </div>
              </div>
              
              {/* Vehicle Information Section */}
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Truck className="mr-2 h-5 w-5" />
                  {t('bookings.details.sections.vehicle')}
                </h2>
                
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
            </div>
          </Card>
          
          {/* Route Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.route')}
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
                      <h3 className="font-medium">{t('bookings.details.fields.pickupLocation')}</h3>
                      <p className="text-muted-foreground mt-1">{booking.pickup_location || 'Suvarnabhumi Airport, Bangkok'}</p>
                    </div>
                  </div>
                  
                  {/* Add Navigate to Pickup button */}
                  <div className="ml-9 mt-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickup_location || '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center px-3 py-2 text-sm bg-primary-100 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-200 dark:bg-black dark:text-white dark:hover:bg-gray-800 dark:border-gray-700"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {t('bookings.details.actions.navigateToPickup')}
                    </a>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{t('bookings.details.fields.dropoffLocation')}</h3>
                      <p className="text-muted-foreground mt-1">{booking.dropoff_location || 'The Sukhothai Bangkok, South Sathorn Road'}</p>
                    </div>
                  </div>
                  
                  {/* Add Navigate to Drop-off button */}
                  <div className="ml-9 mt-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.dropoff_location || '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center px-3 py-2 text-sm bg-primary-100 text-primary-700 border border-primary-200 rounded-md hover:bg-primary-200 dark:bg-black dark:text-white dark:hover:bg-gray-800 dark:border-gray-700"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {t('bookings.details.actions.navigateToDropoff')}
                    </a>
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
                <p className="text-muted-foreground">{t('bookings.details.placeholders.noRouteInfo')}</p>
              )}
              
              {/* Add Weather Forecast Section */}
              {booking.date && booking.pickup_location && (
                <div className="mt-6 pt-6 border-t">
                  <WeatherForecast 
                    date={booking.date}
                    location={booking.pickup_location}
                  />
                </div>
              )}
              
              {/* Add distance and duration */}
              {(booking.distance || booking.duration) && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  {booking.distance && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.distance')}</h3>
                      <p className="mt-1">{booking.distance} km</p>
                    </div>
                  )}
                  
                  {booking.duration && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.duration')}</h3>
                      <p className="mt-1">{booking.duration} min</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
          
          {/* Billing Address and Payment Link Section - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Address Section */}
            <Card className="h-full">
              <div className="border-b py-4 px-6">
                <h2 className="text-lg font-semibold flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  {t('bookings.details.sections.billingAddress')}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {booking.billing_company_name && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.companyName')}</h3>
                      <p className="mt-1">{booking.billing_company_name}</p>
                    </div>
                  )}
                  
                  {booking.billing_tax_number && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.taxNumber')}</h3>
                      <p className="mt-1">{booking.billing_tax_number}</p>
                    </div>
                  )}
                  
                  {(booking.billing_street_name || booking.billing_street_number) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.street')}</h3>
                      <p className="mt-1">
                        {booking.billing_street_name} {booking.billing_street_number}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {booking.billing_city && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.city')}</h3>
                        <p className="mt-1">{booking.billing_city}</p>
                      </div>
                    )}
                    
                    {booking.billing_state && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.state')}</h3>
                        <p className="mt-1">{booking.billing_state}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {booking.billing_postal_code && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.postalCode')}</h3>
                        <p className="mt-1">{booking.billing_postal_code}</p>
                      </div>
                    )}
                    
                    {booking.billing_country && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.country')}</h3>
                        <p className="mt-1">{booking.billing_country}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Payment Link Section */}
            <Card className="h-full">
              <div className="border-b py-4 px-6">
                <h2 className="text-lg font-semibold flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t('bookings.details.sections.payment')}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.status')}</h3>
                    <p className="mt-1">{booking.payment_status || 'Pending'}</p>
                  </div>
                  
                  {/* Price Information - Updated with original price and discount calculation */}
                  {booking.coupon_code || booking.coupon_discount_percentage ? (
                    <div className="space-y-2 pt-2">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.originalPrice') || 'Original Price'}</h3>
                        <p className="mt-1 text-muted-foreground line-through">
                          {booking.original_price ? 
                            (booking.original_price.formatted || `${booking.price?.currency || 'THB'} ${booking.original_price.amount}`) : 
                            calculateOriginalPrice(booking.price?.amount, booking.coupon_discount_percentage)
                          }
                        </p>
                      </div>
                      
                      <div className="bg-secondary/50 px-3 py-2 rounded-md">
                        <div className="flex items-center text-sm">
                          <span className="flex-1 font-medium text-primary">{t('bookings.details.fields.coupon')}</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                            {booking.coupon_code}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm">
                          <span className="flex-1 text-muted-foreground">{t('bookings.details.fields.discount')}</span>
                          <span className="font-medium">-{booking.coupon_discount_percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className={booking.coupon_code || booking.coupon_discount_percentage ? "pt-2 border-t" : ""}>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.finalAmount') || 'Final Amount'}</h3>
                    <p className="mt-1 font-semibold text-lg">
                      {booking.price ? 
                        (booking.price.formatted || `${booking.price.currency || 'THB'} ${booking.price.amount || '8,200'}`) : 
                        'THB 8,200'
                      }
                    </p>
                  </div>
                  
                  <div>
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
                      <p className="mt-1 text-muted-foreground">{t('bookings.details.placeholders.noPaymentLink')}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Right Column: Combined Client Details & Additional Information, and Booking Actions */}
        <div className="space-y-6">
          {/* Combined Client Details and Additional Information Section */}
          <Card>
            <div className="border-b py-4 px-6">
              <h2 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                {t('bookings.details.sections.client')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 mb-4">
                <AvatarInitials name={booking.customer_name || 'Aroon Muangkaew'} />
                
                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-lg">{booking.customer_name || 'Aroon Muangkaew'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('bookings.details.customerSince', {
                      date: (booking as any).customer_since || 
                        (booking.created_at ? 
                          new Date(booking.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                          'January 2023')
                    })}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.email')}</h3>
                  <p className="mt-1 flex items-center">
                    <Mail className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.customer_email || 'aroon.m@example.com'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.phone')}</h3>
                  <p className="mt-1 flex items-center">
                    <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                    {booking.customer_phone || '+66 98 765 4321'}
                  </p>
                  
                  <ContactButtons phoneNumber={booking.customer_phone || '+66 98 765 4321'} />
                </div>
              </div>
              
              {/* Additional Information Section - Combined with client details */}
              <div className="pt-6 mt-6 border-t">
                <h3 className="font-medium mb-4">{t('bookings.details.sections.additional')}</h3>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.flightNumber')}</h3>
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
                        return booking.meta?.chbs_flight_number || t('bookings.details.placeholders.notProvided');
                      })()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.terminal')}</h3>
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
                        return booking.meta?.chbs_terminal || t('bookings.details.placeholders.notProvided');
                      })()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.comment')}</h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {booking.notes || booking.meta?.chbs_comment || t('bookings.details.placeholders.noComments')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Booking Actions */}
          <BookingActions 
            bookingId={(booking.id || booking.booking_id || id)}
            status={booking.status || 'Pending'}
            date={booking.date || '2023-04-30'}
            time={booking.time || '06:30'}
            booking={booking}
          />
        </div>
      </div>

      {/* Notes Section */}
    </div>
  );
} 
