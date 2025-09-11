'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, User, MapPin, Car, Plane, FileText
} from 'lucide-react'
import { Booking } from '@/types/bookings'
import { VehicleWithCategory } from '@/app/actions/services'
import { useDrivers } from '@/lib/hooks/use-drivers'

interface PreviewTabProps {
  formData: Partial<Booking & { 
    flight_number?: string;
    terminal?: string;
    driver_id?: string | null;
    selectedVehicle?: VehicleWithCategory;
    upgradeDowngradeData?: any;
    upgradeDowngradeConfirmed?: boolean;
    upgradeDowngradeAction?: 'upgrade' | 'downgrade';
    upgradeDowngradeCouponCode?: string;
  }>
  getStatusColor: (status: string) => string
}

export function PreviewTab({
  formData,
  getStatusColor
}: PreviewTabProps) {
  const { drivers: availableDrivers } = useDrivers()

  return (
    <div className="space-y-6">
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
              {formData.number_of_passengers && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Passengers</Label>
                  <p className="text-sm">{formData.number_of_passengers}</p>
                </div>
              )}
              {formData.number_of_bags && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bags</Label>
                  <p className="text-sm">{formData.number_of_bags}</p>
                </div>
              )}
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

        </div>
      </Card>

    </div>
  )
}
