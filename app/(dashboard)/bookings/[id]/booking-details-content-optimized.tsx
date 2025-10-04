"use client";

import { Suspense, lazy, memo } from 'react';
import { Booking } from '@/types/bookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  FileText,
  StickyNote,
  RefreshCw
} from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/utils/formatting';
import { BookingDetailsSkeleton } from '@/components/bookings/booking-details-skeleton';

// Lazy load heavy components
const GoogleMap = lazy(() => import('./google-map-component'));
const WeatherForecast = lazy(() => import('@/components/bookings/weather-forecast'));
const BookingShareButtons = lazy(() => import('@/components/bookings/booking-share-buttons'));

interface BookingDetailsContentOptimizedProps {
  booking: Booking;
  bookingId: string;
  onRefresh: () => void;
}

// Memoized components for better performance
const BookingInfoCard = memo(({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Booking Information</CardTitle>
        <Badge variant="outline" className="text-sm">
          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
        </Badge>
      </div>
      <CardDescription>
        Booking ID: {booking.id}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateDDMMYYYY(booking.date)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.time}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Payment Status</span>
          </div>
          <Badge 
            variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {booking.payment_status?.charAt(0).toUpperCase() + booking.payment_status?.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Price</span>
          </div>
          <p className="text-sm font-medium">
            ¥{booking.price?.toLocaleString()}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));

const CustomerInfoCard = memo(({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Customer Information</CardTitle>
      <CardDescription>Contact details and preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-start space-x-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="font-medium">{booking.customer_name}</h3>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {booking.customer_email}
              </span>
            </div>
            {booking.customer_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {booking.customer_phone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

const LocationInfoCard = memo(({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Location Details</CardTitle>
      <CardDescription>Pickup and dropoff locations</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-1">
            <div className="h-2 w-2 rounded-full bg-green-600" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-green-700">Pickup Location</p>
            <p className="text-sm text-muted-foreground">
              {booking.pickup_location}
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center mt-1">
            <div className="h-2 w-2 rounded-full bg-red-600" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-red-700">Dropoff Location</p>
            <p className="text-sm text-muted-foreground">
              {booking.dropoff_location}
            </p>
          </div>
        </div>
      </div>
      
      <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
        <GoogleMap 
          pickupLocation={booking.pickup_location}
          dropoffLocation={booking.dropoff_location}
        />
      </Suspense>
    </CardContent>
  </Card>
));

const ServiceDetailsCard = memo(({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Service Details</CardTitle>
      <CardDescription>Selected services and preferences</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
            </div>
            <span className="text-sm font-medium">Vehicle Type</span>
          </div>
          <Badge variant="outline">{booking.vehicle_type || 'Standard'}</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-purple-600" />
            </div>
            <span className="text-sm font-medium">Service Type</span>
          </div>
          <Badge variant="outline">{booking.service_type || 'One-way'}</Badge>
        </div>
        
        {booking.passengers && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-orange-600" />
              </div>
              <span className="text-sm font-medium">Passengers</span>
            </div>
            <Badge variant="outline">{booking.passengers}</Badge>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));

const NotesCard = memo(({ booking }: { booking: Booking }) => {
  if (!booking.notes && !booking.customer_notes && !booking.merchant_notes) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <StickyNote className="h-5 w-5" />
          <span>Notes & Comments</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {booking.notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">General Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {booking.notes}
            </p>
          </div>
        )}
        
        {booking.customer_notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Customer Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {booking.customer_notes}
            </p>
          </div>
        )}
        
        {booking.merchant_notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Merchant Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {booking.merchant_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const SidebarCard = memo(({ booking, onRefresh }: { booking: Booking; onRefresh: () => void }) => (
  <div className="space-y-6">
    {/* Status Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Booking Status</p>
          <Badge 
            variant={booking.status === 'completed' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Status</p>
          <Badge 
            variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {booking.payment_status?.charAt(0).toUpperCase() + booking.payment_status?.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>

    {/* Pricing Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Base Price</span>
          <span className="text-sm font-medium">¥{booking.price?.toLocaleString()}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">¥{booking.price?.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>

    {/* Actions Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Suspense fallback={<div className="h-9 bg-muted animate-pulse rounded" />}>
          <BookingShareButtons bookingId={booking.id} />
        </Suspense>
      </CardContent>
    </Card>

    {/* Weather Card */}
    <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
      <WeatherForecast 
        pickupLocation={booking.pickup_location}
        date={booking.date}
        time={booking.time}
      />
    </Suspense>
  </div>
));

export default function BookingDetailsContentOptimized({ 
  booking, 
  bookingId, 
  onRefresh 
}: BookingDetailsContentOptimizedProps) {
  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <BookingInfoCard booking={booking} />
          <CustomerInfoCard booking={booking} />
          <LocationInfoCard booking={booking} />
          <ServiceDetailsCard booking={booking} />
          <NotesCard booking={booking} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <SidebarCard booking={booking} onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  );
}
