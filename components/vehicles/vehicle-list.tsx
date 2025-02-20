"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { DbVehicle } from "@/types"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VehicleListProps {
  vehicles: DbVehicle[]
  currentPage: number
  totalPages: number
}

export function VehicleList({ vehicles = [], currentPage, totalPages }: VehicleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const debouncedSearch = useDebounce(search, 500)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/vehicles?${params.toString()}`)
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesFilter = filter === 'all' || vehicle.status === filter
    const matchesSearch = !debouncedSearch || 
      vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(debouncedSearch.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.plate_number}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vehicle.status === "active"
                          ? "success"
                          : vehicle.status === "maintenance"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {vehicle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/vehicles/${vehicle.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 p-4 md:hidden">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{vehicle.name}</h3>
                <Badge
                  variant={
                    vehicle.status === "active"
                      ? "success"
                      : vehicle.status === "maintenance"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {vehicle.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {vehicle.plate_number}
              </div>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/vehicles/${vehicle.id}`}>
                  View Details
                </Link>
              </Button>
            </div>
          ))}
          {filteredVehicles.length === 0 && (
            <div className="text-center text-muted-foreground">
              No vehicles found.
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