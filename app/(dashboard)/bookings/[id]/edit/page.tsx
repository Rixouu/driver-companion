'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Booking } from '@/types/bookings'
import { updateBookingAction, getBookingById } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GooglePlaceAutocomplete } from '@/components/bookings/google-place-autocomplete'
import { 
  ArrowLeft, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CreditCard, CheckCircle, AlertTriangle, Plane, Route, Timer, Info,
  ExternalLink, X, Mail, Phone, MessageSquare, Calculator, Edit
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import Script from 'next/script'
import { getDrivers } from '@/lib/services/drivers'
import { getVehicles } from '@/lib/services/vehicles'
import type { Driver } from '@/types/drivers'
import type { Vehicle } from '@/types/vehicles'

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Booking & { 
    flight_number?: string; 
    terminal?: string; 
    driver_id?: string | null; 
    vehicle_id?: string | null; 
  }>>({})
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])

  // Fetch booking data AND driver/vehicle lists
  useEffect(() => {
    async function loadBookingAndLists() {
      setIsLoading(true)
      try {
        // Fetch Booking
        const { booking: loadedBooking } = await getBookingById(id)
        if (!loadedBooking) {
          setError('Booking not found')
          setBooking(null)
          return; // Stop if booking not found
        }
        setBooking(loadedBooking)
        
        // Extract flight number from meta data if available
        let flightNumber = '';
        let terminal = '';
        
        if (loadedBooking.meta?.chbs_form_element_field && Array.isArray(loadedBooking.meta.chbs_form_element_field)) {
          const flightField = loadedBooking.meta.chbs_form_element_field.find(
            (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
          );
          if (flightField?.value) flightNumber = flightField.value;
          
          const terminalField = loadedBooking.meta.chbs_form_element_field.find(
            (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
          );
          if (terminalField?.value) terminal = terminalField.value;
        }
        
        flightNumber = flightNumber || loadedBooking.meta?.chbs_flight_number || '';
        terminal = terminal || loadedBooking.meta?.chbs_terminal || '';
        
        // Initialize form data including driver/vehicle IDs
        setFormData({
          service_name: loadedBooking.service_name,
          service_type: loadedBooking.service_type || loadedBooking.meta?.chbs_service_type || '',
          date: loadedBooking.date,
          time: loadedBooking.time,
          status: loadedBooking.status,
          customer_name: loadedBooking.customer_name,
          customer_email: loadedBooking.customer_email,
          customer_phone: loadedBooking.customer_phone,
          pickup_location: loadedBooking.pickup_location,
          dropoff_location: loadedBooking.dropoff_location,
          distance: loadedBooking.distance?.toString() || '',
          duration: loadedBooking.duration?.toString() || '',
          notes: loadedBooking.notes,
          driver_id: loadedBooking.driver_id,
          vehicle_id: loadedBooking.vehicle?.id || null,
          flight_number: flightNumber,
          terminal: terminal
        })

        // Fetch Drivers
        const drivers = await getDrivers(); 
        setAvailableDrivers(drivers);

        // Fetch Vehicles
        const vehiclesResult = await getVehicles(); 
        // Extract the vehicles array from the result
        setAvailableVehicles(vehiclesResult.vehicles || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBookingAndLists()
  }, [id])
  
  // Generate static map preview when locations change
  useEffect(() => {
    if (formData.pickup_location && formData.dropoff_location && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const origin = encodeURIComponent(formData.pickup_location);
      const destination = encodeURIComponent(formData.dropoff_location);
      
      // Create a static map URL with route
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x300&scale=2&markers=color:green|label:A|${origin}&markers=color:red|label:B|${destination}&path=color:0x0000ff|weight:5|${origin}|${destination}&key=${apiKey}`;
      
      setMapPreviewUrl(mapUrl);
    } else {
      setMapPreviewUrl(null);
    }
  }, [formData.pickup_location, formData.dropoff_location]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle select changes (now includes driver/vehicle)
  const handleSelectChange = (name: string, value: string) => {
    // Use null for the "None" option
    const actualValue = value === "none" ? null : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }
  
  // Handle Google Places Autocomplete changes
  const handlePlaceChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Calculate route with Google Maps Directions Service
  const calculateRoute = () => {
    if (!formData.pickup_location || !formData.dropoff_location) {
      alert('Please enter both pickup and dropoff locations first');
      return;
    }
    
    if (window.google && window.google.maps) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: formData.pickup_location,
          destination: formData.dropoff_location,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: string) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            // Get the route details
            const route = result.routes[0].legs[0];
            
            // Update distance and duration
            setFormData(prev => ({
              ...prev,
              distance: (route.distance.value / 1000).toFixed(1), // Convert to km
              duration: Math.round(route.duration.value / 60).toString() // Convert to minutes
            }));
          } else {
            alert(`Could not calculate route: ${status}`);
          }
        }
      );
    } else {
      alert('Google Maps is not loaded yet. Please try again in a moment.');
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    setSaveResult(null)
    
    try {
      // Extract specific fields and handle potential nulls for IDs
      const { 
        flight_number, 
        terminal, 
        service_type, 
        driver_id, // Get driver_id
        vehicle_id, // Get vehicle_id
        ...validFields 
      } = formData
      
      // Create meta object
      const metaData = { 
        ...(booking?.meta || {}), 
        chbs_flight_number: flight_number,
        chbs_terminal: terminal,
        chbs_service_type: service_type
      }
      
      // Prepare data for update, including driver/vehicle IDs
      const dataToUpdate = {
        service_name: validFields.service_name,
        date: validFields.date,
        time: validFields.time,
        status: validFields.status,
        customer_name: validFields.customer_name,
        customer_email: validFields.customer_email,
        customer_phone: validFields.customer_phone,
        pickup_location: validFields.pickup_location,
        dropoff_location: validFields.dropoff_location,
        distance: validFields.distance,
        duration: validFields.duration,
        notes: validFields.notes,
        meta: metaData,
        driver_id: driver_id, // Include driver_id (can be null)
        vehicle_id: vehicle_id // Include vehicle_id (can be null)
      }
      
      const result = await updateBookingAction(id, dataToUpdate)
      setSaveResult(result)
      
      if (result.success) {
        // Navigate back to booking details after a short delay
        setTimeout(() => {
          router.push(`/bookings/${id}`)
        }, 1500)
      }
    } catch (err) {
      setSaveResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update booking'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Check if API key is configured
  const isGoogleMapsKeyConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions`}
        strategy="afterInteractive"
      />
    
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(`/bookings/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Booking #{id}</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(booking.updated_at || '').toLocaleDateString() || 'N/A'}
              </p>
            </div>
          </div>
          
          <Badge 
            className={`text-sm px-3 py-1 ${getStatusColor(booking.status)}`}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
        
        <Card className="border-none shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Booking Details
            </CardTitle>
            <CardDescription>Update information for this booking</CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-6 mt-4">
            <TabsList className="grid grid-cols-4 mb-6 h-auto p-1">
              <TabsTrigger value="general" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/10">
                <Calendar className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/10">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/10">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/10">
                <FileText className="h-4 w-4" />
                <span>Additional</span>
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
              <TabsContent value="general" className="space-y-4 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="service_type" className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      Service Type
                    </Label>
                    <Input
                      id="service_type"
                      name="service_type"
                      value={formData.service_type || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Airport Transfer"
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_name" className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      Service Name
                    </Label>
                    <Input
                      id="service_name"
                      name="service_name"
                      value={formData.service_name || ''}
                      onChange={handleInputChange}
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="my-6 border-t pt-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> 
                    Date & Time
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Pickup Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date || ''}
                        onChange={handleInputChange}
                        className="transition-all focus:ring-2 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time">Pickup Time</Label>
                      <Input
                        id="time"
                        name="time"
                        type="time"
                        value={formData.time || ''}
                        onChange={handleInputChange}
                        className="transition-all focus:ring-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" /> 
                    Booking Status
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <div 
                        key={status}
                        className={`
                          border rounded-md p-3 cursor-pointer transition-all flex flex-col items-center
                          ${formData.status === status ? `border-2 ring-2 ${
                            status === 'pending' ? 'border-yellow-500 ring-yellow-200' :
                            status === 'confirmed' ? 'border-green-500 ring-green-200' :
                            status === 'completed' ? 'border-blue-500 ring-blue-200' :
                            'border-red-500 ring-red-200'
                          }` : 'hover:border-primary'}
                        `}
                        onClick={() => handleSelectChange('status', status)}
                      >
                        {status === 'pending' && <AlertTriangle className={`h-5 w-5 mb-1 ${formData.status === status ? 'text-yellow-500' : 'text-muted-foreground'}`} />}
                        {status === 'confirmed' && <CheckCircle className={`h-5 w-5 mb-1 ${formData.status === status ? 'text-green-500' : 'text-muted-foreground'}`} />}
                        {status === 'completed' && <CheckCircle className={`h-5 w-5 mb-1 ${formData.status === status ? 'text-blue-500' : 'text-muted-foreground'}`} />}
                        {status === 'cancelled' && <AlertTriangle className={`h-5 w-5 mb-1 ${formData.status === status ? 'text-red-500' : 'text-muted-foreground'}`} />}
                        <span className="capitalize font-medium text-sm">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver Select */}
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Driver</Label>
                  <Select 
                    name="driver_id" 
                    value={formData.driver_id || "none"} 
                    onValueChange={(value) => handleSelectChange('driver_id', value)}
                  >
                    <SelectTrigger id="driver_id">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Unassigned)</SelectItem>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Select */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Vehicle</Label>
                  <Select 
                    name="vehicle_id" 
                    value={formData.vehicle_id || "none"} 
                    onValueChange={(value) => handleSelectChange('vehicle_id', value)}
                  >
                    <SelectTrigger id="vehicle_id">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Unassigned)</SelectItem>
                      {availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="customer" className="space-y-6 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Customer Name
                    </Label>
                    <Input
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name || ''}
                      onChange={handleInputChange}
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer_email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Customer Email
                    </Label>
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email || ''}
                      onChange={handleInputChange}
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Customer Phone
                  </Label>
                  <Input
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone || ''}
                    onChange={handleInputChange}
                    className="transition-all focus:ring-2 focus:border-primary"
                  />
                </div>
                
                {/* Customer support actions */}
                <div className="border rounded-md p-4 bg-muted/30 mt-6">
                  <h3 className="text-base font-medium mb-3">Quick Customer Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.customer_email && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9"
                              onClick={() => window.open(`mailto:${formData.customer_email}`)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Email Customer
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send an email to {formData.customer_email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {formData.customer_phone && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9"
                              onClick={() => window.open(`tel:${formData.customer_phone}`)}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Call {formData.customer_phone}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {formData.customer_phone && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-9"
                              onClick={() => window.open(`sms:${formData.customer_phone}`)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Text Customer
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send SMS to {formData.customer_phone}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="location" className="space-y-6 p-2">
                {!isGoogleMapsKeyConfigured && (
                  <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">Google Maps API Key Missing</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      The Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
                      Manual address entry will still work.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GooglePlaceAutocomplete
                    id="pickup_location"
                    name="pickup_location"
                    label="Pickup Location"
                    value={formData.pickup_location || ''}
                    onChange={handlePlaceChange}
                    placeholder="Enter pickup address"
                    required
                  />
                  
                  <GooglePlaceAutocomplete
                    id="dropoff_location"
                    name="dropoff_location"
                    label="Dropoff Location"
                    value={formData.dropoff_location || ''}
                    onChange={handlePlaceChange}
                    placeholder="Enter dropoff address"
                    required
                  />
                </div>
                
                {/* Map Preview */}
                {(formData.pickup_location && formData.dropoff_location) ? (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    {mapPreviewUrl ? (
                      <div className="relative">
                        <img 
                          src={mapPreviewUrl} 
                          alt="Route Map" 
                          className="w-full h-auto" 
                        />
                        <div className="absolute bottom-3 left-3">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-800"
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(formData.pickup_location || '')}&destination=${encodeURIComponent(formData.dropoff_location || '')}&travelmode=driving`;
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open in Google Maps
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center border rounded-lg border-dashed mt-4 bg-muted/30">
                    <MapPin className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Enter both pickup and dropoff locations to see the route</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="distance" className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-muted-foreground" />
                        Distance (km)
                      </Label>
                      <span className="text-xs text-muted-foreground">Auto-calculate available</span>
                    </div>
                    <Input
                      id="distance"
                      name="distance"
                      type="text"
                      value={formData.distance || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 25"
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="duration" className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        Duration (min)
                      </Label>
                      <span className="text-xs text-muted-foreground">Auto-calculate available</span>
                    </div>
                    <Input
                      id="duration"
                      name="duration"
                      type="text"
                      value={formData.duration || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 45"
                      className="transition-all focus:ring-2 focus:border-primary"
                    />
                  </div>
                </div>
                
                {(formData.pickup_location && formData.dropoff_location && isGoogleMapsKeyConfigured) && (
                  <div className="flex justify-center mt-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={calculateRoute}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Calculator className="h-4 w-4" />
                      Calculate Route Distance & Duration
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="additional" className="space-y-6 p-2">
                <div className="border-b pb-6">
                  <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" /> 
                    Flight Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="flight_number">Flight Number</Label>
                      <Input
                        id="flight_number"
                        name="flight_number"
                        value={formData.flight_number || ''}
                        onChange={handleInputChange}
                        placeholder="e.g. TG123"
                        className="transition-all focus:ring-2 focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="terminal">Terminal</Label>
                      <Input
                        id="terminal"
                        name="terminal"
                        value={formData.terminal || ''}
                        onChange={handleInputChange}
                        placeholder="e.g. Terminal 1"
                        className="transition-all focus:ring-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notes & Special Instructions
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={6}
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes or special instructions for this booking..."
                    className="transition-all focus:ring-2 focus:border-primary resize-none"
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <Separator className="my-4" />
          
          <CardFooter className="flex justify-between px-6 pb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/bookings/${id}`)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="min-w-[120px] gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {saveResult && (
          <Alert 
            variant={saveResult.success ? "default" : "destructive"} 
            className={`mt-4 transform transition-all duration-300 ${
              saveResult.success ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              {saveResult.success ? 
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : 
                <AlertTriangle className="h-4 w-4" />
              }
              <AlertTitle>{saveResult.success ? "Success" : "Error"}</AlertTitle>
            </div>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  )
} 