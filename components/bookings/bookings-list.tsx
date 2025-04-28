'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { formatDate } from '@/lib/utils/formatting'
import { Booking } from '@/types/bookings'
import { getBookings, syncBookingsAction, cancelBookingAction } from '@/app/actions/bookings'
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
import { 
  Grid, 
  List, 
  RefreshCw, 
  Loader2, 
  RotateCw, 
  AlertCircle, 
  Edit, 
  Trash,
  User,
  MapPin,
  Timer,
  Car
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// Import confirmation dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// Import commented out to prevent showing the setup helper
// import { SetupHelper } from './setup-helper'
import { StatusFilter, BookingStatus } from './status-filter'
import { useI18n } from '@/lib/i18n/context'
import { ContactButtons } from './contact-buttons'

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
  view: initialView = 'list',
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
  const [status, setStatus] = useState<BookingStatus>(
    (searchParams.get('status') as BookingStatus) || 'all'
  )
  const [showConfigHelper, setShowConfigHelper] = useState(false)
  const [view, setView] = useState(initialView)
  // State for sync status
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)
  // State for the cancel booking dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string } | null>(null)
  const { t } = useI18n()

  // Function to view booking details
  const handleViewBooking = (bookingId: string | number) => {
    // Ensure ID is consistently formatted as string
    const formattedId = String(bookingId).trim()
    console.log(`Navigating to booking details: ${formattedId}`)
    // Navigate to the booking details page
    router.push(`/bookings/${formattedId}`)
  }

  // Function to handle status change
  const handleStatusChange = (newStatus: BookingStatus) => {
    setStatus(newStatus)
    
    // Update URL with new status
    const params = new URLSearchParams(searchParams)
    if (newStatus !== 'all') {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    router.push(`/bookings?${params.toString()}`)
  }

  // Function to load bookings
  const loadBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Force fresh data on load by setting useFallback to false
      const { bookings: loadedBookings, error: bookingError, debug } = await getBookings({
        status,
        limit: 100, // Get more to handle client-side filtering
        page: 1
      }, false)
      
      if (bookingError) {
        setError(bookingError)
        console.error('Error loading bookings:', bookingError)
      } else {
        setBookings(loadedBookings || [])
        setError(null)
      }
      
      setDebugInfo(debug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
      console.error('Error in loadBookings:', err)
      setBookings([]) // Clear any previous bookings
    } finally {
      setIsLoading(false)
    }
  }

  // Function to sync bookings from WordPress
  const syncBookingsFromWordPress = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncBookingsAction()
      setSyncResult(result)
      
      if (result.success) {
        // Reload bookings after successful sync
        await loadBookings()
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync bookings'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Function to handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBookingId(bookingId)
    setShowCancelDialog(true)
  }

  // Function to confirm cancellation
  const confirmCancellation = async () => {
    if (!cancellingBookingId) return
    
    setIsCancelling(true)
    setCancelResult(null)
    
    try {
      const result = await cancelBookingAction(cancellingBookingId)
      setCancelResult(result)
      
      if (result.success) {
        // Reload bookings after successful cancellation
        await loadBookings()
        // Close the dialog after a short delay
        setTimeout(() => {
          setShowCancelDialog(false)
          setCancellingBookingId(null)
          setCancelResult(null)
        }, 1500)
      }
    } catch (err) {
      setCancelResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to cancel booking'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Load bookings when component mounts or status changes
  useEffect(() => {
    loadBookings()
  }, [status])

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

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('bookings.errors.loadingTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('bookings.sync.title')}</CardTitle>
            <CardDescription>{t('bookings.sync.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('bookings.sync.connectionIssue')}
            </p>
            
            {syncResult && (
              <Alert variant={syncResult.success ? "default" : "destructive"} className="mb-4">
                <AlertTitle>{syncResult.success ? t('bookings.sync.success') : t('bookings.sync.failed')}</AlertTitle>
                <AlertDescription>{syncResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={syncBookingsFromWordPress} 
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('bookings.sync.syncing')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('bookings.sync.syncButton')}
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={loadBookings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('bookings.sync.retrying')}
                  </>
                ) : (
                  <>
                    <RotateCw className="mr-2 h-4 w-4" />
                    {t('bookings.sync.retryButton')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (filteredBookings.length === 0) {
    return (
      <EmptyState
        title={t('bookings.empty.title')}
        description={t('bookings.empty.description')}
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Icons.arrowPath className="h-4 w-4 mr-2" />
            {t('bookings.actions.refresh')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <StatusFilter
            value={status}
            onChange={handleStatusChange}
          />
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={syncBookingsFromWordPress}
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="hidden sm:inline">{t('bookings.actions.sync')}</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setView(view === 'list' ? 'grid' : 'list')}
          >
            {view === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">
              {view === 'list' ? t('bookings.viewOptions.grid') : t('bookings.viewOptions.list')}
            </span>
          </Button>
        </div>
      </div>

      {/* Show sync result message if any */}
      {syncResult && (
        <Alert variant={syncResult.success ? "default" : "destructive"} className="mb-4">
          <AlertTitle>{syncResult.success ? t('bookings.sync.success') : t('bookings.sync.failed')}</AlertTitle>
          <AlertDescription>{syncResult.message}</AlertDescription>
        </Alert>
      )}

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer overflow-hidden"
              onClick={() => handleViewBooking(booking.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}</CardTitle>
                    <CardDescription className="mt-1">
                      {t('bookings.labels.bookingId')}: {booking.id}
                      {booking.service_name && (booking.service_type || booking.meta?.chbs_service_type) && 
                        booking.service_name !== (booking.service_type || booking.meta?.chbs_service_type) && (
                        <p className="mt-0.5">{booking.service_name}</p>
                      )}
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
                    {t(`bookings.status.${booking.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Icons.calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{formatDate(booking.date)} {t('bookings.labels.at')} {booking.time}</span>
                  </div>
                  
                  {/* Customer information */}
                  {booking.customer_name && (
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span>{booking.customer_name}</span>
                        {booking.customer_email && (
                          <span className="text-xs text-muted-foreground">{booking.customer_email}</span>
                        )}
                        {booking.customer_phone && (
                          <span className="text-xs text-muted-foreground">{booking.customer_phone}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Location information */}
                  {(booking.pickup_location || booking.dropoff_location) && (
                    <div className="flex items-start text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        {booking.pickup_location && (
                          <div className="flex items-start">
                            <span className="text-xs font-medium mr-1">{t('bookings.labels.from')}:</span> 
                            <span className="text-xs">{booking.pickup_location}</span>
                          </div>
                        )}
                        {booking.dropoff_location && (
                          <div className="flex items-start mt-1">
                            <span className="text-xs font-medium mr-1">{t('bookings.labels.to')}:</span> 
                            <span className="text-xs">{booking.dropoff_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {booking.vehicle && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Car className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year ? `(${booking.vehicle.year})` : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Distance and duration if available */}
                  {(booking.distance || booking.duration) && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Timer className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div className="flex flex-wrap gap-x-3">
                        {booking.distance && (
                          <span className="text-xs">{booking.distance} {t('bookings.labels.km')}</span>
                        )}
                        {booking.duration && (
                          <span className="text-xs">{booking.duration} {t('bookings.labels.min')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3 px-6 flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/bookings/${booking.id}/edit`);
                  }}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">{t('bookings.details.actions.edit')}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/bookings/${booking.id}/reschedule`);
                  }}
                >
                  <Icons.calendar className="h-4 w-4" />
                  <span className="sr-only">{t('bookings.details.actions.reschedule')}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelBooking(booking.id.toString());
                  }}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">{t('bookings.details.actions.cancel')}</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('bookings.tableHeaders.bookingId')}</TableHead>
                <TableHead>{t('bookings.tableHeaders.dateTime')}</TableHead>
                <TableHead>{t('bookings.tableHeaders.service')}</TableHead>
                <TableHead>{t('bookings.tableHeaders.customer')}</TableHead>
                <TableHead>{t('bookings.tableHeaders.locations')}</TableHead>
                <TableHead>{t('bookings.tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('bookings.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewBooking(booking.id)}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(booking.date)}</span>
                      <span className="text-xs text-muted-foreground">{booking.time}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}</span>
                      {booking.service_name && (booking.service_type || booking.meta?.chbs_service_type) && 
                        booking.service_name !== (booking.service_type || booking.meta?.chbs_service_type) && (
                        <span className="text-xs text-muted-foreground">{booking.service_name}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{booking.customer_name || t('bookings.defaultLabels.notSpecified')}</span>
                      {booking.customer_email && (
                        <span className="text-xs text-muted-foreground">{booking.customer_email}</span>
                      )}
                      {booking.customer_phone && (
                        <span className="text-xs text-muted-foreground">{booking.customer_phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {booking.pickup_location && (
                        <span className="text-xs">
                          <span className="font-medium">{t('bookings.labels.from')}:</span> {booking.pickup_location}
                        </span>
                      )}
                      {booking.dropoff_location && (
                        <span className="text-xs mt-1">
                          <span className="font-medium">{t('bookings.labels.to')}:</span> {booking.dropoff_location}
                        </span>
                      )}
                      {!booking.pickup_location && !booking.dropoff_location && (
                        <span className="text-xs text-muted-foreground">{t('bookings.defaultLabels.noLocationData')}</span>
                      )}
                    </div>
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
                      {t(`bookings.status.${booking.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bookings/${booking.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">{t('bookings.details.actions.edit')}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bookings/${booking.id}/reschedule`);
                        }}
                      >
                        <Icons.calendar className="h-4 w-4" />
                        <span className="sr-only">{t('bookings.details.actions.reschedule')}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id.toString());
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">{t('bookings.details.actions.cancel')}</span>
                      </Button>
                    </div>
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
            {t('bookings.configHelper.button')}
          </Button>
        </div>
      )}

      {/* Cancel booking dialog */}
      {showCancelDialog && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('bookings.cancelDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('bookings.cancelDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('bookings.cancelDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancellation}>{t('bookings.cancelDialog.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel result message */}
      {cancelResult && (
        <Alert variant={cancelResult.success ? "default" : "destructive"} className="mt-4">
          <AlertTitle>{cancelResult.success ? t('bookings.cancelDialog.successTitle') : t('bookings.cancelDialog.errorTitle')}</AlertTitle>
          <AlertDescription>{cancelResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 