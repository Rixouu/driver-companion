'use client'

import { useState, useEffect, useRef } from 'react'
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
  CheckCircle
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
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

interface BookingsClientProps {
  hideTabNavigation?: boolean;
}

export function BookingsClient({ hideTabNavigation = false }: BookingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(searchParams.get('status') || 'all')
  const [view, setView] = useState<"list" | "grid">(() => {
    // Try to get view from URL params first
    const urlView = searchParams.get('view') as "list" | "grid" | null
    if (urlView === "grid" || urlView === "list") {
      return urlView
    }
    // Default to list view
    return "list"
  })
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page') || '1'))
  const debouncedSearch = useDebounce(search, 500)
  const { t } = useI18n()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Initialize from URL params if available
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
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
    updateUrlWithFilters(value, dateRange, view)
  }
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    updateUrlWithFilters(filter, range, view)
  }
  
  const handleViewChange = (newView: "list" | "grid") => {
    setView(newView)
    updateUrlWithFilters(filter, dateRange, newView)
  }
  
  // Function to update URL with all filters
  const updateUrlWithFilters = (statusFilter: string, dateFilters?: DateRange, viewType: "list" | "grid" = view) => {
    const params = new URLSearchParams(searchParams.toString())
    
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
    
    // Reset to page 1 when filters change
    params.set("page", "1")
    setCurrentPage(1)
    
    router.push(`/bookings?${params.toString()}`)
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/bookings?${params.toString()}`)
  }
  
  const clearFilters = () => {
    setFilter('all')
    setDateRange(undefined)
    setSearch('')
    const params = new URLSearchParams()
    params.set("view", view)
    params.set("page", "1")
    router.push(`/bookings?${params.toString()}`)
  }
  
  // Function to sync bookings from WordPress
  const syncBookingsFromWordPress = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncBookingsAction()
      
      // Create a formatted message using our translation with count data
      let message = result.message
      if (result.success && result.stats) {
        message = t('bookings.sync.successWithCount', {
          count: String(result.stats.total),
          created: String(result.stats.created),
          updated: String(result.stats.updated)
        })
      }
      
      setSyncResult({
        success: result.success,
        message: message
      })
      
      if (result.success) {
        // Reload page after successful sync
        router.refresh()
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
  
  // Set default view based on screen size
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
    if (isMobile && view === "grid") {
      handleViewChange("list")
    }
    
    // Add resize listener to change view when resizing between mobile and desktop
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
      if (isMobileNow && view === "grid") {
        handleViewChange("list")
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  // Generate status filter button class based on active status
  const getStatusButtonClass = (buttonStatus: string) => {
    if (filter === buttonStatus) {
      switch (buttonStatus) {
        case 'confirmed':
          return 'bg-green-600 hover:bg-green-700 text-white font-medium';
        case 'pending':
          return 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium';
        case 'cancelled':
          return 'bg-red-600 hover:bg-red-700 text-white font-medium';
        case 'completed':
          return 'bg-blue-600 hover:bg-blue-700 text-white font-medium';
        default:
          return 'text-primary-foreground font-medium';
      }
    } else {
      switch (buttonStatus) {
        case 'confirmed':
          return 'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30';
        case 'pending':
          return 'border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-950/30';
        case 'cancelled':
          return 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30';
        case 'completed':
          return 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30';
        default:
          return 'text-muted-foreground';
      }
    }
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
                
                {/* View Toggle */}
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
                    className={`rounded-sm flex-1 h-7 px-2 ${view === 'grid' ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">{t('bookings.viewOptions.grid')}</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Advanced Filters Row - Conditional display */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t w-full">
                <div className="flex flex-wrap items-center gap-2 flex-1 w-full">
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateRangeChange}
                    className="w-full sm:w-auto"
                  />
                  
                  <Select
                    value={filter}
                    onValueChange={handleFilterChange}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
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
                
                <div className="flex justify-start sm:justify-end mt-2 sm:mt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-2" />
                    <span>{t('bookings.filters.clearFilters')}</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Status Filter Pills - Only show when not in advanced filters mode */}
            {!showFilters && (
              <div className="flex flex-wrap gap-2 pt-3 border-t overflow-x-auto pb-1 w-full">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                  className={getStatusButtonClass('all')}
                >
                  {t('bookings.filters.all')}
                </Button>
                <Button 
                  variant={filter === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('confirmed')}
                  className={getStatusButtonClass('confirmed')}
                >
                  {t('bookings.filters.confirmed')}
                </Button>
                <Button 
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('pending')}
                  className={getStatusButtonClass('pending')}
                >
                  {t('bookings.filters.pending')}
                </Button>
                <Button 
                  variant={filter === 'cancelled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('cancelled')}
                  className={getStatusButtonClass('cancelled')}
                >
                  {t('bookings.filters.cancelled')}
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('completed')}
                  className={getStatusButtonClass('completed')}
                >
                  {t('bookings.filters.completed')}
                </Button>
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