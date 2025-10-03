import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingWithRelations } from '@/types/dispatch';
import { AssignmentFilterOptions } from '@/components/dispatch/assignment-filter';

export const useAssignmentFiltering = (bookings: BookingWithRelations[]) => {
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<AssignmentFilterOptions>({
    searchQuery: "",
    statusFilter: "all",
    dateFilter: "all",
    serviceFilter: "all",
    assignmentFilter: "all",
    sortBy: "date",
    sortOrder: "desc"
  });

  // Initialize filters from URL params if they exist
  useEffect(() => {
    const searchQuery = searchParams?.get('search') || '';
    const statusFilter = searchParams?.get('status') || 'all';
    const dateFilter = searchParams?.get('date') || 'all';
    const serviceFilter = searchParams?.get('service') || 'all';
    const assignmentFilter = searchParams?.get('assignment') || 'all';
    
    setFilters({
      searchQuery,
      statusFilter,
      dateFilter,
      serviceFilter,
      assignmentFilter,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }, [searchParams]);

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customer_name?.toLowerCase().includes(query) ||
        booking.wp_id?.toString().includes(query) ||
        booking.customer_email?.toLowerCase().includes(query) ||
        booking.customer_phone?.includes(query)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.statusFilter);
    }

    // Date filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(booking => {
        if (!booking.date) return false;
        const bookingDate = new Date(booking.date);
        
        switch (filters.dateFilter) {
          case 'today':
            return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return bookingDate >= weekStart && bookingDate < weekEnd;
          case 'month':
            return bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    // Service filter
    if (filters.serviceFilter !== 'all') {
      filtered = filtered.filter(booking => booking.service_id === filters.serviceFilter);
    }

    // Assignment filter
    if (filters.assignmentFilter !== 'all') {
      switch (filters.assignmentFilter) {
        case 'assigned':
          filtered = filtered.filter(booking => booking.driver_id && booking.vehicle_id);
          break;
        case 'unassigned':
          filtered = filtered.filter(booking => !booking.driver_id || !booking.vehicle_id);
          break;
        case 'driver_only':
          filtered = filtered.filter(booking => booking.driver_id && !booking.vehicle_id);
          break;
        case 'vehicle_only':
          filtered = filtered.filter(booking => !booking.driver_id && booking.vehicle_id);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          break;
        case 'customer':
          aValue = a.customer_name || '';
          bValue = b.customer_name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'service':
          aValue = a.service_type_name || '';
          bValue = b.service_type_name || '';
          break;
        default:
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, filters]);

  return {
    filters,
    setFilters,
    filteredBookings
  };
};
