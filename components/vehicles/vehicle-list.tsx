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
import Image from "next/image"
import { useI18n } from "@/lib/i18n/context"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface VehicleListProps {
  vehicles: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

const ITEMS_PER_PAGE = 9

export function VehicleList({ vehicles = [], currentPage = 1, totalPages = 1 }: VehicleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<"list" | "grid">("grid")
  const debouncedSearch = useDebounce(search, 500)
  const { t } = useI18n()

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
            placeholder={t("vehicles.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              {t("common.all")}
            </Button>
            <Button 
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
            >
              {t("vehicles.status.active")}
            </Button>
            <Button 
              variant={filter === 'maintenance' ? 'default' : 'outline'}
              onClick={() => setFilter('maintenance')}
            >
              {t("vehicles.status.maintenance")}
            </Button>
            <Button 
              variant={filter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilter('inactive')}
            >
              {t("vehicles.status.inactive")}
            </Button>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">
          {t("vehicles.noVehicles")}
        </p>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <div className="relative aspect-video w-full">
                      {vehicle.image_url ? (
                        <Image
                          src={vehicle.image_url}
                          alt={vehicle.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">{t('vehicles.fields.noImage')}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="space-y-2">
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
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{vehicle.brand} {vehicle.model}</p>
                          <p>Year: {vehicle.year}</p>
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full" asChild>
                        <Link href={`/vehicles/${vehicle.id}`}>
                          {t("common.viewDetails")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vehicles.fields.name")}</TableHead>
                    <TableHead>{t("vehicles.fields.plateNumber")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow 
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                    >
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
                          {t(`vehicles.status.${vehicle.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t("common.details")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  )
} 