"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { Search, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/db/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MaintenanceTask {
  id: string
  title: string
  status: string
  due_date: string
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
}

interface MaintenanceListProps {
  tasks: MaintenanceTask[]
}

const ITEMS_PER_PAGE = 10

export function MaintenanceList({ tasks: initialTasks }: MaintenanceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filteredTasks, setFilteredTasks] = useState<MaintenanceTask[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState(searchParams.get("status") || 'all')
  const [search, setSearch] = useState(searchParams.get("search") || '')
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTasks.length / ITEMS_PER_PAGE))
  const debouncedSearch = useDebounce(search, 500)
  const currentPage = Number(searchParams.get("page")) || 1

  useEffect(() => {
    // Filter and search tasks locally
    let result = [...initialTasks]

    if (filter !== 'all') {
      result = result.filter(task => task.status === filter)
    }

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.vehicle.name.toLowerCase().includes(searchLower)
      )
    }

    setFilteredTasks(result)
    setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE))
  }, [filter, debouncedSearch, initialTasks])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/maintenance?${params.toString()}`)
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
    router.push(`/maintenance?${params.toString()}`)
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
    router.push(`/maintenance?${params.toString()}`)
  }

  // Get current page items
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredTasks.slice(indexOfFirstItem, indexOfLastItem)

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
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
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
                <TableHead>Title</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.vehicle.name}</TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "success"
                          : task.status === "in_progress"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/maintenance/${task.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {currentItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No maintenance tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="grid gap-4 p-4 md:hidden">
          {currentItems.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{task.title}</h3>
                <Badge
                  variant={
                    task.status === "completed"
                      ? "success"
                      : task.status === "in_progress"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {task.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{task.vehicle.name}</div>
                <div>{formatDate(task.due_date)}</div>
              </div>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/maintenance/${task.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          ))}
          {currentItems.length === 0 && (
            <div className="text-center text-muted-foreground">
              No maintenance tasks found.
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