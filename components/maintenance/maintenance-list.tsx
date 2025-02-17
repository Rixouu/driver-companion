"use client"

import { useState } from "react"
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

interface MaintenanceListProps {
  tasks: any[]
  currentPage: number
  totalPages: number
}

export function MaintenanceList({ tasks, currentPage, totalPages }: MaintenanceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 500)
  const [filter, setFilter] = useState(searchParams.get("status") || 'all')

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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'overdue') return task.status === 'overdue'
    return true
  })

  const statusColors = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    overdue: "bg-red-500",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            Schedule and track vehicle maintenance
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Maintenance
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('all')}
          >
            All Tasks
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('overdue')}
          >
            Overdue
          </Button>
        </div>

        <div className="rounded-md border">
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
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.vehicle.name}</TableCell>
                  <TableCell>{formatDate(task.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/maintenance/${task.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No maintenance tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("page", page.toString())
                  router.push(`/maintenance?${params.toString()}`)
                }}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 