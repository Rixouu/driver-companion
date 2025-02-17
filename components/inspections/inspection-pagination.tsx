"use client"

import { Button } from "@/components/ui/button"

interface InspectionPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function InspectionPagination({
  currentPage,
  totalPages,
  onPageChange,
}: InspectionPaginationProps) {
  return (
    <div className="flex justify-center gap-2 p-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
    </div>
  )
} 