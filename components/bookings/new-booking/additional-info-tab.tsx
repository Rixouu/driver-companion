'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, X, Plane, FileText, User, RefreshCw } from 'lucide-react'
import { Booking } from '@/types/bookings'
import { Driver } from '@/types/drivers'
import { useDrivers } from '@/lib/hooks/use-drivers'
import { Skeleton } from '@/components/ui/skeleton'

interface AdditionalInfoTabProps {
  formData: Partial<Booking & { 
    flight_number?: string;
    terminal?: string;
    driver_id?: string | null;
    upgradeDowngradeData?: any;
    upgradeDowngradeCouponCode?: string;
  }>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (field: string, value: string) => void
}

export function AdditionalInfoTab({ 
  formData, 
  handleInputChange, 
  handleSelectChange
}: AdditionalInfoTabProps) {
  const { drivers: availableDrivers, isLoading: driversLoading, error: driversError, refetch: refetchDrivers } = useDrivers()
  return (
    <div className="space-y-6">
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

      {/* Driver Selection */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                Driver Assignment
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {driversLoading ? 'Loading drivers...' : `Choose from ${availableDrivers.length} available drivers`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchDrivers}
              disabled={driversLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${driversLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {driversError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">{driversError}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Select Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="driver_id">Select Driver (Optional)</Label>
                <Select 
                  value={formData.driver_id || 'none'} 
                  onValueChange={(value) => handleSelectChange('driver_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No driver assigned</SelectItem>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Minimal Drivers Grid */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Drivers ({availableDrivers.length})</Label>
                  {formData.driver_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectChange('driver_id', 'none')}
                      className="text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {driversLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg bg-card">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : availableDrivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No drivers available</p>
                    <p className="text-xs mt-1">Add drivers in the Drivers section</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableDrivers.map((driver) => (
                      <div 
                        key={driver.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all group ${
                          formData.driver_id === driver.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm' 
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleSelectChange('driver_id', driver.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">{driver.full_name}</h3>
                          {formData.driver_id === driver.id && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        {driver.phone && (
                          <p className="text-xs text-muted-foreground truncate">{driver.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Flight Information */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <h2 className="text-lg font-semibold flex items-center">
            <Plane className="mr-2 h-5 w-5" />
            Flight Information
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Optional flight details for airport transfers
          </p>
        </div>
        
        <div className="p-6">
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
        </div>
      </Card>


      {/* Additional Notes */}
      <Card className="border rounded-lg shadow-sm dark:border-gray-800">
        <div className="border-b py-4 px-6">
          <h2 className="text-lg font-semibold flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Additional Information
          </h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions or Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Any special requirements, pickup instructions, or additional information..."
                className="min-h-[100px] transition-all focus:ring-2 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
