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
                <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
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

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{driver.email}</span>
              </div>
              
              {driver.phone && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{driver.phone}</span>
                </div>
              )}
              
              {driver.license_number && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex items-center gap-1">
                    <span>{driver.license_number}</span>
                    {driver.license_expiry && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {t("drivers.fields.expires")}: {new Date(driver.license_expiry).toLocaleDateString()}
                      </Badge>
                    )}
                  </span>
                </div>
              )}
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