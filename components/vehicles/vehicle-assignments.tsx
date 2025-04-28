"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { PlusCircle, UserPlus, UserX } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { VehicleAssignment } from "@/types/vehicle-assignments"

interface VehicleAssignmentsProps {
  vehicleId: string
}

export function VehicleAssignments({ vehicleId }: VehicleAssignmentsProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadAssignments() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicleId}/assignments`)
        
        if (!response.ok) {
          throw new Error("Failed to load assignments")
        }
        
        const data = await response.json()
        setAssignments(data.assignments || [])
      } catch (error) {
        console.error("Error loading vehicle assignments:", error)
        toast({
          title: t("vehicles.messages.assignmentsLoadError"),
          description: t("vehicles.messages.assignmentsLoadErrorDesc"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (vehicleId) {
      loadAssignments()
    }
  }, [vehicleId, t, toast])

  async function handleEndAssignment(assignmentId: string) {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/vehicles/${vehicleId}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      })
      
      if (!response.ok) {
        throw new Error("Failed to end assignment")
      }
      
      // Update the UI
      setAssignments(current => 
        current.map(a => 
          a.id === assignmentId 
            ? { ...a, status: 'inactive', endDate: new Date().toISOString() } 
            : a
        )
      )
      
      toast({
        title: t("vehicles.messages.assignmentEndedSuccess"),
        description: t("vehicles.messages.assignmentEndedSuccessDesc"),
      })
    } catch (error) {
      console.error("Error ending assignment:", error)
      toast({
        title: t("vehicles.messages.assignmentEndError"),
        description: t("vehicles.messages.assignmentEndErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-64" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const activeAssignment = assignments.find(a => a.status === 'active')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("vehicles.assignments.title")}</CardTitle>
          <CardDescription>{t("vehicles.assignments.description")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/vehicles/${vehicleId}/assign-driver`} legacyBehavior>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("vehicles.actions.assignDriver")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.length === 0 ? (
          <div className="p-8 text-center">
            <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              {t("vehicles.assignments.noAssignments")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("vehicles.assignments.noAssignmentsDesc")}
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/vehicles/${vehicleId}/assign-driver`} legacyBehavior>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("vehicles.actions.assignDriver")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => {
              const isActive = assignment.status === 'active'
              
              return (
                <div key={assignment.id} className="flex items-center space-x-4 p-4 border rounded-md">
                  {assignment.driver && (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={assignment.driver.profile_image_url || ''} alt={`${assignment.driver.first_name} ${assignment.driver.last_name}`} />
                      <AvatarFallback>{assignment.driver.first_name.charAt(0)}{assignment.driver.last_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    {assignment.driver && (
                      <h4 className="font-medium">
                        {assignment.driver.first_name} {assignment.driver.last_name}
                      </h4>
                    )}
                    <div className="flex items-center space-x-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {isActive
                          ? t("vehicles.assignments.assignedAgo", {
                              time: formatDistanceToNow(new Date(assignment.startDate), { addSuffix: true })
                            })
                          : t("vehicles.assignments.wasAssigned", {
                              time: formatDistanceToNow(new Date(assignment.startDate), { addSuffix: true })
                            })}
                      </p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isDeleting}>
                          <UserX className="mr-2 h-4 w-4" />
                          {t("vehicles.actions.unassign")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("vehicles.assignments.confirmUnassign")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("vehicles.assignments.confirmUnassignDesc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleEndAssignment(assignment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("vehicles.actions.unassign")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 