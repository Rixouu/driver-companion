import { useState, useCallback } from 'react';

interface BookingUpdateConfirmation {
  id: string;
  booking_id: string;
  current: any;
  updated: any;
  changes: string[];
  selectedChanges: Record<string, boolean>;
}

export const useBookingsUpdateDialog = () => {
  // Pagination and filtering for updates dialog
  const [currentUpdatePage, setCurrentUpdatePage] = useState(1);
  const [updateItemsPerPage, setUpdateItemsPerPage] = useState(5);
  const [updateFilterField, setUpdateFilterField] = useState<string>('all');
  const [searchUpdateQuery, setSearchUpdateQuery] = useState('');
  const [updateSortField, setUpdateSortField] = useState<string>('id');
  const [updateSortDirection, setUpdateSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort the bookings to update
  const getFilteredAndSortedBookings = useCallback((bookings: BookingUpdateConfirmation[]) => {
    return bookings
      .filter(booking => {
        // Apply search filter
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
          case 'booking_id':
            valA = a.booking_id || '';
            valB = b.booking_id || '';
            break;
          case 'customer_name':
            valA = a.current.customer_name || '';
            valB = b.current.customer_name || '';
            break;
          case 'service_name':
            valA = a.current.service_name || '';
            valB = b.current.service_name || '';
            break;
          case 'changes_count':
            valA = a.changes?.length || 0;
            valB = b.changes?.length || 0;
            break;
          default:
            valA = a.id;
            valB = b.id;
        }
        
        if (updateSortDirection === 'asc') {
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
      });
  }, [searchUpdateQuery, updateSortField, updateSortDirection]);

  // Get paginated bookings
  const getPaginatedBookings = useCallback((bookings: BookingUpdateConfirmation[]) => {
    const filtered = getFilteredAndSortedBookings(bookings);
    const startIndex = (currentUpdatePage - 1) * updateItemsPerPage;
    const endIndex = startIndex + updateItemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredAndSortedBookings, currentUpdatePage, updateItemsPerPage]);

  // Calculate total pages
  const getTotalUpdatePages = useCallback((bookings: BookingUpdateConfirmation[]) => {
    const filtered = getFilteredAndSortedBookings(bookings);
    return Math.ceil(filtered.length / updateItemsPerPage);
  }, [getFilteredAndSortedBookings, updateItemsPerPage]);

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setCurrentUpdatePage(1);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((field: string) => {
    if (updateSortField === field) {
      setUpdateSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setUpdateSortField(field);
      setUpdateSortDirection('asc');
    }
    resetPagination();
  }, [updateSortField, resetPagination]);

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    setSearchUpdateQuery(query);
    resetPagination();
  }, [resetPagination]);

  // Handle filter change
  const handleFilterChange = useCallback((field: string) => {
    setUpdateFilterField(field);
    resetPagination();
  }, [resetPagination]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((items: number) => {
    setUpdateItemsPerPage(items);
    resetPagination();
  }, [resetPagination]);

  return {
    // Pagination state
    currentUpdatePage,
    setCurrentUpdatePage,
    updateItemsPerPage,
    setUpdateItemsPerPage,
    
    // Filter state
    updateFilterField,
    setUpdateFilterField,
    searchUpdateQuery,
    setSearchUpdateQuery,
    updateSortField,
    setUpdateSortField,
    updateSortDirection,
    setUpdateSortDirection,
    
    // Computed values
    getFilteredAndSortedBookings,
    getPaginatedBookings,
    getTotalUpdatePages,
    
    // Handlers
    resetPagination,
    handleSortChange,
    handleSearchChange,
    handleFilterChange,
    handleItemsPerPageChange,
  };
};
