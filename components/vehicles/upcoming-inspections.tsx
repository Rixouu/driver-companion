"use client"

import { useState } from "react"
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
import { format } from "date-fns"

interface Inspection {
  id: string
  date: Date
  timeSlot: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface UpcomingInspectionsProps {
  vehicleId: string
}

export function UpcomingInspections({ vehicleId }: UpcomingInspectionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // TODO: Replace with actual API call
  const inspections: Inspection[] = [
    {
      id: '1',
      date: new Date(),
      timeSlot: '10:00',
      status: 'scheduled',
    },
    // Add more mock data as needed
  ]

  const handleCancel = async (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedInspection) return

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "common.success",
        description: "inspections.schedule.cancelSuccess",
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: "errors.error",
        description: "inspections.schedule.cancelError",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowCancelDialog(false)
    }
  }

  const handleReschedule = (inspection: Inspection) => {
    router.push(`/inspections/schedule/${vehicleId}?reschedule=${inspection.id}`)
  }

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{"inspections.schedule.upcoming"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {"inspections.schedule.noUpcoming"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{"inspections.schedule.upcoming"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"inspections.date"}</TableHead>
                <TableHead>{"inspections.schedule.selectTime"}</TableHead>
                <TableHead>{"status.status"}</TableHead>
                <TableHead className="text-right">{"common.actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>
                    {format(inspection.date, "PPP")}
                  </TableCell>
                  <TableCell>{inspection.timeSlot}</TableCell>
                  <TableCell>{inspection.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReschedule(inspection)}
                      >
                        {"inspections.schedule.reschedule"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(inspection)}
                      >
                        {"inspections.schedule.cancel"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {"inspections.schedule.cancel"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {"inspections.schedule.cancelConfirm"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {"common.cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isLoading}
            >
              {isLoading ? "common.loading" : "common.confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 