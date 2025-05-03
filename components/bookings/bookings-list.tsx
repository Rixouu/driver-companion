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
  Car,
  X
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
import { startOfDay, endOfDay } from 'date-fns'

interface BookingsListProps {
  limit?: number
  search?: string
  view?: "list" | "grid"
  currentPage?: number
  onPageChange?: (page: number) => void
  dateRange?: { from?: Date; to?: Date }
  status?: string
}

const ITEMS_PER_PAGE = 10

// Function to generate consistent status badge styling
function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/60 dark:text-green-200 dark:border-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-200 dark:border-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/60 dark:text-red-200 dark:border-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/60 dark:text-gray-200 dark:border-gray-800';
  }
}

export function BookingsList({ 
  limit = 10, 
  search = '', 
  view: initialView = 'list',
  currentPage = 1,
  onPageChange = () => {},
  dateRange,
  status: externalStatus
}: BookingsListProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<BookingStatus>(
    externalStatus as BookingStatus || 
    (searchParams.get('status') as BookingStatus) || 
    'all'
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
  const [isMobile, setIsMobile] = useState(false)

  // Update view when initialView changes
  useEffect(() => {
    setView(initialView);
    console.log("View updated from props:", initialView);
  }, [initialView]);

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

  // Update internal status when externalStatus changes
  useEffect(() => {
    if (externalStatus) {
      setStatus(externalStatus as BookingStatus);
    }
  }, [externalStatus]);

  // Filter bookings by search term and date range
  const filteredBookings = bookings.filter(booking => {
    // Status filter - applied first to avoid unnecessary checks
    if (status !== 'all') {
      // The booking status might be from WordPress (publish, etc.) or our system (confirmed, cancelled, etc.)
      const bookingStatus = booking.status?.toLowerCase();
      const statusFilter = status.toLowerCase();
      
      // Handle WordPress status mapping
      if (statusFilter === 'confirmed') {
        // Only match confirmed status explicitly, not "publish"/"published"
        return bookingStatus === 'confirmed';
      } else if (statusFilter === 'cancelled') {
        // Match both our "cancelled" status and WordPress "trash"/"draft" statuses
        return bookingStatus === 'cancelled' || 
               bookingStatus === 'canceled' || 
               bookingStatus === 'trash' || 
               bookingStatus === 'draft';
      } else {
        // For other statuses, just do direct matching
        return bookingStatus === statusFilter;
      }
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesServiceName = booking.service_name?.toLowerCase().includes(searchLower)
      const matchesId = booking.id.toString().toLowerCase().includes(searchLower)
      const matchesCustomer = booking.customer_name?.toLowerCase().includes(searchLower)
      const matchesVehicle = booking.vehicle?.make?.toLowerCase().includes(searchLower) || 
                            booking.vehicle?.model?.toLowerCase().includes(searchLower) ||
                            booking.vehicle?.year?.toString().toLowerCase().includes(searchLower)
      
      if (!matchesServiceName && !matchesId && !matchesCustomer && !matchesVehicle) {
        return false
      }
    }
    
    // Date range filter
    if (dateRange && dateRange.from) {
      const bookingDate = new Date(booking.date)
      const fromDate = startOfDay(dateRange.from) // Start of day for from date
      
      if (fromDate && bookingDate < fromDate) {
        return false
      }
      
      if (dateRange.to) {
        const toDate = endOfDay(dateRange.to) // End of day for to date
        if (bookingDate > toDate) {
          return false
        }
      }
    }
    
    return true
  })
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const calculatedTotalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) || 1

  // After the component loads bookings or view changes, log the current view state
  useEffect(() => {
    console.log("Current view state in BookingsList:", view);
  }, [view, bookings]);

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileNow = window.innerWidth < 640;
      setIsMobile(isMobileNow);
      
      // Force list view on mobile
      if (isMobileNow && view === 'grid') {
        setView('list');
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [view]);

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
        icon={<Icons.empty className="h-6 w-6" />}
        title={t('bookings.empty.title')}
        description={t('bookings.empty.description')}
        action={
          <Button variant="outline" onClick={() => {
            // Reset to default status
            handleStatusChange('all');
          }}>
            <X className="h-4 w-4 mr-2" />
            {t('bookings.filters.clearFilters')}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Show sync result message if any */}
      {syncResult && (
        <Alert variant={syncResult.success ? "default" : "destructive"} className="mb-4">
          <AlertTitle>{syncResult.success ? t('bookings.sync.success') : t('bookings.sync.failed')}</AlertTitle>
          <AlertDescription>{syncResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Render view based on the current view state and mobile detection */}
      {(() => {
        // Force list view on mobile
        const effectiveView = isMobile ? "list" : view;
        console.log(`Rendering with effectiveView: ${effectiveView}, isMobile: ${isMobile}`);
        
        if (effectiveView === 'grid') {
          return (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Grid view content */}
              {paginatedBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="hover:bg-accent/50 hover:shadow-md dark:hover:bg-gray-900/50 transition-all cursor-pointer overflow-hidden border-opacity-80"
                  onClick={() => handleViewBooking(booking.id)}
                >
                  {/* Card content for grid view */}
                  <CardHeader className="pb-0 relative">
                    <Badge 
                      className={`absolute right-6 top-6 px-3 py-1.5 font-medium ${getStatusBadgeClasses(booking.status)}`}
                    >
                      {t(`bookings.status.${booking.status}`)}
                    </Badge>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}</CardTitle>
                      <CardDescription className="flex items-center">
                        <span className="font-medium text-primary mr-1">#</span>{booking.id}
                        {booking.service_name && (booking.service_type || booking.meta?.chbs_service_type) && 
                          booking.service_name !== (booking.service_type || booking.meta?.chbs_service_type) && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{booking.service_name}</p>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  {/* Rest of grid card content */}
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center text-foreground/80 gap-2">
                        <Icons.calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatDate(booking.date)} {t('bookings.labels.at')} {booking.time}</span>
                      </div>
                      
                      {/* Customer information */}
                      {booking.customer_name && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-primary mt-0.5" />
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.customer_name}</span>
                            {booking.customer_email && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{booking.customer_email}</span>
                            )}
                            {booking.customer_phone && (
                              <span className="text-xs text-muted-foreground">{booking.customer_phone}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Location information */}
                      {(booking.pickup_location || booking.dropoff_location) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5" />
                          <div className="flex flex-col">
                            {booking.pickup_location && (
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.from')}</span> 
                                <span className="text-sm line-clamp-1">{booking.pickup_location}</span>
                              </div>
                            )}
                            {booking.dropoff_location && (
                              <div className="flex flex-col mt-1.5">
                                <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.to')}</span> 
                                <span className="text-sm line-clamp-1">{booking.dropoff_location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {booking.vehicle && (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year ? `(${booking.vehicle.year})` : ''}
                          </span>
                        </div>
                      )}
                      
                      {/* Distance and duration if available */}
                      {(booking.distance || booking.duration) && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-primary" />
                          <div className="flex gap-x-3">
                            {booking.distance && (
                              <span className="text-sm">{booking.distance} {t('bookings.labels.km')}</span>
                            )}
                            {booking.duration && (
                              <span className="text-sm">{booking.duration} {t('bookings.labels.min')}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 bg-muted/30 dark:bg-muted/10 flex justify-end gap-1 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/bookings/${booking.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span>{t('common.edit')}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/bookings/${booking.id}/reschedule`);
                      }}
                    >
                      <Icons.calendar className="h-4 w-4 mr-1" />
                      <span>{t('bookings.details.actions.reschedule')}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(booking.id.toString());
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      <span>{t('common.cancel')}</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          );
        } else {
          // List view (default)
          return (
            <>
              {/* Desktop table view - hide on mobile */}
              <div className={`rounded-md border overflow-hidden shadow-sm ${isMobile ? 'hidden' : 'block'}`}>
                {/* Table content for desktop */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[100px]">{t('bookings.tableHeaders.bookingId')}</TableHead>
                        <TableHead className="w-[140px]">{t('bookings.tableHeaders.dateTime')}</TableHead>
                        <TableHead>{t('bookings.tableHeaders.service')}</TableHead>
                        <TableHead>{t('bookings.tableHeaders.customer')}</TableHead>
                        <TableHead>{t('bookings.tableHeaders.locations')}</TableHead>
                        <TableHead className="w-[120px]">{t('bookings.tableHeaders.status')}</TableHead>
                        <TableHead className="text-right w-[160px]">{t('bookings.tableHeaders.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking) => (
                        // Table row content...
                        <TableRow 
                          key={booking.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors" 
                          onClick={() => handleViewBooking(booking.id)}
                        >
                          <TableCell className="font-medium text-primary">#{booking.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDate(booking.date)}</span>
                              <span className="text-xs text-muted-foreground">{booking.time}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium line-clamp-1">{booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}</span>
                              {booking.service_name && (booking.service_type || booking.meta?.chbs_service_type) && 
                                booking.service_name !== (booking.service_type || booking.meta?.chbs_service_type) && (
                                <span className="text-xs text-muted-foreground line-clamp-1">{booking.service_name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.customer_name || t('bookings.defaultLabels.notSpecified')}</span>
                              {booking.customer_email && (
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{booking.customer_email}</span>
                              )}
                              {booking.customer_phone && (
                                <span className="text-xs text-muted-foreground">{booking.customer_phone}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1.5">
                              {booking.pickup_location && (
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.from')}</span>
                                  <span className="text-sm line-clamp-1">{booking.pickup_location}</span>
                                </div>
                              )}
                              {booking.dropoff_location && (
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.to')}</span>
                                  <span className="text-sm line-clamp-1">{booking.dropoff_location}</span>
                                </div>
                              )}
                              {!booking.pickup_location && !booking.dropoff_location && (
                                <span className="text-xs text-muted-foreground italic">{t('bookings.defaultLabels.noLocationData')}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`px-2.5 py-1 font-medium ${getStatusBadgeClasses(booking.status)}`}
                            >
                              {t(`bookings.status.${booking.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
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
                                className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
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
              </div>

              {/* Mobile card view */}
              <div className={isMobile ? "block" : "hidden"}>
                <div className="space-y-3">
                  {paginatedBookings.map((booking) => (
                    <Card 
                      key={booking.id} 
                      className="hover:bg-accent/50 hover:shadow-md dark:hover:bg-gray-900/50 transition-all cursor-pointer overflow-hidden border-opacity-80"
                      onClick={() => handleViewBooking(booking.id)}
                    >
                      <CardHeader className="pb-0 pt-3 px-4 relative">
                        <Badge 
                          className={`absolute right-4 top-4 px-2.5 py-1 font-medium ${getStatusBadgeClasses(booking.status)}`}
                        >
                          {t(`bookings.status.${booking.status}`)}
                        </Badge>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-semibold">#{booking.id}</CardTitle>
                          </div>
                          <CardDescription className="line-clamp-1 text-base">
                            {booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3 px-4 pb-3">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center text-foreground/80 gap-2">
                            <Icons.calendar className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium">{formatDate(booking.date)} {t('bookings.labels.at')} {booking.time}</span>
                          </div>
                          
                          {booking.customer_name && (
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-medium">{booking.customer_name}</span>
                              </div>
                            </div>
                          )}
                          
                          {booking.pickup_location && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.from')}</span> 
                                <span className="text-sm line-clamp-1">{booking.pickup_location}</span>
                              </div>
                            </div>
                          )}
                          
                          {booking.dropoff_location && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground">{t('bookings.labels.to')}</span> 
                                <span className="text-sm line-clamp-1">{booking.dropoff_location}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 px-4 pb-2 bg-muted/30 dark:bg-muted/10 flex justify-end gap-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-9 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/bookings/${booking.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1.5">{t('common.edit')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-9 px-3 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(booking.id.toString());
                          }}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="ml-1.5">{t('common.cancel')}</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          );
        }
      })()}
      
      {/* Pagination - Make it more mobile friendly */}
      {filteredBookings.length > ITEMS_PER_PAGE && (
        <Pagination>
          <PaginationContent className={isMobile ? "gap-1" : ""}>
            {/* Pagination content... */}
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
            {/* Simplify pagination on mobile */}
            {isMobile ? (
              <>
                {/* Show only current page and immediate neighbors */}
                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(1)
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(currentPage - 1)
                      }}
                    >
                      {currentPage - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                  >
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                
                {currentPage < calculatedTotalPages && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(currentPage + 1)
                      }}
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {currentPage < calculatedTotalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {currentPage < calculatedTotalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(calculatedTotalPages)
                      }}
                    >
                      {calculatedTotalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
              </>
            ) : (
              // Desktop pagination - show all pages
              [...Array(calculatedTotalPages)].map((_, i) => (
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
              ))
            )}
            
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