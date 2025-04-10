"use client"

import { Table } from "@tanstack/react-table"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon,
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

interface DataTablePaginationProps<TData> {
  table?: Table<TData>
  pagination?: PaginationState & {
    setPage: (page: number) => void
    setPageSize: (pageSize: number) => void
    getPageNumbers: (maxVisible?: number) => number[]
  }
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showGotoPage?: boolean
  showSummary?: boolean
  className?: string
}

export function DataTablePagination<TData>({
  table,
  pagination,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showPageSizeSelector = true,
  showGotoPage = true,
  showSummary = true,
  className,
}: DataTablePaginationProps<TData>) {
  // Try to get pagination info from either table or pagination prop
  const pageCount = table?.getPageCount() ?? pagination?.totalPages ?? 1
  const pageIndex = table?.getState().pagination.pageIndex ?? (pagination?.page ?? 1) - 1
  const pageSize = table?.getState().pagination.pageSize ?? pagination?.pageSize ?? 10
  
  // Current page (1-based for display)
  const currentPage = pageIndex + 1
  
  // Get page numbers for the navigation
  const pageNumbers = pagination?.getPageNumbers?.(5) ?? 
    Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
      if (pageCount <= 5) return i + 1
      
      // Calculate reasonable page numbers around current page
      const middle = pageIndex + 1
      const half = 2
      let start = Math.max(1, middle - half)
      let end = Math.min(pageCount, start + 4)
      
      if (end - start < 4) {
        start = Math.max(1, end - 4)
      }
      
      return start + i
    }).filter(page => page <= pageCount)
  
  // Handlers for pagination actions
  const handlePageChange = (newPage: number) => {
    if (table) {
      table.setPageIndex(newPage - 1)
    } else if (pagination) {
      pagination.setPage(newPage)
    }
  }
  
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10)
    if (table) {
      table.setPageSize(newPageSize)
    } else if (pagination) {
      pagination.setPageSize(newPageSize)
    }
  }
  
  // Determine if next/prev are disabled
  const canPreviousPage = table?.getCanPreviousPage() ?? (currentPage > 1)
  const canNextPage = table?.getCanNextPage() ?? (currentPage < pageCount)
  
  // Get total items (if available from pagination)
  const totalItems = pagination?.total
  
  // Format display info
  const fromItem = pagination?.from ?? (pageIndex * pageSize + 1)
  const toItem = pagination?.to ?? Math.min((pageIndex + 1) * pageSize, totalItems ?? Infinity)
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      {showSummary && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {totalItems !== undefined ? (
            <div>
              Showing {fromItem}-{toItem} of {totalItems} items
            </div>
          ) : (
            <div>
              Page {currentPage} of {pageCount}
            </div>
          )}
          
          {showPageSizeSelector && (
            <div className="flex items-center gap-1">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
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
          onClick={() => handlePageChange(1)}
          disabled={!canPreviousPage}
          className="hidden sm:flex"
          aria-label="Go to first page"
        >
          <ChevronsLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!canPreviousPage}
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="hidden sm:flex gap-1">
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => handlePageChange(page)}
              className="w-8"
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
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
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!canNextPage}
          aria-label="Go to next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(pageCount)}
          disabled={!canNextPage}
          className="hidden sm:flex"
          aria-label="Go to last page"
        >
          <ChevronsRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {showGotoPage && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Go to page:</span>
          <Input
            type="number"
            min={1}
            max={pageCount}
            defaultValue={currentPage}
            onChange={(e) => {
              const page = e.target.value ? parseInt(e.target.value, 10) : 1
              handlePageChange(page)
            }}
            onBlur={(e) => {
              // Ensure value is reset to current page if invalid
              if (!e.target.value) {
                e.target.value = String(currentPage)
              }
            }}
            className="h-8 w-16"
            aria-label="Go to page"
          />
        </div>
      )}
    </div>
  )
} 