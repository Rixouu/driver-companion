"use client"

import { DataTable } from "../data-table"
import type { ColumnDef } from "@tanstack/react-table"

// Type for the pagination prop, similar to what DataTablePagination expects
export interface ServerPaginationState {
  pageIndex: number;      // 0-indexed current page for Tanstack Table
  pageSize: number;
  pageCount: number;      // Total number of pages
  totalCount: number;     // Total number of items
  setPage: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
}

interface VehicleLogsTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchKey?: string // Optional, as server-side pagination might not use client-side search on this key
  pagination?: ServerPaginationState // For server-side pagination control
  isFetching?: boolean // To indicate if data is being fetched in the background
  // pageSize prop is removed as it's now controlled by pagination.pageSize
}

export function VehicleLogsTable<TData>({ columns, data, searchKey, pagination, isFetching }: VehicleLogsTableProps<TData>) {
  return (
    <DataTable<TData, unknown> // Added unknown for TValue as it's not directly used here
      columns={columns}
      data={data}
      searchKey={searchKey}
      // Pass server-side pagination details to DataTable
      pagination={pagination}
      isFetching={isFetching}
      // pageSize is now part of the pagination object if provided
      // If pagination is not provided, DataTable will use its internal client-side pagination with default pageSize
      // We might need to adjust DataTable to accept a pageCount for its internal pagination if pagination is undefined but we still want to show total pages based on full data length for client-side case.
    />
  )
} 