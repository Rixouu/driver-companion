"use client"

import { useState, useEffect, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Edit2, Trash2, PlusCircle, Calendar, Car, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils/styles"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n/context"

import { DriverAvailabilityForm } from "./driver-availability-form"
import { getDriverAvailability, deleteDriverAvailability } from "@/lib/services/driver-availability"
import { getDriverBookings } from "@/app/actions/bookings"
import type { DriverAvailability, Driver } from "@/types/drivers"
import type { Booking } from "@/types/bookings"
import { getStatusBadgeClasses } from "@/lib/utils/styles"

// Helper to get status badge
const StatusBadge = ({ status, isBooking }: { status: string, isBooking?: boolean }) => {
  const { t } = useI18n();
  const finalStatus = isBooking ? 'booking' : status;
  
  return (
    <Badge variant="outline" className={cn(getStatusBadgeClasses(finalStatus), "rounded px-2.5 py-1 text-xs font-medium capitalize")}>
      {isBooking
        ? t('common.booking', { defaultValue: 'Booking' })
        : t(`drivers.availability.statuses.${status}`, { defaultValue: status })}
    </Badge>
  );
};

interface DriverAvailabilityListProps {
  driver: Driver
}

// Format dates with time if available
const formatDateTime = (dateStr: string) => {
  try {
    // Handle both old date-only format and new ISO datetime format
    if (!dateStr) return "";

    const date = new Date(dateStr);
    
    // Ensure date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateStr);
      return dateStr;
    }
    
    // Check if the date string includes time component (for timezone handling)
    if (dateStr.includes('T')) {
      // Use locale specific formatting to handle timezone correctly
      return format(date, "MMM d, yyyy h:mm a"); // Consistent format without timezone
    }
    
    // Format date only (no time component)
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateStr;
  }
};

// Function to extract and format booking information from notes
const getBookingInfo = (notes?: string) => {
  if (!notes || !notes.includes('Assigned to booking')) {
    return null;
  }
  
  // Try to extract booking ID
  const bookingIdMatch = notes.match(/Assigned to booking ([0-9a-f-]+)/);
  const bookingId = bookingIdMatch ? bookingIdMatch[1] : 'Unknown';
  
  // Format the booking assignment text
  return {
    id: bookingId,
    displayText: `Booking #${bookingId.substring(0, 8)}...`,
    isBooking: true
  };
};

