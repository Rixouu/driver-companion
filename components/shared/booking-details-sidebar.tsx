"use client";

import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserIcon,
  PhoneIcon,
  Mail,
  CarIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  MessageSquare,
  CheckIcon,
  XIcon,
  Edit,
  Eye,
} from "lucide-react";
import { cn, getDispatchStatusBadgeClasses } from "@/lib/utils/styles";
import { DispatchEntryWithRelations } from "@/types/dispatch";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";

interface BookingLike {
  id: string;
  wp_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_name?: string;
  service_type_name?: string;
  pickup_location?: string;
  dropoff_location?: string;
  date?: string;
  time?: string;
  status: string;
  driver_id?: string | null;
  vehicle_id?: string | null;
  driver?: Partial<Driver> | null;
  vehicle?: Partial<Vehicle> | null;
  notes?: string;
}

interface BookingDetailsSidebarProps {
  /** Provide a dispatch entry OR a raw booking object */
  entry?: DispatchEntryWithRelations;
  booking?: BookingLike;
  
  /** Configuration options */
  variant?: 'dispatch' | 'assignment';
  showDateInHeader?: boolean;
  showNotes?: boolean;
  showCustomerInfoFirst?: boolean;
  
  /** Action handlers */
  onAssign?: () => void;
  onUnassign?: () => void;
  onReassign?: () => void;
  onViewDetails?: () => void;
  
  /** Custom action buttons */
  customActions?: React.ReactNode;
}

export function BookingDetailsSidebar({ 
  entry, 
  booking: bookingProp, 
  variant = 'dispatch',
  showDateInHeader = true,
  showNotes = true,
  showCustomerInfoFirst = false,
  onAssign,
  onUnassign,
  onReassign,
  onViewDetails,
  customActions
}: BookingDetailsSidebarProps) {
  const { t } = useI18n();
  const router = useRouter();

  // Determine source objects
  const booking: BookingLike = entry ? (entry.booking as any) : (bookingProp as any);
  if (!booking) return null;

  const driver: Partial<Driver> | null = entry ? (entry.driver ?? booking.driver ?? null) : booking.driver ?? null;
  const vehicle: Partial<Vehicle> | null = entry ? (entry.vehicle ?? booking.vehicle ?? null) : booking.vehicle ?? null;

  const status: string = (entry ? entry.status : booking.status) || "pending";
  const isAssigned = (entry ? entry.driver_id && entry.vehicle_id : booking.driver_id && booking.vehicle_id);
  const startISO = entry ? entry.start_time : booking.date && booking.time ? `${booking.date}T${booking.time}` : undefined;

  // Format date for header
  const formattedDate = startISO ? (() => {
    try {
      const parsedDate = parseISO(startISO);
      if (isNaN(parsedDate.getTime())) return "Invalid date";
      return format(parsedDate, "d MMM yyyy 'at' HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  })() : booking.date ? format(parseISO(booking.date), "d MMM yyyy") : null;

  // Customer Information Section
  const CustomerInfoSection = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.customerInformation")}</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{booking.customer_name || t("dispatch.assignments.unknownCustomer")}</span>
        </div>
        {booking.customer_phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`tel:${booking.customer_phone}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {booking.customer_phone}
            </a>
          </div>
        )}
        {booking.customer_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${booking.customer_email}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {booking.customer_email}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // Service Details Section
  const ServiceDetailsSection = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-foreground">
        {booking.service_type_name || booking.service_name || t("dispatch.assignments.vehicleService")}
      </h3>
      <div className="space-y-2">
        {booking.pickup_location && (
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">From:</p>
              <p className="text-sm text-foreground break-words">{booking.pickup_location}</p>
            </div>
          </div>
        )}
        {booking.dropoff_location && (
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">To:</p>
              <p className="text-sm text-foreground break-words">{booking.dropoff_location}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Assignment Status Section
  const AssignmentStatusSection = () => (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.assignmentStatus")}</h3>
      
      {/* Driver Assignment */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            {t("dispatch.assignments.driver")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {booking.driver_id && driver ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={driver.profile_image_url} />
                <AvatarFallback>
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {driver.first_name} {driver.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {driver.phone || driver.email}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">Assigned</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">No driver assigned</p>
              </div>
              <div className="flex items-center gap-1">
                <XIcon className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600">Unassigned</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Assignment */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CarIcon className="h-4 w-4" />
            {t("dispatch.assignments.vehicle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {booking.vehicle_id && vehicle ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={vehicle.image_url} />
                <AvatarFallback>
                  <CarIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {vehicle.name || `${vehicle.brand || vehicle.make} ${vehicle.model}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(vehicle as any).license_plate || (vehicle as any).plate_number}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">Assigned</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <CarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">No vehicle assigned</p>
              </div>
              <div className="flex items-center gap-1">
                <XIcon className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600">Unassigned</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Notes Section
  const NotesSection = () => (
    booking.notes && (
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.notes")}</h3>
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-foreground">{booking.notes}</p>
        </div>
      </div>
    )
  );

  // Default Actions based on variant
  const getDefaultActions = () => {
    if (customActions) return customActions;

    if (variant === 'assignment') {
      return (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUnassign?.()}
            className="flex-1"
          >
            <XIcon className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.unassignAll")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.() || router.push(`/bookings/${booking.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.viewBooking")}
          </Button>
        </div>
      );
    }

    // Dispatch variant
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.actions")}</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onViewDetails?.() || router.push(`/bookings/${booking.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.viewFullDetails")}
          </Button>
          <Button
            className="w-full justify-start"
            onClick={onReassign}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.reassignDriver", { defaultValue: "Reassign Driver" })}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Booking Details #{booking.wp_id || booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getDispatchStatusBadgeClasses(status))}>
            {t(`bookings.status.${status.toLowerCase()}` as any, { defaultValue: status.replace("_", " ") })}
          </Badge>
        </div>
        {showDateInHeader && formattedDate && (
          <p className="text-sm text-muted-foreground">
            {formattedDate}
          </p>
        )}
      </div>

      {/* Content Sections - Order based on configuration */}
      {showCustomerInfoFirst ? <CustomerInfoSection /> : <ServiceDetailsSection />}
      {!showCustomerInfoFirst ? <CustomerInfoSection /> : <ServiceDetailsSection />}
      <AssignmentStatusSection />
      {showNotes && <NotesSection />}
      {getDefaultActions()}
    </div>
  );
}
