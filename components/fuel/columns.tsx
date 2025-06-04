"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import type { FuelLog } from "@/types"

export const columns: ColumnDef<FuelLog>[] = [
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
    accessorKey: "odometer_reading",
    header: "Odometer",
    cell: ({ row }) => {
      const reading = row.getValue("odometer_reading")
      if (typeof reading !== "number") return "-"
      return `${reading.toLocaleString()} km`
    },
  },
  {
    accessorKey: "fuel_amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("fuel_amount")
      if (typeof amount !== "number") return "-"
      return `${amount.toFixed(2)}L`
    },
  },
  {
    accessorKey: "fuel_cost",
    header: "Cost",
    cell: ({ row }) => {
      const cost = row.getValue("fuel_cost")
      if (typeof cost !== "number") return "-"
      return cost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter()
      const { t } = useI18n()
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
              router.push(`/vehicles/${log.vehicle_id}/fuel/${log.id}/edit`)
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('common.edit')}</span>
          </Button>
        </div>
      )
    },
  },
] 