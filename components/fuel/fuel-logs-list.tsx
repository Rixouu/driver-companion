"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { Icons } from "@/components/icons"
import { deleteFuelLog } from "@/lib/services/fuel"
import type { FuelLog } from "@/types"

interface FuelLogsListProps {
  logs: FuelLog[]
  vehicleId: string
}

export function FuelLogsList({ logs, vehicleId }: FuelLogsListProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null)

  async function onDelete() {
    try {
      if (!selectedLog) return

      const { error } = await deleteFuelLog(selectedLog.id)
      if (error) throw error

      toast.success("Fuel log deleted successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedLog(null)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString()
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Icons.empty className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">
          No fuel logs found
        </p>
        <Button asChild>
          <Link href={`/vehicles/${vehicleId}/fuel/new`}>Add Fuel Log</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/vehicles/${vehicleId}/fuel/new`}>Add Fuel Log</Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Amount (L)</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Full Tank</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.date)}</TableCell>
                <TableCell>{log.odometer_reading}</TableCell>
                <TableCell>{log.fuel_amount}</TableCell>
                <TableCell>{formatCurrency(log.fuel_cost)}</TableCell>
                <TableCell>{log.full_tank ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex h-8 w-8 p-0"
                        aria-label="Open menu"
                      >
                        <Icons.more className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/vehicles/${vehicleId}/fuel/${log.id}/edit`
                          )
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the fuel
              log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 