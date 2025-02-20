"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/db/client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Inspection {
  id: string
  vehicle_id: string
  status: string
  created_at: string
  due_date: string
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
}

const ITEMS_PER_PAGE = 10

export function InspectionList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get("status") || 'all')
  const [search, setSearch] = useState(searchParams.get("search") || '')
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(search, 500)
  const currentPage = Number(searchParams.get("page")) || 1

  useEffect(() => {
    async function fetchInspections() {
      try {
        const from = (currentPage - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1

        let query = getSupabaseClient()
          .from("inspections")
          .select(`
            *,
            vehicle:vehicles(
              name, 
              plate_number
            )
          `, { count: 'exact' })

        if (filter !== 'all') {
          query = query.eq('status', filter)
        }

        if (debouncedSearch) {
          query = query.or(`vehicle.name.ilike.%${debouncedSearch}%,vehicle.plate_number.ilike.%${debouncedSearch}%`)
        }

        const { data, error, count } = await query
          .range(from, to)
          .order('due_date', { ascending: true })

        if (error) throw error

        setInspections(data || [])
        setTotalPages(count ? Math.ceil(count / ITEMS_PER_PAGE) : 1)
      } catch (error) {
        console.error("Error fetching inspections:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInspections()
  }, [currentPage, filter, debouncedSearch])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/inspections?${params.toString()}`)
  }

  const handleSearch = (term: string) => {
    setSearch(term)
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/inspections?${params.toString()}`)
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    const params = new URLSearchParams(searchParams.toString())
    if (newFilter !== 'all') {
      params.set("status", newFilter)
    } else {
      params.delete("status")
    }
    params.set("page", "1")
    router.push(`/inspections?${params.toString()}`)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        {/* Desktop view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>{inspection.vehicle?.name}</TableCell>
                  <TableCell>
                    {inspection.due_date ? formatDate(inspection.due_date) : 'Not scheduled'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inspection.status === "completed"
                          ? "success"
                          : inspection.status === "in_progress"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inspections/${inspection.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No inspections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="grid gap-4 p-4 md:hidden">
          {inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{inspection.vehicle?.name}</h3>
                <Badge
                  variant={
                    inspection.status === "completed"
                      ? "success"
                      : inspection.status === "in_progress"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {inspection.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Due: {inspection.due_date ? formatDate(inspection.due_date) : 'Not scheduled'}</div>
              </div>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/inspections/${inspection.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          ))}
          {inspections.length === 0 && (
            <div className="text-center text-muted-foreground">
              No inspections found.
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
} 