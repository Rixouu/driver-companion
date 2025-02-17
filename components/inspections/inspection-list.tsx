"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { Search, Plus } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface Inspection {
  id: string
  vehicle_id: string
  status: string
  created_at: string
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
}

export function InspectionList() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    async function fetchInspections() {
      try {
        const { data, error } = await getSupabaseClient()
          .from("inspections")
          .select(`
            *,
            vehicle:vehicles(name, plate_number)
          `)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setInspections(data || [])
      } catch (error) {
        console.error("Error fetching inspections:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInspections()
  }, [])

  const filteredInspections = inspections.filter(inspection => {
    const matchesFilter = filter === 'all' || inspection.status === filter
    const matchesSearch = !debouncedSearch || 
      inspection.vehicle?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      inspection.vehicle?.plate_number?.toLowerCase().includes(debouncedSearch.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilter('scheduled')}
          >
            Scheduled
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>{inspection.vehicle?.name}</TableCell>
                  <TableCell>{inspection.vehicle?.plate_number}</TableCell>
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
                  <TableCell>{formatDate(inspection.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inspections/${inspection.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No inspections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 