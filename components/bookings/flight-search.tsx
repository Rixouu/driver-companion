'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Plane, Clock, MapPin, X } from 'lucide-react'
import { aeroDataBoxService } from '@/lib/aerodatabox'
import { FlightSearchResult } from '@/types/aviation'
import { cn } from '@/lib/utils'

interface FlightSearchProps {
  value?: string
  onSelect: (flight: FlightSearchResult | null) => void
  onFlightSelect?: (flight: FlightSearchResult) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
}

export function FlightSearch({
  value = '',
  onSelect,
  onFlightSelect,
  placeholder = 'Search for flights...',
  label = 'Flight Search',
  required = false,
  className
}: FlightSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [results, setResults] = useState<FlightSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<FlightSearchResult | null>(null)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const performSearch = async (term: string) => {
    if (!term.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const flights = await aeroDataBoxService.searchFlightsByNumber(term)
      setResults(flights)
      setIsOpen(true)
    } catch (err) {
      console.error('Flight search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search flights')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (flight: FlightSearchResult) => {
    setSelectedFlight(flight)
    setSearchTerm(flight.flightNumber)
    setIsOpen(false)
    onSelect(flight)
    
    // Call onFlightSelect with pickup date and time if provided
    if (onFlightSelect) {
      const pickupTime = formatPickupTime(flight.arrival.scheduled)
      onFlightSelect({
        ...flight,
        pickupDate: pickupTime.date,
        pickupTime: pickupTime.time
      })
    }
  }

  const handleClear = () => {
    setSelectedFlight(null)
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    onSelect(null)
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return dateString
    }
  }

  const formatDateForInput = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const formatTimeForInput = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  const calculatePickupTime = (arrivalTime: string) => {
    try {
      // Add 30 minutes buffer for pickup time after flight arrival
      const arrival = new Date(arrivalTime)
      const pickup = new Date(arrival.getTime() + 30 * 60 * 1000) // 30 minutes later
      return pickup
    } catch {
      return new Date()
    }
  }

  const formatPickupTime = (arrivalTime: string) => {
    try {
      const pickup = calculatePickupTime(arrivalTime)
      return {
        date: formatDateForInput(pickup.toISOString()),
        time: formatTimeForInput(pickup.toISOString())
      }
    } catch {
      return {
        date: '',
        time: ''
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'active':
      case 'enroute':
      case 'in flight':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'landed':
      case 'arrived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700'
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700'
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
      case 'expected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      case 'boarding':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '📅'
      case 'active':
      case 'enroute':
      case 'in flight':
        return '✈️'
      case 'landed':
      case 'arrived':
        return '🛬'
      case 'cancelled':
      case 'canceled':
        return '❌'
      case 'delayed':
        return '⏰'
      case 'expected':
        return '🔮'
      case 'boarding':
        return '🚶‍♂️'
      default:
        return '📋'
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="space-y-2">
        <Label htmlFor="flight-search">{label}</Label>
        <div className="relative">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="flight-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              required={required}
              className="pl-10 pr-10 h-11 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              onFocus={() => {
                if (results.length > 0) {
                  setIsOpen(true)
                }
              }}
            />
            {selectedFlight && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && (results.length > 0 || error) && (
            <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto border shadow-xl bg-background/95 backdrop-blur-sm">
              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {error}
                  </div>
                </div>
              )}
              
              {results.length > 0 ? (
                <div className="p-1">
                  {results.map((flight, index) => (
                    <div
                      key={`${flight.flightNumber}-${index}`}
                      className="p-4 hover:bg-muted/60 cursor-pointer rounded-lg transition-all duration-200 hover:shadow-sm border-b border-border/50 last:border-b-0 group"
                      onClick={() => handleSelect(flight)}
                    >
                      {/* Header with Flight Info and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Plane className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-base">{flight.flightNumber}</div>
                            <div className="text-sm text-muted-foreground font-medium">{flight.airline}</div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(flight.status)} font-semibold px-2.5 py-1 rounded-full border text-xs shadow-sm`}>
                          <span className="mr-1">{getStatusIcon(flight.status)}</span>
                          {flight.status}
                        </Badge>
                      </div>
                      
                      {/* Flight Route Information */}
                      <div className="flex items-center justify-between py-2">
                        {/* Departure */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departure</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground text-sm leading-tight truncate">
                              {flight.departure.airport}
                            </div>
                            {flight.departure.terminal && (
                              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full inline-block border border-blue-200 dark:border-blue-800">
                                Terminal {flight.departure.terminal}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="font-mono font-medium">
                                {formatTime(flight.departure.scheduled)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Flight Path Visual */}
                        <div className="flex items-center justify-center px-4 py-2 mx-2">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                            <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                            <div className="w-8 h-px bg-gradient-to-r from-blue-500 to-green-500 mx-1"></div>
                            <Plane className="h-3 w-3 text-muted-foreground/60" />
                          </div>
                        </div>
                        
                        {/* Arrival */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arrival</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground text-sm leading-tight truncate">
                              {flight.arrival.airport}
                            </div>
                            {flight.arrival.terminal && (
                              <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full inline-block border border-green-200 dark:border-green-800">
                                Terminal {flight.arrival.terminal}
                              </div>
                            )}
                            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                              <span className="font-mono font-medium">
                                {formatTime(flight.arrival.scheduled)}
                              </span>
                              <Clock className="h-3 w-3 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Flight Information */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-3">
                          {/* Aircraft Information */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aircraft:</span>
                            </div>
                            <div className="text-xs">
                              {flight.aircraft?.model ? (
                                <div className="text-foreground font-semibold truncate">
                                  {flight.aircraft.model}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-xs">
                                  Not available
                                </div>
                              )}
                              {flight.aircraft?.registration && (
                                <div className="text-muted-foreground text-xs">
                                  {flight.aircraft.registration}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Flight Duration */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration:</span>
                            </div>
                            <div className="text-xs text-foreground font-semibold">
                              {flight.departure.scheduled && flight.arrival.scheduled && (
                                (() => {
                                  const depTime = new Date(flight.departure.scheduled)
                                  const arrTime = new Date(flight.arrival.scheduled)
                                  const duration = arrTime.getTime() - depTime.getTime()
                                  const hours = Math.floor(duration / (1000 * 60 * 60))
                                  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
                                  return `${hours}h ${minutes}m`
                                })()
                              )}
                            </div>
                          </div>

                          {/* Flight Codes */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details:</span>
                            </div>
                            <div className="text-xs">
                              <div className="text-foreground font-medium">
                                {flight.flightNumber} ({flight.airline})
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !error && !isLoading && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">No flights found</div>
                  <div className="text-xs text-muted-foreground">
                    Try searching for the airline code (e.g., "TG" for Thai Airways) 
                    or check the flight number format
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Selected Flight Display */}
        {selectedFlight && (
          <Card className="p-4 bg-gradient-to-r from-muted/40 to-muted/20 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-base">{selectedFlight.flightNumber}</div>
                  <div className="text-sm text-muted-foreground font-medium">{selectedFlight.airline}</div>
                </div>
              </div>
              <Badge className={`${getStatusColor(selectedFlight.status)} font-semibold px-2.5 py-1 rounded-full border text-xs shadow-sm`}>
                <span className="mr-1">{getStatusIcon(selectedFlight.status)}</span>
                {selectedFlight.status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {/* Flight Route */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departure</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {selectedFlight.departure.airport}
                    </div>
                    {selectedFlight.departure.terminal && (
                      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full inline-block border border-blue-200 dark:border-blue-800">
                        Terminal {selectedFlight.departure.terminal}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="font-mono font-medium">
                        {formatTime(selectedFlight.departure.scheduled)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center px-3 py-1 mx-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                    <div className="w-6 h-px bg-gradient-to-r from-blue-500 to-green-500 mx-1"></div>
                    <Plane className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arrival</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {selectedFlight.arrival.airport}
                    </div>
                    {selectedFlight.arrival.terminal && (
                      <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full inline-block border border-green-200 dark:border-green-800">
                        Terminal {selectedFlight.arrival.terminal}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                      <span className="font-mono font-medium">
                        {formatTime(selectedFlight.arrival.scheduled)}
                      </span>
                      <Clock className="h-3 w-3 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Flight Information */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="grid grid-cols-3 gap-3">
                  {/* Aircraft Information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aircraft:</span>
                    </div>
                    <div className="text-xs">
                      {selectedFlight.aircraft?.model ? (
                        <div className="text-foreground font-semibold truncate">
                          {selectedFlight.aircraft.model}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-xs">
                          Not available
                        </div>
                      )}
                      {selectedFlight.aircraft?.registration && (
                        <div className="text-muted-foreground text-xs">
                          {selectedFlight.aircraft.registration}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flight Duration */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration:</span>
                    </div>
                    <div className="text-xs text-foreground font-semibold">
                      {selectedFlight.departure.scheduled && selectedFlight.arrival.scheduled && (
                        (() => {
                          const depTime = new Date(selectedFlight.departure.scheduled)
                          const arrTime = new Date(selectedFlight.arrival.scheduled)
                          const duration = arrTime.getTime() - depTime.getTime()
                          const hours = Math.floor(duration / (1000 * 60 * 60))
                          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
                          return `${hours}h ${minutes}m`
                        })()
                      )}
                    </div>
                  </div>

                  {/* Flight Codes */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details:</span>
                    </div>
                    <div className="text-xs">
                      <div className="text-foreground font-medium">
                        {selectedFlight.flightNumber} ({selectedFlight.airline})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pickup Information */}
              {selectedFlight.pickupDate && selectedFlight.pickupTime && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Pickup Scheduled</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {selectedFlight.pickupDate} at {selectedFlight.pickupTime} (30min after arrival)
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
