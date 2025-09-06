'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Booking } from '@/types/bookings'
import { createBookingAction } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider'

import { 
  ArrowLeft, ArrowRight, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CheckCircle, AlertTriangle, X, Info, Plane, CreditCard, Route, Timer, Calculator, ExternalLink, Settings,
  Eye, Send, DollarSign
} from 'lucide-react'

// Fetch drivers via a server action to keep service client server-side
import { getDriversAction } from '@/app/actions/drivers'
import { getVehicles } from '@/lib/services/vehicles'
import { getServiceTypesAction, getPricingCategoriesAction, getVehiclesWithCategoriesAction, ServiceType, PricingCategory, VehicleWithCategory } from '@/app/actions/services'
import type { Driver } from '@/types/drivers'
import type { Vehicle } from '@/types/vehicles'
import type { DbVehicle } from '@/types'

import { useI18n } from '@/lib/i18n/context'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { format, parseISO } from "date-fns";

// Import all the refactored components
import { ClientDetailsTab } from '@/components/bookings/new-booking/client-details-tab'
import { ServiceSelection } from '@/components/bookings/new-booking/service-selection'
import { ServiceDuration } from '@/components/bookings/new-booking/service-duration'
import { VehicleSelectionTab } from '@/components/bookings/new-booking/vehicle-selection-tab'
import { RouteInformationTab } from '@/components/bookings/new-booking/route-information-tab'
import { AdditionalInfoTab } from '@/components/bookings/new-booking/additional-info-tab'
import { PreviewTab } from '@/components/bookings/new-booking/preview-tab'
import { RideSummary } from '@/components/bookings/new-booking/ride-summary'

