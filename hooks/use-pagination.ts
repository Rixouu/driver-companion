"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
  offset: number
  from: number
  to: number
}

export interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  paramKey?: string
  persistInUrl?: boolean
}

/**
 * Custom hook for handling pagination state, with optional URL state persistence.
 * 
 * @param total Total number of items
 * @param options Configuration options
 * @returns Pagination state and control functions
 */
export function usePagination(
  total: number,
  options: PaginationOptions = {}
) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    paramKey = "page",
    persistInUrl = false
  } = options
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Read initial page from URL if persistInUrl is enabled
  const initialPageFromUrl = persistInUrl 
    ? parseInt(searchParams.get(paramKey) || String(initialPage), 10)
    : initialPage
  
  // Initialize state
  const [page, setPageInternal] = useState<number>(initialPageFromUrl)
  const [pageSize, setPageSizeInternal] = useState<number>(initialPageSize)
  
  // Calculate derived state
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize])
  const from = useMemo(() => (total === 0 ? 0 : offset + 1), [total, offset])
  const to = useMemo(() => Math.min(offset + pageSize, total), [offset, pageSize, total])
  
  // Ensure page is within valid range
  const currentPage = useMemo(() => Math.min(page, totalPages), [page, totalPages])
  
  // Update page value and optionally update URL
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages))
    setPageInternal(validPage)
    
    if (persistInUrl) {
      const params = new URLSearchParams(searchParams)
      params.set(paramKey, String(validPage))
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [totalPages, persistInUrl, paramKey, pathname, router, searchParams])
  
  // Update page size and adjust current page if needed
  const setPageSize = useCallback((newPageSize: number) => {
    const newTotalPages = Math.max(1, Math.ceil(total / newPageSize))
    const newPage = Math.min(page, newTotalPages)
    
    setPageSizeInternal(newPageSize)
    setPageInternal(newPage)
    
    if (persistInUrl) {
      const params = new URLSearchParams(searchParams)
      params.set(paramKey, String(newPage))
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [total, page, persistInUrl, paramKey, pathname, router, searchParams])
  
  // Reset to first page
  const reset = useCallback(() => setPage(1), [setPage])
  
  // Navigate to previous page
  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1)
    }
  }, [page, setPage])
  
  // Navigate to next page
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }, [page, totalPages, setPage])
  
  // Create page numbers for pagination UI
  const getPageNumbers = useCallback((maxVisible: number = 5): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    // Calculate center of the visible page range
    const half = Math.floor(maxVisible / 2)
    let start = currentPage - half
    let end = currentPage + half
    
    // Adjust if range is out of bounds
    if (start < 1) {
      end += (1 - start)
      start = 1
    }
    
    if (end > totalPages) {
      start = Math.max(1, start - (end - totalPages))
      end = totalPages
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentPage, totalPages])
  
  // Prepare state and functions to return
  const paginationState: PaginationState = {
    page: currentPage,
    pageSize,
    total,
    totalPages,
    offset,
    from,
    to,
  }
  
  return {
    ...paginationState,
    setPage,
    setPageSize,
    reset,
    previousPage,
    nextPage,
    getPageNumbers,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  }
} 