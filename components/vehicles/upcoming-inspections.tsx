"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils/date-utils"
import { useI18n } from "@/lib/i18n/context"
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CalendarX2, Edit3, AlertTriangle, CheckCircle2, CalendarClock, Hourglass } from "lucide-react"

interface UpcomingInspectionItem {
  id: string
  vehicle_id: string
  inspection_date: string
  time_slot: string
  status: "scheduled" | "completed" | "cancelled" | "rescheduled" | "pending_approval"
  notes?: string | null
  created_at: string
}

interface UpcomingInspectionsProps {
  vehicleId: string
}

async function fetchUpcomingInspections(supabase: any, vehicleId: string): Promise<UpcomingInspectionItem[]> {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  return [
    { id: 'insp1', vehicle_id: vehicleId, inspection_date: tomorrow.toISOString(), time_slot: '10:00 - 11:00', status: 'scheduled', created_at: today.toISOString() },
    { id: 'insp2', vehicle_id: vehicleId, inspection_date: nextWeek.toISOString(), time_slot: '14:00 - 15:00', status: 'pending_approval', notes: 'Awaiting customer confirmation', created_at: today.toISOString() },
  ]
}

async function cancelUpcomingInspection(supabase: any, inspectionId: string): Promise<Partial<UpcomingInspectionItem>> {
  await new Promise(resolve => setTimeout(resolve, 700))
  return { id: inspectionId, status: 'cancelled' }
}

export function UpcomingInspections({ vehicleId }: UpcomingInspectionsProps) {
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()
  const [inspections, setInspections] = useState<UpcomingInspectionItem[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInspectionToCancel, setSelectedInspectionToCancel] = useState<UpcomingInspectionItem | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicleId) {
      setIsDataLoading(false)
      setError(t('inspections.upcoming.errors.missingVehicleId'))
      return
    }
    async function loadInspections() {
      setIsDataLoading(true)
      setError(null)
      try {
        const data = await fetchUpcomingInspections(supabase, vehicleId)
        setInspections(data)
      } catch (err) {
        console.error(err)
        setError(t('inspections.upcoming.errors.loadFailed'))
        toast({ title: t('common.error'), description: t('inspections.upcoming.errors.loadFailed'), variant: "destructive" })
      }
      setIsDataLoading(false)
    }
    loadInspections()
  }, [vehicleId, supabase, t, toast])

  const handleOpenCancelDialog = (inspection: UpcomingInspectionItem) => {
    setSelectedInspectionToCancel(inspection)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedInspectionToCancel) return
    setIsSubmittingAction(true)
    try {
      await cancelUpcomingInspection(supabase, selectedInspectionToCancel.id)
      setInspections(prev => prev.filter(item => item.id !== selectedInspectionToCancel.id))
      toast({ title: t("common.success"), description: t("inspections.upcoming.cancelSuccess") })
    } catch (err) {
      console.error(err)
      toast({ title: t("common.error"), description: t("inspections.upcoming.errors.cancelFailed"), variant: "destructive" })
    } finally {
      setIsSubmittingAction(false)
      setShowCancelDialog(false)
      setSelectedInspectionToCancel(null)
    }
  }

  const handleReschedule = (inspection: UpcomingInspectionItem) => {
    router.push(`/vehicles/${vehicleId}/inspections/schedule?reschedule=${inspection.id}`)
  }
  
  const getStatusBadgeInfo = (status: UpcomingInspectionItem['status']) => {
    switch (status) {
      case 'scheduled': return { variant: 'secondary', icon: <CalendarClock className="h-3 w-3" />, textClass: 'text-blue-600' }
      case 'completed': return { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, textClass: 'text-green-600' }
      case 'cancelled': return { variant: 'outline', icon: <CalendarX2 className="h-3 w-3" />, textClass: 'text-gray-500' }
      case 'rescheduled': return { variant: 'warning', icon: <Edit3 className="h-3 w-3" />, textClass: 'text-orange-600' }
      case 'pending_approval': return { variant: 'info', icon: <Hourglass className="h-3 w-3" />, textClass: 'text-purple-600' }
      default: return { variant: 'outline', icon: <AlertTriangle className="h-3 w-3" />, textClass: 'text-gray-700' }
    }
  }

  if (isDataLoading) {
    return <UpcomingInspectionsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("inspections.upcoming.title")}</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("inspections.upcoming.title")}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-center py-8">{t("inspections.upcoming.noUpcoming")}</p></CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("inspections.upcoming.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inspections.common.date")}</TableHead>
                <TableHead>{t("inspections.common.timeSlot")}</TableHead>
                <TableHead>{t("inspections.common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => {
                const statusInfo = getStatusBadgeInfo(inspection.status)
                return (
                  <TableRow key={inspection.id}>
                    <TableCell>{formatDate(inspection.inspection_date)}</TableCell>
                    <TableCell>{inspection.time_slot}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant as any} className={`capitalize ${statusInfo.textClass} border-${statusInfo.textClass?.replace('text-','')}`}>
                        <span className="mr-1.5">{statusInfo.icon}</span>
                        {t(`inspections.status.${inspection.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      { (inspection.status === 'scheduled' || inspection.status === 'pending_approval' || inspection.status === 'rescheduled') && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(inspection)}
                            disabled={isSubmittingAction}
                          >
                            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                            {t("inspections.upcoming.actions.reschedule")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCancelDialog(inspection)}
                            disabled={isSubmittingAction}
                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <CalendarX2 className="mr-1.5 h-3.5 w-3.5" />
                            {t("inspections.upcoming.actions.cancel")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedInspectionToCancel && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("inspections.upcoming.cancelDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("inspections.upcoming.cancelDialog.description", { 
                  date: formatDate(selectedInspectionToCancel.inspection_date), 
                  time: selectedInspectionToCancel.time_slot 
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedInspectionToCancel(null)} disabled={isSubmittingAction}>
                {t("common.goBack")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelConfirm} disabled={isSubmittingAction} className="bg-destructive hover:bg-destructive/90">
                {isSubmittingAction ? t("common.cancelling") : t("common.confirmCancel")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

function UpcomingInspectionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 