export default function NewBookingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Booking & { 
    flight_number?: string; 
    terminal?: string; 
    hours_per_day?: number;
    duration_hours?: number;
    service_days?: number;
    driver_id?: string | null; 
    vehicle_id?: string | null; 
    selectedVehicle?: VehicleWithCategory;
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
  const [activeTab, setActiveTab] = useState('route')
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [availableServices, setAvailableServices] = useState<ServiceType[]>([])
  const [availableCategories, setAvailableCategories] = useState<PricingCategory[]>([])
  const [vehiclesWithCategories, setVehiclesWithCategories] = useState<VehicleWithCategory[]>([])
  
  // Vehicle filtering state
  const [vehicleFilters, setVehicleFilters] = useState({
    category: '',
    brand: '',
    model: '',
    minPassengers: '',
    minLuggage: ''
  })

  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState({
    requiresPayment: false,
    paymentMethod: 'client_pay' as 'client_pay' | 'send_payment_link',
    customPaymentName: ''
  })

  // Pricing state
  const [calculatedPrice, setCalculatedPrice] = useState({
    baseAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0
  })

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  // Service data cache for switching between services
  const [serviceDataCache, setServiceDataCache] = useState<Record<string, any>>({})

  // Route calculation state
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // Email sending state
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false)

  // Check if API key is configured
  const isGoogleMapsKeyConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [drivers, services, categories, vehicles] = await Promise.all([
          getDriversAction(),
          getServiceTypesAction(),
          getPricingCategoriesAction(),
          getVehiclesWithCategoriesAction()
        ])
        
        setAvailableDrivers(drivers)
        setAvailableServices(services)
        setAvailableCategories(categories)
        setVehiclesWithCategories(vehicles)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load required data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter vehicles based on current filters
  const filteredVehicles = useMemo(() => {
    return vehiclesWithCategories.filter(vehicle => {
      const matchesCategory = !vehicleFilters.category || vehicle.category_name === vehicleFilters.category
      const matchesBrand = !vehicleFilters.brand || vehicle.brand === vehicleFilters.brand
      const matchesModel = !vehicleFilters.model || vehicle.model.toLowerCase().includes(vehicleFilters.model.toLowerCase())
      const matchesPassengers = !vehicleFilters.minPassengers || (vehicle.passenger_capacity || 0) >= parseInt(vehicleFilters.minPassengers)
      const matchesLuggage = !vehicleFilters.minLuggage || (vehicle.luggage_capacity || 0) >= parseInt(vehicleFilters.minLuggage)
      
      return matchesCategory && matchesBrand && matchesModel && matchesPassengers && matchesLuggage
    })
  }, [vehiclesWithCategories, vehicleFilters])

  // Get filter options for dropdowns
  const getFilterOptions = useMemo(() => {
    const categories = [...new Set(vehiclesWithCategories.map(v => v.category_name).filter(Boolean))]
    const brands = [...new Set(vehiclesWithCategories.map(v => v.brand).filter(Boolean))]
    
    return { categories, brands }
  }, [vehiclesWithCategories])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Handle service switching logic
      if (name === 'service_name') {
        const newService = value
        
        // Clear previous service-specific data
        newData.duration_hours = undefined
        newData.hours_per_day = undefined
        newData.service_days = undefined
        newData.selectedVehicle = undefined
        newData.vehicle_id = undefined
        
          if (newService === 'Airport Transfer Haneda' || newService === 'Airport Transfer Narita') {
            // Airport Transfer: Set fixed values, clear charter-specific data
            newData.duration_hours = 1
            newData.hours_per_day = 1
            newData.service_days = 1
            
            // Force reset to ensure clean state
            newData.duration_hours = 1
            newData.hours_per_day = 1
            newData.service_days = 1
            
            // Restore vehicle selection if available
          const cachedData = serviceDataCache[newService];
            if (cachedData?.selectedVehicle) {
            newData.selectedVehicle = cachedData.selectedVehicle;
            newData.vehicle_id = cachedData.selectedVehicle.id;
            }
          } else if (newService === 'Charter Services') {
            // Charter Services: Restore cached data or set defaults
          const cachedData = serviceDataCache[newService];
            if (cachedData) {
              newData.duration_hours = cachedData.duration_hours || 1
              newData.hours_per_day = cachedData.hours_per_day || 1
              newData.service_days = cachedData.service_days || 1
              newData.selectedVehicle = cachedData.selectedVehicle
            newData.vehicle_id = cachedData.selectedVehicle?.id
            } else {
              newData.duration_hours = 1
              newData.hours_per_day = 1
              newData.service_days = 1
            }
          }
        
        // Update cache for current service
        if (newService) {
          setServiceDataCache(prevCache => ({
            ...prevCache,
            [newService]: {
              duration_hours: newData.duration_hours,
              hours_per_day: newData.hours_per_day,
              service_days: newData.service_days,
              selectedVehicle: newData.selectedVehicle
            }
          }));
        }
      }
      
      // Recalculate duration for charter services when days or hours change
      if (newData.service_name === 'Charter Services' && (name === 'service_days' || name === 'hours_per_day')) {
        const days = name === 'service_days' ? parseInt(value) || 1 : newData.service_days || 1
        const hours = name === 'hours_per_day' ? parseInt(value) || 1 : newData.hours_per_day || 1
        newData.duration_hours = days * hours
        
        // Update cache
      if (newData.service_name) {
        setServiceDataCache(prevCache => ({
          ...prevCache,
          [newData.service_name as string]: {
            duration_hours: newData.duration_hours,
            hours_per_day: newData.hours_per_day,
            service_days: newData.service_days,
            selectedVehicle: newData.selectedVehicle
          }
          }));
        }
      }
      
      return newData
    })
  }

  // Handle select changes
  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate route using Google Maps
  const calculateRoute = async () => {
    if (!formData.pickup_location || !formData.dropoff_location) return
    
    setIsCalculatingRoute(true)
    try {
      const directionsService = new google.maps.DirectionsService()
      const results = await directionsService.route({
        origin: formData.pickup_location,
        destination: formData.dropoff_location,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      
      if (results.routes[0]) {
        const route = results.routes[0].legs[0]
        const distance = route.distance?.text || ''
        const duration = route.duration?.text || ''
        
        setFormData(prev => ({
          ...prev,
          distance: distance,
          duration: duration
        }))
        
        // Generate map preview URL
        const pickup = encodeURIComponent(formData.pickup_location)
        const dropoff = encodeURIComponent(formData.dropoff_location)
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x200&markers=color:red%7C${pickup}&markers=color:blue%7C${dropoff}&path=color:0x0000ff%7Cweight:5%7C${pickup}%7C${dropoff}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        setMapPreviewUrl(mapUrl)
      }
    } catch (error) {
      console.error('Error calculating route:', error)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Calculate booking price
  const calculateBookingPrice = async () => {
    if (!formData.service_name || !formData.vehicle_id) return

    try {
      // Get duration hours for pricing lookup
      // For Airport Transfer services, use fixed values regardless of form data
      let durationHours, serviceDays, hoursPerDay;
      
      if (formData.service_name === 'Airport Transfer Haneda' || formData.service_name === 'Airport Transfer Narita') {
        // Airport Transfer: Fixed 1 hour duration
        durationHours = 1;
        serviceDays = 1;
        hoursPerDay = 1;
      } else {
        // Charter Services: Use form data
        durationHours = formData.duration_hours || 1;
        serviceDays = formData.service_days || 1;
        hoursPerDay = formData.hours_per_day;
      }

      const response = await fetch('/api/bookings/calculate-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type_id: availableServices.find(s => s.name === formData.service_name)?.id,
          vehicle_id: formData.vehicle_id,
          duration_hours: durationHours,
          service_days: serviceDays,
          hours_per_day: hoursPerDay,
        }),
      })

      if (response.ok) {
        const pricing = await response.json()
        setCalculatedPrice(pricing)
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    }
  }

  // Trigger price calculation when relevant data changes
  useEffect(() => {
    if (formData.service_name && formData.vehicle_id) {
      calculateBookingPrice()
    }
  }, [formData.service_name, formData.vehicle_id, formData.duration_hours, formData.service_days, formData.hours_per_day])

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.customer_email || !formData.service_name || !formData.pickup_location || !formData.dropoff_location) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await createBookingAction(formData as Booking)
      
      if (result.success) {
        setSaveResult({ success: true, message: 'Booking created successfully!' })
        // Redirect to bookings list after successful creation
        setTimeout(() => {
          router.push('/bookings')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading booking form...</span>
        </div>
      </div>
    )
  }

  return (
    <GoogleMapsProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
      libraries={['places']}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full mx-auto">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-3 sm:p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <h1 className="text-2xl font-semibold">Create New Booking</h1>
            <p className="text-base text-muted-foreground">
              Fill in the details below to create a new vehicle booking
            </p>
          </div>
        </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-full">
                Pending
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {saveResult?.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-300">{saveResult.message}</span>
              </div>
            </div>
          )}

          {/* Main Form Card */}
          <Card className="border rounded-lg shadow-sm dark:border-gray-800">
            <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 py-4">
              <CardTitle className="text-lg">Create new booking information</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                  <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="route" 
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs">Route</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="services" 
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                    >
                      <Car className="h-4 w-4" />
                      <span className="text-xs">Vehicles</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="client" 
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-xs">Client</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="additional" 
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Additional</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-none border-t-2 border-transparent data-[state=active]:border-primary text-white"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Preview</span>
                    </TabsTrigger>
              </TabsList>
                </div>

                <div className="p-3 sm:p-6 pb-2 space-y-6">
                  {/* Route Tab */}
                  <TabsContent value="route" className="mt-0 space-y-6">
                <ServiceSelection 
                  formData={formData}
                      availableServices={availableServices}
                      handleSelectChange={handleSelectChange}
                    />

                    <ServiceDuration 
                      formData={formData}
                      setFormData={setFormData}
                      setServiceDataCache={setServiceDataCache}
                  handleInputChange={handleInputChange}
                />

                    <RouteInformationTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                      isGoogleMapsKeyConfigured={isGoogleMapsKeyConfigured}
                      isCalculatingRoute={isCalculatingRoute}
                  calculateRoute={calculateRoute}
                />
              </TabsContent>

                  {/* Services Tab */}
                  <TabsContent value="services" className="mt-0 space-y-6">
                    <VehicleSelectionTab 
                  formData={formData}
                      setFormData={setFormData}
                      availableCategories={availableCategories}
                  vehiclesWithCategories={vehiclesWithCategories}
                  vehicleFilters={vehicleFilters}
                  setVehicleFilters={setVehicleFilters}
                      filteredVehicles={filteredVehicles}
                      getFilterOptions={getFilterOptions}
                    />
              </TabsContent>

                  {/* Client Tab */}
                  <TabsContent value="client" className="mt-0 space-y-6">
                    <ClientDetailsTab 
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </TabsContent>

                  {/* Additional Tab */}
                  <TabsContent value="additional" className="mt-0 space-y-6">
                    <AdditionalInfoTab 
                  formData={formData}
                  handleInputChange={handleInputChange}
                      handleSelectChange={handleSelectChange}
                      availableDrivers={availableDrivers}
                    />
                  </TabsContent>
                  
                  {/* Preview Tab */}
                  <TabsContent value="preview" className="mt-0 space-y-6">
                    <PreviewTab
                      formData={formData}
                      calculatedPrice={calculatedPrice}
                  couponDiscount={couponDiscount}
                  paymentOptions={paymentOptions}
                  setPaymentOptions={setPaymentOptions}
                      availableDrivers={availableDrivers}
                      isSaving={isSaving}
                      isGeneratingPayment={isGeneratingPayment}
                      isSendingEmail={isSendingEmail}
                      handleSubmit={handleSubmit}
                      setActiveTab={setActiveTab}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex items-center justify-between p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const tabs = ['route', 'services', 'client', 'additional', 'preview']
                    const currentIndex = tabs.indexOf(activeTab)
                    const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1]
                    setActiveTab(previousTab)
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const tabs = ['route', 'services', 'client', 'additional', 'preview']
                    const currentIndex = tabs.indexOf(activeTab)
                    const nextTab = tabs[currentIndex + 1] || tabs[0]
                    setActiveTab(nextTab)
                  }}
                  disabled={activeTab === 'preview'}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              {activeTab === 'preview' && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('additional')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Edit
                  </Button>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSaving || isGeneratingPayment || isSendingEmail}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Booking
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
          </div>

          {/* Ride Summary Sidebar */}
            <RideSummary
              formData={formData}
              calculatedPrice={calculatedPrice}
          couponDiscount={couponDiscount}
              mapPreviewUrl={mapPreviewUrl}
          setActiveTab={setActiveTab}
            />
      </div>
    </GoogleMapsProvider>
  )
}
