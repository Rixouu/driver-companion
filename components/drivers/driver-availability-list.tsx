"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Edit2, Trash2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils/styles"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"

import { DriverAvailabilityForm } from "./driver-availability-form"
import { getDriverAvailability, deleteDriverAvailability } from "@/lib/services/driver-availability"
import type { DriverAvailability, Driver } from "@/types/drivers"

// Helper to get status badge
const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useI18n();
  
  const getBadgeStyle = () => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "unavailable":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "leave":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "training":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  return (
    <Badge className={cn(getBadgeStyle())}>
      {t(`drivers.availability.statuses.${status}`)}
    </Badge>
  );
};

interface DriverAvailabilityListProps {
  driver: Driver
}

export function DriverAvailabilityList({ driver }: DriverAvailabilityListProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DriverAvailability | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  
  // Fetch availability data
  const fetchAvailability = async () => {
    try {
      setIsLoading(true)
      const data = await getDriverAvailability(driver.id)
      // Sort by start date (newest first)
      data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      setAvailabilityRecords(data)
    } catch (error) {
      console.error("Error fetching driver availability:", error)
      toast({
        title: "Error",
        description: t("drivers.availability.listView.loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAvailability()
  }, [driver.id])
  
  // Handle adding new availability
  const handleAdd = () => {
    setSelectedRecord(null)
    setIsDialogOpen(true)
  }
  
  // Handle editing availability
  const handleEdit = (record: DriverAvailability) => {
    setSelectedRecord(record)
    setIsDialogOpen(true)
  }
  
  // Handle deleting availability
  const handleDelete = (id: string) => {
    setRecordToDelete(id)
    setIsDeleteDialogOpen(true)
  }
  
  // Confirm delete
  const confirmDelete = async () => {
    if (!recordToDelete) return
    
    try {
      await deleteDriverAvailability(recordToDelete)
      toast({
        title: t("drivers.availability.listView.deleteSuccess"),
        description: t("drivers.availability.listView.deleteSuccessMessage"),
      })
      fetchAvailability()
    } catch (error) {
      console.error("Error deleting availability:", error)
      toast({
        title: "Error",
        description: t("drivers.availability.listView.deleteError"),
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedRecord(null)
  }
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    fetchAvailability()
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t("drivers.availability.availabilityRecords")}</CardTitle>
        <Button onClick={handleAdd} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("drivers.availability.listView.addAvailability")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">{t("drivers.availability.listView.loading")}</div>
        ) : availabilityRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("drivers.availability.listView.noRecords")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("drivers.availability.status")}</TableHead>
                <TableHead>{t("drivers.availability.startDate")}</TableHead>
                <TableHead>{t("drivers.availability.endDate")}</TableHead>
                <TableHead>{t("drivers.availability.notes")}</TableHead>
                <TableHead className="text-right">{t("drivers.availability.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availabilityRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>{format(parseISO(record.start_date), "PPP")}</TableCell>
                  <TableCell>{format(parseISO(record.end_date), "PPP")}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRecord 
                ? t("drivers.availability.listView.editAvailability") 
                : t("drivers.availability.listView.addAvailability")}
            </DialogTitle>
          </DialogHeader>
          <DriverAvailabilityForm
            driverId={driver.id}
            initialData={selectedRecord || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("drivers.availability.listView.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("drivers.availability.listView.deleteConfirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("drivers.availability.deleteAvailability")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 