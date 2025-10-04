"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  SearchIcon, 
  UserIcon, 
  CarIcon, 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckIcon,
  XIcon,
  MoreVerticalIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
  FilterIcon,
  Mail,
  Smartphone,
  MessageSquare,
  Zap,
  Clock,
  Edit,
  Eye,
  UserX,
  Grid3X3Icon,
  List,
  ArrowRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, getDispatchStatusBadgeClasses } from "@/lib/utils/styles";
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { DispatchStatus } from "@/types/dispatch";
import SidePanelDetails from "./side-panel-details";
import SmartAssignmentModal from '@/components/shared/smart-assignment-modal';
import { AssignmentFilter, AssignmentFilterOptions } from "./assignment-filter";
import { BookingDetailsSidebar } from '@/components/shared/booking-details-sidebar';

// Import custom hooks
import { useAssignmentData } from "@/lib/hooks/use-assignment-data";
import { useAssignmentFiltering } from "@/lib/hooks/use-assignment-filtering";
import { useAssignmentStats } from "@/lib/hooks/use-assignment-stats";
import { useAssignmentManagement } from "@/lib/hooks/use-assignment-management";

// Types
interface BookingWithRelations {
  id: string;
  wp_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  driver_id?: string;
  vehicle_id?: string;
  pickup_location?: string;
  dropoff_location?: string;
  notes?: string;
  status: string;
  date: string;
  time: string;
  service_id?: string;
  service_type_name?: string;
  dispatch_entry_id?: string;
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    phone?: string;
    email?: string;
  };
  vehicle?: {
    id: string;
    name?: string;
    plate_number: string;
    brand: string;
    model: string;
    image_url?: string;
  };
}

interface DriverWithAvailability {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  profile_image_url?: string;
  status: string;
  is_available: boolean;
}

interface VehicleWithStatus {
  id: string;
  name?: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  image_url?: string;
  is_available: boolean;
}

export default function DispatchAssignments() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // View mode state
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  // Shared dispatch state for cross-component synchronization
  const { lastUpdate } = useSharedDispatchState();

  // Use custom hooks
  const { 
    bookings, 
    setBookings, 
    drivers, 
    vehicles, 
    isLoading 
  } = useAssignmentData({ lastUpdate });

  const { 
    filters, 
    setFilters, 
    filteredBookings 
  } = useAssignmentFiltering(bookings);

  const stats = useAssignmentStats({ bookings, drivers, vehicles });

  const {
    smartModalOpen,
    setSmartModalOpen,
    selectedBookingForModal,
    setSelectedBookingForModal,
    detailsOpen,
    setDetailsOpen,
    selectedBooking,
    setSelectedBooking,
    handleOpenSmartModal,
    handleViewDetails,
    handleCloseDetails,
    handleUnassign,
  } = useAssignmentManagement({ bookings, setBookings });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">{t("dispatch.assignments.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("dispatch.assignments.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("dispatch.assignments.description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dispatch')}
          className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/80 hover:text-background border-foreground"
        >
          <Grid3X3Icon className="h-4 w-4 mr-2" />
          Dispatch Board
        </Button>
      </div>

      {/* Availability Dashboard */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Available Drivers - Blue */}
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Available Drivers</CardTitle>
              <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.availableDrivers}/{stats.totalDrivers}
              </div>
            </CardContent>
          </Card>

          {/* Available Vehicles - Green */}
          <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Available Vehicles</CardTitle>
              <CarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.availableVehicles}/{stats.totalVehicles}
              </div>
            </CardContent>
          </Card>

          {/* Pending Bookings - Orange */}
          <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Pending</CardTitle>
              <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.pendingBookings}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Bookings - Purple */}
          <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Assigned</CardTitle>
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.assignedBookings}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Filters */}
        <AssignmentFilter
          filters={filters}
          onFiltersChange={setFilters}
          drivers={drivers}
          vehicles={vehicles}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3X3Icon className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t("dispatch.assignments.noBookings")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("dispatch.assignments.noBookingsDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "space-y-4",
            viewMode === "cards" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          )}>
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={handleViewDetails}
                onOpenSmartModal={handleOpenSmartModal}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Smart Assignment Modal */}
      <SmartAssignmentModal
        isOpen={smartModalOpen}
        onClose={() => setSmartModalOpen(false)}
        booking={selectedBookingForModal}
        drivers={drivers}
        vehicles={vehicles}
        onAssignmentComplete={() => {
          setSmartModalOpen(false);
          setSelectedBookingForModal(null);
        }}
      />

      {/* Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("dispatch.assignments.bookingDetails")}</SheetTitle>
          </SheetHeader>
          {selectedBooking && (
            <BookingDetailsSidebar
              booking={selectedBooking}
              variant="assignment"
              showDateInHeader={true}
              showNotes={true}
              showCustomerInfoFirst={true}
              notesType="customer"
              onUnassign={() => handleUnassign(selectedBooking.id)}
              onViewDetails={() => {
                // Add view details functionality
                console.log('View details for booking:', selectedBooking.id);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Booking Card Component
function BookingCard({ 
  booking, 
  onViewDetails, 
  onOpenSmartModal, 
  viewMode 
}: { 
  booking: BookingWithRelations;
  onViewDetails: (bookingId: string) => void;
  onOpenSmartModal: (booking: BookingWithRelations) => void;
  viewMode: "cards" | "list";
}) {
  const { t } = useI18n();
  const formattedDate = format(parseISO(booking.date), "d MMM yyyy");
  const isFullyAssigned = booking.driver_id && booking.vehicle_id;
  const isPartiallyAssigned = booking.driver_id || booking.vehicle_id;

  if (viewMode === "cards") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">
                #{booking.wp_id || booking.id.substring(0, 8)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formattedDate} at {booking.time}
              </p>
            </div>
            <Badge className={cn("text-xs", getDispatchStatusBadgeClasses(booking.status))}>
              {t(`bookings.status.${booking.status.toLowerCase()}` as any, { defaultValue: booking.status })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <p className="text-sm font-medium">{booking.customer_name || t("dispatch.assignments.unknownCustomer")}</p>
            <p className="text-xs text-muted-foreground">{booking.service_type_name || t("dispatch.assignments.unknownService")}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {booking.driver ? (
                <CheckIcon className="h-3 w-3 text-green-500" />
              ) : (
                <XIcon className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs">Driver</span>
            </div>
            <div className="flex items-center gap-1">
              {booking.vehicle ? (
                <CheckIcon className="h-3 w-3 text-green-500" />
              ) : (
                <XIcon className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs">Vehicle</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(booking.id)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenSmartModal(booking)}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-semibold text-sm">
                #{booking.wp_id || booking.id.substring(0, 8)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formattedDate} at {booking.time}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{booking.customer_name || t("dispatch.assignments.unknownCustomer")}</p>
              <p className="text-xs text-muted-foreground">{booking.service_type_name || t("dispatch.assignments.unknownService")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {booking.driver ? (
                  <CheckIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <XIcon className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs">Driver</span>
              </div>
              <div className="flex items-center gap-1">
                {booking.vehicle ? (
                  <CheckIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <XIcon className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs">Vehicle</span>
              </div>
            </div>
            
            <Badge className={cn("text-xs", getDispatchStatusBadgeClasses(booking.status))}>
              {t(`bookings.status.${booking.status.toLowerCase()}` as any, { defaultValue: booking.status })}
            </Badge>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(booking.id)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenSmartModal(booking)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Assign
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
