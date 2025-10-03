"use client";

import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
import { BookingWithRelations } from "@/types/dispatch";

interface DispatchDetailsPanelProps {
  booking: BookingWithRelations;
  onUnassign: (bookingId: string) => void;
}

export function DispatchDetailsPanel({ booking, onUnassign }: DispatchDetailsPanelProps) {
  const { t } = useI18n();
  const router = useRouter();
  const formattedDate = format(parseISO(booking.date), "d MMM yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            #{booking.wp_id || booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getDispatchStatusBadgeClasses(booking.status))}>
            {t(`bookings.status.${booking.status.toLowerCase()}` as any, { defaultValue: booking.status })}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formattedDate} at {booking.time}
        </p>
      </div>

      {/* Customer Info */}
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

      {/* Service Details */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.serviceDetails")}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{booking.service_type_name || t("dispatch.assignments.unknownService")}</span>
          </div>
          {booking.pickup_location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{booking.pickup_location}</span>
            </div>
          )}
          {booking.dropoff_location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{booking.dropoff_location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Status */}
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
            {booking.driver ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={booking.driver.profile_image_url} />
                  <AvatarFallback>
                    {booking.driver.first_name?.[0]}{booking.driver.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {booking.driver.first_name} {booking.driver.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.driver.phone || booking.driver.email}
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
            {booking.vehicle ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={booking.vehicle.image_url} />
                  <AvatarFallback>
                    <CarIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {booking.vehicle.name || `${booking.vehicle.brand} ${booking.vehicle.model}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.vehicle.plate_number}
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

      {/* Notes */}
      {booking.notes && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-foreground">{t("dispatch.assignments.notes")}</h3>
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-foreground">{booking.notes}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUnassign(booking.id)}
          className="flex-1"
        >
          <XIcon className="h-4 w-4 mr-2" />
          {t("dispatch.assignments.unassignAll")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/bookings/${booking.id}`)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          {t("dispatch.assignments.viewBooking")}
        </Button>
      </div>
    </div>
  );
}
