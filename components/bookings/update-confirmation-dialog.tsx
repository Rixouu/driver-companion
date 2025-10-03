"use client";

import { Fragment } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface BookingUpdateConfirmation {
  id: string;
  booking_id: string;
  current: any;
  updated: any;
  changes: string[];
  selectedChanges: Record<string, boolean>;
}

interface UpdateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: BookingUpdateConfirmation[];
  selectedBookings: Record<string, boolean>;
  onSelectedBookingsChange: (bookings: Record<string, boolean>) => void;
  bookingSelectedChanges: Record<string, Record<string, boolean>>;
  onBookingSelectedChangesChange: (changes: Record<string, Record<string, boolean>>) => void;
  pendingSyncAction: {
    newBookings: number;
    updatedBookings: number;
  } | null;
  isSyncing: boolean;
  onSync: () => void;
  onRefresh: () => void;
  // Pagination and filtering
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterField: string;
  onFilterChange: (field: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
}

export function UpdateConfirmationDialog({
  open,
  onOpenChange,
  bookings,
  selectedBookings,
  onSelectedBookingsChange,
  bookingSelectedChanges,
  onBookingSelectedChangesChange,
  pendingSyncAction,
  isSyncing,
  onSync,
  onRefresh,
  currentPage,
  onPageChange,
  totalPages,
  searchQuery,
  onSearchChange,
  filterField,
  onFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange,
}: UpdateConfirmationDialogProps) {
  const { t } = useI18n();

  const isChangeSelected = (bookingId: string, change: string) => {
    return bookingSelectedChanges[bookingId]?.[change] || false;
  };

  const toggleChangeSelection = (bookingId: string, change: string) => {
    const newChanges = { ...bookingSelectedChanges };
    if (!newChanges[bookingId]) {
      newChanges[bookingId] = {};
    }
    newChanges[bookingId][change] = !isChangeSelected(bookingId, change);
    onBookingSelectedChangesChange(newChanges);
  };

  const toggleBookingSelection = (bookingId: string) => {
    const newSelected = { ...selectedBookings };
    newSelected[bookingId] = !selectedBookings[bookingId];
    onSelectedBookingsChange(newSelected);
  };

  const selectAllBookings = () => {
    const newSelected: Record<string, boolean> = {};
    bookings.forEach(booking => {
      newSelected[booking.id] = true;
    });
    onSelectedBookingsChange(newSelected);
  };

  const deselectAllBookings = () => {
    onSelectedBookingsChange({});
  };

  const selectedCount = Object.values(selectedBookings).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="pb-4 border-b sticky top-0 z-20 bg-background p-6">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              {t('bookings.sync.confirmUpdates')}
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                onClick={onRefresh}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Check for Updates
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFilterChange('all')}>
                    All Fields
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFilterChange('customer')}>
                    Customer Info
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFilterChange('service')}>
                    Service Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFilterChange('billing')}>
                    Billing Info
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {pendingSyncAction && (
            <DialogDescription className="text-sm text-muted-foreground">
              {pendingSyncAction.newBookings} new bookings and {pendingSyncAction.updatedBookings} updates available
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllBookings}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllBookings}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Bookings List */}
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  {/* Booking Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedBookings[booking.id] || false}
                        onCheckedChange={() => toggleBookingSelection(booking.id)}
                      />
                      <div>
                        <h4 className="font-medium">
                          #{booking.booking_id || booking.id.substring(0, 8)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.current.customer_name || 'Unknown Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.changes?.length || 0} changes
                    </div>
                  </div>

                  {/* Changes List */}
                  {booking.changes && booking.changes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Changes:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {booking.changes.map((change) => (
                          <div key={change} className="flex items-center gap-2">
                            <Checkbox
                              checked={isChangeSelected(booking.id, change)}
                              onCheckedChange={() => toggleChangeSelection(booking.id, change)}
                            />
                            <span className="text-sm capitalize">
                              {change.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Change Details */}
                  {booking.changes && booking.changes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Details:</h5>
                      <dl className="space-y-1 text-sm">
                        {booking.changes.map((change) => (
                          <div key={change} className="flex justify-between items-center">
                            <dt className="text-muted-foreground capitalize">
                              {change.replace(/_/g, ' ')}:
                            </dt>
                            <dd className={`${
                              isChangeSelected(booking.id, change) 
                                ? 'font-medium text-primary' 
                                : ''
                            }`}>
                              {booking.updated[change] || 'N/A'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          onPageChange(currentPage - 1);
                        }
                      }} 
                      aria-disabled={currentPage === 1}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    >
                      {t('bookings.sync.previous')}
                    </PaginationPrevious>
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1
                    )
                    .map((page, i, arr) => {
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
                                onPageChange(page);
                              }}
                              isActive={page === currentPage}
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
                        if (currentPage < totalPages) {
                          onPageChange(currentPage + 1);
                        }
                      }} 
                      aria-disabled={currentPage === totalPages}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    >
                      {t('bookings.sync.next')}
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-muted-foreground">
              {selectedCount} of {bookings.length} bookings selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSyncing}
              >
                Cancel
              </Button>
              <Button
                onClick={onSync}
                disabled={isSyncing || selectedCount === 0}
                className="flex items-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Selected ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
