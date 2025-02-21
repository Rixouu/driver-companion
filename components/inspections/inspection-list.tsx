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
import { Card, CardContent } from "@/components/ui/card"
import { ViewToggle } from "@/components/ui/view-toggle"
import { Calendar, User, CheckCircle } from "lucide-react"

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
  inspector?: {
    name: string
  }
  type: string
  date: string
  completed_items?: number
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
  const [view, setView] = useState<"list" | "grid">("list")

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

  const filteredInspections = inspections.filter(inspection => {
    const matchesFilter = filter === 'all' || inspection.status === filter
    const matchesSearch = !search || 
      inspection.vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
      inspection.inspector?.name?.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === "list" ? (
        <div className="rounded-md border">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">
                      {inspection.vehicle.name}
                    </TableCell>
                    <TableCell>
                      {inspection.inspector?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>{formatDate(inspection.date)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(inspection.status)}>
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
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="divide-y md:hidden">
            {filteredInspections.map((inspection) => (
              <Link 
                key={inspection.id} 
                href={`/inspections/${inspection.id}`}
                className="block p-4 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{inspection.vehicle.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.inspector?.name || 'Unassigned'} • {formatDate(inspection.date)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(inspection.status)}>
                    {inspection.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInspections.map((inspection) => (
            <Card key={inspection.id}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{inspection.vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {inspection.type} Inspection
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Date: {formatDate(inspection.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Inspector: {inspection.inspector?.name || 'Unassigned'}</span>
                    </div>
                    {inspection.completed_items && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>{inspection.completed_items} items completed</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-2" 
                    asChild
                  >
                    <Link href={`/inspections/${inspection.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success"
    case "in_progress":
      return "warning"
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
} 