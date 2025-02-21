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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
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
import Image from "next/image"

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
  const [view, setView] = useState<"list" | "grid">("list")
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === "list" ? (
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
                    <TableCell className="font-medium">{vehicle.name}</TableCell>
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
                        <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {filteredVehicles.map((vehicle) => (
              <Link 
                key={vehicle.id} 
                href={`/vehicles/${vehicle.id}`}
                className="block p-4 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{vehicle.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.plate_number}
                    </p>
                  </div>
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
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={vehicle.image_url || "/img/vehicle-placeholder.png"}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.plate_number}
                      </p>
                    </div>
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
                    <p>{vehicle.brand} {vehicle.model}</p>
                    <p>Year: {vehicle.year}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-2" 
                    asChild
                  >
                    <Link href={`/vehicles/${vehicle.id}`}>
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
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
} 