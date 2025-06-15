"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/styles";
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { DispatchStatus } from "@/types/dispatch";
import SidePanelDetails from "./side-panel-details";

interface BookingWithRelations {
  id: string;
  wp_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
  date: string;
  time: string;
  pickup_location?: string;
  dropoff_location?: string;
  status: string;
  driver_id?: string | null;
  vehicle_id?: string | null;
  notes?: string;
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
  email?: string;
  phone?: string;
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
  status: string;
  is_available: boolean;
}

// Maps dispatch status to badge color utility classes (mirrors dispatch-board-view)
function getStatusBadgeStyle(status: DispatchStatus): string {
  const styles: Record<DispatchStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
    assigned: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700",
    en_route: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700",
    arrived: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700",
    in_progress: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700",
    completed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
    cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700",
  };
  return styles[status] || "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
}

// Enhanced Assignment Card with Visual Status Indicators
function EnhancedAssignmentCard({ 
  booking, 
  onOpenSmartModal,
  onViewDetails,
  onUnassign
}: {
  booking: BookingWithRelations;
  onOpenSmartModal: (booking: BookingWithRelations) => void;
  onViewDetails: (bookingId: string) => void;
  onUnassign: (bookingId: string) => void;
}) {
  const { t } = useI18n();
  
  const getStatusColorClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned':
      case 'confirmed':
        return {
          border: 'border-l-blue-500 dark:border-l-blue-400',
          dot: 'bg-blue-500 dark:bg-blue-400',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          assignedBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          assignedBox: 'bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/10 dark:border-blue-800',
          avatarFallback: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
        };
      case 'pending':
        return {
          border: 'border-l-amber-500 dark:border-l-amber-400',
          dot: 'bg-amber-500 dark:bg-amber-400',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
          unassignedBox: 'bg-amber-50 border border-amber-200 rounded-md text-center dark:bg-amber-900/10 dark:border-amber-800',
          unassignedText: 'text-amber-800 dark:text-amber-300'
        };
      case 'cancelled':
        return {
          border: 'border-l-red-500 dark:border-l-red-400',
          dot: 'bg-red-500 dark:bg-red-400',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        };
      default:
        return {
          border: 'border-l-gray-300 dark:border-l-gray-600',
          dot: 'bg-gray-300 dark:bg-gray-600',
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
          unassignedBox: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const isAssigned = booking.driver_id && booking.vehicle_id;
  const status = (booking.status || 'pending').toLowerCase();
  const displayStatus = isAssigned && status !== 'cancelled' ? 'assigned' : status;
  const colors = getStatusColorClasses(displayStatus);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg border bg-card text-card-foreground h-full flex flex-col min-h-[320px]",
      colors.border
    )}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-3 h-3 rounded-full mt-1 flex-shrink-0",
              colors.dot
            )} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg text-foreground">
                #{booking.wp_id || booking.id.substring(0, 8)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {booking.customer_name || t("dispatch.assignments.unknownCustomer")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge className={cn("text-xs whitespace-nowrap", colors.badge)}>
              {t(`bookings.status.${displayStatus}` as any, { defaultValue: displayStatus })}
            </Badge>
            <Badge variant="outline" className="text-xs whitespace-nowrap dark:border-gray-600 dark:text-gray-300">
              {format(parseISO(booking.date), "MMM d")} at {booking.time}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Service Info */}
          <div className="space-y-2">
            <p className="font-medium text-sm text-foreground break-words">{booking.service_name || t("dispatch.assignments.vehicleService")}</p>
            {booking.pickup_location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{booking.pickup_location}</span>
              </div>
            )}
          </div>

          {/* Assignment Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Driver Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                  <UserIcon className="h-3 w-3" />
                  {t("dispatch.assignments.driver")}
                </h4>
                {booking.driver_id && (
                  <Badge variant="secondary" className={cn("text-xs", colors.assignedBadge)}>
                    <CheckIcon className="h-3 w-3 mr-1" />
                    {t("dispatch.assignments.assigned")}
                  </Badge>
                )}
              </div>
              
              {booking.driver_id && booking.driver ? (
                <div className="flex items-center gap-2 p-3 rounded-md h-20 bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={booking.driver.profile_image_url || ""} />
                    <AvatarFallback className={cn("text-xs", colors.avatarFallback)}>
                      {booking.driver.first_name?.[0]}{booking.driver.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs break-words text-foreground">
                      {booking.driver.first_name} {booking.driver.last_name}
                    </p>
                    {booking.driver.phone && (
                      <p className="font-medium text-xs text-muted-foreground break-words mt-0.5">
                        {booking.driver.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/10 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-300">{t("dispatch.assignments.notAssigned")}</p>
                </div>
              )}
            </div>

            {/* Vehicle Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
                  <CarIcon className="h-3 w-3" />
                  {t("dispatch.assignments.vehicle")}
                </h4>
                {booking.vehicle_id && (
                  <Badge variant="secondary" className={cn("text-xs", colors.assignedBadge)}>
                    <CheckIcon className="h-3 w-3 mr-1" />
                    {t("dispatch.assignments.assigned")}
                  </Badge>
                )}
              </div>
              
              {booking.vehicle_id && booking.vehicle ? (
                <div className="flex items-center gap-2 p-3 rounded-md h-20 bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
                   <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={booking.vehicle.image_url || "/img/car-placeholder.png"} />
                    <AvatarFallback>
                      {booking.vehicle.brand?.[0]}
                      {booking.vehicle.model?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs break-words text-foreground">
                      {booking.vehicle.plate_number}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/10 dark:border-amber-800">
                   <p className="text-sm text-amber-800 dark:text-amber-300">{t("dispatch.assignments.notAssigned")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Fixed at bottom */}
        <div className="flex gap-2 pt-4 mt-auto border-t border-border">
          {!isAssigned && (
            <Button
              size="sm"
              onClick={() => onOpenSmartModal(booking)}
              className="flex-1 h-9"
            >
              <Zap className="h-4 w-4 mr-1" />
              {t("dispatch.assignments.smartAssign")}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(booking.id)}
            className={cn("h-9", isAssigned ? "flex-1" : "")}
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("dispatch.assignments.viewDetails")}
          </Button>

          {isAssigned && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover border border-border">
                <DropdownMenuItem 
                  onClick={() => onUnassign(booking.id)}
                  className="cursor-pointer hover:bg-accent text-destructive"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {t("dispatch.assignments.unassignAll")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Smart Assignment Modal
function SmartAssignmentModal({
  booking,
  isOpen,
  onClose,
  onAssign,
  drivers,
  vehicles
}: {
  booking: BookingWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (driverId: string, vehicleId: string) => void;
  drivers: DriverWithAvailability[];
  vehicles: VehicleWithStatus[];
}) {
  const { t } = useI18n();
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const availableDrivers = drivers.filter(d => d.is_available);
  const availableVehicles = vehicles.filter(v => v.is_available);

  // Real vehicle matching logic based on service name
  const getVehicleMatches = () => {
    if (!booking?.service_name) return availableVehicles.map(v => ({ vehicle: v, matchPercentage: 50 }));
    
    const serviceName = booking.service_name.toLowerCase();
    
    return availableVehicles.map(vehicle => {
      let matchPercentage = 30; // base score
      
      // Perfect matches based on real data
      if (serviceName.includes('alphard executive lounge') && vehicle.model.toLowerCase().includes('alphard executive lounge')) {
        matchPercentage = 100;
      } else if (serviceName.includes('alphard z') && vehicle.model.toLowerCase().includes('alphard z')) {
        matchPercentage = 100;
      } else if (serviceName.includes('v class') && vehicle.model.toLowerCase().includes('v class')) {
        matchPercentage = 95;
      } else if (serviceName.includes('alphard') && vehicle.model.toLowerCase().includes('alphard')) {
        matchPercentage = 90;
      } else if (serviceName.includes('mercedes') && vehicle.brand.toLowerCase().includes('mercedes')) {
        matchPercentage = 85;
      } else if (serviceName.includes('toyota') && vehicle.brand.toLowerCase().includes('toyota')) {
        matchPercentage = 85;
      }
      
      // Luxury service matching
      if (serviceName.includes('luxury') || serviceName.includes('premium') || serviceName.includes('executive')) {
        if (vehicle.model.toLowerCase().includes('executive') || 
            vehicle.model.toLowerCase().includes('v class')) {
          matchPercentage = Math.max(matchPercentage, 90);
        }
      }
      
      return { vehicle, matchPercentage };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  };

  const vehicleMatches = getVehicleMatches();

  const handleAssign = () => {
    if (selectedDriver && selectedVehicle) {
      onAssign(selectedDriver, selectedVehicle);
      onClose();
      setSelectedDriver("");
      setSelectedVehicle("");
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t("dispatch.assignments.smartAssignmentFor", { id: booking.wp_id || booking.id.substring(0, 8) })}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t("dispatch.assignments.smartAssignmentDescription")}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Drivers */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2 text-foreground">
              <UsersIcon className="h-5 w-5" />
              {t("dispatch.assignments.availableDriversCount", { count: availableDrivers.length })}
            </h3>
            
            {availableDrivers.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t("dispatch.assignments.noDriversAvailable")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableDrivers.map((driver) => (
                  <Card 
                    key={driver.id}
                    className={cn(
                      "cursor-pointer transition-all border border-border bg-card",
                      selectedDriver === driver.id ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.profile_image_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {driver.first_name?.[0]}{driver.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {driver.first_name} {driver.last_name}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("dispatch.assignments.statusAvailable")}</p>
                        </div>
                        
                        {selectedDriver === driver.id && (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Vehicles with Smart Matching */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2 text-foreground">
              <CarIcon className="h-5 w-5" />
              {t("dispatch.assignments.vehicleRecommendations", { count: availableVehicles.length })}
            </h3>
            
            {availableVehicles.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <CarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t("dispatch.assignments.noVehiclesAvailable")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vehicleMatches.map(({ vehicle, matchPercentage }) => (
                  <Card 
                    key={vehicle.id}
                    className={cn(
                      "cursor-pointer transition-all border border-border bg-card",
                      selectedVehicle === vehicle.id ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          {vehicle.image_url ? (
                            <img src={vehicle.image_url} alt="" className="h-8 w-8 object-cover rounded" />
                          ) : (
                            <CarIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-foreground">
                              {vehicle.plate_number}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                matchPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                                matchPercentage >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                                matchPercentage >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                              )}>
                                {t("dispatch.assignments.matchPercentage", { percentage: matchPercentage })}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.brand} {vehicle.model}
                          </p>
                        </div>
                        
                        {selectedVehicle === vehicle.id && (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedVehicle}
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DispatchDetailsPanel({
  booking,
  onUnassign,
}: {
  booking: BookingWithRelations;
  onUnassign: (bookingId: string) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const formattedDate = format(parseISO(booking.date), "MMM d, yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            #{booking.wp_id || booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getStatusBadgeStyle(booking.status as DispatchStatus))}>
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
          <p className="text-sm text-foreground">{booking.service_name || t("dispatch.assignments.vehicleService")}</p>
          {booking.pickup_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("dispatch.assignments.from")}</p>
                <p className="text-sm text-foreground">{booking.pickup_location}</p>
              </div>
            </div>
          )}
          {booking.dropoff_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("dispatch.assignments.to")}</p>
                <p className="text-sm text-foreground">{booking.dropoff_location}</p>
              </div>
            </div>
          )}
        </div>
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
            
            {booking.driver_id && booking.driver ? (
              <div className="flex items-center gap-2 p-3 rounded-md h-20 bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={booking.driver.profile_image_url || ""} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {booking.driver.first_name?.[0]}{booking.driver.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-foreground">
                    {booking.driver.first_name} {booking.driver.last_name}
                  </p>
                  {booking.driver.phone && (
                    <p className="text-xs text-muted-foreground">{booking.driver.phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/10 dark:border-amber-800">
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
            
            {booking.vehicle_id && booking.vehicle ? (
              <div className="flex items-center gap-2 p-3 rounded-md h-20 bg-blue-50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={booking.vehicle.image_url || ""} />
                  <AvatarFallback>
                    {booking.vehicle.brand?.[0]}
                    {booking.vehicle.model?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-foreground">
                    {booking.vehicle.plate_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/10 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300">{t("dispatch.assignments.notAssigned")}</p>
              </div>
            )}
          </div>
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
            <Eye className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.viewFullDetails")}
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/bookings/${booking.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t("dispatch.assignments.editBooking")}
          </Button>

          {booking.driver_id && booking.vehicle_id && (
            <Button
              variant="destructive"
              className="w-full justify-start mt-2"
              onClick={() => onUnassign(booking.id)}
            >
              <UserX className="h-4 w-4 mr-2" />
              {t("dispatch.assignments.unassignAll")}
            </Button>
          )}

          {booking.customer_phone && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(`tel:${booking.customer_phone}`)}
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              {t("dispatch.assignments.callCustomer")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DispatchAssignments() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [drivers, setDrivers] = useState<DriverWithAvailability[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<BookingWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);

  // Shared dispatch state for cross-component synchronization
  const { lastUpdate, updateDispatchStatus, updateAssignment, unassignResources } = useSharedDispatchState();

  // Stats
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter(d => d.is_available).length;
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.is_available).length;
  const pendingBookings = bookings.filter(b => !b.driver_id || !b.vehicle_id).length;
  const assignedBookings = bookings.filter(b => b.driver_id && b.vehicle_id).length;

  useEffect(() => {
    loadData();
  }, [lastUpdate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select(`*`);

      if (dispatchError) throw dispatchError;
      const dispatchMap = new Map(dispatchData?.map(d => [d.booking_id, d]) || []);

      // Load bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, profile_image_url, phone, email),
          vehicle:vehicles(id, name, plate_number, brand, model, image_url)
        `)
        .in('status', ['pending', 'confirmed', 'publish', 'assigned'])
        .order('date', { ascending: true });

      if (bookingsError) throw bookingsError;
      
      const combinedBookings = bookingsData?.map(booking => {
        const dispatchEntry = dispatchMap.get(booking.id);
        const bookingWithDispatchInfo = {
          ...booking,
          wp_id: booking.wp_id || undefined,
          customer_name: booking.customer_name || undefined,
          customer_email: booking.customer_email || undefined,
          customer_phone: booking.customer_phone || undefined,
          driver_id: dispatchEntry?.driver_id || booking.driver_id,
          vehicle_id: dispatchEntry?.vehicle_id || booking.vehicle_id,
          pickup_location: booking.pickup_location || undefined,
          dropoff_location: booking.dropoff_location || undefined,
          notes: booking.notes || undefined,
          status: dispatchEntry ? dispatchEntry.status : booking.status,
          dispatch_entry_id: dispatchEntry?.id,
          driver: booking.driver ? {
            ...booking.driver,
            phone: booking.driver.phone || undefined,
            email: booking.driver.email || undefined,
            profile_image_url: booking.driver.profile_image_url || undefined,
          } : undefined,
          vehicle: booking.vehicle ? {
            ...booking.vehicle,
            name: booking.vehicle.name || undefined,
            image_url: booking.vehicle.image_url || undefined,
          } : undefined,
        };
        return bookingWithDispatchInfo;
      }) || [];
      
      setBookings(combinedBookings);

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null);

      if (driversError) throw driversError;

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      // Process drivers - real data only
      const processedDrivers: DriverWithAvailability[] = driversData?.map(driver => ({
        ...driver,
        phone: driver.phone || undefined,
        email: driver.email || undefined,
        profile_image_url: driver.profile_image_url || undefined,
        status: 'available',
        is_available: true
      })) || [];

      // Process vehicles - real data only
      const processedVehicles: VehicleWithStatus[] = vehiclesData?.map(vehicle => ({
        ...vehicle,
        name: vehicle.name || undefined,
        image_url: vehicle.image_url || undefined,
        year: parseInt(vehicle.year) || 2023,
        is_available: vehicle.status === 'active'
      })) || [];

      setDrivers(processedDrivers);
      setVehicles(processedVehicles);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSmartModal = (booking: BookingWithRelations) => {
    setSelectedBookingForModal(booking);
    setSmartModalOpen(true);
  };

  const handleViewDetails = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setDetailsOpen(true);
    }
  };

  const handleUnassign = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        toast({ title: "Error", description: "Booking not found.", variant: "destructive" });
        return;
    }
    
    if (!booking.dispatch_entry_id) {
        toast({ title: "Error", description: "Cannot unassign, dispatch record not found.", variant: "destructive" });
        return;
    }

    try {
        await unassignResources(booking.dispatch_entry_id, booking.id);
        toast({
            title: t("dispatch.assignments.messages.unassignSuccess"),
            description: "Booking has been returned to pending status.",
        });
    } catch (error) {
        console.error('Error unassigning:', error);
        toast({
            title: "Error",
            description: t("dispatch.assignments.messages.unassignError"),
            variant: "destructive",
        });
    }
  };

  const handleAssignDriverAndVehicle = async (
    bookingId: string,
    driverId: string,
    vehicleId: string
  ) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) return;

    try {
      const supabase = createClient();
      let dispatchId = bookingToUpdate.dispatch_entry_id;

      // If no dispatch entry exists, create one first.
      if (!dispatchId) {
          const { data: newDispatchEntry, error: createError } = await supabase
              .from('dispatch_entries')
              .insert({
                  booking_id: bookingId,
                  status: 'pending', // start as pending
                  start_time: `${bookingToUpdate.date}T${bookingToUpdate.time}:00`,
              })
              .select()
              .single();
          
          if (createError) throw createError;
          if (!newDispatchEntry) throw new Error("Failed to create dispatch entry.");
          dispatchId = newDispatchEntry.id;
      }

      await updateAssignment(dispatchId, driverId, vehicleId, bookingId);

      // Create a corresponding driver_availability record
      console.log('[Assign] Creating driver_availability record for booking', bookingId);
      const { error: availabilityError } = await supabase
        .from('driver_availability')
        .insert({
          driver_id: driverId,
          // Cover the entire booking day to ensure calendar visibility
          start_date: `${bookingToUpdate.date}T00:00:00`,
          end_date: `${bookingToUpdate.date}T23:59:59`,
          status: 'booking',
          notes: `Assigned to booking ${bookingId}`
        });

      if (availabilityError) {
        console.error('Error creating driver availability record:', availabilityError);
      }

      toast({
        title: t("dispatch.assignments.messages.assignSuccess"),
      });

      // Dispatch event to refresh data for the specific driver
      document.dispatchEvent(new CustomEvent('refresh-driver-data', { detail: { driverId } }));

    } catch (error) {
      console.error('Error assigning resources:', error);
      toast({
        title: t("common.error"),
        description: t("dispatch.assignments.messages.assignError"),
        variant: "destructive",
      });
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      const matchesSearch = !searchQuery || 
        booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.wp_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unassigned' && (!booking.driver_id || !booking.vehicle_id)) ||
        (statusFilter === 'assigned' && booking.driver_id && booking.vehicle_id) ||
        booking.status === statusFilter;

      const today = new Date();
      const bookingDate = new Date(booking.date);
      let matchesDate = true;

      if (dateFilter === 'today') {
        matchesDate = bookingDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'thisWeek') {
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        matchesDate = bookingDate >= weekStart && bookingDate <= weekEnd;
      } else if (dateFilter === 'thisMonth') {
        matchesDate = bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filteredBookings = getFilteredBookings();

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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex h-16 items-center px-6 gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-xl font-semibold text-foreground">
              {t("dispatch.assignments.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("dispatch.assignments.description")}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dispatch')}
            className="ml-auto"
          >
            <Grid3X3Icon className="h-4 w-4 mr-2" />
            Dispatch Board
          </Button>
        </div>
      </div>

      {/* Availability Dashboard */}
      <div className="p-6 bg-card border-b border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          {t("dispatch.assignments.resourceAvailability")}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{availableDrivers}/{totalDrivers}</p>
                  <p className="text-sm text-muted-foreground">{t("dispatch.assignments.availableDrivers")}</p>
                </div>
              </div>
              <Progress 
                value={(availableDrivers / totalDrivers) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <CarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{availableVehicles}/{totalVehicles}</p>
                  <p className="text-sm text-muted-foreground">{t("dispatch.assignments.availableVehicles")}</p>
                </div>
              </div>
              <Progress 
                value={(availableVehicles / totalVehicles) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900/20">
                  <ClockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingBookings}</p>
                  <p className="text-sm text-muted-foreground">{t("dispatch.assignments.pendingBookings")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{assignedBookings}</p>
                  <p className="text-sm text-muted-foreground">{t("dispatch.assignments.assignedBookings")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 bg-card border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("dispatch.assignments.searchPlaceholder")}
              className="pl-9 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-background border-border">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">{t("dispatch.assignments.allDates")}</SelectItem>
              <SelectItem value="today">{t("dispatch.assignments.today")}</SelectItem>
              <SelectItem value="thisWeek">{t("dispatch.assignments.thisWeek")}</SelectItem>
              <SelectItem value="thisMonth">{t("dispatch.assignments.thisMonth")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-background border-border">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">{t("dispatch.assignments.allBookings")}</SelectItem>
              <SelectItem value="unassigned">{t("dispatch.assignments.unassigned")}</SelectItem>
              <SelectItem value="assigned">{t("dispatch.assignments.assigned")}</SelectItem>
              <SelectItem value="pending">{t("bookings.status.pending")}</SelectItem>
              <SelectItem value="confirmed">{t("bookings.status.confirmed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">{t("dispatch.assignments.noBookingsFound")}</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? t("dispatch.assignments.noBookingsFilter")
                : t("dispatch.assignments.noBookingsAvailable")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBookings.map((booking) => (
              <EnhancedAssignmentCard
                key={booking.id}
                booking={booking}
                onOpenSmartModal={handleOpenSmartModal}
                onViewDetails={handleViewDetails}
                onUnassign={handleUnassign}
              />
            ))}
          </div>
        )}
      </div>

      {/* Smart Assignment Modal */}
      <SmartAssignmentModal
        booking={selectedBookingForModal}
        isOpen={smartModalOpen}
        onClose={() => {
          setSmartModalOpen(false);
          setSelectedBookingForModal(null);
        }}
        onAssign={(driverId, vehicleId) => {
          if (selectedBookingForModal) {
            handleAssignDriverAndVehicle(selectedBookingForModal.id, driverId, vehicleId);
          }
        }}
        drivers={drivers}
        vehicles={vehicles}
      />

      {/* Details Panel */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{t("dispatch.assignments.bookingDetails")}</SheetTitle>
          </SheetHeader>
          {selectedBooking && (
            <div className="mt-6">
              <SidePanelDetails
                booking={selectedBooking}
                onUnassign={() => handleUnassign(selectedBooking.id)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
} 