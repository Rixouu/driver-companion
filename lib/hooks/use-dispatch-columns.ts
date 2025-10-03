import { useState, useEffect, useCallback } from 'react';
import { DispatchStatus } from '@/types/dispatch';

const DEFAULT_COLUMN_ORDER: DispatchStatus[] = [
  'pending', 
  'assigned', 
  'confirmed', 
  'en_route', 
  'arrived', 
  'in_progress', 
  'completed', 
  'cancelled'
];

export const useDispatchColumns = () => {
  const [columnOrder, setColumnOrder] = useState<DispatchStatus[]>(DEFAULT_COLUMN_ORDER);
  const [hiddenColumns, setHiddenColumns] = useState<Set<DispatchStatus>>(new Set());
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Load saved settings after hydration to prevent hydration mismatch
  useEffect(() => {
    const savedOrder = localStorage.getItem('dispatch-column-order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) {
          setColumnOrder(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse saved column order:', error);
      }
    }

    const savedHidden = localStorage.getItem('dispatch-hidden-columns');
    if (savedHidden) {
      try {
        const parsed = JSON.parse(savedHidden);
        if (Array.isArray(parsed)) {
          setHiddenColumns(new Set(parsed));
        }
      } catch (error) {
        console.warn('Failed to parse saved hidden columns:', error);
      }
    }
  }, []);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((status: DispatchStatus) => {
    setHiddenColumns(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(status)) {
        newHidden.delete(status);
      } else {
        newHidden.add(status);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dispatch-hidden-columns', JSON.stringify(Array.from(newHidden)));
      }
      
      return newHidden;
    });
  }, []);

  // Get visible columns
  const visibleColumns = columnOrder.filter(status => !hiddenColumns.has(status));

  // Column configuration
  const columnConfig = {
    pending: { title: 'Pending', emptyMessage: 'No pending bookings' },
    assigned: { title: 'Assigned', emptyMessage: 'No assigned bookings' },
    confirmed: { title: 'Confirmed', emptyMessage: 'No confirmed bookings' },
    en_route: { title: 'En Route', emptyMessage: 'No en route bookings' },
    arrived: { title: 'Arrived', emptyMessage: 'No arrived bookings' },
    in_progress: { title: 'In Progress', emptyMessage: 'No in progress bookings' },
    completed: { title: 'Completed', emptyMessage: 'No completed bookings' },
    cancelled: { title: 'Cancelled', emptyMessage: 'No cancelled bookings' }
  };

  return {
    columnOrder,
    setColumnOrder,
    hiddenColumns,
    setHiddenColumns,
    visibleColumns,
    columnConfig,
    showColumnSettings,
    setShowColumnSettings,
    toggleColumnVisibility
  };
};
