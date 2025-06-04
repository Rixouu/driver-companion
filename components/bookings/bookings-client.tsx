'use client'

import React, { useState, useEffect, useRef, Fragment } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BookingsList } from './bookings-list'
import { BookingsErrorBoundary } from './error-boundary'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  CalendarRange,
  SlidersHorizontal,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download
} from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useI18n } from '@/lib/i18n/context'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import { syncBookingsAction } from '@/app/actions/bookings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define a type for bookings that need confirmation
interface BookingUpdateConfirmation {
  id: string;
  booking_id?: string; // Add booking ID field
  importedBy?: string; // Add who imported the booking
  current: {
    date?: string;
    time?: string;
    status?: string;
    customer_name?: string;
    service_name?: string;
    billing_company_name?: string;
    billing_tax_number?: string;
    billing_street_name?: string;
    billing_street_number?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    coupon_code?: string;
    coupon_discount_percentage?: string;
  };
  updated: {
    date?: string;
    time?: string;
    status?: string;
    customer_name?: string;
    service_name?: string;
    billing_company_name?: string;
    billing_tax_number?: string;
    billing_street_name?: string;
    billing_street_number?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    coupon_code?: string;
    coupon_discount_percentage?: string;
  };
  changes?: string[]; // List of changes for easier filtering
  selectedChanges?: Record<string, boolean>; // Which specific changes to apply
}

interface BookingsClientProps {
  hideTabNavigation?: boolean;
}

