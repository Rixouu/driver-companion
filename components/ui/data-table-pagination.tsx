"use client"

import { Table } from "@tanstack/react-table"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PaginationState } from "@/hooks/use-pagination"
import type { ServerPaginationState } from "@/components/vehicles/vehicle-logs-table"

interface DataTablePaginationProps<TData> {
  table?: Table<TData>
  pagination?: ServerPaginationState
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showGotoPage?: boolean
  showSummary?: boolean
  isFetching?: boolean
  className?: string
}

export function DataTablePagination<TData>({
  table,
  pagination: serverPagination,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showPageSizeSelector = true,
  showGotoPage = true,
  showSummary = true,
  isFetching,
  className,
}: DataTablePaginationProps<TData>) {
  const isServerPaginated = !!serverPagination
  const pageCount = isServerPaginated ? serverPagination.pageCount : (table?.getPageCount() ?? 1)
  const pageIndex = isServerPaginated ? serverPagination.pageIndex : (table?.getState().pagination.pageIndex ?? 0)
  const pageSize = isServerPaginated ? serverPagination.pageSize : (table?.getState().pagination.pageSize ?? 10)
  const totalItems = isServerPaginated ? serverPagination.totalCount : table?.getFilteredRowModel().rows.length
  
  const currentPage = pageIndex + 1
  
  const getPageNumbers = (maxVisible: number = 5) => {
    if (pageCount <= maxVisible) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(pageCount, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  const pageNumbers = getPageNumbers()
  
  const handlePageChange = (newPageIndex: number) => {
    if (isServerPaginated) {
      serverPagination.setPage(newPageIndex)
    } else if (table) {
      table.setPageIndex(newPageIndex)
    }
  }
  
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10)
    if (isServerPaginated) {
      serverPagination.setPageSize(newPageSize)
    } else if (table) {
      table.setPageSize(newPageSize)
    }
  }
  
  const canPreviousPage = isServerPaginated ? pageIndex > 0 : (table?.getCanPreviousPage() ?? false)
  const canNextPage = isServerPaginated ? pageIndex < pageCount - 1 : (table?.getCanNextPage() ?? false)
  
  const fromItem = totalItems === undefined ? 0 : pageIndex * pageSize + 1
  const toItem = totalItems === undefined ? 0 : Math.min((pageIndex + 1) * pageSize, totalItems)
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      {showSummary && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {isFetching && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {totalItems !== undefined && totalItems > 0 ? (
            <div>
              Showing {fromItem}-{toItem} of {totalItems} items
            </div>
          ) : totalItems === 0 && !isFetching ? (
            <div>No items</div>
          ) : !isFetching ? (
            <div>
              Page {currentPage} of {pageCount}
            </div>
          ) : null}
          
          {showPageSizeSelector && (
            <div className="flex items-center gap-1">
              <span>Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
                disabled={isFetching}
              >
                <SelectTrigger className="h-8 w-[70px]" aria-label="Select number of rows per page">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(0)}
          disabled={!canPreviousPage || isFetching}
          className="hidden sm:flex"
          aria-label="Go to first page"
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pageIndex - 1)}
          disabled={!canPreviousPage || isFetching}
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="hidden sm:flex gap-1">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="icon"
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={isFetching}
              className="w-8"
              aria-label={`Go to page ${pageNumber}`}
              aria-current={currentPage === pageNumber ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
        </div>
        
        <div className="flex sm:hidden items-center gap-1">
          <span className="text-sm text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pageIndex + 1)}
          disabled={!canNextPage || isFetching}
          aria-label="Go to next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pageCount - 1)}
          disabled={!canNextPage || isFetching}
          className="hidden sm:flex"
          aria-label="Go to last page"
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {showGotoPage && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Go to:</span>
          <Input
            type="number"
            min={1}
            max={pageCount}
            defaultValue={currentPage}
            onBlur={(e) => {
              const targetPage = e.target.value ? parseInt(e.target.value, 10) : 1
              if (targetPage >= 1 && targetPage <= pageCount) {
                handlePageChange(targetPage - 1)
              } else {
                e.target.value = String(currentPage)
              }
            }}
            disabled={isFetching}
            className="h-8 w-16"
            aria-label="Go to page"
          />
        </div>
      )}
    </div>
  )
} 