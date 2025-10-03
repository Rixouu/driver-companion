import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface BookingFilterOptions {
  statusFilter: string;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  customerFilter: string;
  driverFilter: string;
}

export const useBookingsFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Basic filter states
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(searchParams?.get('status') || 'all');
  const [view, setView] = useState<"list" | "grid">(() => {
    const urlView = searchParams?.get('view') as "list" | "grid" | null;
    if (urlView === "grid" || urlView === "list") {
      return urlView;
    }
    return "list";
  });
  const [currentPage, setCurrentPage] = useState(Number(searchParams?.get('page') || '1'));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromDate = searchParams?.get('from');
    const toDate = searchParams?.get('to');
    if (fromDate) {
      return {
        from: new Date(fromDate),
        to: toDate ? new Date(toDate) : undefined
      };
    }
    return undefined;
  });

  // Additional filter states
  const [customerFilter, setCustomerFilter] = useState(searchParams?.get('customer') || '');
  const [driverFilter, setDriverFilter] = useState(searchParams?.get('driver') || 'all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Debounced search
  const debouncedSearch = useDebounce(search, 500);

  // Unified filters state
  const [filters, setFilters] = useState<BookingFilterOptions>({
    statusFilter: searchParams?.get('status') || 'all',
    searchQuery: searchParams?.get('search') || '',
    sortBy: 'date',
    sortOrder: 'desc',
    dateFrom: searchParams?.get('from') || undefined,
    dateTo: searchParams?.get('to') || undefined,
    customerFilter: searchParams?.get('customer') || '',
    driverFilter: searchParams?.get('driver') || 'all'
  });

  // Update URL with filters function
  const updateUrlWithFilters = useCallback((
    statusFilter: string, 
    dateFilters?: DateRange, 
    viewType: "list" | "grid" = view,
    additionalFilters?: {
      customer?: string,
      driver?: string
    }
  ) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    // Handle status filter
    if (statusFilter && statusFilter !== 'all') {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    
    // Handle date filters
    if (dateFilters?.from) {
      params.set("from", dateFilters.from.toISOString().split('T')[0]);
      if (dateFilters.to) {
        params.set("to", dateFilters.to.toISOString().split('T')[0]);
      } else {
        params.delete("to");
      }
    } else {
      params.delete("from");
      params.delete("to");
    }
    
    // Handle view type
    params.set("view", viewType);
    
    // Handle additional filters
    if (additionalFilters) {
      // Customer filter
      if (additionalFilters.customer) {
        params.set("customer", additionalFilters.customer);
      } else {
        params.delete("customer");
      }
      
      // Driver filter
      if (additionalFilters.driver && additionalFilters.driver !== 'all') {
        params.set("driver", additionalFilters.driver);
      } else {
        params.delete("driver");
      }
    }
    
    // Reset to page 1 when filters change
    params.set("page", "1");
    setCurrentPage(1);
    
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`);
  }, [router, searchParams, view]);

  // Filter change handlers
  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
    updateUrlWithFilters(value, dateRange, view, {
      customer: customerFilter,
      driver: driverFilter
    });
  }, [dateRange, view, customerFilter, driverFilter, updateUrlWithFilters]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    updateUrlWithFilters(filter, range, view, {
      customer: customerFilter,
      driver: driverFilter
    });
  }, [filter, view, customerFilter, driverFilter, updateUrlWithFilters]);

  const handleViewChange = useCallback((newView: "list" | "grid") => {
    setView(newView);
    updateUrlWithFilters(filter, dateRange, newView, {
      customer: customerFilter,
      driver: driverFilter
    });
  }, [filter, dateRange, customerFilter, driverFilter, updateUrlWithFilters]);

  const handleFiltersChange = useCallback((newFilters: BookingFilterOptions) => {
    setFilters(newFilters);
    
    // Update individual state variables for backward compatibility
    setSearch(newFilters.searchQuery);
    setFilter(newFilters.statusFilter);
    setCustomerFilter(newFilters.customerFilter || '');
    setDriverFilter(newFilters.driverFilter || 'all');
    
    // Update date range if changed
    if (newFilters.dateFrom || newFilters.dateTo) {
      setDateRange({
        from: newFilters.dateFrom ? new Date(newFilters.dateFrom) : undefined,
        to: newFilters.dateTo ? new Date(newFilters.dateTo) : undefined
      });
    }
    
    // Update URL with new filters
    updateUrlWithFilters(newFilters.statusFilter, {
      from: newFilters.dateFrom ? new Date(newFilters.dateFrom) : undefined,
      to: newFilters.dateTo ? new Date(newFilters.dateTo) : undefined
    }, view, {
      customer: newFilters.customerFilter || '',
      driver: newFilters.driverFilter || 'all'
    });
  }, [view, updateUrlWithFilters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set("page", page.toString());
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`);
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setDateRange(undefined);
    setCustomerFilter('');
    setDriverFilter('all');
    setSearch('');
    setCurrentPage(1);
    
    // Update URL to clear all filters
    const params = new URLSearchParams();
    params.set("view", view);
    // @ts-ignore - Route string types are not matching but this works
    router.push(`/bookings?${params.toString()}`);
  }, [view, router]);

  return {
    // Filter states
    search,
    setSearch,
    filter,
    setFilter,
    view,
    setView,
    currentPage,
    setCurrentPage,
    dateRange,
    setDateRange,
    customerFilter,
    setCustomerFilter,
    driverFilter,
    setDriverFilter,
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    debouncedSearch,
    
    // Handlers
    handleFilterChange,
    handleDateRangeChange,
    handleViewChange,
    handleFiltersChange,
    handlePageChange,
    clearFilters,
    updateUrlWithFilters,
  };
};
