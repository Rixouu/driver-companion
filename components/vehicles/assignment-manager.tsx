"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

interface Assignment {
  id: string
  driverId: string
  driverName: string
  startDate: string
  endDate?: string
  status: "active" | "ended"
}

// Mock data for drivers
const MOCK_DRIVERS = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Mike Johnson" },
]

export function AssignmentManager({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedDriver, setSelectedDriver] = useState("")
  const [startDate, setStartDate] = useState<Date>()

  const handleAssign = async () => {
    if (!selectedDriver || !startDate) {
      toast({
        title: t("errors.error"),
        description: t("errors.required"),
        variant: "destructive",
      })
      return
    }

    try {
      const driver = MOCK_DRIVERS.find(d => d.id === selectedDriver)
      if (!driver) return

      // End any active assignments
      const updatedAssignments = assignments.map((assignment): Assignment => 
        assignment.status === "active" 
          ? { 
              ...assignment, 
              status: "ended" as const, 
              endDate: new Date().toISOString() 
            }
          : assignment
      )

      // Add new assignment
      const newAssignment: Assignment = {
        id: Date.now().toString(),
        driverId: driver.id,
        driverName: driver.name,
        startDate: startDate.toISOString(),
        status: "active",
      }

      setAssignments([newAssignment, ...updatedAssignments])
      setIsDialogOpen(false)
      setSelectedDriver("")
      setStartDate(undefined)

      toast({
        title: t("common.success"),
        description: t("vehicles.management.assignment.assignmentAdded"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.somethingWentWrong"),
        variant: "destructive",
      })
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const updatedAssignments = assignments.map((assignment): Assignment =>
        assignment.id === assignmentId
          ? { 
              ...assignment, 
              status: "ended" as const, 
              endDate: new Date().toISOString() 
            }
          : assignment
      )

      setAssignments(updatedAssignments)
      toast({
        title: t("common.success"),
        description: t("vehicles.management.assignment.assignmentRemoved"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.somethingWentWrong"),
        variant: "destructive",
      })
    }
  }

  const currentAssignment = assignments.find(a => a.status === "active")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.management.assignment.title")}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t("vehicles.management.assignment.addAssignment")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("vehicles.management.assignment.addAssignment")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("vehicles.management.assignment.assignTo")} />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_DRIVERS.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="rounded-md border"
                />
              </div>
              <Button onClick={handleAssign} className="w-full">
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {currentAssignment && (
            <div className="space-y-2">
              <h3 className="font-medium">
                {t("vehicles.management.assignment.currentDriver")}
              </h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{currentAssignment.driverName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentAssignment.startDate).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleRemoveAssignment(currentAssignment.id)}
                >
                  {t("vehicles.management.assignment.removeAssignment")}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">
              {t("vehicles.management.assignment.assignmentHistory")}
            </h3>
            <div className="space-y-2">
              {assignments
                .filter(a => a.status === "ended")
                .map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{assignment.driverName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assignment.startDate).toLocaleDateString()} - 
                        {assignment.endDate && new Date(assignment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t("vehicles.management.assignment.ended")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 