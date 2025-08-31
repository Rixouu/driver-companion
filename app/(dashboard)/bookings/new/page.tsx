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
import { 
  ArrowLeft, Save, Loader2, Calendar, User, MapPin, FileText, Car, 
  CheckCircle, AlertTriangle, X, Info
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
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
            <TabsContent value="route" className="mt-0 space-y-4">
              <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                <div className="border-b py-3 sm:py-4 px-4 sm:px-6">
                  <h2 className="text-base sm:text-lg font-semibold flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Route Information
                  </h2>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Pickup Location</h3>
                      <Input
                        id="pickup_location"
                        name="pickup_location"
                        value={formData.pickup_location || ''}
                        onChange={handleInputChange}
                        className="transition-all focus:ring-2 focus:border-primary"
                        placeholder="Enter pickup location"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Dropoff Location</h3>
                      <Input
                        id="dropoff_location"
                        name="dropoff_location"
                        value={formData.dropoff_location || ''}
                        onChange={handleInputChange}
                        className="transition-all focus:ring-2 focus:border-primary"
                        placeholder="Enter dropoff location"
                      />
                    </div>
                  </div>
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
                </div>
              </Card>
            </TabsContent>
            
            {/* Additional Info Tab */}
            <TabsContent value="additional" className="mt-0 space-y-6">
              <Card className="border rounded-lg shadow-sm dark:border-gray-800">
                <div className="border-b py-4 px-6">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Additional Information
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Driver Assignment</h3>
                      <Select
                        value={formData.driver_id || 'none'}
                        onValueChange={(value) => handleSelectChange('driver_id', value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="transition-all focus:ring-2 focus:border-primary">
                          <SelectValue placeholder="Select a driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No driver assigned</SelectItem>
                          {availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.first_name} {driver.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Vehicle Assignment</h3>
                      <Select
                        value={formData.vehicle_id || 'none'}
                        onValueChange={(value) => handleSelectChange('vehicle_id', value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="transition-all focus:ring-2 focus:border-primary">
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No vehicle assigned</SelectItem>
                          {availableVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} ({vehicle.plate_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleInputChange}
                        className="transition-all focus:ring-2 focus:border-primary"
                        placeholder="Enter any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
