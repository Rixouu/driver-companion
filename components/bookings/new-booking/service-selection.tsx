'use client'

import { Card } from '@/components/ui/card'
import { Car } from 'lucide-react'
import { ServiceType } from '@/app/actions/services'
import { Booking } from '@/types/bookings'

interface ServiceSelectionProps {
  formData: Partial<Booking>
  availableServices: ServiceType[]
  handleSelectChange: (field: string, value: string) => void
}

export function ServiceSelection({ formData, availableServices, handleSelectChange }: ServiceSelectionProps) {
  return (
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
  )
}