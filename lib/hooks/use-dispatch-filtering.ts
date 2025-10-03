import { useState, useMemo } from 'react';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';

export const useDispatchFiltering = (assignments: DispatchEntryWithRelations[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DispatchStatus | 'all'>('all');

  // Filter assignments based on search query and status
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const booking = assignment.booking;
      if (!booking) return false;
      
      const matchesSearch = !searchQuery || 
        booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (booking.wp_id && booking.wp_id.toString().toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  // Calculate status counts
  const statusCounts = useMemo(() => ({
    pending: assignments.filter(e => e.status === 'pending').length,
    assigned: assignments.filter(e => e.status === 'assigned').length,
    confirmed: assignments.filter(e => e.status === 'confirmed').length,
    en_route: assignments.filter(e => e.status === 'en_route').length,
    arrived: assignments.filter(e => e.status === 'arrived').length,
    in_progress: assignments.filter(e => e.status === 'in_progress').length,
    completed: assignments.filter(e => e.status === 'completed').length,
    cancelled: assignments.filter(e => e.status === 'cancelled').length
  }), [assignments]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredAssignments,
    statusCounts
  };
};
