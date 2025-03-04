"use client"

import { DataTable } from "../data-table"
import type { ColumnDef } from "@tanstack/react-table"

interface VehicleLogsTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchKey: string
}

export function VehicleLogsTable<T>({ columns, data, searchKey }: VehicleLogsTableProps<T>) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey={searchKey}
      pageSize={5}
    />
  )
} 