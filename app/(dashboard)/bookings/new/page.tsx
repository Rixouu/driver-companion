'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Booking } from '@/types/bookings'
import { createBookingAction } from '@/app/actions/bookings'
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
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider'

import { 
  ArrowLeft, ArrowRight, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CheckCircle, AlertTriangle, X, Info, Plane, CreditCard, Route, Timer, Calculator, ExternalLink
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
// Fetch drivers via a server action to keep service client server-side
import { getDriversAction } from '@/app/actions/drivers'
import { getVehicles } from '@/lib/services/vehicles'
import type { Driver } from '@/types/drivers'
import type { Vehicle } from '@/types/vehicles'
import type { DbVehicle } from '@/types'
import { useI18n } from '@/lib/i18n/context'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { format, parseISO } from "date-fns";
import Image from 'next/image';

export default function NewBookingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Booking & { 
    flight_number?: string; 
    terminal?: string; 
    driver_id?: string | null; 
    vehicle_id?: string | null; 
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  }>>({
    status: 'pending',
    service_name: '',
    date: '',
    time: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_location: '',
    dropoff_location: '',
    notes: '',
    billing_company_name: '',
    billing_tax_number: '',
    billing_street_name: '',
    billing_street_number: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: '',
    distance: '',
    duration: ''
  })
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch driver and vehicle lists
  useEffect(() => {
    async function loadLists() {
      setIsLoading(true)
      try {
        // Fetch Drivers
        const driversResult = await getDriversAction()
        if (driversResult && driversResult.length > 0) {
          setAvailableDrivers(driversResult)
        }
        
        // Fetch Vehicles - pass empty object as searchParams
        const vehiclesResult = await getVehicles({})
        if (vehiclesResult && vehiclesResult.length > 0) {
          // Use the vehicles directly as they should be compatible
          setAvailableVehicles(vehiclesResult as any)
        }
      } catch (error) {
        console.error('Error loading drivers/vehicles:', error)
        setError('Failed to load drivers and vehicles')
      } finally {
        setIsLoading(false)
      }
    }

    loadLists()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlaceChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSaveResult(null)

    try {
      // Validate required fields
      if (!formData.customer_email || !formData.service_name || !formData.date || !formData.time) {
        throw new Error('Please fill in all required fields')
      }

      // Create the booking
      const result = await createBookingAction(formData)
      
      if (result.success) {
        setSaveResult({ success: true, message: 'Booking created successfully!' })
        // Redirect to the new booking details page
        setTimeout(() => {
          router.push(`/bookings/${result.bookingId}`)
        }, 1500)
      } else {
        throw new Error(result.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setError(error instanceof Error ? error.message : 'Failed to create booking')
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

  return (
    <GoogleMapsProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
      libraries={['places']}
    >
      <div className="space-y-6 w-full mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div>
              <h1 className="text-xl font-semibold">Create New Booking</h1>
              <p className="text-xs text-muted-foreground">
                Fill in the details below to create a new vehicle booking
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
            <Badge 
              className={`text-sm px-3 py-1 ${getStatusColor(formData.status || 'pending')}`}
            >
              {(formData.status || 'pending').charAt(0).toUpperCase() + (formData.status || 'pending').slice(1)}
            </Badge>
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className="shadow-sm h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {saveResult?.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Main Form Card */}
        <Card className="border shadow-md dark:border-gray-800 relative pb-16 md:pb-0">
          <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 sm:px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5" />
              Create new booking information
            </CardTitle>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop Tabs */}
            <div className="hidden md:block w-full bg-black border-b">
              <TabsList className="w-full grid grid-cols-4 p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="summary" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Booking Summary</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="route" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Route Information</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="client" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <User className="h-4 w-4" />
                  <span>Client Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  <span>Additional Info</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Bottom Fixed Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t z-50">
              <TabsList className="w-full grid grid-cols-4 p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="summary" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Summary</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="route" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs">Route</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="client" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <User className="h-5 w-5" />
                  <span className="text-xs">Client</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Extra</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-3 sm:p-6 pb-2 space-y-6">
              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-0 space-y-4">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-3 sm:py-4 px-4 sm:px-6">
                    <h2 className="text-base sm:text-lg font-semibold flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Booking Summary
                    </h2>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <div className="grid grid-cols-2 gap-3">
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
                              {status === 'cancelled' && <X className={`h-5 w-5 mb-1 ${formData.status === status ? 'text-red-500' : 'text-muted-foreground'}`} />}
                              <span className="capitalize font-medium text-sm">{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Pickup Date</h3>
                        <div className="mt-1">
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Pickup Time</h3>
                        <div className="mt-1">
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
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Service Name</h3>
                        <Input
                          id="service_name"
                          name="service_name"
                          value={formData.service_name || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                          placeholder="e.g. Airport to Hotel"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              {/* Route Tab */}
              <TabsContent value="route" className="mt-0 space-y-6">
                {!isGoogleMapsKeyConfigured && (
                  <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">Google Maps API Key Missing</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      Please configure your Google Maps API key to enable map functionality.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Card className="border rounded-lg shadow-sm dark:border-gray-800 overflow-hidden">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Route Information
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    {(formData.pickup_location && formData.dropoff_location) ? (
                      <div className="mt-4 rounded-lg overflow-hidden">
                        {isGoogleMapsKeyConfigured ? (
                          <div className="relative h-[300px] w-full">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              style={{border: 0}}
                              loading="lazy"
                              allowFullScreen
                              src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(formData.pickup_location)}&destination=${encodeURIComponent(formData.dropoff_location)}&mode=driving`}
                            />
                            <div className="absolute bottom-3 left-3 z-10">
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
                                View Larger Map
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {mapPreviewUrl ? (
                              <div className="relative aspect-[16/9]">
                                <Image 
                                  src={mapPreviewUrl} 
                                  alt="Route Map" 
                                  fill
                                  className="object-contain rounded-md"
                                />
                              </div>
                            ) : (
                              <div className="h-[200px] flex items-center justify-center bg-muted">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-[200px] flex flex-col items-center justify-center border rounded-lg border-dashed mt-4 bg-muted/30">
                        <MapPin className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center px-4">Enter both pickup and dropoff locations to see the route</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="distance" className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-muted-foreground" />
                            Distance
                          </Label>
                          <span className="text-xs text-muted-foreground">km</span>
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
                            Duration
                          </Label>
                          <span className="text-xs text-muted-foreground">min</span>
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
                    
                    {(formData.pickup_location && formData.dropoff_location) && (
                      <div className="flex justify-center mt-6">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={calculateRoute}
                          className="flex items-center gap-2"
                        >
                          <Calculator className="h-4 w-4" />
                          Calculate Route Distance & Duration
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              {/* Client Tab */}
              <TabsContent value="client" className="mt-0 space-y-6">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Client Details
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Customer Name</h3>
                        <Input
                          id="customer_name"
                          name="customer_name"
                          value={formData.customer_name || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Email *</h3>
                        <Input
                          id="customer_email"
                          name="customer_email"
                          type="email"
                          required
                          value={formData.customer_email || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          type="tel"
                          value={formData.customer_phone || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                    </div>
                    
                    {/* Billing Information Section */}
                    <Separator className="my-6" />
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Billing Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                          <Input
                            id="billing_company_name"
                            name="billing_company_name"
                            value={formData.billing_company_name || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Tax Number / VAT ID</h3>
                          <Input
                            id="billing_tax_number"
                            name="billing_tax_number"
                            value={formData.billing_tax_number || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Street Name</h3>
                          <Input
                            id="billing_street_name"
                            name="billing_street_name"
                            value={formData.billing_street_name || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Street Number / Building</h3>
                          <Input
                            id="billing_street_number"
                            name="billing_street_number"
                            value={formData.billing_street_number || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">City</h3>
                          <Input
                            id="billing_city"
                            name="billing_city"
                            value={formData.billing_city || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">State / Province</h3>
                          <Input
                            id="billing_state"
                            name="billing_state"
                            value={formData.billing_state || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Postal / ZIP Code</h3>
                          <Input
                            id="billing_postal_code"
                            name="billing_postal_code"
                            value={formData.billing_postal_code || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Country</h3>
                        <Input
                          id="billing_country"
                          name="billing_country"
                          value={formData.billing_country || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              {/* Additional Info Tab */}
              <TabsContent value="additional" className="mt-0 space-y-6">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Plane className="mr-2 h-5 w-5" />
                      Flight Information
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Flight Number</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">Terminal</h3>
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
                </Card>
                
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Notes & Instructions
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Comment</h3>
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
                  </div>
                </Card>
                

              </TabsContent>
            </div>
          </Tabs>
          
          <CardFooter className="flex justify-between px-4 sm:px-6 pb-6 pt-2">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  const tabs = ['summary', 'route', 'client', 'additional']
                  const currentIndex = tabs.indexOf(activeTab)
                  const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1]
                  setActiveTab(previousTab)
                }}
                disabled={activeTab === 'summary'}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const tabs = ['summary', 'route', 'client', 'additional']
                  const currentIndex = tabs.indexOf(activeTab)
                  const nextTab = tabs[currentIndex + 1] || tabs[0]
                  setActiveTab(nextTab)
                }}
                disabled={activeTab === 'additional'}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </GoogleMapsProvider>
  )
}
