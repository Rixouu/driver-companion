'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calculator, Eye, MapPin, Clock, Users, Plane, Calendar, Car } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { format } from 'date-fns'
import { useCurrency } from '@/lib/services/currency-service'

interface QuotationSummaryProps {
  formData: any
  serviceItems: any[]
  calculatedPrice?: {
    baseAmount: number
    discountAmount: number
    taxAmount: number
    totalAmount: number
    currency: string
  }
  selectedPackage?: any
  selectedPromotion?: any
  setActiveTab?: (tab: string) => void
  selectedCurrency?: string
}

export function QuotationSummary({ 
  formData, 
  serviceItems, 
  calculatedPrice,
  selectedPackage,
  selectedPromotion,
  setActiveTab,
  selectedCurrency = 'JPY'
}: QuotationSummaryProps) {
  const { t } = useI18n()
  
  // Use the same currency service as pricing step
  const { formatCurrency: dynamicFormatCurrency, convertCurrency } = useCurrency(selectedCurrency)

  const formatCurrency = (amount: number, currency: string = selectedCurrency) => {
    // Convert from JPY to selected currency if needed
    if (selectedCurrency !== 'JPY') {
      const convertedAmount = convertCurrency(amount, 'JPY', selectedCurrency)
      return dynamicFormatCurrency(convertedAmount, selectedCurrency)
    }
    return dynamicFormatCurrency(amount, 'JPY')
  }

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not selected'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'MMM dd, yyyy')
  }

  const formatTime = (time: string) => {
    if (!time) return 'Not selected'
    return time
  }

  return (
    <div className="lg:w-80 w-full">
      <Card className="sticky border rounded-lg shadow-sm dark:border-gray-800" style={{ top: '10.3rem' }}>
        <CardHeader className="bg-muted/30 rounded-t-lg border-b px-4 py-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quotation Summary
            </span>
            {setActiveTab && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('preview')}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4">
          {/* Service Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Service Details</h3>
            
            {serviceItems.length > 0 ? (
              <div className="space-y-3">
                {serviceItems.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg border border-muted">
                    {/* Service Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                          {item.service_type_name?.toLowerCase().includes('airport') ? (
                            <Plane className="h-4 w-4 text-primary" />
                          ) : (
                            <Car className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{item.service_type_name || 'Service'}</span>
                      </div>
                    </div>

                    {/* Vehicle and Duration */}
                    <div className="space-y-2 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        <span className="font-medium">{item.vehicle_type || 'Vehicle not selected'}</span>
                      </div>
                      {item.pickup_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.pickup_date)}</span>
                          {item.pickup_time && <span> at {formatTime(item.pickup_time)}</span>}
                        </div>
                      )}
                      {item.service_days && item.hours_per_day ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.service_days} days × {item.hours_per_day}h/day</span>
                        </div>
                      ) : item.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{item.duration_hours} hour(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Flight Information - only show for Airport Transfer services */}
                    {(item.flight_number || item.terminal) && 
                     item.service_type_name?.toLowerCase().includes('airport') && (
                      <div className="pt-2 border-t border-muted">
                        <div className="text-xs text-muted-foreground mb-2">Flight Details:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.flight_number && (
                            <div className="flex items-center gap-1">
                              <Plane className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">{item.flight_number}</span>
                            </div>
                          )}
                          {item.terminal && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">{item.terminal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Passenger and Bag Details - for all services */}
                    {(item.number_of_passengers || item.number_of_bags) && (
                      <div className="pt-2 pb-2 border-t border-muted">
                        <div className="text-xs text-muted-foreground mb-2">Passenger & Bag Details:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.number_of_passengers && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">{item.number_of_passengers} passengers</span>
                            </div>
                          )}
                          {item.number_of_bags && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">{item.number_of_bags} bags</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location Information */}
                    {(item.pickup_location || item.dropoff_location) && (
                      <div className="pt-2 pb-2 border-t border-muted">
                        <div className="text-xs text-muted-foreground mb-2">Locations:</div>
                        <div className="space-y-3 text-xs">
                          {item.pickup_location && (
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                                <div className="w-0.5 h-4 bg-muted-foreground/30 mt-1"></div>
                              </div>
                              <div className="flex-1">
                                <div className="text-green-600 font-medium text-xs mb-1">Pickup location</div>
                                <div className="text-muted-foreground text-xs break-words">{item.pickup_location}</div>
                              </div>
                            </div>
                          )}
                          {item.dropoff_location && (
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
                              </div>
                              <div className="flex-1">
                                <div className="text-red-600 font-medium text-xs mb-1">Dropoff location</div>
                                <div className="text-muted-foreground text-xs break-words">{item.dropoff_location}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No services added yet
              </div>
            )}
          </div>

          {/* Live Price Breakdown */}
          {serviceItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">Price Breakdown</h3>
              <div className="space-y-2">
                {serviceItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.service_type_name || 'Service'}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.total_price || item.unit_price || 0, selectedCurrency)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-base font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-white">
                    {formatCurrency(
                      serviceItems.reduce((sum, item) => sum + (item.total_price || item.unit_price || 0), 0),
                      selectedCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          {calculatedPrice && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">Pricing Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Amount:</span>
                  <span>{formatCurrency(calculatedPrice.baseAmount, selectedCurrency)}</span>
                </div>
                {calculatedPrice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{selectedPromotion ? 'Promotion' : 'Discount'}:</span>
                    <span>-{formatCurrency(calculatedPrice.discountAmount, selectedCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-white">
                  <span>Tax ({((calculatedPrice.taxAmount / (calculatedPrice.baseAmount - calculatedPrice.discountAmount)) * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(calculatedPrice.taxAmount, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculatedPrice.totalAmount, selectedCurrency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Package/Promotion Info */}
          {(selectedPackage || selectedPromotion) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground">Applied Offers</h3>
              <div className="space-y-2">
                {selectedPackage && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">Package Selected</div>
                    <div className="text-xs text-muted-foreground">{selectedPackage.name}</div>
                  </div>
                )}
                {selectedPromotion && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Promotion Applied</div>
                    <div className="text-xs text-muted-foreground">{selectedPromotion.name}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
