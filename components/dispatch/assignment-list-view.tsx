"use client"

import React from 'react';
import { format, parseISO } from 'date-fns';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EyeIcon, UserIcon, CarIcon, MapPinIcon, ClockIcon, CalendarIcon, ZapIcon, ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
interface AssignmentListViewProps {
  bookings: any[];
  onViewDetails: (booking: any) => void;
  onReassign: (booking: any) => void;
  selectedBookingId?: string;
}

export function AssignmentListView({
  bookings,
  onViewDetails,
  onReassign,
  selectedBookingId
}: AssignmentListViewProps) {
  const { t } = useI18n();

  if (!bookings.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("dispatch.assignments.noBookings")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Table Header - Hidden on mobile, visible on tablet+ */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b-2 border-muted rounded-t-lg">
        <div className="col-span-2 font-medium text-sm text-foreground">
          {t("dispatch.assignments.booking")}
        </div>
        <div className="col-span-3 font-medium text-sm text-foreground">
          {t("dispatch.assignments.serviceLocation")}
        </div>
        <div className="col-span-2 font-medium text-sm text-foreground">
          {t("dispatch.assignments.dateTime")}
        </div>
        <div className="col-span-3 font-medium text-sm text-foreground">
          {t("dispatch.assignments.assignment")}
        </div>
        <div className="col-span-2 font-medium text-sm text-foreground">
          {t("dispatch.assignments.actions")}
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-3">
        {bookings.map((booking) => {
          const isSelected = selectedBookingId === booking.id;
          const hasDriver = booking.driver_id && booking.driver;
          const hasVehicle = booking.vehicle_id && booking.vehicle;

          return (
            <div
              key={booking.id}
              className={cn(
                "bg-card border rounded-lg transition-all duration-200 hover:shadow-lg hover:border-primary/20",
                isSelected && "ring-2 ring-primary ring-offset-2",
                "p-4 md:p-6"
              )}
            >
              {/* Mobile Layout */}
              <div className="md:hidden space-y-4">
                {/* Booking Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          isSelected ? "bg-primary" : "bg-muted"
                        )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-foreground truncate">
                          {booking.booking_id}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.customer_name}
                        </p>
                      </div>
                      <Badge 
                        variant={hasDriver && hasVehicle ? "default" : "secondary"}
                        className={cn(
                          "text-xs px-3 py-1",
                          hasDriver && hasVehicle 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" 
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                        )}
                      >
                        {hasDriver && hasVehicle ? t("dispatch.assignments.assigned") : t("dispatch.assignments.pending")}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Service & Location */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ZapIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground">
                        {booking.service_type_name || booking.service_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.vehicle?.brand} {booking.vehicle?.model}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">From:</span>
                        <p className="text-sm text-foreground line-clamp-2">
                          {booking.pickup_location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">To:</span>
                        <p className="text-sm text-foreground line-clamp-2">
                          {booking.dropoff_location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {format(parseISO(booking.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {format(parseISO(booking.date), 'HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Driver & Vehicle in ONE COLUMN together */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      {hasDriver ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.driver?.profile_image_url || ""} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {booking.driver?.first_name?.[0]}{booking.driver?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground">
                              {booking.driver?.first_name} {booking.driver?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.driver?.phone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("dispatch.assignments.notAssigned")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      {hasVehicle ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.vehicle?.image_url || "/img/car-placeholder.png"} />
                            <AvatarFallback>
                              {booking.vehicle?.brand?.[0]}{booking.vehicle?.model?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground">
                              {booking.vehicle?.plate_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.vehicle?.brand} {booking.vehicle?.model}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("dispatch.assignments.notAssigned")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(booking)}
                    className="flex-1 h-10"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    {t("dispatch.assignments.view")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onReassign(booking)}
                    className="flex-1 h-10"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    {t("dispatch.assignments.reassign")}
                  </Button>
                </div>
              </div>

              {/* Desktop/Tablet Layout */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                {/* Booking */}
                <div className="col-span-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      isSelected ? "bg-primary" : "bg-muted"
                    )} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {booking.wp_id || `#${booking.id.substring(0, 8)}`}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.customer_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service & Location */}
                <div className="col-span-3 min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ZapIcon className="h-3 w-3 text-primary flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {booking.service_type_name || booking.service_name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {booking.vehicle?.brand} {booking.vehicle?.model}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {booking.pickup_location}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <ArrowRightIcon className="h-3 w-3" />
                        {booking.dropoff_location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="col-span-2 min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {format(parseISO(booking.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {format(parseISO(booking.date), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver & Vehicle in ONE COLUMN together */}
                <div className="col-span-3 min-w-0">
                  <div className="space-y-2">
                    {/* Driver */}
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {hasDriver ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.driver?.profile_image_url || ""} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {booking.driver?.first_name?.[0]}{booking.driver?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {booking.driver?.first_name} {booking.driver?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {booking.driver?.phone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("dispatch.assignments.notAssigned")}
                        </p>
                      )}
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-3">
                      <CarIcon className="h-4 w-4 text-muted-foreground" />
                      {hasVehicle ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.vehicle?.image_url || "/img/car-placeholder.png"} />
                            <AvatarFallback>
                              {booking.vehicle?.brand?.[0]}{booking.vehicle?.model?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {booking.vehicle?.plate_number}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {booking.vehicle?.brand} {booking.vehicle?.model}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("dispatch.assignments.notAssigned")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>



                {/* Actions */}
                <div className="col-span-2 min-w-0">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(booking)}
                      className="h-8 px-3 text-xs"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {t("dispatch.assignments.view")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onReassign(booking)}
                      className="h-8 px-3 text-xs"
                    >
                      <UserIcon className="h-4 w-4 mr-1" />
                      {t("dispatch.assignments.reassign")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
