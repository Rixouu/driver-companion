"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Edit2, Trash2, PlusCircle, Calendar } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"

import { DriverAvailabilityForm } from "./driver-availability-form"
import { getDriverAvailability, deleteDriverAvailability } from "@/lib/services/driver-availability"
import type { DriverAvailability, Driver } from "@/types/drivers"

// Helper to get status badge
const StatusBadge = ({ status, isBooking }: { status: string, isBooking?: boolean }) => {
  const { t } = useI18n();
  
  const getBadgeStyle = () => {
    // If it's a booking, always use purple styling regardless of status
    if (isBooking) {
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
    }
    
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case "unavailable":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      case "leave":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200";
      case "training":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    }
  };
  
  return (
    <Badge className={cn(getBadgeStyle(), "rounded px-2.5 py-1 text-xs font-medium")}>
      {isBooking 
        ? t("common.booking", { defaultValue: "Booking" })
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
            disabled={isBookingRelated}
            title={isBookingRelated ? t('drivers.availability.listView.editDisabledTooltip', { defaultValue: "Cannot edit booking assignments" }) : undefined}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive/90"
            onClick={() => onDelete(record.id)}
            disabled={isBookingRelated}
            title={isBookingRelated ? t('drivers.availability.listView.deleteDisabledTooltip', { defaultValue: "Cannot delete booking assignments" }) : t('drivers.availability.deleteAvailability')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export function DriverAvailabilityList({ driver }: DriverAvailabilityListProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DriverAvailability | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  
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
    } catch (error) {
      console.error("Error fetching driver availability:", error)
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
    // Fetch data only once when component mounts or driver.id changes
    fetchAvailability();
    
    // Listen for custom refresh events for booking updates
    const handleRefreshData = () => {
      console.log("Refreshing availability data due to booking changes");
      fetchAvailability();
    };
    
    // Add event listener for external refresh triggers
    document.addEventListener('refresh-driver-availability', handleRefreshData);
    
    // Also listen for booking unassignment events
    const handleBookingUnassigned = () => {
      console.log("Booking unassigned, refreshing availability data");
      fetchAvailability();
    };
    
    document.addEventListener('booking-unassigned', handleBookingUnassigned);
    
    // Cleanup
    return () => {
      document.removeEventListener('refresh-driver-availability', handleRefreshData);
      document.removeEventListener('booking-unassigned', handleBookingUnassigned);
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
        <h3 className="text-lg font-semibold">{t("drivers.availability.availabilityRecords")}</h3>
        <Button onClick={handleAdd} size="sm" variant="outline" className="flex items-center w-full sm:w-auto justify-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("drivers.availability.listView.addAvailability", { defaultValue: "Add Availability" })}
        </Button>
      </div>
      
      <div> 
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">{t("drivers.availability.listView.loading")}</div>
        ) : availabilityRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            {t("drivers.availability.listView.noRecords")}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-md">
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
                {availabilityRecords.map((record, index) => (
                  <AvailabilityTableRow
                    key={record.id}
                    record={record}
                    index={index}
                    totalRecords={availabilityRecords.length}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
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