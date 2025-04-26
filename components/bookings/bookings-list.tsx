'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { formatDate } from '@/lib/utils/formatting'
import { Booking } from '@/types/bookings'
import { getBookings } from '@/app/actions/bookings'
import { ApiConfigHelper } from './api-config-helper'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
// Import commented out to prevent showing the setup helper
// import { SetupHelper } from './setup-helper'

interface BookingsListProps {
  limit?: number
  search?: string
  view?: "list" | "grid"
  currentPage?: number
  onPageChange?: (page: number) => void
}

const ITEMS_PER_PAGE = 10

export function BookingsList({ 
  limit = 10, 
  search = '', 
  view = 'list',
  currentPage = 1,
  onPageChange = () => {}
}: BookingsListProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'all'
  const [showDebug, setShowDebug] = useState(false)
  const [showConfigHelper, setShowConfigHelper] = useState(false)
  // Setup helper state removed to avoid triggering the helper view
  // const [showSetupHelper, setShowSetupHelper] = useState(false)

  // Function to view booking details
  const handleViewBooking = (bookingId: string | number) => {
    // Ensure ID is consistently formatted as string
    const formattedId = String(bookingId).trim()
    console.log(`Navigating to booking details: ${formattedId}`)
    // Navigate to the booking details page
    router.push(`/bookings/${formattedId}`)
  }

  useEffect(() => {
    async function loadBookings() {
      try {
        setIsLoading(true)
        setError(null)
        setDebugInfo(null)
        
        const result = await getBookings({ status, limit })
        
        if (result.error) {
          setError(result.error)
          // Auto-show config helper if API path is the issue
          if (result.error.includes('API request failed: 404') || 
              result.error.includes('Failed to connect to any API endpoint')) {
            setShowConfigHelper(true)
          }
        }
        
        if (result.debug) {
          setDebugInfo(result.debug)
          console.log('API Debug Info:', result.debug)
        }
        
        setBookings(result.bookings || [])
        setTotalPages(Math.ceil((result.bookings?.length || 0) / ITEMS_PER_PAGE))
      } catch (err) {
        setError('Failed to load bookings. Please try again.')
        console.error('Error fetching bookings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [status, limit])

  // Filter bookings by search term
  const filteredBookings = bookings.filter(booking => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    const matchesServiceName = booking.service_name?.toLowerCase().includes(searchLower)
    const matchesId = booking.id.toString().toLowerCase().includes(searchLower)
    const matchesVehicle = booking.vehicle?.make?.toLowerCase().includes(searchLower) || 
                           booking.vehicle?.model?.toLowerCase().includes(searchLower) ||
                           booking.vehicle?.year?.toString().toLowerCase().includes(searchLower)
    
    return matchesServiceName || matchesId || matchesVehicle
  })
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const calculatedTotalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) || 1

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(limit || 5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (showConfigHelper && debugInfo) {
    return (
      <ApiConfigHelper 
        debugInfo={debugInfo} 
        onClose={() => setShowConfigHelper(false)} 
      />
    )
  }

  // Setup helper conditional removed to prevent showing it
  /*
  if (showSetupHelper) {
    return <SetupHelper />
  }
  */

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-300 dark:border-red-700">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  <Icons.arrowPath className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {debugInfo && (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      {showDebug ? 'Hide' : 'Show'} Debug Info
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => setShowConfigHelper(true)}
                    >
                      Configure API
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {showDebug && debugInfo && (
          <Card className="border-gray-300 dark:border-gray-700 overflow-auto">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (filteredBookings.length === 0) {
    return (
      <EmptyState
        title="No bookings found"
        description="You don't have any bookings yet or none match your current filters."
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Icons.arrowPath className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
              onClick={() => handleViewBooking(booking.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.service_name || 'Vehicle Service'}</CardTitle>
                    <CardDescription className="mt-1">
                      Booking ID: {booking.id}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    }
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Icons.calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(booking.date)} at {booking.time}</span>
                  </div>
                  {booking.vehicle && (
                    <div className="text-gray-600 dark:text-gray-400">
                      Vehicle: {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year ? `(${booking.vehicle.year})` : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>{formatDate(booking.date)} at {booking.time}</TableCell>
                  <TableCell>{booking.service_name || 'Vehicle Service'}</TableCell>
                  <TableCell>
                    {booking.vehicle 
                      ? `${booking.vehicle.make} ${booking.vehicle.model}` 
                      : 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewBooking(booking.id)
                      }}
                    >
                      View Details
                      <Icons.chevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Pagination */}
      {filteredBookings.length > ITEMS_PER_PAGE && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(currentPage - 1)
                  }}
                />
              </PaginationItem>
            )}
            {[...Array(calculatedTotalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(i + 1)
                  }}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            {currentPage < calculatedTotalPages && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(currentPage + 1)
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
      
      {debugInfo && (
        <div className="mt-8 text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowConfigHelper(true)}
          >
            Configure WordPress API
          </Button>
        </div>
      )}
    </div>
  )
} 