"use client"

import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface VehiclePaginationProps {
  total: number
  page: number
  onPageChange: (page: number) => void
}

export function VehiclePagination({ total, page, onPageChange }: VehiclePaginationProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#" 
              onClick={() => onPageChange(page - 1)}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext 
              href="#" 
              onClick={() => onPageChange(page + 1)}
              aria-disabled={page * 10 >= total}
              className={page * 10 >= total ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
} 