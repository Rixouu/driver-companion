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
  CreditCard, CheckCircle, AlertTriangle, Plane, Route, Timer, Info,
  ExternalLink, X, Mail, Phone, MessageSquare, Calculator, Edit
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
    billing_country: ''
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
        if (driversResult.drivers) {
          setAvailableDrivers(driversResult.drivers)
        }
        
        // Fetch Vehicles
        const vehiclesResult = await getVehicles()
        if (vehiclesResult.vehicles) {
          setAvailableVehicles(vehiclesResult.vehicles)
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <GoogleMapsProvider>
      <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Create New Booking
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create a new vehicle booking
          </p>
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

        {/* Booking Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Booking Information
              </CardTitle>
              <CardDescription>
                Fill in the details for the new booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Label className="text-base font-medium">Customer Information</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name || ''}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      required
                      value={formData.customer_email || ''}
                      onChange={(e) => handleInputChange('customer_email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">Phone</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      value={formData.customer_phone || ''}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_name">Service Name *</Label>
                    <Input
                      id="service_name"
                      required
                      value={formData.service_name || ''}
                      onChange={(e) => handleInputChange('service_name', e.target.value)}
                      placeholder="Enter service name"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label className="text-base font-medium">Service Details</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      required
                      value={formData.time || ''}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <Label className="text-base font-medium">Location Information</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_location">Pickup Location</Label>
                    <Input
                      id="pickup_location"
                      value={formData.pickup_location || ''}
                      onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                      placeholder="Enter pickup location"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dropoff_location">Dropoff Location</Label>
                    <Input
                      id="dropoff_location"
                      value={formData.dropoff_location || ''}
                      onChange={(e) => handleInputChange('dropoff_location', e.target.value)}
                      placeholder="Enter dropoff location"
                    />
                  </div>
                </div>
              </div>

              {/* Driver and Vehicle Assignment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <Label className="text-base font-medium">Driver & Vehicle Assignment</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver_id">Driver</Label>
                    <Select
                      value={formData.driver_id || ''}
                      onValueChange={(value) => handleInputChange('driver_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No driver assigned</SelectItem>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.first_name} {driver.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Vehicle</Label>
                    <Select
                      value={formData.vehicle_id || ''}
                      onValueChange={(value) => handleInputChange('vehicle_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No vehicle assigned</SelectItem>
                        {availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} ({vehicle.plate_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Booking
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </GoogleMapsProvider>
  )
}
