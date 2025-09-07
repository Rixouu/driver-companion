'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Booking } from '@/types/bookings'
import { updateBookingAction, getBookingById } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { GoogleMapsProvider } from '@/components/providers/google-maps-provider'
import { TeamSwitcher } from '@/components/team-switcher'

import { 
  ArrowLeft, ArrowRight, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CheckCircle, AlertTriangle, X, Info, Plane, CreditCard, Route, Timer, Calculator, ExternalLink, Settings,
  Eye, Send, DollarSign, Edit
} from 'lucide-react'

// Fetch drivers via a server action to keep service client server-side
import { getVehicles } from '@/lib/services/vehicles'
import { getServiceTypesAction, getPricingCategoriesAction, getVehiclesWithCategoriesAction, ServiceType, PricingCategory, VehicleWithCategory } from '@/app/actions/services'
import type { Driver } from '@/types/drivers'
import type { Vehicle } from '@/types/vehicles'
import type { DbVehicle } from '@/types'

import { useI18n } from '@/lib/i18n/context'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { format, parseISO } from "date-fns";
import { cn } from '@/lib/utils'

// Import all the refactored components from Create Booking
import { ClientDetailsTab } from '@/components/bookings/new-booking/client-details-tab'
import { ServiceSelection } from '@/components/bookings/new-booking/service-selection'
import { ServiceDuration } from '@/components/bookings/new-booking/service-duration'
import { VehicleSelectionTab } from '@/components/bookings/new-booking/vehicle-selection-tab'
import { RouteInformationTab } from '@/components/bookings/new-booking/route-information-tab'
import { AdditionalInfoTab } from '@/components/bookings/new-booking/additional-info-tab'
import { PreviewTab } from '@/components/bookings/new-booking/preview-tab'
import { RideSummary } from '@/components/bookings/new-booking/ride-summary'

