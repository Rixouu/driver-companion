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
  CheckCircle, AlertTriangle, X, Info, Plane, CreditCard, Route, Timer, Calculator, ExternalLink, Settings,
  Eye, Send, DollarSign
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import Image from 'next/image';

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
  
  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState({
    requiresPayment: false,
    paymentMethod: 'client_pay' as 'client_pay' | 'send_payment_link',
    customPaymentName: ''
  })
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  // Pricing calculation state
  const [calculatedPrice, setCalculatedPrice] = useState({
    baseAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: 'JPY',
    priceSource: 'default'
  })
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  
  // Vehicle filters state
  const [vehicleFilters, setVehicleFilters] = useState({
    category: '',
    brand: '',
    model: '',
    minPassengers: '',
    minLuggage: ''
  })

  // Service-specific data persistence
  const [serviceDataCache, setServiceDataCache] = useState<{
    [key: string]: {
      duration_hours?: number;
      hours_per_day?: number;
      service_days?: number;
      selectedVehicle?: any;
    }
  }>({})

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

  // Fetch driver, vehicle, service, and category lists
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

        // Fetch Services
        const servicesResult = await getServiceTypesAction()
        if (servicesResult && servicesResult.length > 0) {
          setAvailableServices(servicesResult)
        }

        // Fetch Pricing Categories
        const categoriesResult = await getPricingCategoriesAction()
        if (categoriesResult && categoriesResult.length > 0) {
          setAvailableCategories(categoriesResult)
        }

        // Fetch Vehicles with Categories
        const vehiclesWithCategoriesResult = await getVehiclesWithCategoriesAction()
        if (vehiclesWithCategoriesResult && vehiclesWithCategoriesResult.length > 0) {
          setVehiclesWithCategories(vehiclesWithCategoriesResult)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load services and vehicles')
      } finally {
        setIsLoading(false)
      }
    }

    loadLists()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
      ...prev,
      [name]: value
      } as any
      
      // Handle service switching with proper data persistence
      if (name === 'service_name') {
        const previousService = prev.service_name;
        const newService = value;
        
        // Save current data to cache before switching
        if (previousService && previousService !== newService) {
          setServiceDataCache(prevCache => ({
            ...prevCache,
            [previousService]: {
              duration_hours: prev.duration_hours,
              hours_per_day: prev.hours_per_day,
              service_days: prev.service_days,
              selectedVehicle: prev.selectedVehicle
            }
          }));
        }
        
        // Always reset data when switching services
        if (previousService !== newService) {
          if (newService === 'Airport Transfer Haneda' || newService === 'Airport Transfer Narita') {
            // Airport Transfer: Set fixed values, clear charter-specific data
            newData.duration_hours = 1
            newData.hours_per_day = 1
            newData.service_days = 1  // Set to 1 instead of undefined
            
            // Force reset to ensure clean state
            newData.duration_hours = 1
            newData.hours_per_day = 1
            newData.service_days = 1
            
            // Restore vehicle selection if available
            const cachedData = serviceDataCache[newService];
            if (cachedData?.selectedVehicle) {
              newData.selectedVehicle = cachedData.selectedVehicle;
            }
          } else if (newService === 'Charter Services') {
            // Charter Services: Restore cached data or set defaults
            const cachedData = serviceDataCache[newService];
            if (cachedData) {
              newData.duration_hours = cachedData.duration_hours || 1;
              newData.hours_per_day = cachedData.hours_per_day || 1;
              newData.service_days = cachedData.service_days || 1;
              newData.selectedVehicle = cachedData.selectedVehicle;
            } else {
              // Set defaults if no cached data
              newData.duration_hours = 1;
              newData.hours_per_day = 1;
              newData.service_days = 1;
            }
          }
        }
      }
      
      // Calculate total duration for charter services
      if (name === 'service_days' || name === 'hours_per_day') {
        if (newData.service_name === 'Charter Services' && newData.service_days && newData.hours_per_day) {
          newData.duration_hours = newData.service_days * newData.hours_per_day
        }
      }
      
      // Also recalculate duration when switching to charter services
      if (name === 'service_name' && newData.service_name === 'Charter Services') {
        if (newData.service_days && newData.hours_per_day) {
          newData.duration_hours = newData.service_days * newData.hours_per_day
        }
      }
      
      // Update cache for current service when relevant fields change
      if (newData.service_name && (name === 'duration_hours' || name === 'hours_per_day' || name === 'service_days' || name === 'selectedVehicle')) {
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

      return newData
    })
  }

  const handleSelectChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Update cache for current service when relevant fields change
      if (newData.service_name && (field === 'duration_hours' || field === 'hours_per_day' || field === 'service_days' || field === 'selectedVehicle')) {
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

      return newData;
    })
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

            // Generate map preview
            const mapElement = document.createElement('div');
            mapElement.style.width = '100%';
            mapElement.style.height = '200px';
            
            const map = new window.google.maps.Map(mapElement, {
              center: { lat: 0, lng: 0 },
              zoom: 2
            });
            
            const directionsRenderer = new window.google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
            
            // Convert map to image using Google Maps Static API approach
            const pickupLocation = formData.pickup_location || '';
            const dropoffLocation = formData.dropoff_location || '';
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
            const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x200&path=color:0x0000ff|weight:5|${encodeURIComponent(pickupLocation)}|${encodeURIComponent(dropoffLocation)}&markers=color:red|label:A|${encodeURIComponent(pickupLocation)}&markers=color:red|label:B|${encodeURIComponent(dropoffLocation)}&key=${apiKey}`;
            setMapPreviewUrl(mapUrl);
          } else {
            alert(`Could not calculate route: ${status}`);
          }
        }
      );
    } else {
      alert('Google Maps is not loaded yet. Please try again in a moment.');
    }
  };

  // Calculate pricing for the booking using Supabase data
  const calculateBookingPrice = async () => {
    if (!formData.service_name || !formData.selectedVehicle) {
      return;
    }

    try {
      // Get service type ID
      const serviceTypeMap = {
        'Airport Transfer Haneda': 'a2538c63-bad1-4523-a234-a708b03744b4',
        'Airport Transfer Narita': '296804ed-3879-4cfc-b7dd-e57d18df57a2',
        'Charter Services': '212ea0ed-0012-4d87-8722-b1145495a561'
      };

      const serviceTypeId = serviceTypeMap[formData.service_name as keyof typeof serviceTypeMap];
      if (!serviceTypeId) return;

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

      // Query pricing from Supabase
      const response = await fetch('/api/bookings/calculate-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type_id: serviceTypeId,
          vehicle_id: formData.selectedVehicle.id,
          duration_hours: durationHours,
          service_days: serviceDays,
          hours_per_day: hoursPerDay,
          discount_percentage: couponDiscount,
          tax_percentage: 10, // 10% Japanese tax
          coupon_code: couponCode,
          date_time: formData.date && formData.time ? new Date(`${formData.date}T${formData.time}`).toISOString() : undefined
        })
      });

      if (response.ok) {
        const pricingData = await response.json();
        setCalculatedPrice({
          baseAmount: pricingData.baseAmount,
          discountAmount: pricingData.discountAmount,
          taxAmount: pricingData.taxAmount,
          totalAmount: pricingData.totalAmount,
          currency: 'JPY',
          priceSource: pricingData.priceSource
        });
      } else {
        // Fallback to basic calculation
        calculateBasicPrice();
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      calculateBasicPrice();
    }
  };

  // Fallback basic pricing calculation
  const calculateBasicPrice = () => {
    let baseAmount = 0;
    
    // Basic pricing based on service type and vehicle category
    if (formData.service_name === 'Airport Transfer Haneda' || formData.service_name === 'Airport Transfer Narita') {
      baseAmount = 32000; // Basic airport transfer price
    } else if (formData.service_name === 'Charter Services') {
      baseAmount = 16000; // Basic charter price
    }
    
    // Apply discount
    const discountAmount = baseAmount * (couponDiscount / 100);
    const amountAfterDiscount = baseAmount - discountAmount;
    
    // Apply tax (10% Japanese tax)
    const taxAmount = amountAfterDiscount * 0.1;
    const totalAmount = amountAfterDiscount + taxAmount;
    
    setCalculatedPrice({
      baseAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      currency: 'JPY',
      priceSource: 'fallback'
    });
  };

  // Validate coupon code
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponDiscount(0);
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() })
      });

      if (response.ok) {
        const couponData = await response.json();
        setCouponDiscount(couponData.discount_percentage || 0);
      } else {
        setCouponDiscount(0);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponDiscount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Recalculate price when relevant data changes
  useEffect(() => {
    if (formData.service_name && formData.selectedVehicle) {
      calculateBookingPrice();
    }
  }, [formData.service_name, formData.selectedVehicle, formData.distance, formData.duration_hours, formData.service_days, formData.hours_per_day, couponDiscount]);

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
        // If payment is required and method is send_payment_link, generate and send payment link
        if (paymentOptions.requiresPayment && paymentOptions.paymentMethod === 'send_payment_link') {
          setIsSendingEmail(true)
          try {
            // Generate payment link for booking
            const paymentResponse = await fetch('/api/bookings/generate-payment-link', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                booking_id: result.bookingId,
                customer_email: formData.customer_email,
                customer_name: formData.customer_name,
                custom_payment_name: paymentOptions.customPaymentName || `${formData.service_name} - ${formData.pickup_location} to ${formData.dropoff_location}`,
                language: 'en',
                amount: calculatedPrice.totalAmount
              })
            })

            if (paymentResponse.ok) {
              const paymentResult = await paymentResponse.json()
              setSaveResult({ 
                success: true, 
                message: `Booking created successfully! Payment link sent to ${formData.customer_email}` 
              })
            } else {
              setSaveResult({ 
                success: true, 
                message: 'Booking created successfully! However, payment link could not be sent.' 
              })
            }
          } catch (paymentError) {
            console.error('Error sending payment link:', paymentError)
            setSaveResult({ 
              success: true, 
              message: 'Booking created successfully! However, payment link could not be sent.' 
            })
          } finally {
            setIsSendingEmail(false)
          }
        } else {
          setSaveResult({ success: true, message: 'Booking created successfully!' })
        }
        
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
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
            <Badge 
              className={`text-sm px-3 py-1 ${getStatusColor(formData.status || 'pending')}`}
            >
              {(formData.status || 'pending').charAt(0).toUpperCase() + (formData.status || 'pending').slice(1)}
            </Badge>
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
              <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="route" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Route & Services</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
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
                <TabsTrigger 
                  value="preview" 
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-white whitespace-nowrap"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview & Create</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Bottom Fixed Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t z-50">
              <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-transparent">
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
                  <span className="text-xs">Extra</span>
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
              {/* Client Details Tab - First */}
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
              
              {/* Vehicle Selection Tab - Second */}
              <TabsContent value="services" className="mt-0 space-y-6">

                {/* Vehicle Selection by Category */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Car className="mr-2 h-5 w-5" />
                      Select Your Vehicle
                    </h2>
                  </div>
                  
                  {/* Vehicle Filters */}
                  <div className="border-b bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
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
                                <Badge variant="outline" className="text-xs">
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
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        vehicle_id: vehicle.id,
                                        selectedVehicle: vehicle
                                      }))
                                    }}
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
                                        <h4 className="font-semibold text-sm">
                                          {vehicle.brand} {vehicle.model}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                          {vehicle.year} • {vehicle.name}
                                        </p>
                                        
                                        {/* Capacity Info */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>{vehicle.passenger_capacity || 0} passengers</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            <span>{vehicle.luggage_capacity || 0} luggage</span>
                                          </div>
                                        </div>
                                        
                                        {/* Select Button */}
                                        <Button
                                          variant={formData.vehicle_id === vehicle.id ? "default" : "outline"}
                                          size="sm"
                                          className="w-full mt-3"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setFormData(prev => ({
                                              ...prev,
                                              vehicle_id: vehicle.id,
                                              selectedVehicle: vehicle
                                            }))
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
                      <div className="p-8 border rounded-lg bg-muted/30 text-center">
                        <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No vehicle categories available. Please add vehicles and categories first.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              {/* Route Information Tab - Third */}
              <TabsContent value="route" className="mt-0 space-y-6">
                {/* Service Selection - First in Route Tab */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Car className="mr-2 h-5 w-5" />
                      Service Selection
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Service Type Selection */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Service Type *</h3>
                        {availableServices.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableServices.map((service) => (
                              <div 
                                key={service.id}
                              className={`
                                border rounded-md p-3 cursor-pointer transition-all flex flex-col items-center
                                  ${formData.service_name === service.name ? 'border-2 ring-2 border-primary ring-primary/20 bg-primary/5' : 'hover:border-primary'}
                                `}
                                onClick={() => handleSelectChange('service_name', service.name)}
                              >
                                <Car className={`h-5 w-5 mb-1 ${formData.service_name === service.name ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-medium text-sm text-center">{service.name}</span>
                            </div>
                          ))}
                        </div>
                        ) : (
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">No services available. Please add services first.</p>
                      </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Service Duration - Show when service type is selected */}
                {formData.service_name && (
                  <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                    <div className="border-b py-4 px-6">
                      <h2 className="text-lg font-semibold flex items-center">
                        <Timer className="mr-2 h-5 w-5" />
                        Service Duration
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      {/* Show different fields based on service type */}
                      {formData.service_name === 'Airport Transfer Haneda' || formData.service_name === 'Airport Transfer Narita' ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Airport Transfer Service</span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Duration is automatically set to 1 hour for airport transfer services.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-muted-foreground">
                                <Timer className="h-4 w-4" />
                                Hours Per Day
                              </Label>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                                <span className="text-sm font-medium">1 hour (Fixed)</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2 text-muted-foreground">
                                <Calculator className="h-4 w-4" />
                                Duration (Hours)
                              </Label>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                                <span className="text-sm font-medium">1 hour (Fixed)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : formData.service_name === 'Charter Services' ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">Charter Service</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Please specify the number of days and hours per day for your charter service.
                            </p>
                      </div>
                      
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                              <Label htmlFor="service_days" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Number of Days
                              </Label>
                        <Input
                                id="service_days"
                                name="service_days"
                                type="number"
                                min="1"
                                max="30"
                                value={formData.service_days || ''}
                          onChange={handleInputChange}
                                placeholder="e.g. 3"
                          className="transition-all focus:ring-2 focus:border-primary"
                        />
                      </div>
                            
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                Hours Per Day
                              </Label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => (
                                  <button
                                    key={hours}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => {
                                        const newData = { ...prev, hours_per_day: hours };
                                        
                                        // Calculate total duration for charter services
                                        if (newData.service_name === 'Charter Services' && newData.service_days && newData.hours_per_day) {
                                          newData.duration_hours = newData.service_days * newData.hours_per_day;
                                        }
                                        
                                        // Update cache for current service
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
                                        
                                        return newData;
                                      });
                                    }}
                                    className={`
                                      h-auto py-2 px-2 flex flex-col items-center justify-center text-center transition-all text-xs border rounded
                                      ${formData.hours_per_day === hours 
                                        ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary' 
                                        : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                                      }
                                    `}
                                  >
                                    <span className="font-medium">{hours}h</span>
                                  </button>
                                ))}
                    </div>
                            </div>
                          </div>
                          
                          {formData.service_days && formData.hours_per_day && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                                <Calculator className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Total Duration: {formData.service_days} days × {formData.hours_per_day} hours = {formData.service_days * formData.hours_per_day} total hours
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                  </div>
                </Card>
                )}
              
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
                    {/* Date and Time Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Pickup Date *</h3>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Pickup Time *</h3>
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          value={formData.time || ''}
                          onChange={handleInputChange}
                          className="transition-all focus:ring-2 focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Location Section */}
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
                              title="Route map from pickup to dropoff location"
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
              

              
              {/* Additional Info Tab */}
              <TabsContent value="additional" className="mt-0 space-y-6">
                {/* Booking Status */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Booking Status
                    </h2>
                  </div>
                  
                  <div className="p-6">
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
                  </div>
                </Card>
              
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

                {/* Coupon Code */}
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      Coupon & Discount
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="coupon_code" className="text-sm font-medium">
                          Coupon Code
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="coupon_code"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              if (e.target.value.trim()) {
                                validateCoupon(e.target.value);
                              } else {
                                setCouponDiscount(0);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => validateCoupon(couponCode)}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                            className="px-4"
                          >
                            {isValidatingCoupon ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                        {couponDiscount > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Coupon applied: {couponDiscount}% discount
                          </p>
                        )}
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

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-0 space-y-6">
                <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                  <div className="border-b py-4 px-6">
                    <h2 className="text-lg font-semibold flex items-center">
                      <Eye className="mr-2 h-5 w-5" />
                      Booking Preview
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review all information before creating the booking
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        Client Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                          <p className="text-sm">{formData.customer_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <p className="text-sm">{formData.customer_email || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                          <p className="text-sm">{formData.customer_phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                          <Badge className={`text-sm px-3 py-1 ${getStatusColor(formData.status || 'pending')}`}>
                            {(formData.status || 'pending').charAt(0).toUpperCase() + (formData.status || 'pending').slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Service Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <MapPin className="mr-2 h-5 w-5" />
                        Service Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Service Name</Label>
                          <p className="text-sm">{formData.service_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                          <p className="text-sm">
                            {formData.date && formData.time 
                              ? `${new Date(formData.date).toLocaleDateString()} at ${formData.time}`
                              : 'Not provided'
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Pickup Location</Label>
                          <p className="text-sm">{formData.pickup_location || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Dropoff Location</Label>
                          <p className="text-sm">{formData.dropoff_location || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Distance</Label>
                          <p className="text-sm">{formData.distance || 'Not calculated'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                          <p className="text-sm">{formData.duration || 'Not calculated'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Vehicle & Driver Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Car className="mr-2 h-5 w-5" />
                        Vehicle & Driver
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Selected Vehicle</Label>
                          <p className="text-sm">
                            {formData.selectedVehicle 
                              ? `${formData.selectedVehicle.brand} ${formData.selectedVehicle.model} (${formData.selectedVehicle.plate_number})`
                              : 'Not selected'
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Driver</Label>
                          <p className="text-sm">
                            {formData.driver_id 
                              ? availableDrivers.find(d => d.id === formData.driver_id)?.full_name || 'Selected'
                              : 'Not assigned'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Flight Information */}
                    {(formData.flight_number || formData.terminal) && (
                      <>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center">
                            <Plane className="mr-2 h-5 w-5" />
                            Flight Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Flight Number</Label>
                              <p className="text-sm">{formData.flight_number || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Terminal</Label>
                              <p className="text-sm">{formData.terminal || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Notes */}
                    {formData.notes && (
                      <>
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            Notes & Instructions
                          </h3>
                          <p className="text-sm bg-muted p-3 rounded-md">{formData.notes}</p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Payment Options */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <DollarSign className="mr-2 h-5 w-5" />
                        Payment Options
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requiresPayment"
                            checked={paymentOptions.requiresPayment}
                            onChange={(e) => setPaymentOptions(prev => ({ ...prev, requiresPayment: e.target.checked }))}
                            className="rounded"
                            aria-label="This booking requires payment"
                          />
                          <Label htmlFor="requiresPayment" className="text-sm font-medium">
                            This booking requires payment
                          </Label>
                        </div>
                        
                        {paymentOptions.requiresPayment && (
                          <div className="space-y-4 pl-6 border-l-2 border-muted">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Payment Method</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="client_pay"
                                    name="paymentMethod"
                                    value="client_pay"
                                    checked={paymentOptions.paymentMethod === 'client_pay'}
                                    onChange={(e) => setPaymentOptions(prev => ({ ...prev, paymentMethod: e.target.value as 'client_pay' | 'send_payment_link' }))}
                                    className="rounded"
                                    aria-label="Client will pay directly"
                                  />
                                  <Label htmlFor="client_pay" className="text-sm">
                                    Client will pay directly
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="send_payment_link"
                                    name="paymentMethod"
                                    value="send_payment_link"
                                    checked={paymentOptions.paymentMethod === 'send_payment_link'}
                                    onChange={(e) => setPaymentOptions(prev => ({ ...prev, paymentMethod: e.target.value as 'client_pay' | 'send_payment_link' }))}
                                    className="rounded"
                                    aria-label="Send payment link via email"
                                  />
                                  <Label htmlFor="send_payment_link" className="text-sm">
                                    Send payment link via email
                                  </Label>
                                </div>
                              </div>
                            </div>
                            
                            {paymentOptions.paymentMethod === 'send_payment_link' && (
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
                            )}
                          </div>
                        )}
                      </div>
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
              {activeTab !== 'preview' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const tabs = ['route', 'services', 'client', 'additional', 'preview']
                      const currentIndex = tabs.indexOf(activeTab)
                      const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1]
                      setActiveTab(previousTab)
                    }}
                    disabled={activeTab === 'route'}
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
                </>
              )}
              
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
            </div>
          </CardFooter>
        </Card>
        </div>

        {/* Ride Summary Sidebar */}
        <div className="lg:w-80 w-full">
          <Card className="sticky border rounded-lg shadow-sm dark:border-gray-800" style={{ top: '11.2rem' }}>
            <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 py-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Ride Summary
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('preview')}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              {/* Service Type */}
              {formData.service_name && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Service Type</h4>
                    <div className="text-sm">
                      <div className="font-medium">{formData.service_name}</div>
                      {formData.service_name === 'Charter Services' && formData.duration_hours && (
                        <div className="text-muted-foreground text-xs">
                          {formData.duration_hours} hour{formData.duration_hours > 1 ? 's' : ''}
                          {formData.service_days && formData.service_days > 1 && ` × ${formData.service_days} day${formData.service_days > 1 ? 's' : ''}`}
                        </div>
                      )}
                      {(formData.service_name === 'Airport Transfer Haneda' || formData.service_name === 'Airport Transfer Narita') && (
                        <div className="text-muted-foreground text-xs">
                          Fixed duration service
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Route Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <span className="text-muted-foreground truncate">{formData.pickup_location || 'Pickup location'}</span>
                </div>
                <div className="ml-3 border-l-2 border-dashed border-muted-foreground h-4"></div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">B</div>
                  <span className="text-muted-foreground truncate">{formData.dropoff_location || 'Dropoff location'}</span>
                </div>
              </div>

              <Separator />

              {/* Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span>{formData.date ? new Date(formData.date).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                  <span>{formData.time || 'Not set'}</span>
                </div>
              </div>

              <Separator />

              {/* Distance & Duration */}
              {(formData.distance || formData.duration) && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Distance:</span>
                      <span>{formData.distance || 'Not calculated'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formData.duration || 'Not calculated'}</span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Vehicle Information with Image */}
              {formData.selectedVehicle && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Selected Vehicle</h4>
                    <div className="flex gap-3">
                      {formData.selectedVehicle.image_url && (
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={formData.selectedVehicle.image_url} 
                            alt={`${formData.selectedVehicle.brand} ${formData.selectedVehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="text-sm flex-1">
                        <div className="font-medium">{formData.selectedVehicle.brand} {formData.selectedVehicle.model}</div>
                        <div className="text-muted-foreground">{formData.selectedVehicle.category_name || 'Standard'}</div>
                        <div className="text-muted-foreground text-xs">
                          {formData.selectedVehicle.passenger_capacity} passengers • {formData.selectedVehicle.luggage_capacity} luggage
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Map Preview */}
              {formData.pickup_location && formData.dropoff_location && (
                <>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Route Map</h4>
                    <div className="w-full h-36 bg-muted rounded-md overflow-hidden">
                      {mapPreviewUrl ? (
                        <img 
                          src={mapPreviewUrl} 
                          alt="Route map"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          <div className="text-center">
                            <Route className="h-6 w-6 mx-auto mb-1" />
                            <div>Calculate route to see map</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Pricing Breakdown */}
              {calculatedPrice.totalAmount > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Pricing Breakdown</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span>¥{calculatedPrice.baseAmount.toLocaleString()}</span>
                    </div>
                    
                    {calculatedPrice.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-muted-foreground">Discount ({couponDiscount}%)</span>
                        <span>-¥{calculatedPrice.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>¥{calculatedPrice.taxAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">¥{calculatedPrice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Benefits</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Meet & Greet included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Free waiting time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Safe and secure travel</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GoogleMapsProvider>
  )
}
