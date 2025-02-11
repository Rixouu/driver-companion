"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/providers/language-provider"
import { SearchFilter } from "@/components/search-filter"
import { Pagination } from "@/components/pagination"
import { useState } from "react"

const filterOptions = [
  { value: "all", label: "All Vehicles" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
]

interface Vehicle {
  id: string
  name: string
  plateNumber: string
  status: string
  imageUrl: string
}

export default function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SearchFilter
          onSearch={setSearchQuery}
          onFilter={setStatusFilter}
          filterOptions={filterOptions}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden">
            <div className="relative h-48">
              <Image
                src={vehicle.imageUrl}
                alt={vehicle.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-xl font-semibold">{vehicle.name}</span>
                <span className={`status-badge ${
                  vehicle.status === 'active' 
                    ? 'status-badge-success' 
                    : 'status-badge-warning'
                }`}>
                  {t(`status.${vehicle.status}`)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("vehicles.plateNumber")}: {vehicle.plateNumber}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/vehicles/${vehicle.id}`}>
                    {t("vehicles.viewDetails")}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/inspections/new?vehicleId=${vehicle.id}`}>
                    {t("dashboard.startInspection")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
} 