export default function EditBookingPageNew() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
    coupon_code?: string;
    created_by?: string | null;
  }>>({})
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('route')
  const [mapPreviewUrl, setMapPreviewUrl] = useState<string | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
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
  const [serviceDataCache, setServiceDataCache] = useState<Record<string, any>>({})
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState({
    baseAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0
  })
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [paymentOptions, setPaymentOptions] = useState({
    requiresPayment: false,
    paymentMethod: 'client_pay' as 'client_pay' | 'send_payment_link',
    customPaymentName: ''
  })
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false)
  const [paymentLinkResult, setPaymentLinkResult] = useState<{ success: boolean; message: string; paymentUrl?: string } | null>(null)

  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Check if Google Maps API key is configured
  const isGoogleMapsKeyConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Filter vehicles based on selected filters
  const filteredVehicles = useMemo(() => {
    return vehiclesWithCategories.filter(vehicle => {
      const matchesCategory = !vehicleFilters.category || vehicle.category_name === vehicleFilters.category
      const matchesBrand = !vehicleFilters.brand || vehicle.brand === vehicleFilters.brand
      const matchesModel = !vehicleFilters.model || vehicle.model.toLowerCase().includes(vehicleFilters.model.toLowerCase())
      const matchesPassengers = !vehicleFilters.minPassengers || vehicle.passenger_capacity >= parseInt(vehicleFilters.minPassengers)
      const matchesLuggage = !vehicleFilters.minLuggage || vehicle.luggage_capacity >= parseInt(vehicleFilters.minLuggage)
      
      return matchesCategory && matchesBrand && matchesModel && matchesPassengers && matchesLuggage
    })
  }, [vehiclesWithCategories, vehicleFilters])

  // Get filter options for dropdowns
  const getFilterOptions = useMemo(() => {
    const categories = [...new Set(vehiclesWithCategories.map(v => v.category_name).filter(Boolean))]
    const brands = [...new Set(vehiclesWithCategories.map(v => v.brand).filter(Boolean))]
    
    return { categories, brands }
  }, [vehiclesWithCategories])

  // Fetch booking data
  useEffect(() => {
    async function loadBooking() {
      setIsLoading(true)
      try {
        const { booking: loadedBooking, error } = await getBookingById(id)
        
        if (error || !loadedBooking) {
          setError(error || 'Booking not found')
          setBooking(null)
        } else {
          setBooking(loadedBooking)
          // Initialize form data with existing booking data
          setFormData({
            ...loadedBooking,
            customer_name: loadedBooking.customer_name || '',
            customer_email: loadedBooking.customer_email || '',
            customer_phone: loadedBooking.customer_phone || '',
            flight_number: loadedBooking.flight_number || '',
            terminal: loadedBooking.terminal || '',
            hours_per_day: loadedBooking.hours_per_day || 1,
            duration_hours: loadedBooking.duration_hours || 1,
            service_days: loadedBooking.service_days || 1,
            driver_id: loadedBooking.driver_id || null,
            vehicle_id: loadedBooking.vehicle_id || null,
            coupon_code: loadedBooking.coupon_code || '',
            status: loadedBooking.status || 'pending',
            team_location: loadedBooking.team_location || 'thailand'
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadBooking()
  }, [id])

  // Load services, categories, and vehicles
  useEffect(() => {
    async function loadData() {
      try {
        const [services, categories, vehicles] = await Promise.all([
          getServiceTypesAction(),
          getPricingCategoriesAction(),
          getVehiclesWithCategoriesAction()
        ])
        
        setAvailableServices(services)
        setAvailableCategories(categories)
        setVehiclesWithCategories(vehicles)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Calculate route distance and duration
  const calculateRoute = async () => {
    if (!formData.pickup_location || !formData.dropoff_location) {
      return
    }

    setIsCalculatingRoute(true)
    try {
      const directionsService = new google.maps.DirectionsService()
      const result = await directionsService.route({
        origin: formData.pickup_location,
        destination: formData.dropoff_location,
        travelMode: google.maps.TravelMode.DRIVING,
      })

      if (result.routes[0]) {
        const route = result.routes[0]
        const leg = route.legs[0]
        
        setFormData(prev => ({
          ...prev,
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || ''
        }))
      }
    } catch (error) {
      console.error('Error calculating route:', error)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Save changes
  const handleSave = async () => {
    setIsSaving(true)
    setSaveResult(null)
    
    try {
      const result = await updateBookingAction(id, formData)
      
      if (result.success) {
        setSaveResult({ success: true, message: 'Booking updated successfully' })
        // Optionally redirect back to booking details
        // router.push(`/bookings/${id}`)
      } else {
        setSaveResult({ success: false, message: result.error || 'Failed to update booking' })
      }
    } catch (error) {
      setSaveResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update booking' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Generate payment link
  const handleGeneratePaymentLink = async () => {
    if (!formData.customer_email) {
      setPaymentLinkResult({ success: false, message: 'Customer email is required to generate payment link' })
      return
    }

    setIsGeneratingPaymentLink(true)
    setPaymentLinkResult(null)

    try {
      const response = await fetch('/api/bookings/regenerate-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: id,
          customer_email: formData.customer_email,
          customer_name: formData.customer_name,
          custom_payment_name: paymentOptions.customPaymentName,
          bccEmails: ['booking@japandriver.com']
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPaymentLinkResult({ 
          success: true, 
          message: 'Payment link generated and sent successfully!',
          paymentUrl: result.paymentUrl
        })
      } else {
        setPaymentLinkResult({ success: false, message: result.error || 'Failed to generate payment link' })
      }
    } catch (error) {
      setPaymentLinkResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate payment link' 
      })
    } finally {
      setIsGeneratingPaymentLink(false)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading booking...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Booking not found'}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <GoogleMapsProvider 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
        libraries={['places', 'directions']}
      >
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 hidden md:flex">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Booking
                </Button>
              </div>
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  <h1 className="text-lg font-semibold">Edit Booking #{booking.wp_id || id}</h1>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(booking.updated_at || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <TeamSwitcher />
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container flex-1 items-start md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            {/* Main Content */}
            <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
              <div className="mx-auto w-full min-w-0">
                <div className="space-y-6">
                  {/* Progress Indicator */}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Edit Booking</span>
                    <span>•</span>
                    <span>Step {['route', 'services', 'client', 'additional', 'preview'].indexOf(activeTab) + 1} of 5</span>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between">
                      <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                        <TabsTrigger 
                          value="route" 
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="hidden sm:inline">Route & Services</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="services" 
                          className="flex items-center gap-2"
                        >
                          <Car className="h-4 w-4" />
                          <span className="hidden sm:inline">Vehicles</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="client" 
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          <span className="hidden sm:inline">Client Details</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="additional" 
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">Additional Info</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="preview" 
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Preview</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="p-3 sm:p-6 pb-2 md:pb-2 pb-20 space-y-6">
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
                          setFormData={setFormData}
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
                      
                      {/* Additional Info Tab */}
                      <TabsContent value="additional" className="mt-0 space-y-6">
                        <AdditionalInfoTab 
                          formData={formData}
                          handleInputChange={handleInputChange}
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
                          getStatusColor={getStatusColor}
                        />
                        
                        {/* Payment Link Generation */}
                        <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                          <div className="border-b py-4 px-6">
                            <h2 className="text-lg font-semibold flex items-center">
                              <CreditCard className="mr-2 h-5 w-5" />
                              Payment Link Generation
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Generate and send a payment link to the customer
                            </p>
                          </div>
                          
                          <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="requiresPayment"
                                checked={paymentOptions.requiresPayment}
                                onChange={(e) => setPaymentOptions(prev => ({ ...prev, requiresPayment: e.target.checked }))}
                                className="rounded"
                                aria-label="Generate payment link for this booking"
                              />
                              <Label htmlFor="requiresPayment" className="text-sm font-medium">
                                Generate payment link for this booking
                              </Label>
                            </div>
                            
                            {paymentOptions.requiresPayment && (
                              <div className="space-y-4 pl-6 border-l-2 border-muted">
                                <div className="space-y-2">
                                  <Label htmlFor="customPaymentName" className="text-sm font-medium">
                                    Payment Description (Optional)
                                  </Label>
                                  <Input
                                    id="customPaymentName"
                                    value={paymentOptions.customPaymentName}
                                    onChange={(e) => setPaymentOptions(prev => ({ ...prev, customPaymentName: e.target.value }))}
                                    placeholder="e.g., Airport Transfer - Tokyo to Narita"
                                    className="text-sm"
                                  />
                                </div>
                                
                                <Button 
                                  onClick={handleGeneratePaymentLink}
                                  disabled={isGeneratingPaymentLink || !formData.customer_email}
                                  className="w-full"
                                  aria-label="Generate and send payment link to customer"
                                >
                                  {isGeneratingPaymentLink ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Generating Payment Link...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Generate & Send Payment Link
                                    </>
                                  )}
                                </Button>
                                
                                {paymentLinkResult && (
                                  <div className={`p-3 rounded-md ${
                                    paymentLinkResult.success 
                                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                  }`}>
                                    <p className={`text-sm ${
                                      paymentLinkResult.success 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-red-800 dark:text-red-200'
                                    }`}>
                                      {paymentLinkResult.message}
                                    </p>
                                    {paymentLinkResult.paymentUrl && (
                                      <div className="mt-2">
                                        <Label className="text-xs font-medium text-green-800 dark:text-green-200">
                                          Payment Link:
                                        </Label>
                                        <Input
                                          value={paymentLinkResult.paymentUrl}
                                          readOnly
                                          className="mt-1 text-xs font-mono"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>

              {/* Ride Summary Sidebar */}
              <div className="hidden text-center xl:block">
                <div className="sticky top-6">
                  <RideSummary 
                    formData={formData}
                    calculatedPrice={calculatedPrice}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      </GoogleMapsProvider>
    </>
  )
}
