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
import { Search, Plus, Calendar, Clock, Wrench } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import { ViewToggle } from "@/components/ui/view-toggle"

interface MaintenanceTask {
  id: string
  title: string
  status: string
  due_date: string
  estimated_duration?: number | null
  priority?: 'high' | 'medium' | 'low' | null
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
  const [view, setView] = useState<"list" | "grid">("list")

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
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search maintenance tasks..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
                  <TableHead>Task</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
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
                        <Link href={`/maintenance/${task.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="divide-y md:hidden">
            {currentItems.map((task) => (
              <Link 
                key={task.id} 
                href={`/maintenance/${task.id}`}
                className="block p-4 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.vehicle.name} • {formatDate(task.due_date)}
                    </p>
                  </div>
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
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {task.vehicle.name}
                      </p>
                    </div>
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
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                    {task.estimated_duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{task.estimated_duration} hours</span>
                      </div>
                    )}
                    {task.priority && (
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span>Priority: {task.priority}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-2" 
                    asChild
                  >
                    <Link href={`/maintenance/${task.id}`}>
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