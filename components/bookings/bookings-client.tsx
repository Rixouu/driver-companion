'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BookingsList } from './bookings-list'
import { BookingsErrorBoundary } from './error-boundary'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ViewToggle } from "@/components/ui/view-toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function BookingsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState(searchParams.get('status') || 'all')
  const [view, setView] = useState<"list" | "grid">("list")
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page') || '1'))
  const debouncedSearch = useDebounce(search, 500)
  
  const handleFilterChange = (value: string) => {
    setFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("status", value)
    params.set("page", "1") // Reset to page 1 when filter changes
    router.push(`/bookings?${params.toString()}`)
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/bookings?${params.toString()}`)
  }
  
  // Set default view based on screen size
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
    if (isMobile) {
      setView("list");
    }
    
    // Add resize listener to change view when resizing between mobile and desktop
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
      if (isMobileNow && view === "grid") {
        setView("list");
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  return (
    <BookingsErrorBoundary>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="sm:hidden">
                <Select
                  value={filter}
                  onValueChange={handleFilterChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:flex flex-wrap gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('confirmed')}
                >
                  Confirmed
                </Button>
                <Button 
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('pending')}
                >
                  Pending
                </Button>
                <Button 
                  variant={filter === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('cancelled')}
                >
                  Cancelled
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
        
        <BookingsList 
          limit={10} 
          search={debouncedSearch}
          view={view}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </BookingsErrorBoundary>
  )
} 