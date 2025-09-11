'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { GooglePlaceAutocomplete } from '@/components/bookings/google-place-autocomplete'
import { MapPin, Route, Timer, Loader2, ExternalLink } from 'lucide-react'
import { Booking } from '@/types/bookings'

interface RouteInformationTabProps {
  formData: Partial<Booking>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  setFormData: React.Dispatch<React.SetStateAction<any>>
  isGoogleMapsKeyConfigured: boolean
  isCalculatingRoute: boolean
  calculateRoute: () => void
}

export function RouteInformationTab({
  formData,
  handleInputChange,
  setFormData,
  isGoogleMapsKeyConfigured,
  isCalculatingRoute,
  calculateRoute
}: RouteInformationTabProps) {
  return (
    <div className="space-y-6">
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Pickup Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={handleInputChange}
                  required
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Pickup Time *</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time || ''}
                  onChange={handleInputChange}
                  required
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            {/* Passenger and Bag Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number_of_passengers">Number of Passengers</Label>
                <Input
                  id="number_of_passengers"
                  name="number_of_passengers"
                  type="number"
                  min="1"
                  value={formData.number_of_passengers || ''}
                  onChange={handleInputChange}
                  placeholder="Enter number of passengers"
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number_of_bags">Number of Bags</Label>
                <Input
                  id="number_of_bags"
                  name="number_of_bags"
                  type="number"
                  min="0"
                  value={formData.number_of_bags || ''}
                  onChange={handleInputChange}
                  placeholder="Enter number of bags"
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            {/* Flight Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  name="flight_number"
                  value={formData.flight_number || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., JL123"
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
                  placeholder="e.g., Terminal 1"
                  className="transition-all focus:ring-2 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Pickup Location *</Label>
                {isGoogleMapsKeyConfigured ? (
                  <GooglePlaceAutocomplete
                    id="pickup_location"
                    name="pickup_location"
                    label=""
                    value={formData.pickup_location || ''}
                    onChange={(name, value) => {
                      setFormData(prev => ({ ...prev, [name]: value }))
                    }}
                    placeholder="Enter pickup address"
                    required={false}
                  />
                ) : (
                  <Input
                    id="pickup_location"
                    name="pickup_location"
                    value={formData.pickup_location || ''}
                    onChange={handleInputChange}
                    placeholder="Enter pickup location"
                    required
                    className="transition-all focus:ring-2 focus:border-primary"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoff_location">Dropoff Location *</Label>
                {isGoogleMapsKeyConfigured ? (
                  <GooglePlaceAutocomplete
                    id="dropoff_location"
                    name="dropoff_location"
                    label=""
                    value={formData.dropoff_location || ''}
                    onChange={(name, value) => {
                      setFormData(prev => ({ ...prev, [name]: value }))
                    }}
                    placeholder="Enter dropoff address"
                    required={false}
                  />
                ) : (
                  <Input
                    id="dropoff_location"
                    name="dropoff_location"
                    value={formData.dropoff_location || ''}
                    onChange={handleInputChange}
                    placeholder="Enter dropoff location"
                    required
                    className="transition-all focus:ring-2 focus:border-primary"
                  />
                )}
              </div>
            </div>
            
            {/* Calculate Route Button */}
            {formData.pickup_location && formData.dropoff_location && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={calculateRoute}
                  disabled={isCalculatingRoute}
                  className="flex items-center gap-2"
                >
                  {isCalculatingRoute ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                  {isCalculatingRoute ? 'Calculating...' : 'Calculate Route'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Google Maps Integration */}
        {isGoogleMapsKeyConfigured && formData.pickup_location && formData.dropoff_location && (
          <div className="border-t">
            <div className="p-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Route Preview
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const pickup = encodeURIComponent(formData.pickup_location || '')
                    const dropoff = encodeURIComponent(formData.dropoff_location || '')
                    window.open(`https://www.google.com/maps/dir/${pickup}/${dropoff}`, '_blank')
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in Maps
                </Button>
              </div>
            </div>
            
            <div className="h-64">
              <iframe
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(formData.pickup_location || '')}&destination=${encodeURIComponent(formData.dropoff_location || '')}&mode=driving`}
                className="w-full h-full border-0"
              ></iframe>
            </div>
            
            {/* Distance and Duration Display */}
            {(formData.distance || formData.duration) && (
              <div className="p-4 bg-muted/30 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">{formData.distance}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formData.duration}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
