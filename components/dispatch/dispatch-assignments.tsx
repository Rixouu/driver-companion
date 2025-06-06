"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import { 
  SearchIcon, 
  UserIcon, 
  CarIcon, 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckIcon,
  XIcon
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { DispatchEntryWithRelations } from "@/types/dispatch";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";

interface AssignmentCardProps {
  booking: any;
  onAssignDriver: (bookingId: string, driverId: string) => void;
  onAssignVehicle: (bookingId: string, vehicleId: string) => void;
  onUnassignDriver: (bookingId: string) => void;
  onUnassignVehicle: (bookingId: string) => void;
  availableDrivers: Driver[];
  availableVehicles: Vehicle[];
}

function AssignmentCard({ 
  booking, 
  onAssignDriver, 
  onAssignVehicle, 
  onUnassignDriver, 
  onUnassignVehicle,
  availableDrivers,
  availableVehicles 
}: AssignmentCardProps) {
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const handleAssignDriver = () => {
    if (selectedDriverId) {
      onAssignDriver(booking.id, selectedDriverId);
      setDriverDialogOpen(false);
      setSelectedDriverId("");
    }
  };

  const handleAssignVehicle = () => {
    if (selectedVehicleId) {
      onAssignVehicle(booking.id, selectedVehicleId);
      setVehicleDialogOpen(false);
      setSelectedVehicleId("");
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              #{booking.wp_id || booking.id.substring(0, 8)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.customer_name || "Unknown Customer"}
            </p>
          </div>
          <Badge variant="outline">
            {format(parseISO(booking.date), "MMM d")} at {booking.time}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Info */}
        <div className="space-y-2">
          <p className="font-medium text-sm">{booking.service_name || "Vehicle Service"}</p>
          {booking.pickup_location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4" />
              <span>{booking.pickup_location}</span>
            </div>
          )}
        </div>

        {/* Driver Assignment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Driver Assignment
            </h4>
            {booking.driver_id ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onUnassignDriver(booking.id)}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Unassign
              </Button>
            ) : (
              <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Assign Driver
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Driver</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={driver.profile_image_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{driver.first_name} {driver.last_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setDriverDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAssignDriver}
                        disabled={!selectedDriverId}
                        className="flex-1"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {booking.driver_id ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <Avatar className="h-8 w-8">
                <AvatarImage src={booking.driver?.profile_image_url || ""} />
                <AvatarFallback className="text-sm">
                  {booking.driver?.first_name?.[0]}{booking.driver?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {booking.driver?.first_name} {booking.driver?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Assigned Driver
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center">
              <p className="text-sm text-amber-800">No driver assigned</p>
            </div>
          )}
        </div>

        {/* Vehicle Assignment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CarIcon className="h-4 w-4" />
              Vehicle Assignment
            </h4>
            {booking.vehicle_id ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onUnassignVehicle(booking.id)}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Unassign
              </Button>
            ) : (
              <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Assign Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Vehicle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 bg-muted rounded flex items-center justify-center">
                                <CarIcon className="h-3 w-3" />
                              </div>
                              <span>{vehicle.name} - {vehicle.plate_number} - {vehicle.brand} {vehicle.model}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setVehicleDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAssignVehicle}
                        disabled={!selectedVehicleId}
                        className="flex-1"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {booking.vehicle_id ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center">
                <CarIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {booking.vehicle?.name} - {booking.vehicle?.plate_number} - {booking.vehicle?.brand} {booking.vehicle?.model}
                </p>
                <p className="text-xs text-muted-foreground">
                  Assigned Vehicle
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center">
              <p className="text-sm text-amber-800">No vehicle assigned</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DispatchAssignments() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Load bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, profile_image_url),
          vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Load available drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'available');

      if (driversError) throw driversError;

      // Load available vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      setBookings(bookingsData || []);
      setAvailableDrivers(driversData as Driver[] || []);
      setAvailableVehicles(vehiclesData as Vehicle[] || []);
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

  const handleAssignDriver = async (bookingId: string, driverId: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('bookings')
        .update({ driver_id: driverId })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  const handleAssignVehicle = async (bookingId: string, vehicleId: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('bookings')
        .update({ vehicle_id: vehicleId })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    }
  };

  const handleUnassignDriver = async (bookingId: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('bookings')
        .update({ driver_id: null })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver unassigned successfully",
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to unassign driver",
        variant: "destructive",
      });
    }
  };

  const handleUnassignVehicle = async (bookingId: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('bookings')
        .update({ vehicle_id: null })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle unassigned successfully",
      });
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error unassigning vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to unassign vehicle",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.wp_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unassigned' && (!booking.driver_id || !booking.vehicle_id)) ||
      (statusFilter === 'assigned' && booking.driver_id && booking.vehicle_id) ||
      booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex h-14 items-center px-6 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dispatch
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                className="w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Fully Assigned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Driver & Vehicle Assignments</h1>
            <p className="text-muted-foreground">
              Manage driver and vehicle assignments for all bookings
            </p>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredBookings.map((booking) => (
                <AssignmentCard
                  key={booking.id}
                  booking={booking}
                  onAssignDriver={handleAssignDriver}
                  onAssignVehicle={handleAssignVehicle}
                  onUnassignDriver={handleUnassignDriver}
                  onUnassignVehicle={handleUnassignVehicle}
                  availableDrivers={availableDrivers}
                  availableVehicles={availableVehicles}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 