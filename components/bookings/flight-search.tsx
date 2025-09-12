'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Plane, Clock, MapPin, X } from 'lucide-react'
import { aviationStackService } from '@/lib/aviation-stack'
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
      const flights = await aviationStackService.searchFlightsByNumber(term)
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'landed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="space-y-2">
        <Label htmlFor="flight-search">{label}</Label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="flight-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              required={required}
              className="pl-10 pr-10"
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
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {isOpen && (results.length > 0 || error) && (
            <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto border shadow-lg">
              {error && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((flight, index) => (
                    <div
                      key={`${flight.flightNumber}-${index}`}
                      className="p-3 hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
                      onClick={() => handleSelect(flight)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{flight.flightNumber}</span>
                          <span className="text-sm text-muted-foreground">{flight.airline}</span>
                        </div>
                        <Badge className={getStatusColor(flight.status)}>
                          {flight.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">Departure</span>
                          </div>
                          <div className="font-medium">{flight.departure.airport}</div>
                          {flight.departure.terminal && (
                            <div className="text-xs text-muted-foreground">
                              Terminal {flight.departure.terminal}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {formatTime(flight.departure.scheduled)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">Arrival</span>
                          </div>
                          <div className="font-medium">{flight.arrival.airport}</div>
                          {flight.arrival.terminal && (
                            <div className="text-xs text-muted-foreground">
                              Terminal {flight.arrival.terminal}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {formatTime(flight.arrival.scheduled)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !error && !isLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <div className="mb-2">No exact flight match found</div>
                  <div className="text-xs">
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
          <Card className="p-3 bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedFlight.flightNumber}</span>
                <span className="text-sm text-muted-foreground">{selectedFlight.airline}</span>
              </div>
              <Badge className={getStatusColor(selectedFlight.status)}>
                {selectedFlight.status}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {selectedFlight.departure.airport} → {selectedFlight.arrival.airport}
              {selectedFlight.arrival.terminal && ` (Terminal ${selectedFlight.arrival.terminal})`}
            </div>
            {selectedFlight.pickupDate && selectedFlight.pickupTime && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pickup scheduled for {selectedFlight.pickupDate} at {selectedFlight.pickupTime} (30min after arrival)
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
