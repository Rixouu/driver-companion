"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, Calendar, ArrowRight, Plus } from "lucide-react"
import { getInspectionsByBookingId } from "@/lib/services/inspections"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"
import type { DbInspection } from "@/types/inspections"
import Link from "next/link"

interface BookingInspectionsProps {
  bookingId: string
  vehicleId: string
}

export function BookingInspections({ bookingId, vehicleId }: BookingInspectionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const [inspections, setInspections] = useState<DbInspection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInspections = async () => {
      try {
        setIsLoading(true)
        const data = await getInspectionsByBookingId(bookingId)
        setInspections(data)
      } catch (error) {
        console.error("Error loading inspections:", error)
        toast({
          title: "Error",
          description: "Failed to load inspections",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) {
      loadInspections()
    }
  }, [bookingId, toast])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {t('bookings.inspections.title', 'Vehicle Inspections')}
        </CardTitle>
        <Button 
          size="sm" 
          onClick={() => router.push(`/inspections/new?vehicleId=${vehicleId}&bookingId=${bookingId}`)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bookings.inspections.newInspection', 'New Inspection')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">
            Loading inspections...
          </div>
        ) : inspections.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            {t('bookings.inspections.noInspections', 'No inspections found for this booking')}
          </div>
        ) : (
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <div 
                key={inspection.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-center">
                  {getStatusIcon(inspection.status)}
                  <div className="ml-3">
                    <h4 className="font-medium">
                      {inspection.type.charAt(0).toUpperCase() + inspection.type.slice(1)} Inspection
                    </h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {inspection.created_at 
                        ? format(new Date(inspection.created_at), 'PPP') 
                        : 'Date not available'}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                >
                  <Link href={`/inspections/${inspection.id}`} legacyBehavior>
                    {t('common.view', 'View')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 