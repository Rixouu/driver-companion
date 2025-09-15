'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Timer, Calculator, Calendar, Info } from 'lucide-react'
import { Booking } from '@/types/bookings'

interface ServiceDurationProps {
  formData: Partial<Booking & { 
    hours_per_day?: number;
    duration_hours?: number;
    service_days?: number;
  }>
  setFormData: React.Dispatch<React.SetStateAction<any>>
  setServiceDataCache: React.Dispatch<React.SetStateAction<any>>
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function ServiceDuration({ 
  formData, 
  setFormData, 
  setServiceDataCache, 
  handleInputChange 
}: ServiceDurationProps) {
  if (!formData.service_name) return null

  // Debug logging for service duration values
  console.log('ServiceDuration component received:', {
    service_name: formData.service_name,
    service_days: formData.service_days,
    hours_per_day: formData.hours_per_day,
    duration_hours: formData.duration_hours
  });

  return (
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
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Airport Transfer Service</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
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
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Charter Service</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
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
                        setFormData((prev: any) => {
                          const newData = { ...prev, hours_per_day: hours };
                          
                          // Calculate total duration for charter services
                          if (newData.service_name === 'Charter Services' && newData.service_days && newData.hours_per_day) {
                            newData.duration_hours = newData.service_days * newData.hours_per_day;
                          }
                          
                          // Update cache for current service
                          if (newData.service_name) {
                            setServiceDataCache((prevCache: any) => ({
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
  )
}
