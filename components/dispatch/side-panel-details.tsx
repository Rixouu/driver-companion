import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserIcon, CarIcon, MapPinIcon, EyeIcon, EditIcon, PhoneIcon, CheckIcon, Zap, UserXIcon, ClockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/styles";
import { useI18n } from "@/lib/i18n/context";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BookingLike {
  id: string;
  wp_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_name?: string;
  pickup_location?: string;
  dropoff_location?: string;
  date?: string;
  time?: string;
  status: string;
  driver_id?: string | null;
  vehicle_id?: string | null;
  driver?: Partial<Driver> | null;
  vehicle?: Partial<Vehicle> | null;
}

interface SidePanelDetailsProps {
  /** Provide a dispatch entry OR a raw booking object */
  entry?: DispatchEntryWithRelations;
  booking?: BookingLike;
  onAssign?: () => void;
  onUnassign?: () => void;
  onReassign?: () => void;
}

function getStatusBadgeStyle(status: string): string {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
    assigned: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700",
    en_route: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700",
    arrived: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700",
    in_progress: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700",
    completed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
    cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700",
  };
  return styles[status as DispatchStatus] || "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
}

export default function SidePanelDetails({ entry, booking: bookingProp, onAssign, onUnassign, onReassign }: SidePanelDetailsProps) {
  const { t } = useI18n();
  const router = useRouter();

  // Determine source objects
  const booking: BookingLike = entry ? (entry.booking as any) : (bookingProp as any);
  if (!booking) return null;

  const driver: Partial<Driver> | null = entry ? (entry.driver ?? booking.driver ?? null) : booking.driver ?? null;
  const vehicle: Partial<Vehicle> | null = entry ? (entry.vehicle ?? booking.vehicle ?? null) : booking.vehicle ?? null;

  const status: string = (entry ? entry.status : booking.status) || "pending";

  const isAssigned = (entry ? entry.driver_id && entry.vehicle_id : booking.driver_id && booking.vehicle_id);

  const startISO = entry ? entry.start_time : booking.date && booking.time ? `${booking.date}T${booking.time}:00` : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            #{booking.wp_id || booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getStatusBadgeStyle(status))}>{status.replace("_", " ")}</Badge>
        </div>
        {startISO && (
          <p className="text-sm text-muted-foreground">
            {format(parseISO(startISO), "MMM d, yyyy HH:mm")}
          </p>
        )}
      </div>

      {/* Service Details */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{booking.service_type_name || booking.service_name || t("dispatch.assignments.vehicleService")}</h3>
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

      {/* Assignment Status */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.assignmentStatus")}</h3>
        <div className="space-y-4">
          {/* Driver */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                <UserIcon className="h-4 w-4" />
                {t("dispatch.assignments.driver")}
              </h4>
              {booking.driver_id && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  {t("dispatch.assignments.assigned")}
                </Badge>
              )}
            </div>
            {booking.driver_id && driver ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/10 dark:border-blue-800">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={driver.profile_image_url || ""} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {driver.first_name?.[0]}
                    {driver.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-foreground">
                    {driver.first_name} {driver.last_name}
                  </p>
                  {driver.phone && <p className="text-xs text-muted-foreground">{driver.phone}</p>}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center dark:bg-amber-900/10 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">{t("dispatch.assignments.notAssigned")}</p>
              </div>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                <CarIcon className="h-4 w-4" />
                {t("dispatch.assignments.vehicle")}
              </h4>
              {booking.vehicle_id && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  {t("dispatch.assignments.assigned")}
                </Badge>
              )}
            </div>
            {booking.vehicle_id && vehicle ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/10 dark:border-blue-800">
                <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center dark:bg-blue-900/20">
                  <CarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-foreground">
                    {(vehicle as any).license_plate || (vehicle as any).plate_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.make || (vehicle as any).brand} {vehicle.model}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center dark:bg-amber-900/10 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">{t("dispatch.assignments.notAssigned")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.customerInformation")}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground break-words">
              {booking.customer_name || t("dispatch.assignments.unknownCustomer")}
            </span>
          </div>
          {booking.customer_phone && (
            <div className="flex items-center gap-2 break-all">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${booking.customer_phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {booking.customer_phone}
              </a>
            </div>
          )}
          {booking.customer_email && (
            <div className="flex items-center gap-2 break-all">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${booking.customer_email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {booking.customer_email}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.actions")}</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/bookings/${booking.id}`)}
          >
            <EyeIcon className="h-4 w-4 mr-2" />
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
    </div>
  );
} 