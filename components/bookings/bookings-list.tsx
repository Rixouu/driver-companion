'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookingFilters, BookingFilterOptions } from './bookings-filters'
import { Icons } from '@/components/icons'
import { formatDate } from '@/lib/utils/formatting'
import { Booking } from '@/types/bookings'
import { getBookings, syncBookingsAction, cancelBookingAction } from '@/app/actions/bookings'
import { ApiConfigHelper } from './api-config-helper'
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
  X,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DeleteConfirmationModal } from '@/components/shared/delete-confirmation-modal'
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
import { StatusFilter, BookingStatus } from './status-filter'
import { useI18n } from '@/lib/i18n/context'
import { ContactButtons } from './contact-buttons'
import { startOfDay, endOfDay } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface BookingsListProps {
  limit?: number
  search?: string
  view?: "list" | "grid"
  currentPage?: number
  onPageChange?: (page: number) => void
  dateRange?: { from?: Date; to?: Date }
  status?: string
  onSyncClick?: () => void
}

const ITEMS_PER_PAGE = 10

// Function to generate consistent status badge styling
function getStatusBadgeClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-green-700';
    case 'cancelled':
    case 'canceled':
    case 'trash':
    case 'draft':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
    case 'assigned':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
  }
}

export function BookingsList({ 
  limit = 10, 
  search = '', 
  view: initialView = 'list',
  currentPage = 1,
  onPageChange = () => {},
  dateRange,
  status: externalStatus,
  onSyncClick
}: BookingsListProps) {
  // Add error boundary protection
  try {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [totalPages, setTotalPages] = useState(1)
  
  // New state for search and filters
  const [searchQuery, setSearchQuery] = useState(search)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<BookingFilterOptions>({
    statusFilter: externalStatus || 'all',
    searchQuery: search,
    sortBy: 'date',
    sortOrder: 'desc',
    dateFrom: dateRange?.from?.toISOString().split('T')[0],
    dateTo: dateRange?.to?.toISOString().split('T')[0],
    customerFilter: '',
    driverFilter: 'all'
  })
  
  const handleFiltersChange = (newFilters: BookingFilterOptions) => {
    setFilters(newFilters)
    setSearchQuery(newFilters.searchQuery)
    // You can add more logic here to handle other filter changes
  }
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<BookingStatus>(
    externalStatus as BookingStatus || 
    (searchParams?.get('status') as BookingStatus) || 
    'all'
  )
  const [showConfigHelper, setShowConfigHelper] = useState(false)
  const [view, setView] = useState(initialView)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string } | null>(null)
  const { t } = useI18n()
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()
  
  // New state for Select All functionality
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Update view when initialView changes
  useEffect(() => {
    setView(initialView);
    console.log("View updated from props:", initialView);
  }, [initialView]);

  // Function to view booking details
  const handleViewBooking = (bookingId: string | number) => {
    if (!bookingId) {
      console.warn('Cannot navigate to booking: bookingId is undefined or null')
      return
    }
    const formattedId = String(bookingId).trim()
    console.log(`Navigating to booking details: ${formattedId}`)
    router.push(`/bookings/${formattedId}`)
  }

  // Function to handle status change
  const handleStatusChange = (newStatus: BookingStatus) => {
    setStatus(newStatus)
    
    const params = new URLSearchParams(searchParams?.toString() || '')
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
      const { bookings: loadedBookings, error: bookingError, debug } = await getBookings({
        status,
        limit: 100,
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
      setBookings([])
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
        await loadBookings()
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
    if (status !== 'all') {
      const bookingStatus = booking.status?.toLowerCase();
      const statusFilter = status.toLowerCase();
      
      if (statusFilter === 'confirmed') {
        return bookingStatus === 'confirmed';
      } else if (statusFilter === 'cancelled') {
        return bookingStatus === 'cancelled' || 
               bookingStatus === 'canceled' || 
               bookingStatus === 'trash' || 
               bookingStatus === 'draft';
      } else {
        return bookingStatus === statusFilter;
      }
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesServiceName = (booking.service_name?.toLowerCase() || '').includes(searchLower)
      const matchesId = (booking.id?.toString() || '').toLowerCase().includes(searchLower)
      const matchesBookingNumber = (booking.wp_id?.toString() || '').toLowerCase().includes(searchLower)
      const matchesCustomer = (booking.customer_name?.toLowerCase() || '').includes(searchLower)
      const matchesVehicle = (booking.vehicle?.make?.toLowerCase() || '').includes(searchLower) || 
                            (booking.vehicle?.model?.toLowerCase() || '').includes(searchLower) ||
                            (booking.vehicle?.year?.toString().toLowerCase() || '').includes(searchLower)
      
      if (!matchesServiceName && !matchesId && !matchesBookingNumber && !matchesCustomer && !matchesVehicle) {
        return false
      }
    }
    
    if (dateRange && dateRange.from && booking.date) {
      try {
        const bookingDate = new Date(booking.date)
        if (isNaN(bookingDate.getTime())) {
          return false // Skip invalid dates
        }
        
        const fromDate = startOfDay(dateRange.from)
        
        if (fromDate && bookingDate < fromDate) {
          return false
        }
        
        if (dateRange.to) {
          const toDate = endOfDay(dateRange.to)
          if (bookingDate > toDate) {
            return false
          }
        }
      } catch (error) {
        console.warn('Error processing date filter for booking:', booking.id, error)
        return false
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
      
      if (isMobileNow && view === 'grid') {
        setView('list');
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [view]);

  // Clear selection when bookings change to prevent ID mismatch
  useEffect(() => {
    if (bookings.length > 0) {
      // Clear any selections that don't match current booking IDs
      const validIds = new Set(bookings.map(b => b.id?.toString()).filter(Boolean));
      const filteredSelections = new Set(
        Array.from(selectedBookings).filter(id => validIds.has(id))
      );
      
      if (filteredSelections.size !== selectedBookings.size) {
        console.log('Clearing invalid selections. Valid IDs:', Array.from(validIds));
        console.log('Previous selections:', Array.from(selectedBookings));
        setSelectedBookings(filteredSelections);
      }
    }
  }, [bookings]); // Remove selectedBookings dependency to prevent infinite loop

  // Force clear selection on component mount to ensure clean state
  useEffect(() => {
    console.log('Component mounted, clearing any existing selections');
    setSelectedBookings(new Set());
  }, []);

  // Select All functionality
  const handleSelectAll = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id?.toString()).filter(Boolean)));
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    if (!bookingId) {
      console.warn('Cannot select booking: bookingId is undefined or null')
      return
    }
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleClearSelection = () => {
    console.log('Clearing selection. Previous selections:', Array.from(selectedBookings));
    setSelectedBookings(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedBookings.size === 0) return;
    
    // Show confirmation modal instead of window.confirm
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteSelected = async () => {
    try {
      setIsDeleting(true);
      const selectedIds = Array.from(selectedBookings);
      console.log('Deleting selected bookings:', selectedIds);
      
      // Debug: Check what type of IDs we have
      console.log('Current bookings in state:', bookings.map(b => ({ id: b.id, wp_id: b.wp_id })));
      console.log('Selected IDs type check:', selectedIds.map(id => ({ id, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) })));
      
      // Delete each booking one by one
      for (const selectedId of selectedIds) {
        try {
          // The selectedId is now the database ID (UUID), so we can use it directly
          console.log(`Deleting booking with database id: ${selectedId}`);
          
          const response = await fetch(`/api/bookings/${selectedId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete booking ${selectedId}: ${response.statusText}`);
          }
          
          console.log(`Successfully deleted booking ${selectedId}`);
        } catch (error) {
          console.error(`Error deleting booking ${selectedId}:`, error);
          // Continue with other deletions even if one fails
        }
      }
      
      // Clear selection and refresh the list
      setSelectedBookings(new Set());
      await loadBookings();
      
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedIds.length} booking(s)`,
      });
      
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Error",
        description: "Some bookings could not be deleted. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportSelected = () => {
    // Implementation for bulk export
    console.log('Exporting selected bookings:', Array.from(selectedBookings));
    // TODO: Implement bulk export functionality
  };

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
    <div className="space-y-6">
      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bookings - Blue */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Bookings</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{bookings.length.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Confirmed Bookings - Green */}
        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Confirmed</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>

        {/* Pending Bookings - Orange */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        {/* Completed Bookings - Purple */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Completed</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {bookings.filter(b => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Show sync result message if any */}
      {syncResult && (
        <Alert variant={syncResult.success ? "default" : "destructive"} className="mb-4">
          <AlertTitle>{syncResult.success ? t('bookings.sync.success') : t('bookings.sync.failed')}</AlertTitle>
          <AlertDescription>{syncResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar - Above Advanced Filters */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('bookings.search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 border-muted w-full"
        />
      </div>

      {/* Advanced Filters */}
      <div className="border rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full justify-between p-4 rounded-none border-b-0"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Advanced Filters</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {filtersOpen && (
          <BookingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalBookings={bookings.length}
            className="border-t p-4 space-y-4"
          />
        )}
      </div>

      {/* Booking Count and Sync Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredBookings.length} bookings
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncClick || syncBookingsFromWordPress}
          disabled={isSyncing}
          className="h-9"
        >
          {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          <span className="hidden sm:inline">{t('bookings.actions.sync')}</span>
        </Button>
      </div>

      {/* Select All Bar */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-muted/20 rounded-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            aria-label="Select all bookings"
          />
          <span className="text-sm font-medium text-muted-foreground">Select All</span>
          {selectedBookings.size > 0 && (
            <span className="text-sm text-muted-foreground">
              ({selectedBookings.size} of {filteredBookings.length} selected)
            </span>
          )}
        </div>
        {/* Multi-select Actions */}
        {selectedBookings.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="flex items-center gap-2 flex-1 sm:flex-none">
              <Trash className="h-4 w-4" />
              <span className="hidden xs:inline">Delete</span>
              <span className="xs:hidden">Del</span>
              <span className="ml-1">({selectedBookings.size})</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearSelection} className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">Clear Selection</span>
              <span className="xs:hidden">Clear</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('Current selections:', Array.from(selectedBookings));
                console.log('Current bookings:', bookings.map(b => ({ id: b.id, wp_id: b.wp_id })));
              }}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden xs:inline">Debug Selection</span>
              <span className="xs:hidden">Debug</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSelected} className="flex items-center gap-2 flex-1 sm:flex-none">
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Export CSV</span>
              <span className="xs:hidden">Export</span>
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table View with Headers */}
      <div className="hidden sm:block space-y-3">
        {/* Column Headers */}
        <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 bg-muted/20 rounded-lg">
          <div className="col-span-1">
            <span className="text-sm font-medium text-muted-foreground">Select</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-muted-foreground">ID</span>
          </div>
          <div className="col-span-3">
            <span className="text-sm font-medium text-muted-foreground">Customer</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-muted-foreground">Date & Time</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-muted-foreground">Actions</span>
          </div>
        </div>

        {/* Desktop Booking Rows */}
        {paginatedBookings.map((booking) => (
          <Card key={booking.id || `booking-${Math.random()}`} className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card/95 backdrop-blur">
            <div className="grid grid-cols-12 items-center gap-4 p-4">
              {/* Selection Checkbox */}
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedBookings.has(booking.id?.toString() || '')}
                  onChange={() => handleSelectBooking(booking.id?.toString() || '')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Select booking ${booking.id || 'unknown'}`}
                />
              </div>
              
              {/* ID Column */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="font-mono text-sm text-muted-foreground">#{booking.wp_id || 'N/A'}</div>
              </div>
              
              {/* Customer Column - Name and Email */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {booking.customer_name || t('bookings.defaultLabels.notSpecified')}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.customer_email || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}
                  </p>
                </div>
              </div>
              
              {/* Date & Time Column */}
              <div className="col-span-2 space-y-1 flex flex-col items-start justify-start">
                <div className="text-sm text-foreground">
                  {booking.date ? formatDate(booking.date) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {booking.time || '—'}
                </div>
              </div>
              
              {/* Status Column */}
              <div className="col-span-2 flex flex-col items-start justify-start">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusBadgeClasses(booking.status || 'pending')}>
                    {booking.status ? (t(`bookings.status.${booking.status}`) || booking.status) : t('bookings.status.pending')}
                  </Badge>
                </div>
              </div>
              
              {/* Actions Column */}
              <div className="col-span-2 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); if (booking.id) handleViewBooking(booking.id); }}
                  className="flex items-center gap-2"
                >
                  <Icons.eye className="h-4 w-4" />
                  View
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); if (booking.id) router.push(`/bookings/${booking.id}/edit`); }}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {paginatedBookings.map((booking) => (
          <Card key={booking.id || `booking-${Math.random()}`} className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card/95 backdrop-blur">
            <div className="p-4">
              {/* Header with Selection and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBookings.has(booking.id?.toString() || '')}
                    onChange={() => handleSelectBooking(booking.id?.toString() || '')}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    aria-label={`Select booking ${booking.id || 'unknown'}`}
                  />
                  <div className="font-mono text-sm text-muted-foreground">#{booking.wp_id || 'N/A'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusBadgeClasses(booking.status || 'pending')}>
                    {booking.status ? (t(`bookings.status.${booking.status}`) || booking.status) : t('bookings.status.pending')}
                  </Badge>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-2 mb-4">
                <div className="font-semibold text-base">{booking.service_type || booking.meta?.chbs_service_type || booking.service_name || t('bookings.defaultLabels.vehicleService')}</div>
                <div className="font-medium text-sm text-muted-foreground">{booking.customer_name || t('bookings.defaultLabels.notSpecified')}</div>
                <div className="text-sm text-muted-foreground">{booking.customer_email || '—'}</div>
              </div>
              
              {/* Footer with Date, Time, and Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{booking.date ? formatDate(booking.date) : '—'}</span>
                    <span>{booking.time || '—'}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); if (booking.id) handleViewBooking(booking.id); }}
                  className="flex items-center gap-2 w-full justify-center"
                >
                  <Icons.eye className="h-4 w-4" />
                  View Details
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); if (booking.id) router.push(`/bookings/${booking.id}/edit`); }}
                  className="flex items-center gap-2 w-full justify-center"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      {filteredBookings.length > ITEMS_PER_PAGE && (
        <div className="border-t pt-4">
          <Pagination>
            <PaginationContent className="flex justify-center">
              {/* Previous Page */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(currentPage - 1)
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, calculatedTotalPages) }, (_, i) => {
                let pageNum;
                if (calculatedTotalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= calculatedTotalPages - 2) {
                  pageNum = calculatedTotalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > calculatedTotalPages) return null;

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(pageNum)
                      }}
                      isActive={pageNum === currentPage}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* Ellipsis for long page ranges */}
              {calculatedTotalPages > 5 && currentPage < calculatedTotalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Next Page */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(currentPage + 1)
                  }}
                  className={currentPage >= calculatedTotalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          {/* Page Info */}
          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-2 px-2">
            Page {currentPage} of {calculatedTotalPages} • Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length} bookings
          </div>
        </div>
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
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteSelected}
        isDeleting={isDeleting}
        title="Delete Bookings"
        description={`Are you sure you want to delete ${selectedBookings.size} selected booking${selectedBookings.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected bookings from the system.`}
        itemName="Booking"
        itemCount={selectedBookings.size}
        warningItems={[
          "This will permanently delete the selected booking" + (selectedBookings.size > 1 ? 's' : ''),
          "All associated data will be removed",
          "This action cannot be undone"
        ]}
      />
    </div>
  )
  } catch (error) {
    console.error('Error in BookingsList component:', error)
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Error Loading Bookings</h2>
        <p className="text-muted-foreground">There was an error loading your bookings. Please refresh the page.</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    )
  }
} 