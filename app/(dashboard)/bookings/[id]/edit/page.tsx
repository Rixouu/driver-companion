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
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider'
import { 
  ArrowLeft, ArrowRight, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CreditCard, CheckCircle, CheckCircle2, AlertTriangle, Plane, Route, Timer, Info,
  ExternalLink, X, Mail, Phone, MessageSquare, Calculator, Edit, Settings, XCircle
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
// Fetch drivers via a server action to keep service client server-side
import { getDriversAction } from '@/app/actions/drivers'
import { getServiceTypesAction, getPricingCategoriesAction, getVehiclesWithCategoriesAction } from '@/app/actions/services'
import type { ServiceType, PricingCategory, VehicleWithCategory } from '@/app/actions/services'
import { getVehicles } from '@/lib/services/vehicles'
import type { Driver } from '@/types/drivers'
import type { Vehicle } from '@/types/vehicles'
import type { DbVehicle } from '@/types'
import { useI18n } from '@/lib/i18n/context'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { format, parseISO } from "date-fns";
import Image from 'next/image';

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
    vehicle_category?: string;
  }>>({})
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('route')
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  // New state for services, categories, and vehicles with categories
  const [availableServices, setAvailableServices] = useState<ServiceType[]>([])
  const [availableCategories, setAvailableCategories] = useState<PricingCategory[]>([])
  const [vehiclesWithCategories, setVehiclesWithCategories] = useState<VehicleWithCategory[]>([])
  const [vehicleFilters, setVehicleFilters] = useState({
    category: '',
    brand: '',
    model: '',
    minPassengers: '',
    minLuggage: ''
  })
  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Filter vehicles based on selected filters
  const filteredVehicles = vehiclesWithCategories.filter(vehicle => {
    if (vehicleFilters.category && vehicle.category_name?.trim() !== vehicleFilters.category) {
      return false
    }
    if (vehicleFilters.brand && !vehicle.brand?.trim().toLowerCase().includes(vehicleFilters.brand.toLowerCase())) {
      return false
    }
    if (vehicleFilters.model && !vehicle.model?.trim().toLowerCase().includes(vehicleFilters.model.toLowerCase())) {
      return false
    }
    if (vehicleFilters.minPassengers && vehicle.passenger_capacity && vehicle.passenger_capacity < parseInt(vehicleFilters.minPassengers)) {
      return false
    }
    if (vehicleFilters.minLuggage && vehicle.luggage_capacity && vehicle.luggage_capacity < parseInt(vehicleFilters.minLuggage)) {
      return false
    }
    
    return true
  })

  // Get unique values for filter options - memoized to prevent multiple calls
  const getFilterOptions = useMemo(() => {
    // Trim whitespace and filter out empty values, then get unique values
    const brands = [...new Set(vehiclesWithCategories
      .map(v => v.brand?.trim())
      .filter(Boolean)
    )].sort()
    
    const models = [...new Set(vehiclesWithCategories
      .map(v => v.model?.trim())
      .filter(Boolean)
    )].sort()
    
    const categories = [...new Set(vehiclesWithCategories
      .map(v => v.category_name?.trim())
      .filter(Boolean)
    )].sort()
    
    return { brands, models, categories }
  }, [vehiclesWithCategories])

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
        // Extract base service type from full service name (e.g., "Airport Transfer Haneda - Toyota..." -> "Airport Transfer Haneda")
        const extractBaseServiceType = (fullServiceName: string) => {
          if (!fullServiceName) return '';
          
          // Extract base service type by removing everything after " - "
          const baseName = fullServiceName.split(' - ')[0];
          
          // Known service types that we expect to find
          const knownServiceTypes = [
            'Airport Transfer Haneda',
            'Airport Transfer Narita', 
            'Charter Services'
          ];
          
          // Check if the extracted base name matches any known service type
          const matchingService = knownServiceTypes.find(service => service === baseName);
          return matchingService || fullServiceName;
        };
        
        const extractedServiceName = extractBaseServiceType(loadedBooking.service_name || '');
        console.log('🔧 [EDIT] Service name extraction:', {
          original: loadedBooking.service_name,
          extracted: extractedServiceName
        });
        
        const initialFormData = {
          service_name: extractedServiceName,
          service_type: loadedBooking.service_type || loadedBooking.meta?.chbs_service_type || '',
          date: loadedBooking.date,
          time: loadedBooking.time,
          status: loadedBooking.status,
          customer_name: loadedBooking.customer_name || loadedBooking.customer?.name || '',
          customer_email: loadedBooking.customer_email || loadedBooking.customer?.email || '',
          customer_phone: loadedBooking.customer_phone || loadedBooking.customer?.phone || '',
          pickup_location: loadedBooking.pickup_location || '',
          dropoff_location: loadedBooking.dropoff_location || '',
          distance: loadedBooking.distance?.toString() || '',
          duration: loadedBooking.duration?.toString() || '',
          notes: loadedBooking.notes,
          driver_id: loadedBooking.driver_id,
          vehicle_id: loadedBooking.vehicle?.id || loadedBooking.vehicle_id || undefined,
          vehicle_category: loadedBooking.meta?.vehicle_category || '',
          flight_number: flightNumber,
          terminal: terminal,
          // Billing information
          billing_company_name: loadedBooking.billing_company_name || '',
          billing_tax_number: loadedBooking.billing_tax_number || '',
          billing_street_name: loadedBooking.billing_street_name || '',
          billing_street_number: loadedBooking.billing_street_number || '',
          billing_city: loadedBooking.billing_city || '',
          billing_state: loadedBooking.billing_state || '',
          billing_postal_code: loadedBooking.billing_postal_code || '',
          billing_country: loadedBooking.billing_country || '',
          // Coupon information
          coupon_code: loadedBooking.coupon_code || '',
          coupon_discount_percentage: loadedBooking.coupon_discount_percentage?.toString() || ''
        }
        
        setFormData(initialFormData)

        // Fetch Drivers via server action (server-side)
        const drivers = await getDriversAction(); 
        setAvailableDrivers(drivers);

        // Fetch Vehicles (legacy)
        const vehiclesResult = await getVehicles({}); 
        // vehiclesResult is DbVehicle[], cast to Vehicle[] for state
        setAvailableVehicles(vehiclesResult as Vehicle[]);

        // Fetch Services, Categories, and Vehicles with Categories (new)
        const servicesResult = await getServiceTypesAction()
        if (servicesResult && servicesResult.length > 0) {
          setAvailableServices(servicesResult)
        }

        const categoriesResult = await getPricingCategoriesAction()
        if (categoriesResult && categoriesResult.length > 0) {
          setAvailableCategories(categoriesResult)
        }

        const vehiclesWithCategoriesResult = await getVehiclesWithCategoriesAction()
        if (vehiclesWithCategoriesResult && vehiclesWithCategoriesResult.length > 0) {
          setVehiclesWithCategories(vehiclesWithCategoriesResult)
        }

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
  
  // Handle select changes (now includes driver/vehicle and vehicle_category)
  const handleSelectChange = (
    name: keyof Partial<typeof formData> | 'vehicle_category',
    value: string | null
  ) => {
    if (value === '') return
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      if (!booking) {
        throw new Error("Booking not found")
      }

      const { 
        flight_number, 
        terminal, 
        service_type,
        vehicle_category,
      } = formData
      
      const metaData = { 
        ...(booking.meta || {}), 
        chbs_flight_number: flight_number,
        chbs_terminal: terminal,
        chbs_service_type: service_type,
        vehicle_category: vehicle_category
      }

      // Ensure coupon_discount_percentage is string | undefined to match Booking type if it's string there
      // If Booking type's coupon_discount_percentage is number, then parse it here.
      // From types/bookings.ts: coupon_discount_percentage?: string
      const couponDiscount = formData.coupon_discount_percentage?.toString() || undefined;

      const dataToSave: Partial<Booking> = {
        service_name: formData.service_name,
        service_type: formData.service_type,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        distance: formData.distance || undefined, // string | undefined, matches Booking type if it's string | number
        duration: formData.duration || undefined, // string | undefined, matches Booking type if it's string | number
        notes: formData.notes,
        driver_id: formData.driver_id === '' || formData.driver_id === null ? undefined : formData.driver_id,
        vehicle_id: formData.vehicle_id === '' || formData.vehicle_id === null ? undefined : formData.vehicle_id,
        meta: metaData,
        billing_company_name: formData.billing_company_name,
        billing_tax_number: formData.billing_tax_number,
        billing_street_name: formData.billing_street_name,
        billing_street_number: formData.billing_street_number,
        billing_city: formData.billing_city,
        billing_state: formData.billing_state,
        billing_postal_code: formData.billing_postal_code,
        billing_country: formData.billing_country,
        coupon_code: formData.coupon_code,
        coupon_discount_percentage: couponDiscount
      }

      const result = await updateBookingAction(id, dataToSave)
      setSaveResult(result)
      
      if (result.success) {
        // Customize the success message to use "Booking Number" with translation
        setSaveResult({
          ...result,
          message: `${t('bookings.details.fields.bookingId')} ${id} ${t('common.updated')}`
        })
        
        // Navigate back to booking details after a short delay
        setTimeout(() => {
          router.push(`/bookings/${id}` as any)
        }, 1500)
      }
    } catch (err) {
      console.error("Error updating booking:", err);
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
      <GoogleMapsProvider 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
        libraries={['places', 'directions']}
      >
        <div className="space-y-6 w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div>
              <h1 className="text-xl font-semibold">Edit Booking #{booking?.wp_id || id}</h1>
              <p className="text-xs text-muted-foreground">
                {t('bookings.details.lastUpdated', { date: new Date(booking.updated_at || '').toLocaleDateString() || 'N/A' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
            <Badge 
              className={`text-sm px-3 py-1 ${getStatusColor(booking.status)}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="shadow-sm h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Card className="border shadow-md dark:border-gray-800 relative pb-16 md:pb-0">
          <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 sm:px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Edit className="h-5 w-5" />
              Update information for this booking
            </CardTitle>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop Tabs */}
            <div className="hidden md:block w-full bg-black border-b">
              <TabsList className="w-full grid grid-cols-4 p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="route" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Route & Services</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="vehicles" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <Car className="h-4 w-4" />
                  <span>Vehicles</span>
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
                  value="route" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs">Route</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="vehicles" 
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                >
                  <Car className="h-5 w-5" />
                  <span className="text-xs">Vehicles</span>
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
              <TabsContent value="summary" className="mt-0 space-y-4">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-3 sm:py-4 px-4 sm:px-6">
                    <h2 className="text-base sm:text-lg font-semibold flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      {t('bookings.details.sections.summary')}
                    </h2>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.bookingId')}</h3>
                        <p className="mt-1">#{id}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.status')}</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupDate')}</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.pickupTime')}</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.serviceName')}</h3>
                        <Input
                          id="service_name"
                          name="service_name"
                          value={formData.service_name || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                          placeholder="e.g. Airport to Hotel"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.vehicleCategory')}</h3>
                        <Select
                          value={formData.vehicle_category || ''}
                          onValueChange={(value) => handleSelectChange('vehicle_category', value)}
                        >
                          <SelectTrigger className="transition-all focus:ring-2 focus:border-primary">
                            <SelectValue placeholder="Select vehicle category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="611107df-a656-4812-b0c1-d54b8e67e7f1">Elite</SelectItem>
                            <SelectItem value="eeb5632d-d028-4272-92c0-8c0d22abb06a">Platinum</SelectItem>
                            <SelectItem value="ad9eb0c4-4e33-4c2a-a466-18a05086b854">Luxury</SelectItem>
                            <SelectItem value="57fb7a7e-1e7c-4f46-b00a-55246030d691">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="vehicles" className="mt-0 space-y-6">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Car className="mr-2 h-5 w-5" />
                      Select Your Vehicle
                    </h2>
                  </div>
                  
                  {/* Vehicle Filters */}
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium">Filters</h3>
                      {Object.values(vehicleFilters).some(filter => filter) && (
                        <button
                          onClick={() => setVehicleFilters({ category: '', brand: '', model: '', minPassengers: '', minLuggage: '' })}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* Category Filter */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                        <Select 
                          value={vehicleFilters.category || undefined} 
                          onValueChange={(value) => setVehicleFilters(prev => ({ ...prev, category: value || '' }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilterOptions.categories.filter(Boolean).map((category) => (
                              <SelectItem key={category} value={category as string}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Brand Filter */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Brand</Label>
                        <Select 
                          value={vehicleFilters.brand || undefined} 
                          onValueChange={(value) => setVehicleFilters(prev => ({ ...prev, brand: value || '' }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilterOptions.brands.filter(Boolean).map((brand) => (
                              <SelectItem key={brand} value={brand as string}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Model Filter */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                        <Input
                          placeholder="Search model..."
                          value={vehicleFilters.model}
                          onChange={(e) => setVehicleFilters(prev => ({ ...prev, model: e.target.value }))}
                          className="h-8 text-xs"
                        />
                      </div>
                      
                      {/* Passengers Filter */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Min. Passengers</Label>
                        <Select 
                          value={vehicleFilters.minPassengers || undefined} 
                          onValueChange={(value) => setVehicleFilters(prev => ({ ...prev, minPassengers: value || '' }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Luggage Filter */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Min. Luggage</Label>
                        <Select 
                          value={vehicleFilters.minLuggage || undefined} 
                          onValueChange={(value) => setVehicleFilters(prev => ({ ...prev, minLuggage: value || '' }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Filter Results Count */}
                    <div className="mt-3 text-xs text-muted-foreground">
                      Showing {filteredVehicles.length} of {vehiclesWithCategories.length} vehicles
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {availableCategories.length > 0 ? (
                      <div className="space-y-8">
                        {availableCategories
                          .filter(category => {
                            const categoryVehicles = filteredVehicles.filter(v => v.category_name?.trim() === category.name?.trim())
                            return categoryVehicles.length > 0
                          })
                          .map((category) => {
                          const categoryVehicles = filteredVehicles.filter(v => v.category_name?.trim() === category.name?.trim())
                          
                          return (
                            <div key={category.id} className="space-y-4">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{category.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {categoryVehicles.length} vehicle{categoryVehicles.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryVehicles.map((vehicle) => (
                                  <div
                                    key={vehicle.id}
                                    className={`
                                      border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                                      ${formData.vehicle_id === vehicle.id ? 'border-2 border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}
                                    `}
                                    onClick={() => handleSelectChange('vehicle_id', vehicle.id)}
                                  >
                                    <div className="space-y-3">
                                      {/* Vehicle Image */}
                                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                                        {vehicle.image_url ? (
                                          <Image
                                            src={vehicle.image_url}
                                            alt={`${vehicle.brand} ${vehicle.model}`}
                                            width={300}
                                            height={200}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Car className="h-12 w-12 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Vehicle Details */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-semibold text-sm">{vehicle.brand?.trim()} {vehicle.model?.trim()}</h4>
                                          {formData.vehicle_id === vehicle.id && (
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>{vehicle.passenger_capacity} passengers</span>
                                          <span>{vehicle.luggage_capacity} luggage</span>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground">
                                          {vehicle.name}
                                        </div>
                                        
                                        {/* Select Button */}
                                        <Button
                                          variant={formData.vehicle_id === vehicle.id ? "default" : "outline"}
                                          size="sm"
                                          className="w-full mt-3"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleSelectChange('vehicle_id', vehicle.id)
                                          }}
                                        >
                                          {formData.vehicle_id === vehicle.id ? 'Selected' : 'Select'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No vehicles available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="client" className="mt-0 space-y-6">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      {t('bookings.details.sections.client')}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.customerName')}</h3>
                        <Input
                          id="customer_name"
                          name="customer_name"
                          value={formData.customer_name || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.email')}</h3>
                        <Input
                          id="customer_email"
                          name="customer_email"
                          type="email"
                          value={formData.customer_email || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.phone')}</h3>
                        <Input
                          id="customer_phone"
                          name="customer_phone"
                          value={formData.customer_phone || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                    </div>
                    
                    {(formData.customer_email || formData.customer_phone) && (
                      <div className="border rounded-md p-4 bg-muted/30 mt-6">
                        <h3 className="text-base font-medium mb-3">{t('bookings.details.quickCustomerActions')}</h3>
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
                                    {t('bookings.details.actions.emailCustomer')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('bookings.details.tooltips.emailTo')} {formData.customer_email}</p>
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
                                    {t('bookings.details.actions.callCustomer')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('bookings.details.tooltips.callTo')} {formData.customer_phone}</p>
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
                                    {t('bookings.details.actions.textCustomer')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('bookings.details.tooltips.textTo')} {formData.customer_phone}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Billing Information Section */}
                    <Separator className="my-6" />
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        {t('bookings.billing.title')}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.companyName')}</h3>
                          <Input
                            id="billing_company_name"
                            name="billing_company_name"
                            value={formData.billing_company_name || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.taxNumber')}</h3>
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
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.streetName')}</h3>
                          <Input
                            id="billing_street_name"
                            name="billing_street_name"
                            value={formData.billing_street_name || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.streetNumber')}</h3>
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
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.city')}</h3>
                          <Input
                            id="billing_city"
                            name="billing_city"
                            value={formData.billing_city || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.state')}</h3>
                          <Input
                            id="billing_state"
                            name="billing_state"
                            value={formData.billing_state || ''}
                            onChange={handleInputChange}
                            className="transition-all focus:ring-2 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.postalCode')}</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.billing.country')}</h3>
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
              
              <TabsContent value="route" className="mt-0 space-y-6">
                {/* Service Selection Card */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Car className="mr-2 h-5 w-5" />
                      Service Selection
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Service Type</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {availableServices.map((service) => {
                            const isSelected = formData.service_name === service.name;
                            console.log('🔧 [EDIT] Service button comparison:', {
                              serviceName: service.name,
                              formDataServiceName: formData.service_name,
                              isSelected
                            });
                            
                            return (
                            <div 
                              key={service.id}
                              className={`
                                border rounded-md p-3 cursor-pointer transition-all flex flex-col items-center
                                ${isSelected ? 'border-2 ring-2 border-primary ring-primary/20 bg-primary/5' : 'hover:border-primary'}
                              `}
                              onClick={() => handleSelectChange('service_name', service.name)}
                            >
                              <Car className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className="font-medium text-sm text-center">{service.name}</span>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Pickup Date</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date || ''}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Pickup Time</Label>
                          <Input
                            id="time"
                            name="time"
                            type="time"
                            value={formData.time || ''}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {!isGoogleMapsKeyConfigured && (
                  <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">{t('bookings.details.googleMapsApiKeyMissing')}</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      {t('bookings.details.googleMapsApiKeyMissingDescription')}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Card className="border rounded-lg shadow-sm dark:border-gray-800 overflow-hidden">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      {t('bookings.details.sections.route')}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GooglePlaceAutocomplete
                        id="pickup_location"
                        name="pickup_location"
                        label={t('bookings.details.fields.pickupLocation')}
                        value={formData.pickup_location || ''}
                        onChange={handlePlaceChange}
                        placeholder="Enter pickup address"
                        required
                      />
                      
                      <GooglePlaceAutocomplete
                        id="dropoff_location"
                        name="dropoff_location"
                        label={t('bookings.details.fields.dropoffLocation')}
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
                                {t('bookings.details.actions.viewLargerMap')}
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
                        <p className="text-sm text-muted-foreground text-center px-4">{t('bookings.details.placeholders.enterBothLocations')}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="distance" className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-muted-foreground" />
                            {t('bookings.details.fields.distance')}
                          </Label>
                          <span className="text-xs text-muted-foreground">{t('bookings.labels.km')}</span>
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
                            {t('bookings.details.fields.duration')}
                          </Label>
                          <span className="text-xs text-muted-foreground">{t('bookings.labels.min')}</span>
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
                      <div className="flex justify-center mt-6">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={calculateRoute}
                          className="flex items-center gap-2"
                        >
                          <Calculator className="h-4 w-4" />
                          {t('bookings.calculateRoute')}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="additional" className="mt-0 space-y-6">
                {/* Booking Status */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Booking Status
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                          {[
                            { value: 'pending', label: 'Pending', icon: AlertTriangle, color: 'border-yellow-500 text-yellow-600' },
                            { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'border-green-500 text-green-600' },
                            { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'border-blue-500 text-blue-600' },
                            { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'border-red-500 text-red-600' }
                          ].map((status) => {
                            const Icon = status.icon;
                            const isSelected = formData.status === status.value;
                            
                            return (
                              <div
                                key={status.value}
                                className={`
                                  border rounded-md p-3 cursor-pointer transition-all flex flex-col items-center
                                  ${isSelected 
                                    ? `border-2 ring-2 ${status.color} ring-opacity-20 bg-opacity-5` 
                                    : 'hover:border-primary border-gray-200 dark:border-gray-700'
                                  }
                                `}
                                onClick={() => handleSelectChange('status', status.value)}
                              >
                                <Icon className={`h-5 w-5 mb-1 ${isSelected ? status.color.split(' ')[1] : 'text-muted-foreground'}`} />
                                <span className="font-medium text-sm text-center">{status.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Plane className="mr-2 h-5 w-5" />
                      {t('bookings.details.flightInformation')}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.flightNumber')}</h3>
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
                        <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.terminal')}</h3>
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
                      {t('bookings.details.notesAndInstructions')}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">{t('bookings.details.fields.comment')}</h3>
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
              onClick={() => router.push(`/bookings/${id}` as any)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t('common.cancel')}
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
              <AlertTitle>{saveResult.success ? t('common.success') : t('common.error')}</AlertTitle>
            </div>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}
      </div>
      </GoogleMapsProvider>
    </>
  )
} 