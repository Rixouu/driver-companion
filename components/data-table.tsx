"use client"

import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import type { ServerPaginationState } from "@/components/vehicles/vehicle-logs-table"
import { DataTableToolbar } from "./data-table-toolbar"
import { DataTableDesktopView } from "./data-table-desktop-view"
import { DataTableMobileView } from "./data-table-mobile-view"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  initialPageSize?: number
  searchPlaceholder?: string
  showColumnToggle?: boolean
  pagination?: ServerPaginationState
  isFetching?: boolean
  tableTitle?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  initialPageSize = 10,
  searchPlaceholder = "Search...",
  showColumnToggle = false,
  pagination: serverPagination,
  isFetching,
  tableTitle,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const isServerPaginated = !!serverPagination

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: isServerPaginated,
    pageCount: isServerPaginated ? serverPagination.pageCount : -1,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: isServerPaginated
      ? (updaterOrValue) => {
          if (typeof updaterOrValue === 'function') {
            const newState = updaterOrValue({
              pageIndex: serverPagination.pageIndex,
              pageSize: serverPagination.pageSize,
            })
            serverPagination.setPage(newState.pageIndex)
            serverPagination.setPageSize(newState.pageSize)
          } else {
            serverPagination.setPage(updaterOrValue.pageIndex)
            serverPagination.setPageSize(updaterOrValue.pageSize)
          }
        }
      : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(isServerPaginated && {
        pagination: {
          pageIndex: serverPagination.pageIndex,
          pageSize: serverPagination.pageSize,
        },
      }),
    },
    initialState: {
      ...(!isServerPaginated && {
        pagination: {
          pageSize: initialPageSize,
        },
      }),
    },
  })

  const titleId = tableTitle ? `data-table-title-${Math.random().toString(36).substring(7)}` : undefined;

  return (
    <div 
      className="space-y-4"
      role="region" 
      aria-labelledby={titleId}
    >
      {tableTitle && <h2 id={titleId} className="sr-only">{tableTitle}</h2>}
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        showColumnToggle={showColumnToggle}
        isServerPaginated={isServerPaginated}
      />

      <DataTableDesktopView table={table} columns={columns} />
      <DataTableMobileView table={table} />

      {table.getRowModel().rows.length > 0 && (
        <DataTablePagination 
          table={isServerPaginated ? undefined : table}
          pagination={serverPagination}
          isFetching={isFetching}
        />
      )}
    </div>
  )
} 