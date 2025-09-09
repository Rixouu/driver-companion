'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, Eye, Calendar, Timer, Route, CheckCircle 
} from 'lucide-react'
import { Booking } from '@/types/bookings'
import { VehicleWithCategory } from '@/app/actions/services'

interface RideSummaryProps {
  formData: Partial<Booking & { 
    hours_per_day?: number;
    duration_hours?: number;
    service_days?: number;
    selectedVehicle?: VehicleWithCategory;
  }>
  calculatedPrice: {
    baseAmount: number
    timeBasedAdjustment: number
    adjustedBaseAmount: number
    appliedTimeBasedRule: {
      name: string
      adjustment_percentage: number
      description?: string | null
      start_time: string
      end_time: string
      days_of_week: string[] | null
    } | null
    discountAmount: number
    regularDiscountAmount?: number
    couponDiscountAmount?: number
    taxAmount: number
    totalAmount: number
  }
  couponDiscount: number
  mapPreviewUrl: string | null
  setActiveTab: (tab: string) => void
}

export function RideSummary({ 
  formData, 
  calculatedPrice, 
  couponDiscount, 
  mapPreviewUrl, 
  setActiveTab 
}: RideSummaryProps) {
  return (
    <div className="lg:w-80 w-full">
      <Card className="sticky border rounded-lg shadow-sm dark:border-gray-800" style={{ top: '10.3rem' }}>
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
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">A</div>
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
                    <div className="w-18 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={formData.selectedVehicle.image_url} 
                        alt={`${formData.selectedVehicle.brand} ${formData.selectedVehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-sm flex-1">
                    <div className="font-medium">{formData.selectedVehicle.brand} {formData.selectedVehicle.model}</div>
                    <div className="text-muted-foreground text-xs">Category: {formData.selectedVehicle.category_name || 'Standard'}</div>
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
                
                {/* Time-based adjustment - only show if > 0 */}
                {(calculatedPrice.timeBasedAdjustment || 0) > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span className="text-muted-foreground">
                      {calculatedPrice.appliedTimeBasedRule?.name || 'Time-based adjustment'}
                      {calculatedPrice.appliedTimeBasedRule?.start_time && calculatedPrice.appliedTimeBasedRule?.end_time && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({calculatedPrice.appliedTimeBasedRule.start_time.split(':').slice(0, 2).join(':')}-{calculatedPrice.appliedTimeBasedRule.end_time.split(':').slice(0, 2).join(':')})
                        </span>
                      )}
                    </span>
                    <span>+¥{(calculatedPrice.timeBasedAdjustment || 0).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Regular Discount - only show if > 0 */}
                {(calculatedPrice.regularDiscountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-muted-foreground">Discount ({formData.discount_percentage || 0}%)</span>
                    <span>-¥{(calculatedPrice.regularDiscountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Coupon Discount - only show if > 0 */}
                {(calculatedPrice.couponDiscountAmount || 0) > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span className="text-muted-foreground">Coupon Discount</span>
                    <span>-¥{(calculatedPrice.couponDiscountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                
                {/* Subtotal After Discounts */}
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>¥{((calculatedPrice.adjustedBaseAmount || calculatedPrice.baseAmount) - (calculatedPrice.regularDiscountAmount || 0) - (calculatedPrice.couponDiscountAmount || 0)).toLocaleString()}</span>
                </div>
                
                {/* Tax - only show if > 0 */}
                {(calculatedPrice.taxAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({formData.tax_percentage || 10}%)</span>
                    <span>¥{calculatedPrice.taxAmount.toLocaleString()}</span>
                  </div>
                )}
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
  )
}
