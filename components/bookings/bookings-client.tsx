'use client'

import React from 'react'
import { BookingsList } from './bookings-list'
import { BookingsErrorBoundary } from './error-boundary'
import { UpdateConfirmationDialog } from './update-confirmation-dialog'
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useI18n } from '@/lib/i18n/context'

// Import custom hooks
import { useBookingsSync } from '@/lib/hooks/use-bookings-sync'
import { useBookingsFilters } from '@/lib/hooks/use-bookings-filters'
import { useBookingsUpdateDialog } from '@/lib/hooks/use-bookings-update-dialog'
import { useBookingsResponsive } from '@/lib/hooks/use-bookings-responsive'

interface BookingsClientProps {
  hideTabNavigation?: boolean;
}

export function BookingsClient({ hideTabNavigation = false }: BookingsClientProps) {
  const { t } = useI18n();

  // Use custom hooks
  const {
    isSyncing,
    syncResult,
    setSyncResult,
    clearSyncResult,
    showUpdateConfirmation,
    setShowUpdateConfirmation,
    bookingsToUpdate,
    setBookingsToUpdate,
    selectedBookingsToUpdate,
    setSelectedBookingsToUpdate,
    pendingSyncAction,
    setPendingSyncAction,
    bookingSelectedChanges,
    setBookingSelectedChanges,
    handleSyncBookings,
    syncBookingsFromWordPress,
  } = useBookingsSync();

  const {
    debouncedSearch,
    view,
    currentPage,
    dateRange,
    filter,
    handlePageChange,
  } = useBookingsFilters();

  const {
    currentUpdatePage,
    setCurrentUpdatePage,
    updateItemsPerPage,
    setUpdateItemsPerPage,
    updateFilterField,
    setUpdateFilterField,
    searchUpdateQuery,
    setSearchUpdateQuery,
    updateSortField,
    setUpdateSortField,
    updateSortDirection,
    setUpdateSortDirection,
    getFilteredAndSortedBookings,
    getPaginatedBookings,
    getTotalUpdatePages,
    resetPagination,
    handleSortChange,
    handleSearchChange,
    handleFilterChange: handleUpdateFilterChange,
    handleItemsPerPageChange,
  } = useBookingsUpdateDialog();

  const {
    isMobile,
  } = useBookingsResponsive();

  // Get filtered and paginated bookings for update dialog
  const filteredBookings = getFilteredAndSortedBookings(bookingsToUpdate);
  const paginatedBookings = getPaginatedBookings(bookingsToUpdate);
  const totalUpdatePages = getTotalUpdatePages(bookingsToUpdate);

  // Auto-dismiss sync result message
  React.useEffect(() => {
    if (syncResult) {
      clearSyncResult();
    }
  }, [syncResult, clearSyncResult]);

  return (
    <BookingsErrorBoundary>
      <div className="space-y-4">
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
        <UpdateConfirmationDialog
          open={showUpdateConfirmation}
          onOpenChange={setShowUpdateConfirmation}
          bookings={paginatedBookings}
          selectedBookings={selectedBookingsToUpdate}
          onSelectedBookingsChange={setSelectedBookingsToUpdate}
          bookingSelectedChanges={bookingSelectedChanges}
          onBookingSelectedChangesChange={setBookingSelectedChanges}
          pendingSyncAction={pendingSyncAction}
          isSyncing={isSyncing}
          onSync={syncBookingsFromWordPress}
          onRefresh={handleSyncBookings}
          currentPage={currentUpdatePage}
          onPageChange={setCurrentUpdatePage}
          totalPages={totalUpdatePages}
          searchQuery={searchUpdateQuery}
          onSearchChange={handleSearchChange}
          filterField={updateFilterField}
          onFilterChange={handleUpdateFilterChange}
          sortField={updateSortField}
          sortDirection={updateSortDirection}
          onSortChange={handleSortChange}
          itemsPerPage={updateItemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {/* Bookings List */}
        <BookingsList 
          limit={10} 
          search={debouncedSearch}
          view={view}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          dateRange={dateRange}
          status={filter}
          onSyncClick={handleSyncBookings}
        />
      </div>
    </BookingsErrorBoundary>
  )
}