export function BookingsClient({ hideTabNavigation = false }: BookingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(searchParams?.get('status') || 'all')
  const [view, setView] = useState<"list" | "grid">(() => {
    // Try to get view from URL params first
    const urlView = searchParams?.get('view') as "list" | "grid" | null
    if (urlView === "grid" || urlView === "list") {
      return urlView
    }
    // Default to list view
    return "list"
  })
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page') || '1'))
  const debouncedSearch = useDebounce(search, 500)
  const { t } = useI18n()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Initialize from URL params if available
    const fromDate = searchParams?.get('from')
    const toDate = searchParams?.get('to')
    if (fromDate) {
      return {
        from: new Date(fromDate),
        to: toDate ? new Date(toDate) : undefined
      }
    }
    return undefined
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)
  const syncResultTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Update state for booking update confirmation
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false)
  const [bookingsToUpdate, setBookingsToUpdate] = useState<BookingUpdateConfirmation[]>([])
  const [selectedBookingsToUpdate, setSelectedBookingsToUpdate] = useState<Record<string, boolean>>({})
  const [pendingSyncAction, setPendingSyncAction] = useState<{
    newBookings: number;
    updatedBookings: number;
  } | null>(null)
  
  // Add pagination, filtering, and sorting state for the updates dialog
  const [currentUpdatePage, setCurrentUpdatePage] = useState(1)
  const [updateItemsPerPage, setUpdateItemsPerPage] = useState(5)
  const [updateFilterField, setUpdateFilterField] = useState<string>('all')
  const [searchUpdateQuery, setSearchUpdateQuery] = useState('')
  const [updateSortField, setUpdateSortField] = useState<string>('id')
  const [updateSortDirection, setUpdateSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // State to track which specific changes to apply for each booking
  const [bookingSelectedChanges, setBookingSelectedChanges] = useState<Record<string, Record<string, boolean>>>({});
  
  // Add more advanced filter states
  const [customerFilter, setCustomerFilter] = useState(searchParams?.get('customer') || '')
  const [driverFilter, setDriverFilter] = useState(searchParams?.get('driver') || 'all')
  
  // Auto-dismiss sync result message after 5 seconds
  useEffect(() => {
    if (syncResult) {
      // Clear any existing timeout
      if (syncResultTimeoutRef.current) {
        clearTimeout(syncResultTimeoutRef.current)
      }
      
      // Set new timeout to clear the sync result
      syncResultTimeoutRef.current = setTimeout(() => {
        setSyncResult(null)
      }, 5000)
    }
    
    // Cleanup on unmount
    return () => {
      if (syncResultTimeoutRef.current) {
        clearTimeout(syncResultTimeoutRef.current)
      }
    }
  }, [syncResult])
  
  const handleFilterChange = (value: string) => {
    setFilter(value)
    updateUrlWithFilters(value, dateRange, view, {
      customer: customerFilter,
      driver: driverFilter
    })
  }
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    updateUrlWithFilters(filter, range, view, {
      customer: customerFilter,
      driver: driverFilter
    })
  }
  
  const handleViewChange = (newView: "list" | "grid") => {
    // Don't allow grid view on mobile devices
    if (isMobile && newView === "grid") {
      console.log("Grid view blocked on mobile");
      return;
    }
    
    console.log(`Changing view to ${newView}`);
    setView(newView);
    
    // Update URL with the new view and preserve all other filters
    updateUrlWithFilters(filter, dateRange, newView, {
      customer: customerFilter,
      driver: driverFilter
    });
  }
  
  // Update the URL with filters function to include new filters
  const updateUrlWithFilters = (
    statusFilter: string, 
    dateFilters?: DateRange, 
    viewType: "list" | "grid" = view,
    additionalFilters?: {
      customer?: string,
      driver?: string
    }
  ) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    // Handle status filter
    if (statusFilter && statusFilter !== 'all') {
      params.set("status", statusFilter)
    } else {
      params.delete("status")
    }
    
    // Handle date filters
    if (dateFilters?.from) {
      params.set("from", dateFilters.from.toISOString().split('T')[0])
      if (dateFilters.to) {
        params.set("to", dateFilters.to.toISOString().split('T')[0])
      } else {
        params.delete("to")
      }
    } else {
      params.delete("from")
      params.delete("to")
    }
    
    // Handle view type
    params.set("view", viewType)
    
    // Handle additional filters
    if (additionalFilters) {
      // Customer filter
      if (additionalFilters.customer) {
        params.set("customer", additionalFilters.customer)
      } else {
        params.delete("customer")
      }
      
      // Driver filter
      if (additionalFilters.driver && additionalFilters.driver !== 'all') {
        params.set("driver", additionalFilters.driver)
      } else {
        params.delete("driver")
      }
    }
    
    // Reset to page 1 when filters change
    params.set("page", "1")
    setCurrentPage(1)
    
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`)
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set("page", page.toString())
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`)
  }
  
  const clearFilters = () => {
    setFilter('all')
    setDateRange(undefined)
    setSearch('')
    // Clear additional filters
    setCustomerFilter('')
    setDriverFilter('all')
    
    const params = new URLSearchParams()
    params.set("view", view)
    params.set("page", "1")
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`)
  }
  
  // Function to sync bookings from WordPress
  const syncBookingsFromWordPress = async () => {
    try {
      setIsSyncing(true);
      
      // Check for updates first
      const checkResult = await fetch('/api/bookings/check-updates');
      const updates = await checkResult.json();
      
      if (!updates || !updates.updatableBookings || updates.updatableBookings.length === 0) {
        // No updatable bookings, just sync new ones if they exist
        if (updates.newBookings > 0) {
          // Complete sync with just new bookings
          const result = await completeSyncProcess();
          setSyncResult(result);
        } else {
          // No changes at all
          setSyncResult({
            success: true,
            message: 'All bookings are already up to date.'
          });
        }
      } else {
        // We have updates to confirm
        console.log('Found updates:', updates);
        
        // Set the bookings to update without auto-selecting them
        setBookingsToUpdate(updates.updatableBookings.map(booking => ({
          ...booking,
          selectedChanges: {} // Initialize with no preselected changes
        })));
        
        // Initialize empty selection objects
        const emptySelectionMap: Record<string, boolean> = {};
        updates.updatableBookings.forEach(booking => {
          emptySelectionMap[booking.id] = false; // Initialize all bookings as unselected
        });
        setSelectedBookingsToUpdate(emptySelectionMap);
        
        // Initialize empty change selections
        const emptyChangeMap: Record<string, Record<string, boolean>> = {};
        updates.updatableBookings.forEach(booking => {
          emptyChangeMap[booking.id] = {};
          // Initialize all changes as unselected
          booking.changes?.forEach(change => {
            emptyChangeMap[booking.id][change] = false;
          });
        });
        setBookingSelectedChanges(emptyChangeMap);
        
        // Store action info for new bookings
        setPendingSyncAction({
          newBookings: updates.newBookings || 0,
          updatedBookings: updates.updatableBookings.length
        });
        
        // Show the update confirmation dialog
        setShowUpdateConfirmation(true);
      }
    } catch (error) {
      console.error('Error syncing bookings:', error);
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error syncing bookings'
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Function to handle the confirmation and complete the sync with selected changes
  const handleConfirmBookingUpdates = async () => {
    setIsSyncing(true);
    setShowUpdateConfirmation(false);
    
    try {
      // Check if any bookings are selected
      const selectedBookings = Object.entries(selectedBookingsToUpdate)
        .filter(([_, selected]) => selected);
      
      if (selectedBookings.length === 0) {
        setSyncResult({
          success: true,
          message: 'No bookings were selected for update.'
        });
        setIsSyncing(false);
        setPendingSyncAction(null);
        return;
      }
      
      // Get list of booking IDs to update and their selected changes
      const bookingsToApply = selectedBookings
        .map(([id]) => ({
          id,
          selectedChanges: bookingSelectedChanges[id] || {}
        }));
      
      // Check if any selected bookings have any changes selected
      const hasSelectedChanges = bookingsToApply.some(booking => 
        Object.values(booking.selectedChanges).some(isSelected => isSelected)
      );
      
      if (!hasSelectedChanges) {
        setSyncResult({
          success: true,
          message: 'No changes were selected for any bookings.'
        });
        setIsSyncing(false);
        setPendingSyncAction(null);
        return;
      }
      
      // Call sync with the selected booking IDs and changes
      const result = await completeSyncWithSelectedChanges(bookingsToApply);
      
      // Create a formatted message using our translation with count data
      let message = result.message;
      if (result.success && result.stats) {
        message = t('bookings.sync.successWithCount', {
          count: String(result.stats.total),
          created: String(result.stats.created),
          updated: String(result.stats.updated)
        });
      }
      
      setSyncResult({
        success: result.success,
        message: message
      });
      
      if (result.success) {
        // Reload page after successful sync
        router.refresh();
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync bookings'
      });
    } finally {
      setIsSyncing(false);
      setPendingSyncAction(null);
    }
  };
  
  // Function to complete sync with selected changes
  const completeSyncWithSelectedChanges = async (bookingsToApply: Array<{ id: string, selectedChanges: Record<string, boolean> }>) => {
    try {
      // Extract the booking IDs and their selected changes
      const bookingsWithSelectedFields = bookingsToApply.map(item => {
        // Get the booking data
        const booking = bookingsToUpdate.find(b => b.id === item.id);
        
        // Get the selected fields for this booking
        const selectedFields = Object.entries(item.selectedChanges)
          .filter(([_, selected]) => selected)
          .map(([field]) => field);
        
        return {
          id: item.id,
          selectedFields
        };
      });
      
      // CRITICAL FIX: Only proceed with sync if we have bookings to update
      if (bookingsWithSelectedFields.length === 0) {
        return {
          success: true,
          message: 'No changes were selected for update.'
        };
      }
      
      // Check if any selected bookings have fields selected
      const hasSelectedFields = bookingsWithSelectedFields.some(booking => 
        booking.selectedFields.length > 0
      );
      
      // Only call the server action if we have selected fields
      if (hasSelectedFields) {
        const selectedFieldsByBooking = bookingsWithSelectedFields.reduce((acc, item) => {
          acc[item.id] = item.selectedFields;
          return acc;
        }, {} as Record<string, string[]>);
        
        return await syncBookingsAction({ 
          bookingIdsToUpdate: bookingsWithSelectedFields.map(b => b.id),
          selectedFieldsByBooking
        });
      } else {
        return {
          success: true,
          message: 'No fields were selected for update.'
        };
      }
    } catch (error) {
      console.error('Error during sync with selected changes:', error);
      throw error;
    }
  }
  
  // Function to cancel the booking updates
  const handleCancelBookingUpdates = () => {
    setShowUpdateConfirmation(false);
    setPendingSyncAction(null);
    setSyncResult({
      success: true,
      message: t('bookings.sync.cancelled')
    });
  }
  
  // Function to toggle selection of a specific change for a booking
  const toggleChangeSelection = (bookingId: string, changeField: string) => {
    setBookingSelectedChanges(prev => {
      const bookingChanges = { ...(prev[bookingId] || {}) };
      bookingChanges[changeField] = !bookingChanges[changeField];
      
      return {
        ...prev,
        [bookingId]: bookingChanges
      };
    });
  };
  
  // Function to toggle selection of a booking
  const toggleBookingSelection = (bookingId: string) => {
    // Determine the new selection state for this booking
    const newSelectionState = !selectedBookingsToUpdate[bookingId];
    
    // First, update the booking selection
    setSelectedBookingsToUpdate(prev => ({
      ...prev,
      [bookingId]: newSelectionState
    }));
    
    // Then, update all change selections for this booking to match the booking selection state
    const booking = bookingsToUpdate.find(b => b.id === bookingId);
    if (booking) {
      const newChanges = { ...bookingSelectedChanges };
      
      // Initialize the changes object for this booking if it doesn't exist
      if (!newChanges[bookingId]) {
        newChanges[bookingId] = {};
      }
      
      // Update all change checkboxes to match the main booking checkbox
      if (booking.changes) {
        booking.changes.forEach(change => {
          newChanges[bookingId][change] = newSelectionState;
        });
      }
      
      // Update the change selections state
      setBookingSelectedChanges(newChanges);
    }
  };
  
  // Function to toggle all bookings selection
  const toggleAllBookings = (selected: boolean) => {
    const newSelection = bookingsToUpdate.reduce((acc: Record<string, boolean>, booking) => {
      acc[booking.id] = selected;
      return acc;
    }, {});
    
    setSelectedBookingsToUpdate(newSelection);
  };
  
  // Helper function to actually perform the sync
  const completeSyncProcess = async (bookingIdsToUpdate?: string[]) => {
    // Call the server action with optional booking IDs
    if (bookingIdsToUpdate && bookingIdsToUpdate.length > 0) {
      return await syncBookingsAction({ bookingIdsToUpdate });
    } else {
      return await syncBookingsAction();
    }
  };
  
  // Set default view based on screen size and handle resize
  useEffect(() => {
    const checkIfMobile = () => {
      const width = window.innerWidth;
      const mobileBreakpoint = 640; // sm breakpoint in Tailwind
      const wasMobile = isMobile;
      setIsMobile(width < mobileBreakpoint);
      
      // Only force list view when screen size changes from desktop to mobile
      if (!wasMobile && width < mobileBreakpoint && view === "grid") {
        setView("list");
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set("view", "list");
        // @ts-ignore - Route string types are not matching but this works
        router.push(`/bookings?${params.toString()}`);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [isMobile, router, searchParams, view]);

  // Generate status filter button class based on active status
  const getStatusButtonClass = (buttonStatus: string) => {
    if (filter === buttonStatus) {
      switch (buttonStatus) {
        case 'confirmed':
          return 'bg-green-600 hover:bg-green-700 border-green-600 text-white font-medium';
        case 'pending':
          return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600 text-white font-medium';
        case 'cancelled':
          return 'bg-red-600 hover:bg-red-700 border-red-600 text-white font-medium';
        case 'completed':
          return 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-medium';
        default:
          return 'bg-primary text-primary-foreground font-medium';
      }
    } else {
      switch (buttonStatus) {
        case 'confirmed':
          return 'border-green-500 text-green-500 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950/30';
        case 'pending':
          return 'border-yellow-500 text-yellow-500 hover:bg-yellow-50 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950/30';
        case 'cancelled':
          return 'border-red-500 text-red-500 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30';
        case 'completed':
          return 'border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30';
        default:
          return 'border-gray-200 text-foreground dark:border-gray-700';
      }
    }
  };

  // Helper functions for the updates pagination and filtering
  const getFilteredAndSortedBookingsToUpdate = () => {
    return bookingsToUpdate
      .filter(booking => {
        // Apply field-based filtering
        if (updateFilterField !== 'all') {
          if (updateFilterField === 'billing') {
            // Handle billing filter as a special case
            return booking.changes?.some(change => change.startsWith('billing_'));
          }
          if (updateFilterField === 'coupon') {
            // Handle coupon filter as a special case
            return booking.changes?.some(change => change.startsWith('coupon_'));
          }
          return booking.changes?.includes(updateFilterField);
        }
        
        // Apply search filtering if entered
        if (searchUpdateQuery) {
          const searchLower = searchUpdateQuery.toLowerCase();
          return (
            booking.id.toLowerCase().includes(searchLower) ||
            (booking.booking_id || '').toLowerCase().includes(searchLower) ||
            (booking.current.customer_name || '').toLowerCase().includes(searchLower) ||
            (booking.current.service_name || '').toLowerCase().includes(searchLower) ||
            (booking.current.billing_company_name || '').toLowerCase().includes(searchLower) ||
            (booking.current.coupon_code || '').toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        let valA, valB;
        
        switch (updateSortField) {
          case 'id':
            valA = a.id;
            valB = b.id;
            break;
          case 'customer_name':
            valA = a.current.customer_name || '';
            valB = b.current.customer_name || '';
            break;
          default:
            valA = a.id;
            valB = b.id;
        }
        
        if (valA < valB) return updateSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return updateSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }
  
  const getPaginatedBookingsToUpdate = () => {
    const filtered = getFilteredAndSortedBookingsToUpdate();
    const startIndex = (currentUpdatePage - 1) * updateItemsPerPage;
    return filtered.slice(startIndex, startIndex + updateItemsPerPage);
  }
  
  const totalUpdatePages = () => {
    const filtered = getFilteredAndSortedBookingsToUpdate();
    return Math.ceil(filtered.length / updateItemsPerPage);
  }
  
  // Function to get a summary of all changes
  const getChangesSummary = () => {
    const summary = {
      date: 0,
      time: 0,
      status: 0,
      customer_name: 0,
      service_name: 0,
      billing: 0,
      coupon: 0
    };
    
    bookingsToUpdate.forEach(booking => {
      // Count regular fields
      booking.changes?.forEach(change => {
        if (change.startsWith('billing_')) {
          // Only count billing once in summary
          summary.billing = summary.billing + 1;
        } else if (change.startsWith('coupon_')) {
          // Only count coupon once in summary
          summary.coupon = summary.coupon + 1;
        } else if (summary.hasOwnProperty(change)) {
          summary[change as keyof typeof summary]++;
        }
      });
    });
    
    return summary;
  }
  
  // Function to handle filter changes
  const handleUpdateFilterChange = (field: string) => {
    setUpdateFilterField(field);
    setCurrentUpdatePage(1); // Reset to first page when filter changes
  }
  
  // Function to handle sort changes
  const handleUpdateSortChange = (field: string) => {
    if (updateSortField === field) {
      // Toggle direction if clicking the same field
      setUpdateSortDirection(updateSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset to ascending
      setUpdateSortField(field);
      setUpdateSortDirection('asc');
    }
  }

  // Helper function to check if a specific change is selected
  const isChangeSelected = (bookingId: string, changeField: string) => {
    return Boolean(bookingSelectedChanges[bookingId]?.[changeField]);
  };

  // Handle customer filter change
  const handleCustomerFilterChange = (value: string) => {
    setCustomerFilter(value)
    updateUrlWithFilters(filter, dateRange, view, {
      customer: value,
      driver: driverFilter
    })
  }
  
  // Handle driver filter change
  const handleDriverFilterChange = (value: string) => {
    setDriverFilter(value)
    updateUrlWithFilters(filter, dateRange, view, {
      customer: customerFilter,
      driver: value
    })
  }

  // Add this function to download JSON data
  const downloadBookingJson = (bookingId: string) => {
    // First fetch the booking JSON data from our API
    fetch(`/api/bookings/check-updates?id=${bookingId}`)
      .then(response => response.json())
      .then(data => {
        // Create a blob with the JSON data
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link and trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking-${bookingId}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading booking JSON:', error);
        alert('Error downloading booking data. See console for details.');
      });
  };

  return (
    <BookingsErrorBoundary>
      <div className="space-y-4">
        <Card className="p-4 border-none shadow-sm">
          <div className="space-y-4">
            {/* Search and Main Controls Row */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('bookings.search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 border-muted w-full"
                />
              </div>
              
              <div className="flex items-center gap-2 justify-between md:justify-end flex-wrap">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-9 ${showFilters ? 'bg-muted' : ''}`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span>{t('bookings.filters.advancedFilters')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncBookingsFromWordPress}
                    disabled={isSyncing}
                    className="h-9"
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    <span className="hidden sm:inline">{t('bookings.actions.sync')}</span>
                  </Button>
                </div>
                
                {/* View Toggle Button */}
                <div className="flex items-center bg-muted border rounded-md p-1 h-9">
                  <Button 
                    variant={view === 'list' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => handleViewChange('list')}
                    className={`rounded-sm flex-1 h-7 px-2 ${view === 'list' ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    <List className="h-4 w-4" />
                    <span className="sr-only">{t('bookings.viewOptions.list')}</span>
                  </Button>
                  <Button 
                    variant={view === 'grid' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => handleViewChange('grid')}
                    className={`rounded-sm flex-1 h-7 px-2 ${view === 'grid' ? 'font-medium' : 'text-muted-foreground'} ${isMobile ? 'cursor-not-allowed opacity-50' : ''}`}
                    disabled={isMobile}
                    title={isMobile ? t('bookings.viewOptions.gridDisabledOnMobile') : ""}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">{t('bookings.viewOptions.grid')}</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Advanced Filters Row - Conditional display */}
            {showFilters && (
              <div className="space-y-4 overflow-hidden mb-4 bg-background rounded-md border">
                {/* Filter header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-base font-semibold">{t('bookings.filters.advancedFilters')}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('bookings.filters.clearFilters')}
                  </Button>
                </div>
                
                {/* Filter content */}
                <div className="p-4">
                  {/* All filters in one row */}
                  <div className="flex flex-row gap-4 w-full items-center">
                    {/* Date Range Filter */}
                    <div className="flex-[2]">
                      <DateRangePicker
                        date={dateRange}
                        onDateChange={handleDateRangeChange}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <div className="w-[200px]">
                      <Select
                        value={filter}
                        onValueChange={handleFilterChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('bookings.filters.statusPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('bookings.filters.all')}</SelectItem>
                          <SelectItem value="confirmed" className="text-green-700 font-medium">{t('bookings.filters.confirmed')}</SelectItem>
                          <SelectItem value="pending" className="text-yellow-700 font-medium">{t('bookings.filters.pending')}</SelectItem>
                          <SelectItem value="cancelled" className="text-red-700 font-medium">{t('bookings.filters.cancelled')}</SelectItem>
                          <SelectItem value="completed" className="text-blue-700 font-medium">{t('bookings.filters.completed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Customer Filter */}
                    <div className="flex-[1.5]">
                      <Input
                        placeholder="Customer name..."
                        value={customerFilter}
                        onChange={(e) => handleCustomerFilterChange(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Driver Filter */}
                    <div className="flex-1">
                      <Select
                        value={driverFilter}
                        onValueChange={handleDriverFilterChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Driver Assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Filter Pills - Only show when not in advanced filters mode */}
            {!showFilters && (
              <div className="pt-3 border-t w-full">
                {isMobile ? (
                  // Mobile status filter layout - Full width buttons like in the screenshot
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('all')}
                      className={`${getStatusButtonClass('all')} w-full h-12 font-semibold border-2`}
                    >
                      {t('bookings.filters.all')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('confirmed')}
                      className={`${getStatusButtonClass('confirmed')} w-full h-12 font-semibold border-2`}
                    >
                      {t('bookings.filters.confirmed')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('pending')}
                      className={`${getStatusButtonClass('pending')} w-full h-12 font-semibold border-2`}
                    >
                      {t('bookings.filters.pending')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('cancelled')}
                      className={`${getStatusButtonClass('cancelled')} w-full h-12 font-semibold border-2`}
                    >
                      {t('bookings.filters.cancelled')}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('completed')}
                      className={`${getStatusButtonClass('completed')} w-full h-12 col-span-2 font-semibold border-2`}
                    >
                      {t('bookings.filters.completed')}
                    </Button>
                  </div>
                ) : (
                  // Desktop status filter layout
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('all')}
                      className={`${getStatusButtonClass('all')} flex-shrink-0`}
                    >
                      {t('bookings.filters.all')}
                    </Button>
                    <Button 
                      variant={filter === 'confirmed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('confirmed')}
                      className={`${getStatusButtonClass('confirmed')} flex-shrink-0`}
                    >
                      {t('bookings.filters.confirmed')}
                    </Button>
                    <Button 
                      variant={filter === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('pending')}
                      className={`${getStatusButtonClass('pending')} flex-shrink-0`}
                    >
                      {t('bookings.filters.pending')}
                    </Button>
                    <Button 
                      variant={filter === 'cancelled' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('cancelled')}
                      className={`${getStatusButtonClass('cancelled')} flex-shrink-0`}
                    >
                      {t('bookings.filters.cancelled')}
                    </Button>
                    <Button 
                      variant={filter === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('completed')}
                      className={`${getStatusButtonClass('completed')} flex-shrink-0`}
                    >
                      {t('bookings.filters.completed')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        {/* Display sync result if available */}
        {syncResult && (
          <Alert 
            variant={syncResult.success ? "default" : "destructive"} 
            className={`mb-2 ${syncResult.success ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200' : ''}`}
          >
            {syncResult.success ? 
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : 
              <AlertCircle className="h-4 w-4" />
            }
            <AlertTitle>
              {syncResult.success ? t('bookings.sync.success') : t('bookings.sync.failed')}
            </AlertTitle>
            <AlertDescription>{syncResult.message}</AlertDescription>
          </Alert>
        )}
        
        {/* Update Confirmation Dialog */}
        <Dialog open={showUpdateConfirmation} onOpenChange={setShowUpdateConfirmation}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0">
            <DialogHeader className="pb-4 border-b sticky top-0 z-20 bg-background p-6">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold">{t('bookings.sync.confirmUpdates')}</DialogTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {bookingsToUpdate.map(booking => (
                      <DropdownMenuItem 
                        key={booking.id}
                        onClick={() => downloadBookingJson(booking.id)}
                      >
                        Booking {booking.booking_id || booking.id}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => downloadBookingJson('all')}>
                      All Bookings Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <DialogDescription>
                {t('bookings.sync.confirmUpdatesDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="p-6 pt-3">
                {pendingSyncAction && (
                  <div className="mb-4 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                    <p>
                      {t('bookings.sync.syncSummary', {
                        newCount: String(pendingSyncAction.newBookings),
                        updateCount: String(pendingSyncAction.updatedBookings)
                      })}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {t('bookings.sync.newBookingsAutomatically')}
                    </p>
                  </div>
                )}
                
                {/* Summary of changes */}
                {bookingsToUpdate.length > 0 && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">{t('bookings.sync.changesSummary')}:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.entries(getChangesSummary()).map(([field, count]) => (
                        count > 0 && (
                          <div 
                            key={field}
                            className={`text-xs rounded-md px-2 py-1 ${updateFilterField === field ? 'bg-primary text-primary-foreground' : 'bg-background'} cursor-pointer`}
                            onClick={() => handleUpdateFilterChange(field)}
                          >
                            {field.replace('_', ' ')}: <span className="font-bold">{count}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('bookings.sync.searchPlaceholder')}
                      value={searchUpdateQuery}
                      onChange={(e) => {
                        setSearchUpdateQuery(e.target.value);
                        setCurrentUpdatePage(1); // Reset to first page when search changes
                      }}
                      className="pl-9 border-muted w-full"
                    />
                  </div>
                  
                  <Select
                    value={updateFilterField}
                    onValueChange={handleUpdateFilterChange}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder={t('bookings.sync.allChanges')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('bookings.sync.allChanges')}</SelectItem>
                      <SelectItem value="date">date</SelectItem>
                      <SelectItem value="time">time</SelectItem>
                      <SelectItem value="status">status</SelectItem>
                      <SelectItem value="customer_name">customer name</SelectItem>
                      <SelectItem value="service_name">service name</SelectItem>
                      <SelectItem value="billing">billing information</SelectItem>
                      <SelectItem value="coupon">coupon information</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={String(updateItemsPerPage)}
                    onValueChange={(value) => {
                      setUpdateItemsPerPage(Number(value));
                      setCurrentUpdatePage(1); // Reset to first page when items per page changes
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue placeholder={t('bookings.sync.perPage', { count: String(5) })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">{t('bookings.sync.perPage', { count: String(5) })}</SelectItem>
                      <SelectItem value="10">{t('bookings.sync.perPage', { count: String(10) })}</SelectItem>
                      <SelectItem value="20">{t('bookings.sync.perPage', { count: String(20) })}</SelectItem>
                      <SelectItem value="50">{t('bookings.sync.perPage', { count: String(50) })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="select-all" 
                      checked={
                        getFilteredAndSortedBookingsToUpdate().length > 0 && 
                        getFilteredAndSortedBookingsToUpdate().every(b => selectedBookingsToUpdate[b.id])
                      }
                      onCheckedChange={(checked) => {
                        // Convert to boolean
                        const newCheckedState = !!checked;
                        
                        // Get the filtered/visible bookings
                        const filteredBookings = getFilteredAndSortedBookingsToUpdate();
                        
                        // 1. Update booking selections
                        const newSelections = { ...selectedBookingsToUpdate };
                        filteredBookings.forEach(booking => {
                          newSelections[booking.id] = newCheckedState;
                        });
                        setSelectedBookingsToUpdate(newSelections);
                        
                        // 2. Update all change selections for these bookings
                        const newChangeSelections = { ...bookingSelectedChanges };
                        
                        filteredBookings.forEach(booking => {
                          // Initialize the changes object for this booking if it doesn't exist
                          if (!newChangeSelections[booking.id]) {
                            newChangeSelections[booking.id] = {};
                          }
                          
                          // Set all changes for this booking to the new state
                          if (booking.changes) {
                            booking.changes.forEach(change => {
                              newChangeSelections[booking.id][change] = newCheckedState;
                            });
                          }
                        });
                        
                        // Update state with all changes at once
                        setBookingSelectedChanges(newChangeSelections);
                      }}
                    />
                    <label 
                      htmlFor="select-all" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {t('common.all')}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Object.values(selectedBookingsToUpdate).filter(Boolean).length} / {bookingsToUpdate.length} {t('common.selected')}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {getPaginatedBookingsToUpdate().length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      No bookings match your filters.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getPaginatedBookingsToUpdate().map((booking) => (
                        <div 
                          key={booking.id} 
                          className={`border rounded-lg overflow-hidden ${selectedBookingsToUpdate[booking.id] ? 'border-primary' : 'border-border'}`}
                        >
                          {/* Booking header */}
                          <div className="flex items-center gap-3 p-4 bg-muted/30">
                            <Checkbox 
                              id={`booking-${booking.id}`} 
                              checked={selectedBookingsToUpdate[booking.id]} 
                              onCheckedChange={() => toggleBookingSelection(booking.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="font-medium">
                                  {booking.booking_id ? `Booking ${booking.booking_id}: ` : ''}{booking.current.customer_name || t('bookings.details.fields.bookingId', { id: booking.id })}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {booking.changes?.map(change => (
                                    <span 
                                      key={change} 
                                      className="text-xs bg-accent px-2 py-0.5 rounded-full"
                                    >
                                      {change.replace('_', ' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {booking.importedBy && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t('bookings.sync.importedBy')}: {booking.importedBy}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Booking content */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                            {/* Current values */}
                            <div className="p-3 border-b md:border-b-0 md:border-r">
                              <h5 className="text-sm font-medium mb-2">{t('bookings.sync.current')}</h5>
                              
                              {/* Date & Time */}
                              {(booking.changes?.includes('date') || booking.changes?.includes('time')) && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-date-time`}
                                    checked={isChangeSelected(booking.id, 'date') || isChangeSelected(booking.id, 'time')} 
                                    onCheckedChange={() => {
                                      if (booking.changes?.includes('date')) toggleChangeSelection(booking.id, 'date');
                                      if (booking.changes?.includes('time')) toggleChangeSelection(booking.id, 'time');
                                    }}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.sync.dateTime')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'date') || isChangeSelected(booking.id, 'time') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.date} {booking.current.time}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Status */}
                              {booking.changes?.includes('status') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-status`}
                                    checked={isChangeSelected(booking.id, 'status')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'status')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.status')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'status') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.status}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Customer Name */}
                              {booking.changes?.includes('customer_name') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-customer-name`}
                                    checked={isChangeSelected(booking.id, 'customer_name')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'customer_name')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.customerName')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'customer_name') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.customer_name || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Service Name */}
                              {booking.changes?.includes('service_name') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-service-name`}
                                    checked={isChangeSelected(booking.id, 'service_name')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'service_name')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.serviceName')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'service_name') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.service_name || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* ADD COUPON FIELDS */}
                              {/* Coupon Code - Current */}
                              {booking.changes?.includes('coupon_code') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-coupon-code`}
                                    checked={isChangeSelected(booking.id, 'coupon_code')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'coupon_code')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">Coupon Code</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'coupon_code') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.coupon_code || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Coupon Discount - Current */}
                              {booking.changes?.includes('coupon_discount_percentage') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-coupon-discount`}
                                    checked={isChangeSelected(booking.id, 'coupon_discount_percentage')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'coupon_discount_percentage')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">Discount Percentage</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'coupon_discount_percentage') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.coupon_discount_percentage ? `${booking.current.coupon_discount_percentage}%` : 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Company Name - Current */}
                              {booking.changes?.includes('billing_company_name') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-billing-company-name`}
                                    checked={isChangeSelected(booking.id, 'billing_company_name')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'billing_company_name')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.billing.companyName')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'billing_company_name') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.billing_company_name || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Tax Number - Current */}
                              {booking.changes?.includes('billing_tax_number') && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-billing-tax-number`}
                                    checked={isChangeSelected(booking.id, 'billing_tax_number')}
                                    onCheckedChange={() => toggleChangeSelection(booking.id, 'billing_tax_number')}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.billing.taxNumber')}</dt>
                                      <dd className={`text-sm ${isChangeSelected(booking.id, 'billing_tax_number') ? 'line-through text-muted-foreground' : ''}`}>
                                        {booking.current.billing_tax_number || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Address - Current */}
                              {(booking.changes?.includes('billing_street_name') || 
                                booking.changes?.includes('billing_street_number') || 
                                booking.changes?.includes('billing_city') || 
                                booking.changes?.includes('billing_state') || 
                                booking.changes?.includes('billing_postal_code') || 
                                booking.changes?.includes('billing_country')) && (
                                <div className="flex items-center mb-2">
                                  <Checkbox 
                                    id={`change-${booking.id}-billing-address`}
                                    checked={
                                      (booking.changes?.includes('billing_street_name') && isChangeSelected(booking.id, 'billing_street_name')) ||
                                      (booking.changes?.includes('billing_street_number') && isChangeSelected(booking.id, 'billing_street_number')) ||
                                      (booking.changes?.includes('billing_city') && isChangeSelected(booking.id, 'billing_city')) ||
                                      (booking.changes?.includes('billing_state') && isChangeSelected(booking.id, 'billing_state')) ||
                                      (booking.changes?.includes('billing_postal_code') && isChangeSelected(booking.id, 'billing_postal_code')) ||
                                      (booking.changes?.includes('billing_country') && isChangeSelected(booking.id, 'billing_country'))
                                    }
                                    onCheckedChange={() => {
                                      if (booking.changes?.includes('billing_street_name')) toggleChangeSelection(booking.id, 'billing_street_name');
                                      if (booking.changes?.includes('billing_street_number')) toggleChangeSelection(booking.id, 'billing_street_number');
                                      if (booking.changes?.includes('billing_city')) toggleChangeSelection(booking.id, 'billing_city');
                                      if (booking.changes?.includes('billing_state')) toggleChangeSelection(booking.id, 'billing_state');
                                      if (booking.changes?.includes('billing_postal_code')) toggleChangeSelection(booking.id, 'billing_postal_code');
                                      if (booking.changes?.includes('billing_country')) toggleChangeSelection(booking.id, 'billing_country');
                                    }}
                                    className="mr-2"
                                  />
                                  <div className="w-full">
                                    <div className="flex justify-between items-center">
                                      <dt className="text-xs text-muted-foreground">{t('bookings.billing.address')}</dt>
                                      <dd className={`text-sm ${
                                        (booking.changes?.includes('billing_street_name') && isChangeSelected(booking.id, 'billing_street_name')) ||
                                        (booking.changes?.includes('billing_street_number') && isChangeSelected(booking.id, 'billing_street_number')) ||
                                        (booking.changes?.includes('billing_city') && isChangeSelected(booking.id, 'billing_city')) ||
                                        (booking.changes?.includes('billing_state') && isChangeSelected(booking.id, 'billing_state')) ||
                                        (booking.changes?.includes('billing_postal_code') && isChangeSelected(booking.id, 'billing_postal_code')) ||
                                        (booking.changes?.includes('billing_country') && isChangeSelected(booking.id, 'billing_country'))
                                          ? 'line-through text-muted-foreground' : ''
                                      }`}>
                                        {[
                                          booking.current.billing_street_name,
                                          booking.current.billing_street_number,
                                          booking.current.billing_city,
                                          booking.current.billing_state,
                                          booking.current.billing_postal_code,
                                          booking.current.billing_country
                                        ].filter(Boolean).join(', ') || 'N/A'}
                                      </dd>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Updated values */}
                            <div className="p-3 bg-accent/30">
                              <h5 className="text-sm font-medium mb-2">{t('bookings.sync.afterUpdate')}</h5>
                              
                              {/* Date & Time */}
                              {(booking.changes?.includes('date') || booking.changes?.includes('time')) && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.sync.dateTime')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'date') || isChangeSelected(booking.id, 'time') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.date} {booking.updated.time}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Status */}
                              {booking.changes?.includes('status') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.status')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'status') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.status}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Customer Name */}
                              {booking.changes?.includes('customer_name') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.customerName')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'customer_name') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.customer_name || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Service Name */}
                              {booking.changes?.includes('service_name') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.details.fields.serviceName')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'service_name') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.service_name || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Coupon Code - Updated */}
                              {booking.changes?.includes('coupon_code') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">Coupon Code</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'coupon_code') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.coupon_code || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Coupon Discount - Updated */}
                              {booking.changes?.includes('coupon_discount_percentage') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">Discount Percentage</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'coupon_discount_percentage') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.coupon_discount_percentage ? `${booking.updated.coupon_discount_percentage}%` : 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Company Name - Updated */}
                              {booking.changes?.includes('billing_company_name') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.billing.companyName')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'billing_company_name') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.billing_company_name || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Tax Number - Updated */}
                              {booking.changes?.includes('billing_tax_number') && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.billing.taxNumber')}</dt>
                                    <dd className={`text-sm ${isChangeSelected(booking.id, 'billing_tax_number') ? 'font-medium text-primary' : ''}`}>
                                      {booking.updated.billing_tax_number || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                              
                              {/* Billing Address - Updated */}
                              {(booking.changes?.includes('billing_street_name') || 
                                booking.changes?.includes('billing_street_number') || 
                                booking.changes?.includes('billing_city') || 
                                booking.changes?.includes('billing_state') || 
                                booking.changes?.includes('billing_postal_code') || 
                                booking.changes?.includes('billing_country')) && (
                                <div className="mb-2">
                                  <div className="flex justify-between items-center">
                                    <dt className="text-xs text-muted-foreground">{t('bookings.billing.address')}</dt>
                                    <dd className={`text-sm ${
                                      (booking.changes?.includes('billing_street_name') && isChangeSelected(booking.id, 'billing_street_name')) ||
                                      (booking.changes?.includes('billing_street_number') && isChangeSelected(booking.id, 'billing_street_number')) ||
                                      (booking.changes?.includes('billing_city') && isChangeSelected(booking.id, 'billing_city')) ||
                                      (booking.changes?.includes('billing_state') && isChangeSelected(booking.id, 'billing_state')) ||
                                      (booking.changes?.includes('billing_postal_code') && isChangeSelected(booking.id, 'billing_postal_code')) ||
                                      (booking.changes?.includes('billing_country') && isChangeSelected(booking.id, 'billing_country'))
                                        ? 'font-medium text-primary' : ''
                                    }`}>
                                      {[
                                        booking.updated.billing_street_name,
                                        booking.updated.billing_street_number,
                                        booking.updated.billing_city,
                                        booking.updated.billing_state,
                                        booking.updated.billing_postal_code,
                                        booking.updated.billing_country
                                      ].filter(Boolean).join(', ') || 'N/A'}
                                    </dd>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {totalUpdatePages() > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentUpdatePage > 1) {
                                setCurrentUpdatePage(currentUpdatePage - 1);
                              }
                            }} 
                            aria-disabled={currentUpdatePage === 1}
                            className={currentUpdatePage === 1 ? 'pointer-events-none opacity-50' : ''}
                          >
                            {t('bookings.sync.previous')}
                          </PaginationPrevious>
                        </PaginationItem>
                        
                        {Array.from({ length: totalUpdatePages() }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === totalUpdatePages() || 
                            Math.abs(page - currentUpdatePage) <= 1
                          )
                          .map((page, i, arr) => {
                            // Add ellipsis
                            const showEllipsisBefore = i > 0 && arr[i-1] !== page - 1;
                            const showEllipsisAfter = i < arr.length - 1 && arr[i+1] !== page + 1;
                            
                            return (
                              <Fragment key={`pagination-${page}`}>
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                
                                <PaginationItem>
                                  <PaginationLink 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentUpdatePage(page);
                                    }}
                                    isActive={page === currentUpdatePage}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                                
                                {showEllipsisAfter && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                              </Fragment>
                            );
                          })
                        }
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentUpdatePage < totalUpdatePages()) {
                                setCurrentUpdatePage(currentUpdatePage + 1);
                              }
                            }}
                            aria-disabled={currentUpdatePage === totalUpdatePages()}
                            className={currentUpdatePage === totalUpdatePages() ? 'pointer-events-none opacity-50' : ''}
                          >
                            {t('bookings.sync.next')}
                          </PaginationNext>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <DialogFooter className="border-t py-4 px-6 mt-0 sticky bottom-0 bg-background z-10">
              <Button variant="outline" onClick={handleCancelBookingUpdates} disabled={isSyncing}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleConfirmBookingUpdates} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>{t('bookings.sync.syncing')}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>
                      {t('bookings.sync.confirmAndSync')}
                    </span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <BookingsList 
          limit={10} 
          search={debouncedSearch}
          view={view}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          dateRange={dateRange}
          status={filter}
        />
      </div>
    </BookingsErrorBoundary>
  )
} 