// TableRow component with booking data highlight
const AvailabilityTableRow = ({ record, index, totalRecords, onEdit, onDelete }: { 
  record: DriverAvailability, 
  index: number, 
  totalRecords: number,
  onEdit: (record: DriverAvailability) => void,
  onDelete: (id: string) => void 
}) => {
  const { t } = useI18n();
  const bookingInfo = getBookingInfo(record.notes);
  const isBookingRelated = !!bookingInfo;
  
  // Handle empty or invalid dates
  const startDate = record.start_date ? formatDateTime(record.start_date) : "—";
  const endDate = record.end_date ? formatDateTime(record.end_date) : "—";
  
  return (
    <TableRow 
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", 
        index === totalRecords - 1 && "border-b-0"
      )}
    >
      <TableCell className="py-3 px-2 sm:p-3 align-middle whitespace-nowrap">
        <StatusBadge status={record.status} isBooking={isBookingRelated} />
      </TableCell>
      <TableCell className="py-3 px-2 sm:p-3 align-middle whitespace-nowrap text-xs sm:text-sm">
        {startDate}
      </TableCell>
      <TableCell className="py-3 px-2 sm:p-3 align-middle whitespace-nowrap text-xs sm:text-sm">
        {endDate}
      </TableCell>
      <TableCell className="hidden md:table-cell py-3 px-2 sm:p-3 align-middle max-w-xs truncate text-xs sm:text-sm">
        {isBookingRelated ? (
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
              <Calendar className="mr-1 h-3 w-3" />
              {bookingInfo.displayText}
            </span>
          </div>
        ) : (
          record.notes || "—"
        )}
      </TableCell>
      <TableCell className="py-3 px-2 sm:p-3 align-middle text-right">
        <div className="flex justify-end items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(record)}
            title={t('drivers.availability.listView.editAvailability')}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive/90"
            onClick={() => onDelete(record.id)}
            title={t('drivers.availability.deleteAvailability')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export function DriverAvailabilityList({ driver }: DriverAvailabilityListProps) {
  const { t } = useI18n()
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DriverAvailability | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [showPastBookings, setShowPastBookings] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [availabilityStatusFilter, setAvailabilityStatusFilter] = useState("")
  const [availabilitySearchTerm, setAvailabilitySearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Computed values for filtering and pagination
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filter by search term
      if (searchTerm && !booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (statusFilter && booking.status !== statusFilter) {
        return false;
      }
      
      // Filter by past/future if showPastBookings is false
      if (!showPastBookings) {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
          return false;
        }
      }
      
      return true;
    });
  }, [bookings, searchTerm, statusFilter, showPastBookings]);

  // Filter availability records
  const filteredAvailabilityRecords = useMemo(() => {
    return availabilityRecords.filter(record => {
      // Filter by status
      if (availabilityStatusFilter && record.status !== availabilityStatusFilter) {
        return false;
      }
      
      // Filter by search term in notes
      if (availabilitySearchTerm && !record.notes?.toLowerCase().includes(availabilitySearchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [availabilityRecords, availabilityStatusFilter, availabilitySearchTerm]);
  
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, showPastBookings, availabilityStatusFilter, availabilitySearchTerm]);
  
  // Fetch availability data
  const fetchAvailability = async () => {
    try {
      setIsLoading(true)
      const data = await getDriverAvailability(driver.id)
      
      // Process the data to handle possible invalid dates or edge cases
      const processedData = data.map(record => {
        // Ensure dates are valid
        let validRecord = { ...record };
        
        // Check if start_date is valid
        try {
          if (record.start_date) {
            new Date(record.start_date).toISOString();
          }
        } catch (e) {
          console.warn("Invalid start_date detected:", record.start_date);
          // Set a fallback date if invalid
          validRecord.start_date = new Date().toISOString();
        }
        
        // Check if end_date is valid
        try {
          if (record.end_date) {
            new Date(record.end_date).toISOString();
          }
        } catch (e) {
          console.warn("Invalid end_date detected:", record.end_date);
          // Set a fallback date if invalid
          validRecord.end_date = new Date().toISOString();
        }
        
        return validRecord;
      });
      
      // Sort by start date (newest first)
      processedData.sort((a, b) => {
        try {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        } catch (e) {
          return 0; // Return 0 if we can't compare dates
        }
      });
      
      setAvailabilityRecords(processedData);
      
      // Fetch driver bookings
      const { bookings: driverBookings, error: bookingErr } = await getDriverBookings(driver.id, {
        upcoming: undefined, // Get all bookings
        limit: 1000
      });
      
      if (bookingErr) {
        console.error('Error fetching driver bookings:', bookingErr);
      }
      
      setBookings(driverBookings || []);
    } catch (error) {
      console.error("Error fetching driver data:", error)
      toast({
        title: "Error",
        description: t("drivers.availability.listView.loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAvailability();
    
    const handleDataRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.driverId === driver.id) {
        console.log("Refreshing driver data due to booking changes");
        fetchAvailability();
      }
    };
    
    document.addEventListener('refresh-driver-data', handleDataRefresh);
    
    return () => {
      document.removeEventListener('refresh-driver-data', handleDataRefresh);
    };
  }, [driver.id]);
  
  // Handle adding new availability
  const handleAdd = () => {
    setSelectedRecord(null)
    setIsDialogOpen(true)
  }
  
  // Handle editing availability
  const handleEdit = (record: DriverAvailability) => {
    setSelectedRecord(record)
    setIsDialogOpen(true)
  }
  
  // Handle deleting availability
  const handleDelete = (id: string) => {
    setRecordToDelete(id)
    setIsDeleteDialogOpen(true)
  }
  
  // Confirm delete
  const confirmDelete = async () => {
    if (!recordToDelete) return
    
    try {
      await deleteDriverAvailability(recordToDelete)
      toast({
        title: t("drivers.availability.listView.deleteSuccess"),
        description: t("drivers.availability.listView.deleteSuccessMessage"),
      })
      fetchAvailability()
    } catch (error) {
      console.error("Error deleting availability:", error)
      toast({
        title: "Error",
        description: t("drivers.availability.listView.deleteError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedRecord(null)
  }
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    fetchAvailability()
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pb-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {availabilityRecords.length} Availability Records
          </span>
          <span className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            {bookings.length} Total Bookings
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Button 
            variant={showPastBookings ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowPastBookings(!showPastBookings)}
            className="h-8 w-full sm:w-auto"
          >
            {showPastBookings ? "Hide Past" : "Show Past"}
          </Button>
          <Button onClick={handleAdd} size="sm" variant="outline" className="flex items-center w-full sm:w-auto justify-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("drivers.availability.listView.addAvailability", { defaultValue: "Add Availability" })}
          </Button>
        </div>
      </div>
      
      {/* Availability Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Availability Records</h3>
        </div>
        
        {/* Filters for Availability */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
          <select
            value={availabilityStatusFilter}
            onChange={(e) => setAvailabilityStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background w-full sm:w-40"
            aria-label="Filter by availability status"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_leave">On Leave</option>
            <option value="training">Training</option>
            <option value="unavailable">Unavailable</option>
          </select>
          
          <input
            type="text"
            placeholder="Search notes..."
            className="px-3 py-2 text-sm border rounded-md bg-background w-full sm:w-48"
            value={availabilitySearchTerm}
            onChange={(e) => setAvailabilitySearchTerm(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">{t("drivers.availability.listView.loading")}</div>
        ) : filteredAvailabilityRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {availabilityRecords.length === 0 ? t("drivers.availability.listView.noRecords") : 'No availability records match the current filters'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card View for Availability */}
            <div className="block sm:hidden space-y-3">
              {filteredAvailabilityRecords.map((record, index) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={record.status} />
                        {getBookingInfo(record.notes) && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                            <Calendar className="mr-1 h-3 w-3" />
                            {getBookingInfo(record.notes)?.displayText}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Start:</span>
                          <span className="font-medium">{formatDateTime(record.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">End:</span>
                          <span className="font-medium">{formatDateTime(record.end_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {record.notes && !record.notes.includes('Assigned to booking') && (
                    <div className="text-xs text-muted-foreground mb-3 bg-muted/30 rounded-lg p-2">
                      {record.notes}
                    </div>
                  )}
                  
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                      className="h-8 flex-1"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="h-8 flex-1 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View for Availability */}
            <div className="hidden sm:block border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                      {t("drivers.availability.status")}
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">
                      {t("drivers.availability.startDate")}
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap min-w-[120px]">
                      {t("drivers.availability.endDate")}
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                      {t("drivers.availability.notes")}
                    </TableHead>
                    <TableHead className="h-10 px-3 text-right align-middle font-medium text-muted-foreground whitespace-nowrap w-[90px]">
                      {t("drivers.availability.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailabilityRecords.map((record, index) => (
                    <AvailabilityTableRow
                      key={record.id}
                      record={record}
                      index={index}
                      totalRecords={filteredAvailabilityRecords.length}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
      
      {/* Driver Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Driver Bookings</h3>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search services..."
                className="px-3 py-2 text-sm border rounded-md bg-background w-full sm:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-background w-full sm:w-40"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {bookings.length === 0 ? 'No bookings found for this driver' : 'No bookings match the current filters'}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {paginatedBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 truncate" title={booking.service_name}>
                        {booking.service_name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{format(new Date(booking.date), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span>{booking.time ? booking.time.substring(0, 5) : 'TBD'}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(getStatusBadgeClasses(booking.status), "text-xs flex-shrink-0")}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  
                  {booking.customer_name && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Customer: {booking.customer_name}
                    </div>
                  )}
                  
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/bookings/${booking.id}`, '_blank')}
                      className="h-8 flex-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                      Service
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-10 px-3 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">
                      Customer
                    </TableHead>
                    <TableHead className="h-10 px-3 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((booking, index) => (
                    <TableRow 
                      key={booking.id} 
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                        index === paginatedBookings.length - 1 && "border-b-0"
                      )}
                    >
                      <TableCell className="py-3 px-3 align-middle">
                        <div className="font-medium text-sm max-w-[200px] truncate" title={booking.service_name}>
                          {booking.service_name}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3 align-middle text-sm">
                        {format(new Date(booking.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="py-3 px-3 align-middle text-sm">
                        {booking.time ? booking.time.substring(0, 5) : 'TBD'}
                      </TableCell>
                      <TableCell className="py-3 px-3 align-middle">
                        <Badge 
                          variant="outline" 
                          className={cn(getStatusBadgeClasses(booking.status), "text-xs")}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3 px-3 align-middle max-w-[150px] truncate text-sm">
                        <span title={booking.customer_name || '—'}>
                          {booking.customer_name || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-3 align-middle text-right">
                        <div className="flex justify-end items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(`/bookings/${booking.wp_id || booking.id}`, '_blank')}
                            title="View Booking Details"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 border-t">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-3"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord 
                ? t("drivers.availability.listView.editAvailability") 
                : t("drivers.availability.listView.addAvailability")}
            </DialogTitle>
          </DialogHeader>
          <DriverAvailabilityForm
            driverId={driver.id}
            initialData={selectedRecord || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("drivers.availability.listView.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("drivers.availability.listView.deleteConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("drivers.availability.deleteAvailability")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 