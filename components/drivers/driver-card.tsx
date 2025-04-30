"use client"

import Link from "next/link"
import { Car, Mail, Phone, Calendar, MapPin, Clock, Award } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import type { Driver } from "@/types/drivers"
import { DriverStatusBadge } from "./driver-status-badge"

interface DriverCardProps {
  driver: Driver
}

export function DriverCard({ driver }: DriverCardProps) {
  const { t } = useI18n()
  
  // Helper function to get status badge style
  const getStatusBadge = () => {
    if (!driver.status) return null;
    
    let colorClass = '';
    let bgClass = '';
    
    switch (driver.status.toLowerCase()) {
      case 'available':
        colorClass = "bg-green-100 text-green-800 border-green-200";
        bgClass = "bg-green-50";
        break;
      case 'unavailable':
        colorClass = "bg-red-100 text-red-800 border-red-200";
        bgClass = "bg-red-50";
        break;
      case 'leave':
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        bgClass = "bg-amber-50";
        break;
      case 'training':
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        bgClass = "bg-blue-50";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
        bgClass = "bg-gray-50";
    }
    
    return (
      <Badge className={colorClass}>
        {t(`drivers.availability.statuses.${driver.status.toLowerCase()}`)}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
      <Link href={`/drivers/${driver.id}`} className="block h-full">
        <div className="h-full flex flex-col">
          <CardContent className="p-6 pt-5 flex-grow">
            <div className="flex items-center justify-between mb-4">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary-foreground">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <DriverStatusBadge status={driver.availability_status || driver.status || 'available'} />
            </div>
            
            <div className="mb-3">
              <h3 className="font-medium text-lg">{driver.full_name}</h3>
              {/* Commented out: Years Experience - field not currently fetched */}
              {/* {driver.years_experience && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Award className="h-3.5 w-3.5" />
                  <span>{t("drivers.yearsExperience", { years: driver.years_experience })}</span>
                </div>
              )} */}
            </div>

            <div className="space-y-3 mb-4">
              {driver.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{driver.email}</span>
                </div>
              )}
              {driver.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.phone}</span>
                </div>
              )}
              {/* Commented out: Location - field not currently fetched */}
              {/* {driver.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{driver.location}</span>
                </div>
              )} */}
              {/* Commented out: Assigned Vehicles - field not currently fetched */}
              {/* {driver.assigned_vehicles && driver.assigned_vehicles.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">{t("drivers.assignedVehicles.count", { count: String(driver.assigned_vehicles.length) })}</p>
                    <p className="truncate">{driver.assigned_vehicles.map(v => v.name).join(", ")}</p>
                  </div>
                </div>
              )} */}
              
              {/* Commented out: Upcoming Booking - field not currently fetched */}
              {/* {driver.upcoming_booking && (
                <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">{t("drivers.upcomingBooking")}</p>
                    <p className="truncate">{new Date(driver.upcoming_booking.date).toLocaleDateString()}, {driver.upcoming_booking.time}</p>
                  </div>
                </div>
              )} */}
            </div>
          </CardContent>
          
          <CardFooter className="border-t py-3 px-6 bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full">
              {t("drivers.actions.viewDetails")}
            </Button>
          </CardFooter>
        </div>
      </Link>
    </Card>
  );
} 