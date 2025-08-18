"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { MileageLog } from "@/types"

export const columns: ColumnDef<MileageLog>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date")
      if (!date) return "-"
      try {
        return format(new Date(date as string), "MMM d, yyyy")
      } catch (error) {
        return "-"
      }
    },
  },
  {
    accessorKey: "reading",
    header: "Reading",
    cell: ({ row }) => {
      const reading = row.getValue("reading")
      if (typeof reading !== "number") return "-"
      return `${reading.toLocaleString()} km`
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes")
      if (!notes) return "-"
      return (
        <span className="truncate max-w-[200px] block" title={notes as string}>
          {notes as string}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original

      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!log?.id || !log?.vehicle_id) {
                toast.error("Invalid log data")
                return
              }
              // Use window.location for navigation since we can't use useRouter in cell function
              window.location.href = `/vehicles/${log.vehicle_id}/mileage/${log.id}/edit`
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      )
    },
  },
] 