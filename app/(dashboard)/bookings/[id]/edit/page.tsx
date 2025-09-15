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
import { UpgradeDowngradeModal } from '@/components/bookings/upgrade-downgrade-modal'

export default function EditBookingPage() {
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
    originalVehicleId?: string | null;
    selectedVehicle?: VehicleWithCategory;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    coupon_code?: string;
    created_by?: string | null;
    upgradeDowngradeData?: any;
    upgradeDowngradeConfirmed?: boolean;
    upgradeDowngradeAction?: 'upgrade' | 'downgrade';
    upgradeDowngradeCouponCode?: string;
    isFreeUpgrade?: boolean;
    refundCouponDiscount?: number;
  }>>({})
  const [upgradeDowngradeData, setUpgradeDowngradeData] = useState<any>(null)
  const [showUpgradeDowngradeModal, setShowUpgradeDowngradeModal] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('route')
  const [refundCouponDiscount, setRefundCouponDiscount] = useState(0)
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
  const [originalServiceName, setOriginalServiceName] = useState<string>('')
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState({
    baseAmount: 0,
    timeBasedAdjustment: 0,
    adjustedBaseAmount: 0,
    appliedTimeBasedRule: null,
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

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [bccEmails, setBccEmails] = useState('booking@japandriver.com')
  const [sendLanguage, setSendLanguage] = useState<'en' | 'ja'>('en')
  
  // Progress modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressTitle, setProgressTitle] = useState('')
  
  // Team selection state
  const [currentTeam, setCurrentTeam] = useState<'japan' | 'thailand'>('thailand')

  const { t } = useI18n()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Check if Google Maps API key is configured
  const isGoogleMapsKeyConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Define tabs for mobile navigation
  const tabs = [
    { id: 'route', name: 'Route & Services', icon: MapPin },
    { id: 'services', name: 'Vehicles', icon: Car },
    { id: 'client', name: 'Client Details', icon: User },
    { id: 'additional', name: 'Pricing & Payment', icon: DollarSign },
    { id: 'preview', name: 'Preview & Save', icon: Eye },
  ]

  // Filter vehicles based on selected filters
  const filteredVehicles = useMemo(() => {
    return vehiclesWithCategories.filter(vehicle => {
      const matchesCategory = !vehicleFilters.category || vehicle.category_name === vehicleFilters.category
      const matchesBrand = !vehicleFilters.brand || vehicle.brand === vehicleFilters.brand
      const matchesModel = !vehicleFilters.model || (vehicle.model || '').toLowerCase().includes(vehicleFilters.model.toLowerCase())
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

  // Fetch booking data
  useEffect(() => {
    async function loadBooking() {
      setIsLoading(true)
      try {
        const { booking: loadedBooking } = await getBookingById(id)
        
        if (!loadedBooking) {
          setError('Booking not found')
          setBooking(null)
        } else {
          setBooking(loadedBooking)
          
          // Extract flight number and terminal - prioritize direct database fields first
          let flightNumber = loadedBooking.flight_number || '';
          let terminal = loadedBooking.terminal || '';
          
          // If not found in direct fields, check meta data
          if (!flightNumber) {
            flightNumber = loadedBooking.meta?.chbs_flight_number || '';
            
            // If still not found, check form element fields
            if (!flightNumber && loadedBooking.meta?.chbs_form_element_field && Array.isArray(loadedBooking.meta.chbs_form_element_field)) {
              const flightField = loadedBooking.meta.chbs_form_element_field.find(
                (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
              );
              if (flightField?.value) flightNumber = flightField.value;
            }
          }
          
          if (!terminal) {
            terminal = loadedBooking.meta?.chbs_terminal || '';
            
            // If still not found, check form element fields
            if (!terminal && loadedBooking.meta?.chbs_form_element_field && Array.isArray(loadedBooking.meta.chbs_form_element_field)) {
              const terminalField = loadedBooking.meta.chbs_form_element_field.find(
                (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
              );
              if (terminalField?.value) terminal = terminalField.value;
            }
          }
          
          // Extract basic service type from complex service name
          let extractedServiceName = loadedBooking.service_name || '';
          if (extractedServiceName.includes('Airport Transfer Haneda')) {
            extractedServiceName = 'Airport Transfer Haneda';
          } else if (extractedServiceName.includes('Airport Transfer Narita')) {
            extractedServiceName = 'Airport Transfer Narita';
          } else if (extractedServiceName.includes('Charter Services') || extractedServiceName.includes('Charter')) {
            extractedServiceName = 'Charter Services';
          }
          
          // Store the original service name for comparison
          setOriginalServiceName(extractedServiceName);
          
          // Initialize form data with existing booking data
          const initialFormData = {
            ...loadedBooking,
            service_name: extractedServiceName,
            customer_name: loadedBooking.customer_name || loadedBooking.customer?.name || '',
            customer_email: loadedBooking.customer_email || loadedBooking.customer?.email || '',
            customer_phone: loadedBooking.customer_phone || loadedBooking.customer?.phone || '',
            flight_number: flightNumber,
            terminal: terminal,
            hours_per_day: loadedBooking.hours_per_day || 1,
            duration_hours: loadedBooking.duration_hours || 1,
            service_days: loadedBooking.service_days || 1,
            number_of_passengers: loadedBooking.number_of_passengers || undefined,
            number_of_bags: loadedBooking.number_of_bags || undefined,
            driver_id: loadedBooking.driver_id || undefined,
            vehicle_id: loadedBooking.vehicle_id || undefined,
            originalVehicleId: loadedBooking.vehicle_id || undefined, // Store original vehicle ID
            coupon_code: loadedBooking.coupon_code || '',
            status: loadedBooking.status || 'pending',
            team_location: loadedBooking.team_location || 'thailand'
          }
          
          // Cache the service data to prevent it from being reset by service switching logic
          if (extractedServiceName) {
            console.log('Loading booking data:', {
              service_days: loadedBooking.service_days,
              hours_per_day: loadedBooking.hours_per_day,
              duration_hours: loadedBooking.duration_hours,
              service_name: extractedServiceName
            });
            
            setServiceDataCache(prevCache => ({
              ...prevCache,
              [extractedServiceName]: {
                duration_hours: loadedBooking.duration_hours || 1,
                hours_per_day: loadedBooking.hours_per_day || 1,
                service_days: loadedBooking.service_days || 1,
                selectedVehicle: null // Will be set when vehicle is loaded
              }
            }));
          }
          
          setFormData(initialFormData)
          
          // Set current team based on booking
          setCurrentTeam(loadedBooking.team_location || 'thailand')
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

  // Set selected vehicle when vehicles are loaded and booking has a vehicle_id
  useEffect(() => {
    if (vehiclesWithCategories.length > 0 && formData.vehicle_id) {
      const selectedVehicle = vehiclesWithCategories.find(v => v.id === formData.vehicle_id)
      if (selectedVehicle && (!formData.selectedVehicle || formData.selectedVehicle.id !== selectedVehicle.id)) {
        setFormData(prev => ({
          ...prev,
          selectedVehicle: selectedVehicle
        }))
      }
    }
  }, [vehiclesWithCategories, formData.vehicle_id])


  // Sync team selection with form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      team_location: currentTeam
    }))
  }, [currentTeam])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Smart vehicle filtering based on passenger and bag counts
      if (name === 'number_of_passengers' || name === 'number_of_bags') {
        const passengers = name === 'number_of_passengers' ? parseInt(value) || 0 : (newData.number_of_passengers || 0)
        const bags = name === 'number_of_bags' ? parseInt(value) || 0 : (newData.number_of_bags || 0)
        
        // Auto-set vehicle filters for smart filtering
        if (passengers > 0) {
          setVehicleFilters(prev => ({
            ...prev,
            minPassengers: passengers.toString()
          }))
        }
        
        if (bags > 0) {
          setVehicleFilters(prev => ({
            ...prev,
            minLuggage: bags.toString()
          }))
        }
      }
      
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

  // Handle vehicle change with upgrade/downgrade detection
  const handleVehicleChange = (pricingData: any) => {
    console.log('Vehicle change detected:', pricingData);
    console.log('Original service name:', originalServiceName);
    console.log('Current service name:', formData.service_name);
    
    // Check if service type has changed from original quotation
    const serviceTypeChanged = originalServiceName && formData.service_name && 
      originalServiceName !== formData.service_name;
    
    if (serviceTypeChanged) {
      console.log('🚫 Service type changed from original quotation, skipping upgrade/downgrade logic');
      // Don't show upgrade/downgrade modal when service type has changed
      // Just update the form data without upgrade/downgrade logic
      setFormData(prev => ({
        ...prev,
        upgradeDowngradeData: null // Clear any existing upgrade/downgrade data
      }));
      return;
    }
    
    // If selecting back to original vehicle, reset all upgrade/downgrade data
    if (pricingData.isOriginalVehicle) {
      console.log('🔄 Resetting to original vehicle pricing');
      setUpgradeDowngradeData(null);
      setFormData(prev => ({
        ...prev,
        upgradeDowngradeData: null,
        upgradeDowngradeConfirmed: false,
        upgradeDowngradeAction: undefined,
        upgradeDowngradeCouponCode: undefined,
        isFreeUpgrade: false
      }));
      return;
    }
    
    setUpgradeDowngradeData(pricingData);
    
    // Update form data with new pricing
    setFormData(prev => ({
      ...prev,
      upgradeDowngradeData: pricingData
    }));
    
    // Show modal if there's a price difference
    if (pricingData.priceDifference !== 0) {
      setShowUpgradeDowngradeModal(true);
    }
  }

  // Handle upgrade/downgrade confirmation
  const handleUpgradeDowngradeConfirm = async (action: 'upgrade' | 'downgrade', couponCode?: string) => {
    if (!upgradeDowngradeData) return;

    // Just close the modal and keep the pricing data
    // The actual payment/coupon generation will happen in the preview tab
    setShowUpgradeDowngradeModal(false);
    setUpgradeDowngradeData(null);
    
    // Update the form data to mark this as confirmed
    setFormData(prev => ({
      ...prev,
      upgradeDowngradeConfirmed: true,
      upgradeDowngradeAction: action,
      upgradeDowngradeCouponCode: couponCode,
      isFreeUpgrade: couponCode === 'free'
    }));
  }

  // Handle payment actions from preview tab - now handled directly in PaymentModal
  const handlePaymentAction = async (action: 'upgrade-only' | 'full-quote', emailData?: any) => {
    // This is now handled directly in the PaymentModal component
    console.log('Payment action triggered:', action, emailData)
  }

  // Handle select changes
  const handleSelectChange = (field: string, value: string) => {
    // Convert "none" to null for driver_id
    const processedValue = field === 'driver_id' && value === 'none' ? null : value
    setFormData(prev => ({ ...prev, [field]: processedValue }))
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
    if (!formData.service_name || !formData.vehicle_id) {
      console.log('❌ Price calculation skipped - missing required data:', {
        service_name: formData.service_name,
        vehicle_id: formData.vehicle_id
      });
      return;
    }

    console.log('💰 Calculating price for edit booking:', {
      service_name: formData.service_name,
      vehicle_id: formData.vehicle_id,
      availableServices: availableServices.length
    });

    try {
      // Get duration hours for pricing lookup
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
          tax_percentage: formData.tax_percentage || 10,
          discount_percentage: formData.discount_percentage || 0,
          coupon_code: formData.coupon_code || '',
          pickup_date: formData.date,
          pickup_time: formData.time,
        }),
      })

      if (response.ok) {
        const pricing = await response.json()
        console.log('✅ Price calculated successfully for edit booking:', pricing);
        setCalculatedPrice(pricing)
      } else {
        console.error('❌ Price calculation failed:', await response.text());
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    }
  }

  // Trigger price calculation when relevant data changes
  useEffect(() => {
    if (formData.service_name && formData.vehicle_id && availableServices.length > 0) {
      console.log('🔄 Triggering price calculation for edit booking:', {
        service_name: formData.service_name,
        vehicle_id: formData.vehicle_id,
        availableServices: availableServices.length
      });
      calculateBookingPrice()
    }
  }, [formData.service_name, formData.vehicle_id, formData.duration_hours, formData.service_days, formData.hours_per_day, formData.tax_percentage, formData.discount_percentage, formData.coupon_code, formData.date, formData.time, availableServices])

  // Auto-generate map preview when booking is loaded with existing locations
  useEffect(() => {
    if (formData.pickup_location && formData.dropoff_location && !mapPreviewUrl) {
      const pickup = encodeURIComponent(formData.pickup_location)
      const dropoff = encodeURIComponent(formData.dropoff_location)
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x200&markers=color:red%7C${pickup}&markers=color:blue%7C${dropoff}&path=color:0x0000ff%7Cweight:5%7C${pickup}%7C${dropoff}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      setMapPreviewUrl(mapUrl)
    }
  }, [formData.pickup_location, formData.dropoff_location, mapPreviewUrl])

  // Save changes
  const handleSave = async (sendPaymentLink = false) => {
    setIsSaving(true)
    setSaveResult(null)
    
    try {
      const result = await updateBookingAction(id, formData)
      
      if (result.success) {
        // If payment is required and method is send_payment_link, generate and send payment link
        if (sendPaymentLink && paymentOptions.requiresPayment && paymentOptions.paymentMethod === 'send_payment_link') {
          setProgressTitle('Updating Booking & Sending Payment Link')
          setProgressLabel('Updating booking...')
          setProgressValue(15)
          setIsProgressModalOpen(true)
          
          try {
            setProgressLabel('Generating payment link...')
            setProgressValue(60)
            
            // Generate payment link for booking
            const paymentResponse = await fetch('/api/bookings/regenerate-payment-link', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingId: id,
                customer_email: formData.customer_email,
                customer_name: formData.customer_name,
                custom_payment_name: paymentOptions.customPaymentName || `${formData.service_name} - ${formData.pickup_location} to ${formData.dropoff_location}`,
                language: sendLanguage,
                amount: calculatedPrice.totalAmount,
                bcc_emails: bccEmails
              })
            })

            if (paymentResponse.ok) {
              const paymentResult = await paymentResponse.json()
              setProgressValue(100)
              setProgressLabel('Completed!')
              setSaveResult({ 
                success: true, 
                message: `Booking updated successfully! Payment link sent to ${formData.customer_email}` 
              })
              
              // Close progress modal after a short delay
              setTimeout(() => {
                setIsProgressModalOpen(false)
                router.push(`/bookings/${id}?refresh=${Date.now()}`)
              }, 1000)
            } else {
              setProgressValue(100)
              setProgressLabel('Booking updated, but email failed')
              setSaveResult({ 
                success: true, 
                message: 'Booking updated successfully! However, payment link could not be sent.' 
              })
              
              setTimeout(() => {
                setIsProgressModalOpen(false)
                router.push(`/bookings/${id}?refresh=${Date.now()}`)
              }, 2000)
            }
          } catch (paymentError) {
            console.error('Error generating payment link:', paymentError)
            setProgressValue(100)
            setProgressLabel('Booking updated, but email failed')
            setSaveResult({ 
              success: true, 
              message: 'Booking updated successfully! However, payment link could not be sent.' 
            })
            
            setTimeout(() => {
              setIsProgressModalOpen(false)
              router.push(`/bookings/${id}?refresh=${Date.now()}`)
            }, 2000)
          }
        } else {
          setSaveResult({ success: true, message: 'Booking updated successfully!' })
          // Redirect to booking details after successful update
          setTimeout(() => {
            router.push(`/bookings/${id}?refresh=${Date.now()}`)
          }, 2000)
        }
      } else {
        setSaveResult({ success: false, message: 'Failed to update booking' })
        if (sendPaymentLink) {
          setIsProgressModalOpen(false)
        }
      }
    } catch (error) {
      setSaveResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update booking' 
      })
      if (sendPaymentLink) {
        setIsProgressModalOpen(false)
      }
    } finally {
      setIsSaving(false)
    }
  }


  // Get status color
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
    <GoogleMapsProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
      libraries={['places', 'directions']}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full mx-auto">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Page Header */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Edit Booking #{booking.wp_id || id}</h1>
            <div className="w-full h-px bg-border my-6"></div>
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
            <CardHeader className="bg-muted/30 rounded-t-lg border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg font-semibold">
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                    Edit Booking
                  </CardTitle>
                  {!isMobile && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Step {tabs.findIndex(tab => tab.id === activeTab) + 1} of {tabs.length}: {tabs.find(tab => tab.id === activeTab)?.name}
                    </p>
                  )}
                </div>
                <TeamSwitcher
                  currentTeam={currentTeam}
                  onTeamChange={setCurrentTeam}
                  className="ml-4"
                />
              </div>
            </CardHeader>
          
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Desktop/Tablet Tabs */}
                <div className="hidden md:block border-b">
                  <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                    {tabs.map((tab) => (
                      <TabsTrigger 
                        key={tab.id}
                        value={tab.id} 
                        className="flex items-center justify-center gap-2 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <tab.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{tab.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {/* Bottom Fixed Mobile Nav */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-muted/95 dark:bg-muted/95 backdrop-blur-sm border-t z-50">
                  <TabsList className="w-full grid grid-cols-5 p-0 h-auto bg-transparent">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-none border-b-2",
                          "text-muted-foreground data-[state=active]:text-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
                          activeTab === tab.id 
                            ? "border-primary data-[state=active]:border-primary" 
                            : "border-transparent"
                        )}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span className="text-xs leading-tight">{tab.name.split(' ')[0]}</span>
                      </TabsTrigger>
                    ))}
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
                      bookingId={id}
                      originalServiceName={originalServiceName}
                      onVehicleChange={handleVehicleChange}
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
                      calculatedPrice={calculatedPrice}
                      couponDiscount={couponDiscount}
                      paymentOptions={paymentOptions}
                      setPaymentOptions={setPaymentOptions}
                      getStatusColor={getStatusColor}
                      onPaymentAction={handlePaymentAction}
                      isProcessingPayment={isSaving}
                      handleInputChange={handleInputChange}
                      refundCouponDiscount={refundCouponDiscount}
                      setRefundCouponDiscount={setRefundCouponDiscount}
                    />
                  </TabsContent>
                  
                  {/* Preview Tab */}
                  <TabsContent value="preview" className="mt-0 space-y-6">
                    <PreviewTab
                      formData={formData}
                      getStatusColor={getStatusColor}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-4 pb-20 md:pb-4 border-t bg-muted/30 gap-3 sm:gap-4">
              {activeTab !== 'preview' ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
                      const previousTab = tabs[currentIndex - 1] || tabs[tabs.length - 1]
                      setActiveTab(previousTab.id)
                    }}
                    className="w-full sm:w-auto order-2 sm:order-1 gap-2 text-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
                      const nextTab = tabs[currentIndex + 1] || tabs[0]
                      setActiveTab(nextTab.id)
                    }}
                    className="w-full sm:w-auto order-1 sm:order-2 gap-2 text-sm"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('additional')}
                    className="w-full sm:w-auto order-2 sm:order-1 gap-2 text-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Edit
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
                    <Button 
                      onClick={() => handleSave(false)} 
                      disabled={isSaving}
                      variant="outline"
                      className="w-full sm:w-auto gap-2 text-sm"
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
                    
                    {paymentOptions.requiresPayment && (
                      <Button 
                        onClick={() => setIsPaymentModalOpen(true)} 
                        disabled={isSaving}
                        className="w-full sm:w-auto gap-2 text-sm"
                      >
                        <Send className="h-4 w-4" />
                        Save & Send Payment Link
                      </Button>
                    )}
                  </div>
                </>
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
                  refundCouponDiscount={refundCouponDiscount}
                />
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Payment Link to Customer
            </DialogTitle>
            <DialogDescription>
              Configure email settings before sending the payment link to the customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-email">Customer Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.customer_email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email will be sent to the customer's registered email address
              </p>
            </div>
            
            <div>
              <Label htmlFor="bcc-emails">BCC Emails</Label>
              <Input
                id="bcc-emails"
                value={bccEmails}
                onChange={(e) => setBccEmails(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: booking@japandriver.com. Add more emails separated by commas.
              </p>
            </div>
            
            <div>
              <Label>Language</Label>
              <Select value={sendLanguage} onValueChange={(value: 'en' | 'ja') => setSendLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                📧 What's included in the email:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Complete booking details and service information</li>
                <li>• Customer information and contact details</li>
                <li>• Service breakdown and pricing</li>
                <li>• Secure payment link for online payment</li>
                <li>• Company branding and contact information</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                setIsPaymentModalOpen(false);
                // Submit the form with payment link
                await handleSave(true);
              }}
              disabled={isSaving}
              className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving & Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Save & Send Payment Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={isProgressModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{progressTitle}</DialogTitle>
            <DialogDescription className="sr-only">Processing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress value={progressValue} />
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{progressLabel}</span>
              <span className="font-medium text-foreground">{progressValue}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade/Downgrade Modal */}
      <UpgradeDowngradeModal
        isOpen={showUpgradeDowngradeModal}
        onClose={() => {
          setShowUpgradeDowngradeModal(false)
          setUpgradeDowngradeData(null)
        }}
        pricingData={upgradeDowngradeData || {
          currentPrice: 0,
          newPrice: 0,
          priceDifference: 0,
          currency: 'JPY'
        }}
        currentVehicle={vehiclesWithCategories.find(v => v.id === formData.originalVehicleId) || null}
        newVehicle={formData.selectedVehicle || null}
        onConfirm={handleUpgradeDowngradeConfirm}
        isLoading={isSaving}
        bookingId={id}
      />
    </GoogleMapsProvider>
  )
}